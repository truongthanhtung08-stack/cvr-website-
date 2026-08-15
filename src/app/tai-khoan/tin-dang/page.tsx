"use client";

import { useEffect, useState } from "react";
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
export default function MyListingsPage() {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | ListingStatus>("all");

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
      setRows((data ?? []) as ListingRow[]);
      setLoading(false);
    })();
  }, []);

  // Xoá tin NHÁP của chính mình (hỏi xác nhận trước; RLS chỉ cho xoá tin mình)
  async function handleDelete(r: ListingRow) {
    if (!window.confirm(`Xoá tin nháp "${r.title || "(chưa có tiêu đề)"}"?`)) return;
    const { error } = await createClient().from("listings").delete().eq("id", r.id);
    if (!error) setRows((rows) => rows.filter((x) => x.id !== r.id));
  }

  const filtered = tab === "all" ? rows : rows.filter((r) => r.status === tab);
  const count = (s: ListingStatus) => rows.filter((r) => r.status === s).length;

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

  return (
    <div className="space-y-4">
      <PageHeader title="Tin đã đăng" desc="Tin của bạn ở mọi trạng thái — kể cả nháp và tin đang chờ duyệt." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                tab === t.key ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link href="/dang-tin" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          + Đăng tin mới
        </Link>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center gap-4 rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium text-cvr-ink">{r.title || "(chưa có tiêu đề)"}</span>
                {listingStatusBadge(r.status)}
              </div>
              <div className="mt-1 truncate text-sm text-cvr-muted">
                {purposeLabel(r.purpose)}{r.type ? ` · ${r.type}` : ""} · {adminPriceText(r.price_vnd, r.purpose)}
                {r.area_m2 != null ? ` · ${r.area_m2} m²` : ""}
                {r.province ? ` · ${r.province}` : ""}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-xs text-cvr-faint">{r.view_count} lượt xem</span>
              {r.status === "approved" && (
                <Link
                  href={`/bat-dong-san/${r.id}`}
                  target="_blank"
                  className="flex h-9 items-center gap-1.5 rounded-full border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
                >
                  Xem ↗
                </Link>
              )}
              <Link
                href={`/dang-tin?id=${r.id}`}
                className="flex h-9 items-center gap-1.5 rounded-full bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Sửa
              </Link>
              {r.status === "draft" && (
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  className="flex h-9 items-center rounded-full border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50"
                >
                  Xoá
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-cvr-muted">Không có tin nào ở mục này.</p>
        )}
      </div>
    </div>
  );
}
