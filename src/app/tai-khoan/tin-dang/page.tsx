"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/Ui";
import {
  type ListingRow,
  type ListingStatus,
  purposeLabel,
  listingStatusBadge,
  adminPriceText,
} from "@/lib/listingAdmin";

// Tin đăng của THÀNH VIÊN — tin của chính mình (mọi trạng thái, kể cả nháp).
// RLS đảm bảo chỉ thấy tin owner_id = mình.
// Lead = người ĐÃ ĐĂNG NHẬP đã bấm "hiện số" ở tin của mình (bảng listing_leads).
type Lead = { id: string; listing_id: string; viewer_name: string | null; viewer_phone: string | null; created_at: string };

// Số tin mỗi trang. Khách đăng vài trăm tin thì đổ hết ra một trang là máy yếu
// đứng hình và không tài nào tìm lại được tin cũ.
const MOI_TRANG = 10;

export default function MyListingsPage() {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [leadsByListing, setLeadsByListing] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | ListingStatus>("all");
  const [tuKhoa, setTuKhoa] = useState("");
  const [trang, setTrang] = useState(1);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as ListingRow[];
      setRows(list);
      setLoading(false);

      // Lead cho MỌI tin của mình trong một lần gọi (RLS chỉ cho chủ tin đọc).
      const ids = list.map((r) => r.id);
      if (ids.length) {
        const { data: leads } = await supabase
          .from("listing_leads")
          .select("id,listing_id,viewer_name,viewer_phone,created_at")
          .in("listing_id", ids)
          .order("created_at", { ascending: false });
        const grouped: Record<string, Lead[]> = {};
        for (const ld of (leads ?? []) as Lead[]) (grouped[ld.listing_id] ??= []).push(ld);
        setLeadsByListing(grouped);
      }
    })();
  }, []);

  // Xoá tin NHÁP của chính mình (hỏi xác nhận trước; RLS chỉ cho xoá tin mình)
  async function handleDelete(r: ListingRow) {
    if (!window.confirm(`Xoá tin nháp "${r.title || "(chưa có tiêu đề)"}"?`)) return;
    const { error } = await createClient().from("listings").delete().eq("id", r.id);
    if (!error) setRows((rows) => rows.filter((x) => x.id !== r.id));
  }

  const count = (s: ListingStatus) => rows.filter((r) => r.status === s).length;

  // Lọc theo mục đang chọn + ô tìm trong tin của mình (tiêu đề / địa chỉ).
  const filtered = useMemo(() => {
    const t = tuKhoa.trim().toLowerCase();
    return rows
      .filter((r) => (tab === "all" ? true : r.status === tab))
      .filter((r) =>
        !t
          ? true
          : `${r.title ?? ""} ${r.details?.addressDetail ?? ""} ${r.ward ?? ""} ${r.district ?? ""} ${r.province ?? ""}`
              .toLowerCase()
              .includes(t),
      );
  }, [rows, tab, tuKhoa]);

  // PHÂN TRANG — số trang luôn nằm trong khoảng hợp lệ kể cả khi vừa đổi mục
  // lọc làm danh sách ngắn lại (trước đây đứng ở "trang 5" mà mục mới chỉ có
  // 2 trang thì màn hình trắng trơn).
  const tongTrang = Math.max(1, Math.ceil(filtered.length / MOI_TRANG));
  const trangHienTai = Math.min(trang, tongTrang);
  const tinTrongTrang = filtered.slice((trangHienTai - 1) * MOI_TRANG, trangHienTai * MOI_TRANG);

  function doiTrang(p: number) {
    setTrang(Math.min(Math.max(1, p), tongTrang));
    document.getElementById("dau-danh-sach")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Đổi mục lọc / gõ tìm → quay về trang 1
  function chonTab(k: "all" | ListingStatus) { setTab(k); setTrang(1); }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-cvr-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-cvr-ink">Chưa có tin đăng</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-cvr-muted">
          Đăng tin đầu tiên của bạn — có thể lưu nháp và hoàn thiện dần.
        </p>
        <Link href="/dang-tin" className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          + Đăng tin mới
        </Link>
      </div>
    );
  }

  const tabs: { key: "all" | ListingStatus; label: string }[] = [
    { key: "all", label: `Tất cả (${rows.length})` },
    { key: "approved", label: `Đang đăng (${count("approved")})` },
    { key: "pending", label: `Chờ duyệt (${count("pending")})` },
    { key: "draft", label: `Nháp (${count("draft")})` },
  ];
  // Chỉ hiện mục "Bị từ chối" khi thật sự có — không ai cần một mục luôn bằng 0.
  if (count("rejected") > 0) tabs.push({ key: "rejected", label: `Bị từ chối (${count("rejected")})` });

  return (
    <div className="space-y-4">
      <PageHeader title="Tin đã đăng" desc="Tin của bạn ở mọi trạng thái — kể cả nháp và tin đang chờ duyệt.">
        <Link href="/dang-tin" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          + Đăng tin mới
        </Link>
      </PageHeader>

      {/* Thanh lọc: mục trạng thái bên trái, ô tìm bên phải. Ô tìm chỉ tìm trong
          tin của CHÍNH MÌNH — có vài trăm tin thì cuộn tay không nổi. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => chonTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                tab === t.key ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={tuKhoa}
          onChange={(e) => { setTuKhoa(e.target.value); setTrang(1); }}
          placeholder="Tìm trong tin của tôi…"
          className="h-9 w-full rounded-full border border-cvr-line px-4 text-sm text-cvr-ink outline-none transition placeholder:text-cvr-faint focus:border-cvr-ink sm:w-64"
        />
      </div>

      <div id="dau-danh-sach" className="space-y-3 scroll-mt-32">
        {tinTrongTrang.map((r) => {
          const leads = leadsByListing[r.id] ?? [];
          return (
          <article key={r.id} className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
            {/* TIÊU ĐỀ HIỆN ĐỦ, KHÔNG CẮT.
                Trước đây tiêu đề nằm cùng HÀNG với cụm nút (Xem · Sửa · Xoá) và
                bị `truncate` → tin nào cũng cụt giữa chừng, khách không phân biệt
                nổi tin nào với tin nào. Nay tiêu đề chiếm trọn một dòng riêng và
                tự xuống dòng; cụm nút tụt xuống dưới. */}
            <div className="flex flex-wrap items-center gap-2">
              {listingStatusBadge(r.status)}
              <span className="text-xs text-cvr-faint">{r.view_count} lượt xem</span>
              {leads.length > 0 && (
                <span className="text-xs font-semibold text-cvr-blue-ink">· {leads.length} người quan tâm</span>
              )}
            </div>
            <h3 className="mt-1.5 break-words text-[15px] font-semibold leading-snug text-cvr-ink">
              {r.title || "(chưa có tiêu đề)"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-cvr-muted">
              {purposeLabel(r.purpose)}{r.type ? ` · ${r.type}` : ""} · {adminPriceText(r.price_vnd, r.purpose)}
              {r.area_m2 != null ? ` · ${r.area_m2} m²` : ""}
              {r.province ? ` · ${r.province}` : ""}
            </p>

            {/* Tin bị từ chối: nói thẳng lý do ngay tại đây. Chỉ báo qua email thì
                khách mất thư là chịu, vào trang này chỉ thấy chữ "Bị từ chối" trơ trọi. */}
            {r.status === "rejected" && r.details?.ly_do_tu_choi && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-800">
                <span className="font-semibold">Lý do chưa duyệt:</span> {r.details.ly_do_tu_choi}
                <span className="block text-red-700/80">Sửa lại rồi gửi duyệt lại — tin chưa duyệt thì chưa bị trừ tiền.</span>
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cvr-line pt-3">
              <Link
                href={`/dang-tin?id=${r.id}`}
                className="flex h-9 items-center gap-1.5 rounded-full bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Sửa
              </Link>
              {r.status === "approved" && (
                <Link
                  href={`/bat-dong-san/${r.id}`}
                  target="_blank"
                  className="flex h-9 items-center gap-1.5 rounded-full border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
                >
                  Xem ↗
                </Link>
              )}
              {/* THỐNG KÊ — lượt xem theo ngày + danh sách ai đã bấm xem số.
                  Trước đây danh sách người quan tâm bung ngay trong thẻ, tin nào
                  cũng bung là danh sách dài dằng dặc; nay có trang riêng. */}
              <Link
                href={`/tai-khoan/tin-dang/${r.id}`}
                className="flex h-9 items-center gap-1.5 rounded-full border border-cvr-line bg-cvr-surface px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
              >
                Thống kê
              </Link>
              {r.status === "draft" && (
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  className="ml-auto flex h-9 items-center rounded-full border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50"
                >
                  Xoá
                </button>
              )}
            </div>

          </article>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-cvr-muted">
            {tuKhoa.trim() ? `Không có tin nào khớp “${tuKhoa.trim()}”.` : "Không có tin nào ở mục này."}
          </p>
        )}
      </div>

      {tongTrang > 1 && (
        <PhanTrang tong={tongTrang} hienTai={trangHienTai} doiTrang={doiTrang} soTin={filtered.length} />
      )}
    </div>
  );
}

