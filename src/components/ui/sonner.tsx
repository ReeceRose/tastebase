"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        style: {
          background: "var(--background)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        },
        className:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
      }}
      style={
        {
          "--normal-bg": "hsl(var(--background))",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--border))",
          "--error-bg": "hsl(var(--destructive))",
          "--error-text": "hsl(var(--destructive-foreground))",
          "--error-border": "hsl(var(--destructive))",
          "--success-bg": "hsl(var(--success, 142 76% 36%))",
          "--success-text": "hsl(var(--success-foreground, 0 0% 100%))",
          "--success-border": "hsl(var(--success, 142 76% 36%))",
          "--warning-bg": "hsl(var(--warning, 48 96% 53%))",
          "--warning-text": "hsl(var(--warning-foreground, 0 0% 15%))",
          "--warning-border": "hsl(var(--warning, 48 96% 53%))",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
