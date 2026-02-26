import Image from "next/image";

import { cn } from "@/lib/utils";

type CziBrandProps = {
  className?: string;
  compact?: boolean;
  subtitle?: boolean;
};

export function CziBrand({ className, compact = false, subtitle = true }: CziBrandProps) {
  const imageSize = compact ? 34 : 42;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-white/95 shadow-sm">
        <Image
          alt="Logo CZI"
          className="block object-cover"
          height={imageSize}
          priority
          src="/brand/czi-logo.jpeg"
          width={imageSize}
        />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tracking-tight text-foreground">CZI</p>
          {subtitle ? (
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted">
              Collectif Zero Indigent
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
