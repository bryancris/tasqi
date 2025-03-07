
import * as SheetPrimitive from "@radix-ui/react-dialog"
import * as React from "react"

// Import components from separate files
import {
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./sheet/sheet-primitives";
import { SheetContent } from "./sheet/sheet-content";

// Re-export everything
const Sheet = SheetPrimitive.Root;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger
}