// ─── PHÂN TRANG ─────────────────────────────────────────────────────────────
// Nhiều trang thì chỉ hiện quanh trang đang xem + trang đầu/cuối, chèn "…" ở
// giữa — đăng vài trăm tin mà in ra 50 nút số thì tràn hết màn hình điện thoại.
function PhanTrang({
  tong,
  hienTai,
  doiTrang,
  soTin,
}: {
  tong: number;
  hienTai: number;
  doiTrang: (p: number) => void;
  soTin: number;
}) {
  const so: (number | "…")[] = [];
  for (let p = 1; p <= tong; p++) {
    if (p === 1 || p === tong || Math.abs(p - hienTai) <= 1) so.push(p);
    else if (so[so.length - 1] !== "…") so.push("…");
  }

  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={hienTai === 1}
          onClick={() => doiTrang(hienTai - 1)}
          aria-label="Trang trước"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        {so.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-cvr-faint">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => doiTrang(p)}
              aria-current={p === hienTai ? "page" : undefined}
              className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                p === hienTai
                  ? "bg-cvr-ink text-white"
                  : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={hienTai === tong}
          onClick={() => doiTrang(hienTai + 1)}
          aria-label="Trang sau"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-cvr-line text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <p className="text-xs text-cvr-faint">
        Trang {hienTai}/{tong} · {soTin} tin
      </p>
    </div>
  );
}
