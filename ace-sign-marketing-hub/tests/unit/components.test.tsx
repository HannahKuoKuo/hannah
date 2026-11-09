// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Database } from "lucide-react";

describe("KpiCard", () => {
  it("shows a falling cost as good", () => {
    render(<KpiCard label="CPC" value="$1.20" change={-0.1} lowerIsBetter />);
    const badge = screen.getByText("10.0%").closest("span")!;
    expect(badge.className).toMatch(/emerald/);
  });

  it("shows n/a when there is no comparison", () => {
    render(<KpiCard label="Leads" value="5" change={null} />);
    expect(screen.getByText("n/a")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState icon={Database} title="Nothing here" description="Import data" />);
    expect(screen.getByRole("heading", { name: "Nothing here" })).toBeInTheDocument();
  });
});
