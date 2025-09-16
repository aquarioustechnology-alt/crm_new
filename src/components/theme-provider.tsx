"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // forcedTheme="dark" = always dark (you can remove later to allow toggling)
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
      value={{ dark: "dark", light: "light" }}
    >
      {children}
    </NextThemesProvider>
  );
}
