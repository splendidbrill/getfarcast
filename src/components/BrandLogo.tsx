import Image from "next/image";

// BrandLogo — renders the GetFarcast logo image from /public/logo.png.
// The source asset already contains the intended brand colors, so we present it
// inside a small white badge to keep it crisp and readable on orange gradients.

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogoIcon({ size = 16, className = "" }: BrandLogoProps) {
  const badgeSize = size + 8;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-[28%] bg-white ring-1 ring-black/5 shadow-[0_6px_18px_rgba(255,107,78,0.18)] ${className}`}
      style={{ width: badgeSize, height: badgeSize }}
    >
      <Image
        src="/logo.png"
        alt="GetFarcast logo"
        width={size}
        height={size}
        className="h-auto w-auto object-contain select-none"
        priority
      />
    </span>
  );
}
