import { assetPath } from "@/lib/site";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export uses plain img for theme swap */}
      <img
        src={assetPath("/brand/weekly-frontier-logo.png")}
        alt="Weekly Frontier"
        width={640}
        height={214}
        className={cn("dark:hidden", className)}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- static export uses plain img for theme swap */}
      <img
        src={assetPath("/brand/weekly-frontier-logo-dark.png")}
        alt="Weekly Frontier"
        width={640}
        height={214}
        className={cn("hidden dark:block", className)}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      />
    </>
  );
}
