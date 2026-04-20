import { ReactNode } from "react";

/**
 * MobileFrame
 * Wraps the app in a phone-like viewport on desktop, full-bleed on mobile.
 */
export const MobileFrame = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-dvh w-full gradient-warm md:p-6 md:flex md:items-center md:justify-center">
      <div className="relative mx-auto w-full max-w-[440px] min-h-dvh md:min-h-0 md:h-[860px] bg-background md:rounded-[2.5rem] md:shadow-elevated md:border md:border-border overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};
