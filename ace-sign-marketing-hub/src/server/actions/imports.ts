"use server";

import { invalidateAll } from "./invalidate";
import { prisma } from "@/lib/db";
import { IMPORT_MAX_BYTES, parseMetricsCsv, type ImportError } from "@/lib/csv-import";
import { recordAudit } from "../audit";
import { requirePermission } from "../session";
import { failure, type ActionResult } from "./result";

export interface ImportPreview {
  filename: string;
  totalRows: number;
  validRows: number;
  errors: ImportError[];
  campaigns: { name: string; platform: string; exists: boolean; rows: number }[];
  dateRange: { from: string; to: string } | null;
  totals: { spend: number; clicks: number; impressions: number; leads: number };
}

async function readFile(formData: FormData): Promise<{ name: string; text: string } | string> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return "Choose a CSV file to upload.";
  if (file.size > IMPORT_MAX_BYTES) return "File is larger than 2 MB. Split it into smaller files.";
  if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return "Only .csv files are supported.";
  return { name: file.name.slice(0, 200), text: await file.text() };
}

/** Validate a CSV without writing anything. */
export async function previewImport(formData: FormData): Promise<ActionResult<ImportPreview>> {
  try {
    await requirePermission("data:import");
    const f = await readFile(formData);
    if (typeof f === "string") return { ok: false, error: f };
    const parsed = parseMetricsCsv(f.text);
    const existing = await prisma.campaign.findMany({ select: { name: true, platform: true } });
    const key = (n: string, p: string) => `${n.toLowerCase()}|${p}`;
    const existingKeys = new Set(existing.map((c) => key(c.name, c.platform)));
    const byCampaign = new Map<string, { name: string; platform: string; rows: number }>();
    for (const r of parsed.rows) {
      const k = key(r.campaign, r.platform);
      const e = byCampaign.get(k) ?? { name: r.campaign, platform: r.platform, rows: 0 };
      e.rows++;
      byCampaign.set(k, e);
    }
    const dates = parsed.rows.map((r) => r.date).sort();
    return {
      ok: true,
      data: {
        filename: f.name,
        totalRows: parsed.totalRows,
        validRows: parsed.rows.length,
        errors: parsed.errors.slice(0, 200),
        campaigns: [...byCampaign.entries()].map(([k, v]) => ({ ...v, exists: existingKeys.has(k) })),
        dateRange: dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null,
        totals: parsed.rows.reduce((t, r) => ({ spend: t.spend + r.spend, clicks: t.clicks + r.clicks, impressions: t.impressions + r.impressions, leads: t.leads + r.leads }), { spend: 0, clicks: 0, impressions: 0, leads: 0 }),
      },
    };
  } catch (e) {
    return failure(e, "Could not read the file.");
  }
}

/**
 * Import a CSV. All-or-nothing: if any row is invalid nothing is written.
 * Rows for the same campaign + day replace earlier CSV-imported values.
 */
export async function commitImport(formData: FormData): Promise<ActionResult<{ batchId: string; rows: number; campaignsCreated: number }>> {
  try {
    const user = await requirePermission("data:import");
    const f = await readFile(formData);
    if (typeof f === "string") return { ok: false, error: f };
    const parsed = parseMetricsCsv(f.text);
    if (parsed.errors.length) return { ok: false, error: `The file has ${parsed.errors.length} error(s). Fix them and upload again - nothing was imported.` };
    if (!parsed.rows.length) return { ok: false, error: "The file has no data rows." };

    const result = await prisma.$transaction(
      async (tx) => {
        const batch = await tx.importBatch.create({ data: { filename: f.name, rowCount: parsed.rows.length, createdBy: user.name } });
        const campaignIds = new Map<string, string>();
        let created = 0;
        for (const r of parsed.rows) {
          const k = `${r.campaign.toLowerCase()}|${r.platform}`;
          if (campaignIds.has(k)) continue;
          const found = await tx.campaign.findFirst({ where: { name: { equals: r.campaign, mode: "insensitive" }, platform: r.platform }, select: { id: true } });
          if (found) campaignIds.set(k, found.id);
          else {
            const c = await tx.campaign.create({ data: { name: r.campaign, platform: r.platform, objective: "CONVERSIONS", status: "ACTIVE", source: "CSV_IMPORT" } });
            campaignIds.set(k, c.id);
            created++;
          }
        }
        for (const r of parsed.rows) {
          const campaignId = campaignIds.get(`${r.campaign.toLowerCase()}|${r.platform}`)!;
          const date = new Date(`${r.date}T00:00:00Z`);
          const values = { impressions: r.impressions, clicks: r.clicks, spendAud: r.spend, conversions: r.conversions, revenueAud: r.revenue, engagements: r.engagements, leads: r.leads, importBatchId: batch.id };
          await tx.metricSnapshot.upsert({
            where: { campaignId_date_source: { campaignId, date, source: "CSV_IMPORT" } },
            create: { campaignId, date, source: "CSV_IMPORT", ...values },
            update: values,
          });
        }
        return { batchId: batch.id, rows: parsed.rows.length, campaignsCreated: created };
      },
      { timeout: 60_000 },
    );

    await recordAudit({ actorId: user.id, action: "data.import", entityType: "import_batch", entityId: result.batchId, metadata: { rows: result.rows, campaignsCreated: result.campaignsCreated } });
    invalidateAll();
    return { ok: true, data: result, message: `Imported ${result.rows} rows.` };
  } catch (e) {
    return failure(e, "Import failed. Nothing was written.");
  }
}

export async function undoImport(batchId: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("data:import");
    const batch = await prisma.importBatch.findUnique({ where: { id: batchId }, select: { id: true } });
    if (!batch) return { ok: false, error: "Import not found." };
    await prisma.importBatch.delete({ where: { id: batchId } }); // cascades to its metric rows
    await recordAudit({ actorId: user.id, action: "data.import_undo", entityType: "import_batch", entityId: batchId });
    invalidateAll();
    return { ok: true, message: "Import removed." };
  } catch (e) {
    return failure(e);
  }
}
