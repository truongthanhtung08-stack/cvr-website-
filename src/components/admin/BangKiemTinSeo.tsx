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

  // MỘT luật cho mọi khâu (src/lib/kiemTinSeo.ts): bảng kiểm này, nút Duyệt (hỏi lại khi còn lỗi), nạp hàng loạt,
  // trang Tổng quan. Chỉ ghi cái CHƯA đạt; cho = chỗ sửa trong form bên dưới (chủ dự án 25/10/2026).
  // daNhan: mã lỗi admin vừa bấm "Đã kiểm – chấp nhận" (cập nhật tại chỗ, không tải lại trang)
  const [daNhan, setDaNhan] = useState<string[]>([]);
  const loi = loiTinSeo(row, trung.length).filter((x) => !daNhan.includes(x.ma));
  // Admin đã thấy, đã kiểm, chấp nhận → CHỈ ghi nhận các lỗi này (details.seoChapNhan), KHÔNG đổi gói, ngày, hạn hay nội dung
  // tin (chủ dự án 25/10/2026: "không thay đổi bất cứ cái gì ngoài cái lỗi đã duyệt"). Tin không báo lại các lỗi đó.
  async function chapNhan() {
    const ma = loi.map((x) => x.ma);
    const { data: moi } = await createClient().from("listings").select("details").eq("id", row.id).single();
    const d = ((moi?.details ?? row.details ?? {}) as Record<string, unknown>);
    const daCo = (d.seoChapNhan as string[] | undefined) ?? [];
    const { data, error } = await createClient().from("listings").update({ details: { ...d, seoChapNhan: [...new Set([...daCo, ...ma])] } }).eq("id", row.id).select("id");
    if (error || !data?.length) return window.alert(`Chưa ghi nhận được${error ? ": " + error.message : " — phiên đăng nhập admin đã hết, tải lại trang"}`);
    setDaNhan((x) => [...x, ...ma]);
  }
  // Cuộn tới ô cần sửa, đặt con trỏ vào ô đó. Trang không có ô đó (màn hình Duyệt tin nạp) → mở trang Sửa tin,
  // nhảy đúng ô (chủ dự án 25/10/2026: "tin lỗi, bấm vào là đến SỬA")
  const toiO = (id?: string) => {
    const el = id ? document.getElementById(id) : null;
    if (!el) {
      if (id) window.location.assign(`/admin/tin-dang/${row.id}#${id}`);
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
      {loi.length > 0 && (
        <button type="button" onClick={chapNhan} className="mt-3 rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
          Đã kiểm – chấp nhận
        </button>
      )}
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
