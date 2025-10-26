"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocsSidebar } from "./docs-sidebar";

export function DocsMobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-40"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Documentation</SheetTitle>
        </SheetHeader>
        <DocsSidebar />
      </SheetContent>
    </Sheet>
  );
}
