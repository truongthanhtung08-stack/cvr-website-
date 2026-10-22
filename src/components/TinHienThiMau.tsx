"use client";

import { useEffect, useRef } from "react";
import type { Listing } from "@/lib/data";
import type { TierId } from "@/lib/packages";
import TheTinMobile from "@/components/TheTinMobile";
import KhungCuonNgang from "@/components/KhungCuonNgang";
import { ANH_MAU } from "@/lib/anhMau";

// TIN HIỂN THỊ — thẻ tin mẫu từng cấp, vuốt qua lại. MỘT chỗ cho trang Báo giá (mục "Tin hiển thị") và bước chọn gói khi đăng tin
// (nút "Tin hiển thị", chủ dự án 23/10/2026). Chuyển nguyên từ trang Báo giá, không đổi gì.

const KHO = "https://miyugmacyerqvzhgmbyd.supabase.co/storage/v1/object/public/listings/";
// Mô tả ví dụ ĐỦ DÀI để thẻ hiện đúng số dòng của từng hạng (Kim cương 3 · Vàng 2 · Bạc 1 ·
// Thường 0) — tiêu đề viết hoa, dải nhấn, huy hiệu do PropertyCard tự áp theo hạng.
const viDu = (id: string, title: string, image: string, location: string, desc: string): Listing =>
  ({ id, title, image, location, desc, price: "Thoả thuận", area: "" }) as Listing;
// Tiêu đề + mô tả ĐỦ DÀI và DÀI NGANG NHAU ở cả 4 hạng — để khách thấy rõ khác biệt hiển thị
// (tiêu đề VIẾT HOA hay không · mô tả 3/2/1/0 dòng), không phải do nội dung ngắn dài khác nhau.
const MO_TA_CHUNG =
  " Pháp lý sổ hồng chính chủ, sẵn sàng giao dịch. Khu dân cư hiện hữu, gần trường học, chợ, bệnh viện và các trục đường chính, thuận tiện di chuyển vào trung tâm.";
// THẺ MẪU = THẺ TIN THẬT CỦA WEB (TheTinMobile) với dữ liệu ví dụ ĐỦ để thẻ tự hiện đúng quy định từng cấp (chủ dự án
// 22/10/2026 tối: "hình theo cấp VIP cấu trúc đúng trên Mobile theo tỷ lệ; nội dung bên dưới phải đúng theo quy định — vì đây
// coi như là tin hiển thị mẫu"; "lấy hình nào đẹp nhất thì thay vào — nhà, villa, nội thất"). Số ảnh đúng khung từng cấp:
// Diamond 1 chính + 3 phụ · Gold 1 chính + 3 phụ (thẻ Gold cần đủ 4 ảnh mới chia khung) · Silver 1 · Basic 1. Ảnh trộn nội thất
// + mặt tiền, chọn ảnh đẹp nhất (chủ dự án 22/10/2026 tối). Nhà không hiện giá/m² trừ khi người bán tự ghi —
// mẫu Diamond là trường hợp người bán có ghi (để thấy đủ 5 thông số của Diamond). Người đăng: Coastal Land + hotline công ty.
// MỖI CẤP MỘT LOẠI HÌNH, ảnh đẹp nhất trong kho (chủ dự án 22/10/2026 tối: "lựa hình đẹp, nhiều kiểu, nhiều loại hình — tin mẫu
// mà, xấu thì ai đăng"): Diamond biệt thự sân vườn · Gold shophouse phố thương mại · Silver căn hộ view biển · Basic nhà phố.
const MAU_CHUNG = { agentName: "Coastal Land", soDau: "0377 985", postedAt: new Date(Date.now() - 2 * 3600_000).toISOString() };
const VI_DU_MINH_HOA: Record<TierId, Listing> = {
  // Ảnh chính là NỘI THẤT (chủ dự án 22/10/2026 tối: "các hình đẹp thường là nội thất — lấy một hình có nội thất")
  diamond: { ...viDu("vi-du-diamond", "Bán biệt thự sân vườn 3 tầng, nội thất cao cấp, sổ hồng riêng, phường Ngũ Hành Sơn, Đà Nẵng",
    KHO + "cfd50d885c07c23ec69ee0db-pt03-8.webp", "Phường Ngũ Hành Sơn, Đà Nẵng",
    "Biệt thự hoàn thiện đầy đủ nội thất, 4 phòng ngủ, phòng khách rộng, sân vườn trước sau, an ninh 24/7." + MO_TA_CHUNG), badge: "VIP",
    ...MAU_CHUNG, type: "Biệt thự / Villa", price: "18,5 tỷ", area: "200 m²", beds: 4, baths: 5, pricePerM2: "41 tr/m² sàn", imageCount: 16,
    images: ANH_MAU.bietThu },
  gold: { ...viDu("vi-du-gold", "Bán nhà phố liền kề 3 tầng, nội thất hiện đại, sổ hồng riêng, phường Thuận Hóa, Huế",
    KHO + "1788251822682-40179-pt03-7.webp", "Phường Thuận Hóa, Huế",
    "Thiết kế hiện đại đồng bộ cả dãy, 4 phòng ngủ, phòng khách liền phòng ăn rộng thoáng, an ninh 24/7." + MO_TA_CHUNG), badge: "Nổi bật",
    ...MAU_CHUNG, type: "Nhà phố liền kề", price: "7,5 tỷ", area: "120 m²", beds: 4, baths: 4, imageCount: 9,
    images: ANH_MAU.nhaPho },
  silver: { ...viDu("vi-du-silver", "Bán căn hộ 2 phòng ngủ view biển, đủ nội thất, phường Sơn Trà, Đà Nẵng",
    KHO + "1788789958242-233504-qnhon10-1.webp", "Phường Sơn Trà, Đà Nẵng",
    "Căn hộ tầng cao, cửa kính lớn nhìn ra biển, hoàn thiện nội thất, toà nhà có hồ bơi và phòng gym." + MO_TA_CHUNG), badge: "Mới",
    ...MAU_CHUNG, type: "Căn hộ", price: "4,3 tỷ", area: "75 m²", beds: 2, baths: 2, imageCount: 15 },
  basic: { ...viDu("vi-du-basic", "Bán nhà 3 tầng mới xây, mặt tiền đường 7,5m, phường Hòa Xuân, Đà Nẵng",
    KHO + "721b01b977d3c2b1d4811cdc-dn03-1210-1.webp", "Phường Hòa Xuân, Đà Nẵng",
    "Nhà 3 phòng ngủ, 3 phòng tắm, hoàn thiện mới, khu dân cư đông đúc." + MO_TA_CHUNG),
    ...MAU_CHUNG, type: "Nhà mặt phố", price: "5,2 tỷ", area: "100 m²", beds: 3, baths: 3, imageCount: 11 },
};

