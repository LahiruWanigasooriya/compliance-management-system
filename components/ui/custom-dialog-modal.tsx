import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

export const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed top-14 left-1/2 z-50 translate-x-[-50%] rounded-2xl bg-white shadow-lg md:top-1/2 md:translate-x-[-50%] md:translate-y-[-50%]",
        "w-[91.5vw] max-w-145 max-h-[90vh] overflow-y-auto no-scrollbar",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
CustomDialogContent.displayName = DialogPrimitive.Content.displayName;
