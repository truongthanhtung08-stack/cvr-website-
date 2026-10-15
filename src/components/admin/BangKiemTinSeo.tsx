"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ListingRow } from "@/lib/listingAdmin";

// ============================================================================
// BẢNG KIỂM CHUẨN SEO CỦA MỘT TIN — trang duyệt/sửa tin trong admin (tự động hoá D3, 15/10/2026)
// Tiêu chí: docs/CHUAN-TIN-DANG-SEO.md. Tin chưa đạt mục "bắt buộc" → web tự gắn noindex.
// Giai đoạn sau, AI kiểm duyệt chấm theo đúng bảng này.
// ============================================================================

const soAnh = (r: ListingRow) => (r.images ?? []).filter((s) => !/youtu|\.mp4|\.mov|\.webm/i.test(s)).length;
const sdt = (s?: string) => (s ?? "").split(/[,;/|]| - /)[0].replace(/\D/g, "").replace(/^84/, "0").slice(0, 10);
const nhaHoacCanHo = (t: string) => /căn hộ|chung cư|nhà|biệt thự|shophouse|villa/i.test(t);

export default function BangKiemTinSeo({ row }: { row: ListingRow }) {
  const [trung, setTrung] = useState<{ id: string; title: string }[]>([]);

  // Cùng người đăng + cùng loại + giá + diện tích + phường = cùng một BĐS đăng nhiều tin
  useEffect(() => {
    if (row.price_vnd == null || row.area_m2 == null) return;
    let huy = false;
    createClient()
      .from("listings")
      .select("id,title,details")
      .eq("type", row.type)
      .eq("price_vnd", row.price_vnd)
      .eq("area_m2", row.area_m2)
      .neq("id", row.id)
      .in("status", ["approved", "expired", "pending"])
      .then(({ data }) => {
        if (huy || !data) return;
        const so = sdt(row.details?.contact?.phone);
        setTrung(data.filter((x) => so && sdt((x.details as ListingRow["details"])?.contact?.phone) === so).map((x) => ({ id: x.id, title: x.title })));
      });
    return () => { huy = true; };
  }, [row]);

  const d = row.details ?? {};
  const tieuDe = row.title ?? "";
  const moTa = (row.description ?? "").trim();
  const tieuChi: { ten: string; dat: boolean; batBuoc: boolean }[] = [
    { ten: `Ảnh thật ≥ 3 (đang có ${soAnh(row)})`, dat: soAnh(row) >= 3, batBuoc: true },
    { ten: `Mô tả ≥ 100 ký tự (đang có ${moTa.length})`, dat: moTa.length >= 100, batBuoc: true },
    { ten: "Không trùng tin khác (cùng người · loại · giá · diện tích)", dat: trung.length === 0, batBuoc: true },
    { ten: "Tiêu đề 30–100 ký tự, không viết hoa toàn bộ", dat: tieuDe.length >= 30 && tieuDe.length <= 100 && tieuDe !== tieuDe.toUpperCase(), batBuoc: false },
    { ten: "Có giá và diện tích", dat: row.area_m2 != null && (row.price_vnd != null || !!(d as { giaTuGhi?: string }).giaTuGhi), batBuoc: false },
    { ten: "Địa chỉ có tên đường (để vào trang theo đường)", dat: /đường|kiệt|hẻm|ngõ/i.test(d.addressDetail ?? ""), batBuoc: false },
    { ten: "Có hướng nhà", dat: !!d.direction, batBuoc: false },
    ...(row.purpose === "thue" ? [] : [{ ten: "Có pháp lý", dat: !!d.legal, batBuoc: false }]),
    ...(nhaHoacCanHo(row.type) ? [{ ten: "Có số phòng ngủ", dat: row.beds != null && row.beds > 0, batBuoc: false }] : []),
  ];
  const datBatBuoc = tieuChi.filter((t) => t.batBuoc).every((t) => t.dat);

  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-lux">
      <p className="text-sm font-semibold text-cvr-ink">
        Chuẩn SEO của tin:{" "}
        <span className={datBatBuoc ? "text-green-700" : "text-red-600"}>
          {datBatBuoc ? "đạt — Google được lập chỉ mục" : "chưa đạt — web đang chặn Google lập chỉ mục"}
        </span>
      </p>
      <ul className="mt-2 grid grid-cols-1 gap-1 text-[13px] sm:grid-cols-2">
        {tieuChi.map((t) => (
          <li key={t.ten} className={t.dat ? "text-cvr-body" : t.batBuoc ? "text-red-600" : "text-amber-700"}>
            {t.dat ? "✓" : "✗"} {t.ten}{!t.dat && t.batBuoc ? " (bắt buộc)" : ""}
          </li>
        ))}
      </ul>
      {trung.length > 0 && (
        <p className="mt-2 text-[13px] text-red-600">
          Trùng với:{" "}
          {trung.map((x, i) => (
            <span key={x.id}>{i > 0 && " · "}<Link href={`/admin/tin-dang/${x.id}`} className="underline">{x.title.slice(0, 40)}</Link></span>
          ))}
        </p>
      )}
    </div>
  );
}
