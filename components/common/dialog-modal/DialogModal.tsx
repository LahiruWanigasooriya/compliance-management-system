import { CustomDialogContent } from "@/components/ui/custom-dialog-modal";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReactElement } from "react";
import CloseButton from "../close-button/CloseButton";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface DialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactElement;
  className?: string;
  classNameTwo?: string;
  titleClassName?: string;
}
const DialogModal = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  classNameTwo,
  titleClassName,
}: DialogModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <CustomDialogContent
        className={`max-h-[95.417vh] animate-in zoom-in-95 bg-card borer border-border fixed top-[50%] left-[50%] z-50 flex max-w-93.75 translate-x-[-50%] translate-y-[-50%] flex-col p-4 transition-all duration-300 ease-in-out focus:outline-none md:max-w-145 md:p-6 ${className}`}
      >
        <CloseButton
          onClick={onClose}
          className="text-foreground top-2 right-2 md:top-3 md:right-3"
        />
        <div
          className={`flex min-h-0 flex-col gap-4 text-foreground ${classNameTwo}`}
        >
          {title ? (
            <DialogHeader className="flex flex-col">
              <DialogTitle
                className={`md:text-xl! text-left! font-bold! text-primary-foreground ${titleClassName}`}
              >
                {title}
              </DialogTitle>
            </DialogHeader>
          ) : (
            <VisuallyHidden>
              <DialogTitle>Modal</DialogTitle>
            </VisuallyHidden>
          )}
          {children}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default DialogModal;