// chon = gói khách đang chọn ở bước chọn gói khi đăng tin (chủ dự án 23/10/2026: "tin hiển thị tốt nhất — bật xuống thì hiển thị
// tin như gói đã chọn, chọn gói khác thì tương ứng, di chuyển qua lại xem"): dải tự tới đúng thẻ gói đó, viền đậm đánh dấu; vẫn
// vuốt / bấm ‹ › xem gói khác. Trang Báo giá không truyền → như cũ.
// gon = trong bảng nổi (bước chọn gói khi đăng tin): thẻ thu nhỏ đều hơn để bảng gọn, nổi rõ là bảng riêng chứ không chiếm cả màn hình.
export default function TinHienThiMau({ chon, gon }: { chon?: TierId | ""; gon?: boolean }) {
  const dai = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chon) return;
    const r = requestAnimationFrame(() => {
      const the = dai.current?.querySelector<HTMLElement>(`[data-cap="${chon}"]`);
      const cuon = the?.parentElement;
      if (!the || !cuon) return;
      cuon.scrollBy({ left: the.getBoundingClientRect().left - cuon.getBoundingClientRect().left, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(r);
  }, [chon]);
  return (
    <div ref={dai}>
      {/* Thẻ các cấp CAO BẰNG NHAU (chủ dự án 23/10/2026: "khung mỗi cấp to nhỏ khác nhau") — khung giãn theo thẻ cao nhất. */}
      <KhungCuonNgang khung="flex items-stretch snap-x snap-mandatory gap-3 pb-1">
        {(["basic", "silver", "gold", "diamond"] as const).map((id) => (
          <DacDiemGoi key={id} id={id} dangChon={chon === id} gon={gon} mau={<TheMau listing={VI_DU_MINH_HOA[id]} gon={gon} />} />
        ))}
      </KhungCuonNgang>
    </div>
  );
}

// ĐẶC ĐIỂM RIÊNG TỪNG GÓI + HÌNH MINH HOẠ (chủ dự án 22/10/2026 tối: "mỗi gói có một đặc điểm riêng kèm hình minh hoạ" — đặt
// trong phần Đặc điểm hiển thị, mở sẵn). Chữ từ admin (quyền lợi từng hạng), hình = thẻ tin mẫu.
// Một thẻ trong dải vuốt: chỉ thẻ tin mẫu (huy hiệu cấp nằm trên ảnh).
function DacDiemGoi({ id, mau, dangChon, gon }: { id: TierId; mau: React.ReactNode; dangChon?: boolean; gon?: boolean }) {
  return (
    // GỌN (chủ dự án 22/10/2026 tối: "tin minh hoạ — có thể giảm đồng đều khung hình các cấp cho gọn"): khung ảnh theo bề
    // rộng thẻ nên thẻ thu nhỏ đều (TheMau). Điện thoại 290px (thấy mép thẻ sau), máy tính 300px.
    <article data-cap={id} className={`${gon ? "w-[248px]" : "w-[290px] sm:w-[300px]"} shrink-0 snap-start overflow-hidden rounded-2xl border bg-white ${dangChon ? "border-cvr-ink ring-1 ring-cvr-ink" : "border-cvr-line"}`}>
      {mau}
    </article>
  );
}

// ── HÌNH MINH HOẠ TỪNG GÓI ──────────────────────────────────────────────────
// Thẻ tin điện thoại THẬT của web (TheTinMobile — khung ảnh, tỷ lệ, thông số, số dòng mô tả, nút đúng theo cấp), dữ liệu là
// VÍ DỤ nên không bấm được.
// THU NHỎ ĐỀU (chủ dự án 22/10/2026 tối: "chỉ là minh hoạ — giảm đồng đều khung hình; hạn chế xuống dòng giá, diện tích, vị
// trí"): thẻ dựng đúng bề ngang thẻ thật trên điện thoại (343px) rồi thu cả thẻ bằng zoom cho vừa khung (290px điện thoại,
// 300px máy tính) → khung ảnh, chữ, nút nhỏ đều nhau, các dòng giữ nguyên như thẻ thật, không xuống dòng thêm.
function TheMau({ listing, gon }: { listing: Listing; gon?: boolean }) {
  return (
    <div className={`pointer-events-none w-[343px] select-none ${gon ? "[zoom:0.723]" : "[zoom:0.8455] sm:[zoom:0.8746]"}`} aria-hidden>
      <TheTinMobile item={listing} />
    </div>
  );
}
