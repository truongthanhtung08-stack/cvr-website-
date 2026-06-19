import Image from "next/image";
import { asset } from "@/lib/asset";

// Logo dùng chung: biểu tượng + tên + slogan, cân đối ở mọi kích thước.
// Tên chữ hoa giãn rộng (tracking) để slogan luôn ngắn hơn hoặc bằng tên.
export default function BrandLogo({ size = "md" }: { size?: "md" | "lg" }) {
  const s =
    size === "lg"
      ? { icon: 76, iconCls: "h-[4.4rem] w-[4.4rem]", name: "text-[1.7rem]", slogan: "text-[13.5px]", gap: "gap-3.5" }
      : { icon: 60, iconCls: "h-[3.4rem] w-[3.4rem]", name: "text-[1.45rem]", slogan: "text-[11.5px]", gap: "gap-3" };

  return (
    <span className={`flex items-center ${s.gap}`}>
      <Image
        src={asset("/logo/symbol-white.svg")}
        alt="CENTRAL LAND"
        width={s.icon}
        height={s.icon}
        priority
        className={`${s.iconCls} shrink-0`}
      />
      <span className="flex flex-col leading-none">
        <span className={`${s.name} font-extrabold tracking-[0.22em] text-white`}>
          CENTRAL LAND
        </span>
        <span className={`mt-2 ${s.slogan} font-medium tracking-[0.03em] text-white/75`}>
          Gateway to Central Coast property
        </span>
      </span>
    </span>
  );
}
