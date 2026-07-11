import Image from "next/image";
import { asset } from "@/lib/asset";

// Logo NGANG chính thức COASTAL LAND (biểu tượng + chữ + tagline). viewBox đã
// cắt sát nội dung (82 43 2005 389 ≈ 5.15:1) để bỏ khoảng trống thừa → cùng
// chiều cao header, logo + slogan render to/rõ hơn mà không đổi style logo.
// size: "md" cho Header (chiều cao responsive, nhỏ hơn ở mobile để không tràn)
//       · "lg" cho Footer.
// tone: "dark" (logo đen — dùng trên nền sáng) · "light" (logo trắng — nền tối).
export default function BrandLogo({
  size = "md",
  tone = "dark",
}: {
  size?: "md" | "lg";
  tone?: "dark" | "light";
}) {
  const cls =
    size === "lg" ? "h-[3.4rem]" : "h-[2.7rem] sm:h-[3rem] lg:h-[3.15rem]";
  const src =
    tone === "light"
      ? "/logo/logo-horizontal-white.svg"
      : "/logo/logo-horizontal-dark.svg";

  return (
    <Image
      src={asset(src)}
      alt="COASTAL LAND — Gateway to Central Coast property"
      width={2005}
      height={389}
      priority
      className={`${cls} w-auto`}
    />
  );
}
