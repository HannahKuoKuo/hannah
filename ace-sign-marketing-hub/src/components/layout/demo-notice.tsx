import { Info } from "lucide-react";

export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
