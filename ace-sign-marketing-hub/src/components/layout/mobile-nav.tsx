"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";
import { SidebarFooter } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu />
        </Button>
      </DialogTrigger>
      <DialogContent side="left" className="flex flex-col gap-6 bg-sidebar px-4 py-5" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <BrandMark />
        <div className="flex-1">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <SidebarFooter />
      </DialogContent>
    </Dialog>
  );
}
