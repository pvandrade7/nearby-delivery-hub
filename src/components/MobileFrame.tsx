import { ReactNode } from "react";

/**
 * MobileFrame (legacy) — kept as a passthrough for any lingering imports.
 * The desktop shell now lives in AppShell.
 */
export const MobileFrame = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh w-full bg-background">{children}</div>
);
