"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { createCampaign } from "@/server/actions/campaigns";
import { CampaignForm } from "./campaign-form";

export function NewCampaignButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus /> New campaign</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogTitle>New campaign</DialogTitle>
        <DialogDescription>Creates a campaign record in this workspace. Nothing is created on any ad platform.</DialogDescription>
        <div className="mt-4">
          <CampaignForm
            submitLabel="Create campaign"
            onCancel={() => setOpen(false)}
            onSubmit={async (input) => {
              const res = await createCampaign(input);
              if (res.ok) {
                toast("Campaign created.");
                setOpen(false);
                router.push(`/campaigns/${res.data!.id}`);
              }
              return res;
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
