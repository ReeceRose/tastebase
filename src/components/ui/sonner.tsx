"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      closeButton={true}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-control !border-0 !bg-primary !text-primary-foreground !shadow-float !font-sans !text-body !gap-3 !px-4 !py-3.5",
          title: "!font-extrabold",
          description: "!text-primary-foreground/80",
          actionButton:
            "!bg-accent !text-accent-foreground !font-extrabold !rounded-full",
          cancelButton: "!bg-transparent !text-primary-foreground",
          closeButton:
            "!bg-primary !text-primary-foreground !border-primary-foreground/30",
          error: "!bg-destructive !text-destructive-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
