"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  type ListingRow,
  type ListingTier,
  type ListingStatus,
  type ListingPurpose,
  purposeLabel,
  tierBadge,
  listingStatusBadge,
  adminPriceText,
} from "@/lib/listingAdmin";

// Quản lý tin đăng (B3): danh sách + lọc + thao tác nhanh Duyệt/Ẩn/Hiện.
export default function AdminListingsPage() {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbMissing, setDbMissing] = useState(false);
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState<"all" | ListingPurpose>("all");
  const [tier, setTier] = useState<"all" | ListingTier>("all");
  const [status, setStatus] = useState<"all" | ListingStatus>("all");
  const [chon, setChon] = useState<Set<string>>(new Set()); // tin đang tick để xoá hàng loạt

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) setDbMissing(true); // bảng chưa tạo (chưa chạy 0002_listings.sql)
      else setRows((data ?? []) as ListingRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (purpose !== "all" && r.purpose !== purpose) return false;
      if (tier !== "all" && r.tier !== tier) return false;
      if (status !== "all" && r.status !== status) return false;
      if (!kw) return true;
      return [r.title, r.type, r.ward, r.district, r.province]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(kw));
    });
  }, [rows, q, purpose, tier, status]);

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const draftCount = rows.filter((r) => r.status === "draft").length;

  // Thao tác nhanh: đổi trạng thái 1 tin (Duyệt / Ẩn / Hiện lại)
  // KHÔNG nuốt lỗi: thất bại phải báo ngay để admin biết tin CHƯA đổi trạng thái.
  async function setRowStatus(id: string, next: ListingStatus) {
    // DUYỆT phải đi qua máy chủ — ở đó mới trừ ví theo bảng giá, ghi doanh thu
    // và báo cho khách. Sửa thẳng từ trình duyệt là tin lên sóng MIỄN PHÍ.
    if (next === "approved") {
      const r = await fetch("/api/tin-dang/duyet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json().catch(() => ({ ok: false, message: "Máy chủ không trả lời" }));
      if (!j.ok) {
        window.alert(`Duyệt tin THẤT BẠI — tin chưa thay đổi.\n${j.message ?? ""}`);
        return;
      }
      setRows((rs) =>
        rs.map((x) => (x.id === id ? { ...x, status: next, published_at: new Date().toISOString() } : x)),
      );
      if (j.daTru) {
        window.alert(
          `Đã duyệt và cho tin lên sóng.\n\n` +
            `Đã trừ ví: ${Number(j.daTru).toLocaleString("vi-VN")}đ\n` +
            `Số dư còn: ${Number(j.soDuMoi).toLocaleString("vi-VN")}đ\n` +
            `Hóa đơn: ${j.hoaDon}`,
        );
      }
      return;
    }

    const supabase = createClient();
    const patch: Partial<ListingRow> = { status: next };
    const { error } = await supabase.from("listings").update(patch).eq("id", id);
    if (error) {
      window.alert(`Đổi trạng thái THẤT BẠI — tin chưa thay đổi.\nLỗi: ${error.message}`);
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  // TỪ CHỐI phải đi qua máy chủ: ghi lý do vào tin rồi BÁO KHÁCH qua email/Zalo.
  // Sửa thẳng từ trình duyệt thì tin chết lặng, khách ngồi chờ mãi không biết vì sao.
  async function tuChoi(id: string) {
    const lyDo = window.prompt(
      "Lý do từ chối (khách nhận đúng dòng này qua email):\n" +
        "Ví dụ: Ảnh mờ và trùng tin khác · Thiếu diện tích và giá · Sai khu vực.",
    );
    if (lyDo === null) return;
    if (!lyDo.trim()) {
      window.alert("Chưa ghi lý do — tin chưa thay đổi.");
      return;
    }

    const r = await fetch("/api/tin-dang/tu-choi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, lyDo }),
    });
    const j = await r.json().catch(() => ({ ok: false, message: "Máy chủ không trả lời" }));
    if (!j.ok) {
      window.alert(`Từ chối tin THẤT BẠI — tin chưa thay đổi.\n${j.message ?? ""}`);
      return;
    }
    setRows((rs) => rs.map((x) => (x.id === id ? { ...x, status: "rejected" } : x)));

    // Nói rõ đã báo được khách chưa — gửi hỏng thì admin còn gọi điện.
    const kenh = (j.thongBao ?? []) as { kenh: string; daGui: boolean; lyDo?: string }[];
    const hong = kenh.filter((k) => !k.daGui).map((k) => `· ${k.kenh}: ${k.lyDo ?? "không gửi được"}`);
    window.alert(
      "Đã từ chối tin.\n\n" +
        (kenh.some((k) => k.daGui) ? "Đã báo cho khách." : "CHƯA báo được cho khách — cần liên hệ tay.") +
        (hong.length ? `\n\nKênh không gửi được:\n${hong.join("\n")}` : ""),
    );
  }

  // XOÁ HẲN một tin — dùng khi nhập nhầm/nhập thừa từ file và muốn nhập lại.
  // Phải xoá thật khỏi bảng: mã ảnh còn nằm đó thì lần nhập sau chỉ bổ sung ảnh,
  // KHÔNG đăng lại tin (xem trang Đăng nhiều tin bằng file).
  // XOÁ HÀNG LOẠT — tick chọn nhiều tin rồi xoá một lượt. Dùng khi nhập nhầm cả
  // một đợt tin bằng file và muốn làm lại sạch từ đầu (33 tin mà bấm xoá từng cái
  // thì mất cả buổi).
  async function xoaNhieu() {
    const ds = [...chon];
    if (!ds.length) return;
    if (!window.confirm(`XOÁ HẲN ${ds.length} tin đã chọn? Không lấy lại được.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("listings").delete().in("id", ds);
    if (error) {
      window.alert(`Xoá THẤT BẠI — chưa tin nào bị xoá.\nLỗi: ${error.message}`);
      return;
    }
    setRows((rs) => rs.filter((r) => !chon.has(r.id)));
    setChon(new Set());
  }

  async function xoaTin(id: string, tieuDe: string) {
    if (!window.confirm(`XOÁ HẲN tin này? Không lấy lại được.\n\n${tieuDe}`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      window.alert(`Xoá THẤT BẠI — tin chưa bị xoá.\nLỗi: ${error.message}`);
      return;
    }
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  if (dbMissing) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Tin đăng</h1>
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <p className="text-sm leading-relaxed text-amber-900">
            Bảng <code className="font-semibold">listings</code> chưa được tạo trên Supabase.
            Vào <strong>Supabase → SQL Editor</strong>, dán toàn bộ file{" "}
            <code className="font-semibold">supabase/migrations/0002_listings.sql</code> rồi bấm <strong>Run</strong>.
            Xong tải lại trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Tin đăng</h1>
          <p className="mt-1 text-sm text-cvr-muted">
            {loading
              ? "Đang tải…"
              : `${filtered.length} / ${rows.length} tin${pendingCount ? ` · ${pendingCount} chờ duyệt` : ""}${draftCount ? ` · ${draftCount} nháp` : ""}`}
          </p>
        </div>
        <Link
          href="/admin/tin-dang/moi"
          className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
        >
          + Đăng tin mới
        </Link>
      </div>

      {/* Bộ lọc */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tiêu đề, loại hình, khu vực…"
          className="h-10 min-w-[240px] flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-ink"
        />
        <select value={purpose} onChange={(e) => setPurpose(e.target.value as typeof purpose)} className={selCls}>
          <option value="all">Bán & Thuê</option>
          <option value="ban">Mua bán</option>
          <option value="thue">Cho thuê</option>
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} className={selCls}>
          <option value="all">Tất cả hạng</option>
          <option value="diamond">Diamond</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="basic">Thường</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selCls}>
          <option value="all">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đang đăng</option>
          <option value="hidden">Đã ẩn</option>
          <option value="rejected">Từ chối</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      {/* Thanh chọn nhiều tin — chỉ hiện khi đã tick ít nhất một tin */}
      {chon.size > 0 && (
        // DÍNH THEO MÀN HÌNH: tick một dòng ở cuối bảng 80 tin mà thanh xoá nằm tít
        // trên đầu trang thì coi như không có nút. Luôn nổi ở đáy màn hình.
        <div className="sticky bottom-3 z-30 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 shadow-lux">
          <span className="text-sm font-semibold text-red-800">Đã chọn {chon.size} tin</span>
          <button type="button" onClick={xoaNhieu} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800">
            Xoá {chon.size} tin
          </button>
          <button type="button" onClick={() => setChon(new Set())} className="text-sm font-medium text-cvr-body hover:text-cvr-ink">
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Bảng (desktop) */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wider text-cvr-faint">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả tin đang lọc"
                  checked={filtered.length > 0 && filtered.every((r) => chon.has(r.id))}
                  onChange={(e) => setChon(e.target.checked ? new Set(filtered.map((r) => r.id)) : new Set())}
                  className="h-4 w-4 accent-red-700"
                />
              </th>
              <th className="px-4 py-3 font-medium">Tin đăng</th>
              <th className="px-4 py-3 font-medium">Giá · DT</th>
              <th className="px-4 py-3 font-medium">Hạng</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-cvr-line/70 last:border-0 hover:bg-cvr-surface/60">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Chọn tin ${r.title}`}
                    checked={chon.has(r.id)}
                    onChange={(e) =>
                      setChon((cu) => {
                        const s = new Set(cu);
                        if (e.target.checked) s.add(r.id);
                        else s.delete(r.id);
                        return s;
                      })
                    }
                    className="h-4 w-4 accent-red-700"
                  />
                </td>
                <td className="max-w-[320px] px-4 py-3">
                  <div className="truncate font-medium text-cvr-ink">{r.title}</div>
                  <div className="truncate text-xs text-cvr-muted">
                    {purposeLabel(r.purpose)} · {r.type} · {[r.district, r.province].filter(Boolean).join(", ")}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-cvr-body">
                  <div>{adminPriceText(r.price_vnd, r.purpose)}</div>
                  <div className="text-xs text-cvr-muted">{r.area_m2 != null ? `${r.area_m2} m²` : "—"}</div>
                </td>
                <td className="px-4 py-3">{tierBadge(r.tier)}</td>
                <td className="px-4 py-3">{listingStatusBadge(r.status)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-cvr-muted">{fmtDate(r.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <RowActions row={r} onStatus={setRowStatus} onTuChoi={tuChoi} onXoa={xoaTin} />
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-cvr-muted">
                  {rows.length === 0 ? "Chưa có tin nào — bấm “+ Đăng tin mới”." : "Không có tin nào khớp bộ lọc."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Thẻ (mobile) */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-cvr-line bg-white p-4 shadow-lux">
            <Link href={`/admin/tin-dang/${r.id}`} className="block">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug text-cvr-ink">{r.title}</span>
                {listingStatusBadge(r.status)}
              </div>
              <div className="mt-1 text-sm text-cvr-body">
                {adminPriceText(r.price_vnd, r.purpose)} · {r.area_m2 != null ? `${r.area_m2} m²` : "—"}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-cvr-muted">
                {tierBadge(r.tier)} <span>{purposeLabel(r.purpose)} · {[r.district, r.province].filter(Boolean).join(", ")}</span>
              </div>
            </Link>
            <div className="mt-3 border-t border-cvr-line pt-2 text-right">
              <RowActions row={r} onStatus={setRowStatus} onTuChoi={tuChoi} onXoa={xoaTin} />
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-cvr-muted">
            {rows.length === 0 ? "Chưa có tin nào — bấm “+ Đăng tin mới”." : "Không có tin nào khớp bộ lọc."}
          </p>
        )}
      </div>
    </div>
  );
}

// Thao tác nhanh theo trạng thái: Duyệt (pending) · Ẩn (approved) · Hiện lại (hidden/rejected/expired)
function RowActions({
  row,
  onStatus,
  onTuChoi,
  onXoa,
}: {
  row: ListingRow;
  onStatus: (id: string, next: ListingStatus) => void;
  onTuChoi: (id: string) => void;
  onXoa: (id: string, tieuDe: string) => void;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <a href={`/bat-dong-san/${row.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-cvr-body hover:text-cvr-ink">
        Xem
      </a>
      {row.status === "draft" && (
        <button type="button" onClick={() => onStatus(row.id, "approved")} className="text-sm font-medium text-green-700 hover:text-green-800">
          Đăng
        </button>
      )}
      {row.status === "pending" && (
        <button type="button" onClick={() => onStatus(row.id, "approved")} className="text-sm font-medium text-green-700 hover:text-green-800">
          Duyệt
        </button>
      )}
      {row.status === "pending" && (
        <button type="button" onClick={() => onTuChoi(row.id)} className="text-sm font-medium text-red-700 hover:text-red-800">
          Từ chối
        </button>
      )}
      {row.status === "approved" && (
        <button type="button" onClick={() => onStatus(row.id, "hidden")} className="text-sm font-medium text-cvr-muted hover:text-cvr-ink">
          Ẩn
        </button>
      )}
      {(row.status === "hidden" || row.status === "rejected" || row.status === "expired") && (
        <button type="button" onClick={() => onStatus(row.id, "approved")} className="text-sm font-medium text-green-700 hover:text-green-800">
          Hiện lại
        </button>
      )}
      <Link href={`/admin/tin-dang/${row.id}`} className="text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
        Sửa
      </Link>
      <button type="button" onClick={() => onXoa(row.id, row.title)} className="text-sm font-medium text-red-700 hover:text-red-800">
        Xoá
      </button>
    </span>
  );
}

const selCls =
  "h-10 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-body outline-none focus:border-cvr-ink";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
