"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function BrandWatermark() {
  const pathname = usePathname();
  const topRight = pathname === "/"; // home page: move to top-right
  const pos = topRight ? "top-6 right-6" : "bottom-6 left-6";
  return (
    <div className={`pointer-events-none fixed ${pos} z-[5]`}>
      <div className="relative h-10 w-10 sm:h-12 sm:w-12 brand-soft">
        <Image src="/branding/tap-logo.png" alt="brand" fill sizes="48px" className="object-contain" />
      </div>
    </div>
  );
}
