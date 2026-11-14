"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ListingRow } from "@/lib/listingAdmin";
import { loiTinSeo } from "@/lib/kiemTinSeo";

// ============================================================================
// BẢNG KIỂM CHUẨN SEO CỦA MỘT TIN — trang duyệt/sửa tin trong admin (tự động hoá D3, 15/10/2026)
// Tiêu chí: docs/CHUAN-TIN-DANG-SEO.md. Tin chưa đạt mục "bắt buộc" → web tự gắn noindex.
// Giai đoạn sau, AI kiểm duyệt chấm theo đúng bảng này.
// ============================================================================

const sdt = (s?: string) => (s ?? "").split(/[,;/|]| - /)[0].replace(/\D/g, "").replace(/^84/, "0").slice(0, 10);

// Cùng người đăng + cùng loại + giá + diện tích = cùng một BĐS đăng nhiều tin. Một luật cho bảng kiểm này và
// danh sách Tin chờ duyệt (đếm lỗi ở dòng danh sách phải khớp bảng kiểm khi mở tin).
export async function timTinTrung(row: ListingRow): Promise<{ id: string; title: string }[]> {
  if (row.price_vnd == null || row.area_m2 == null) return [];
  const { data } = await createClient()
    .from("listings")
    .select("id,title,details")
    .eq("type", row.type)
    .eq("price_vnd", row.price_vnd)
    .eq("area_m2", row.area_m2)
    .neq("id", row.id)
    .in("status", ["approved", "expired", "pending"]);
  const so = sdt(row.details?.contact?.phone);
  return (data ?? []).filter((x) => so && sdt((x.details as ListingRow["details"])?.contact?.phone) === so).map((x) => ({ id: x.id, title: x.title }));
}

export default function BangKiemTinSeo({ row }: { row: ListingRow }) {
  const [trung, setTrung] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    let huy = false;
    timTinTrung(row).then((ds) => { if (!huy) setTrung(ds); });
    return () => { huy = true; };
  }, [row]);

  // MỘT luật cho mọi khâu (src/lib/kiemTinSeo.ts): bảng kiểm này, nút Duyệt (còn lỗi vẫn duyệt được, lỗi đã xem ghi vào seoChapNhan), nạp hàng loạt,
  // trang Tổng quan. Chỉ ghi cái CHƯA đạt; cho = chỗ sửa trong form bên dưới (chủ dự án 25/10/2026).
  const loi = loiTinSeo(row, trung.length);
  // Cuộn tới ô cần sửa, đặt con trỏ vào ô đó. Trang không có ô đó (màn hình Duyệt tin nạp) → mở trang Sửa tin,
  // nhảy đúng ô (chủ dự án 25/10/2026: "tin lỗi, bấm vào là đến SỬA")
  const toiO = (id?: string) => {
    const el = id ? document.getElementById(id) : null;
    if (!el) {
      // ?ve= trang đang làm → lưu / duyệt xong ở trang Sửa tin thì quay về đúng chỗ này (chủ dự án 25/10/2026)
      if (id) window.location.assign(`/admin/tin-dang/${row.id}?ve=${encodeURIComponent(window.location.pathname)}#${id}`);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
  };
  // Mở từ màn hình Duyệt tin nạp với #o-… → chờ form vẽ xong rồi nhảy tới ô đó (chỉ cuộn, không mở trang khác)
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id.startsWith("o-")) return;
    let lan = 0;
    const t = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
      }
      if (el || ++lan > 20) clearInterval(t);
    }, 200);
    return () => clearInterval(t);
  }, []);

  // MỌI TIN đều hiện bảng kiểm — tin khách tự đăng cũng qua bước kiểm duyệt, xác thực trước khi lên web (anh 14/11/2026; trước đó 25/10 ẩn với tin khách)
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-lux">
      <p className="text-sm font-semibold text-cvr-ink">
        Chuẩn SEO của tin:{" "}
        <span className={loi.length ? "text-red-600" : "text-green-700"}>
          {loi.length ? `chưa đạt — còn ${loi.length} lỗi, bấm từng lỗi để sửa` : "đạt — Google được lập chỉ mục"}
        </span>
      </p>
      {loi.length > 0 && (
      <ul className="mt-2 grid grid-cols-1 gap-1 text-[13px] sm:grid-cols-2">
        {loi.map((t) => (
          <li key={t.ten} className="text-red-600">
            {/* Bấm cảnh báo → nhảy tới đúng ô trong form sửa tin bên dưới (chủ dự án 25/10/2026), không mở thêm gì mới */}
            <button type="button" onClick={() => toiO(t.o)} className="text-left hover:underline">
              ✗ {t.ten} <span className="text-cvr-muted">→ sửa ở {t.cho}</span>
            </button>
          </li>
        ))}
      </ul>
      )}
      {trung.length > 0 && (
        <p id="o-trung" className="mt-2 text-[13px] text-red-600">
          Trùng với:{" "}
          {trung.map((x, i) => (
            <span key={x.id}>{i > 0 && " · "}<Link href={`/admin/tin-dang/${x.id}`} className="underline">{x.title.slice(0, 40)}</Link></span>
          ))}
        </p>
      )}
    </div>
  );
}
