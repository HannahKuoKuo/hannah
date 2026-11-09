"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { removeDemoData, switchDemoUser } from "@/server/actions/settings";

export function DemoUserSwitcher({ users, current }: { users: { email: string; name: string | null; role: string }[]; current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor="demo-user" className="sr-only">Act as</Label>
      <Select
        id="demo-user"
        defaultValue={current}
        disabled={pending}
        className="w-auto"
        onChange={(e) =>
          startTransition(async () => {
            const res = await switchDemoUser(e.target.value);
            toast(res.ok ? res.message ?? "Switched." : res.error, res.ok ? "success" : "error");
          })
        }
      >
        {users.map((u) => (
          <option key={u.email} value={u.email}>{u.name} ({u.role.toLowerCase()})</option>
        ))}
      </Select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

export function RemoveDemoData({ disabled }: { disabled: boolean }) {
  const [text, setText] = useState("");
  return (
    <ConfirmDialog
      trigger={<Button variant="outline" className="text-red-700" disabled={disabled}><Trash2 /> Remove demo data</Button>}
      title="Remove all demo data?"
      confirmLabel="Remove demo data"
      description={
        <div className="space-y-3">
          <p>Deletes every campaign, metric row and post marked as demo. Imported and manually created data is kept. You can restore demo data later with <code>npm run db:seed</code>.</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-demo">Type <strong>REMOVE DEMO DATA</strong> to confirm</Label>
            <Input id="confirm-demo" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
          </div>
        </div>
      }
      onConfirm={async () => {
        const res = await removeDemoData(text);
        if (!res.ok) return res.error;
        toast(res.message ?? "Demo data removed.");
      }}
    />
  );
}
