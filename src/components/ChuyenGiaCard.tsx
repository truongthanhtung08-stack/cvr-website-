"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { chuanHoaSdt } from "@/lib/phone";
import type { ChuyenGia } from "@/lib/chuyenGiaDb";

// ============================================================================
// THẺ CHUYÊN GIA — người thật, số tin thật, không có chỉ số bịa.
//
// Chủ dự án chốt thẻ chỉ gồm: TÊN · SỐ ĐIỆN THOẠI · TIN ĐÃ ĐĂNG (+ ảnh đại diện).
// Không sao, không "năm kinh nghiệm", không "số giao dịch" — những con số đó
// không có nguồn thật thì không được phép hiện (xem src/lib/experts.ts).
//
// SỐ ĐIỆN THOẠI đi qua ĐÚNG CỔNG như trang chi tiết tin: HTML chỉ có số đã che,
// bấm "Hiện số" mới gọi RPC reveal_contact → bắt đăng nhập và GHI LEAD cho chính
// chuyên gia đó. Không được in số đầy đủ ra HTML.
// ============================================================================

export default function ChuyenGiaCard({ cg }: { cg: ChuyenGia }) {
  const [so, setSo] = useState<string | null>(null);
  const [dangMo, setDangMo] = useState(false);
  const [loi, setLoi] = useState("");

  const chuCai = cg.ten.trim().split(/\s+/).slice(-2).map((s) => s[0]).join("").toUpperCase();

  async function hienSo() {
    setDangMo(true);
    setLoi("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/dang-nhap?next=${encodeURIComponent(next)}`;
        return;
      }
      const { data, error } = await supabase.rpc("reveal_contact", { p_listing_id: cg.tinDaiDien });
      if (error) throw error;
      const num = chuanHoaSdt((data as string | null) ?? "");
      if (!num) { setLoi("Chuyên gia này chưa công khai số điện thoại."); return; }
      setSo(num);
    } catch {
      setLoi("Không hiện được số. Vui lòng thử lại.");
    } finally {
      setDangMo(false);
    }
  }

  return (
    <article className="shadow-lux flex flex-col rounded-2xl border border-cvr-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-cvr-blue/40">
      <div className="flex items-start gap-4">
        {cg.anh ? (
          <Image
            src={cg.anh}
            alt={cg.ten}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-cvr-line"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-lg font-bold text-cvr-ink ring-1 ring-cvr-line">
            {chuCai}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold text-cvr-ink">{cg.ten}</h3>
          <p className="mt-0.5 text-sm text-cvr-muted">
            <strong className="font-semibold text-cvr-ink">{cg.soTin}</strong> tin đang đăng
          </p>
          {cg.khuVuc.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-cvr-faint">{cg.khuVuc.join(" · ")}</p>
          )}
        </div>
      </div>

      {cg.loaiHinh.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cg.loaiHinh.map((l) => (
            <span key={l} className="rounded-full bg-cvr-surface px-2.5 py-1 text-xs text-cvr-body">{l}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {so ? (
          <>
            <a
              href={`tel:${so}`}
              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
            >
              Gọi {so}
            </a>
            <a
              href={`https://zalo.me/${so}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center justify-center rounded-lg border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              Zalo
            </a>
          </>
        ) : (
          <button
            type="button"
            onClick={hienSo}
            disabled={dangMo}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
          >
            {dangMo ? "Đang mở…" : <>{cg.sdtChe[0] ?? "Hiện số"} · Hiện số</>}
          </button>
        )}
        <Link
          href={`/chuyen-gia/${cg.slug}`}
          className="flex h-10 items-center justify-center rounded-lg border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          Xem tin
        </Link>
      </div>

      {cg.sdtChe.length > 1 && !so && (
        <p className="mt-2 text-xs text-cvr-faint">Còn {cg.sdtChe.length - 1} số khác: {cg.sdtChe.slice(1).join(" · ")}</p>
      )}
      {loi && <p className="mt-2 text-xs font-medium text-red-600">{loi}</p>}
    </article>
  );
}
