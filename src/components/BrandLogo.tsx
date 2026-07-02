import Image from "next/image";
import { asset } from "@/lib/asset";

// Logo NGANG chính thức COASTAL LAND (biểu tượng + chữ + tagline). Tỷ lệ gốc
// 2115×473 (≈4.47:1).
// size: "md" cho Header · "lg" cho Footer.
// tone: "dark" (logo đen — dùng trên nền sáng) · "light" (logo trắng — nền tối).
export default function BrandLogo({
  size = "md",
  tone = "dark",
}: {
  size?: "md" | "lg";
  tone?: "dark" | "light";
}) {
  const cls = size === "lg" ? "h-[3rem]" : "h-[2.9rem]";
  const src =
    tone === "light"
      ? "/logo/logo-horizontal-white.svg"
      : "/logo/logo-horizontal-dark.svg";

  return (
    <Image
      src={asset(src)}
      alt="COASTAL LAND — Gateway to Central Coast property"
      width={2115}
      height={473}
      priority
      className={`${cls} w-auto`}
    />
  );
}
