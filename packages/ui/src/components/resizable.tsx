"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "../lib/utils";

function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.Group>) {
  return <ResizablePrimitive.Group className={cn("flex size-full data-[panel-group-direction=vertical]:flex-col", className)} {...props} />;
}

const ResizablePanel = ResizablePrimitive.Panel;

function ResizableHandle({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.Separator> & { withHandle?: boolean }) {
  return <ResizablePrimitive.Separator className={cn("relative flex w-px cursor-col-resize items-center justify-center bg-transparent after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:bg-transparent hover:after:bg-carbon/10 focus-visible:outline-none focus-visible:after:bg-carbon/20 data-[separator=active]:after:bg-carbon/20", className)} {...props}>{withHandle ? <span className="sr-only"><GripVertical aria-hidden="true" />Redimensionar</span> : null}</ResizablePrimitive.Separator>;
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
