"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--error-bg": "hsl(0 84% 60%)",
          "--error-text": "hsl(0 0% 100%)",
          "--error-border": "hsl(0 84% 60%)",
          "--success-bg": "hsl(142 76% 36%)",
          "--success-text": "hsl(0 0% 100%)",
          "--success-border": "hsl(142 76% 36%)",
          "--warning-bg": "hsl(48 96% 53%)",
          "--warning-text": "hsl(0 0% 15%)",
          "--warning-border": "hsl(48 96% 53%)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
