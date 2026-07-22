"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { type ArticleRow, type ContentStatus, contentStatusBadge } from "@/lib/contentAdmin";

// Quản lý bài viết Tin tức: danh sách + lọc + Đăng/Ẩn nhanh.
export default function AdminArticlesPage() {
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbMissing, setDbMissing] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ContentStatus>("all");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) setDbMissing(true); // bảng chưa tạo (chưa chạy 0009_articles_projects.sql)
      else setRows((data ?? []) as ArticleRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!kw) return true;
      return [r.title, r.category, r.slug].some((v) => v.toLowerCase().includes(kw));
    });
  }, [rows, q, status]);

  // Đăng / Ẩn nhanh — thất bại phải báo ngay
  async function setRowStatus(id: string, next: ContentStatus) {
    const supabase = createClient();
    const patch: Partial<ArticleRow> = { status: next };
    if (next === "published") patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("articles").update(patch).eq("id", id);
    if (error) {
      window.alert(`Đổi trạng thái THẤT BẠI — bài chưa thay đổi.\nLỗi: ${error.message}`);
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  if (dbMissing) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Tin tức</h1>
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <p className="text-sm leading-relaxed text-amber-900">
            Bảng <code className="font-semibold">articles</code> chưa được tạo trên Supabase.
            Vào <strong>Supabase → SQL Editor</strong>, dán toàn bộ file{" "}
            <code className="font-semibold">supabase/migrations/0009_articles_projects.sql</code> rồi bấm <strong>Run</strong>.
            Xong tải lại trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Tin tức</h1>
          <p className="mt-1 text-sm text-cvr-muted">
            {loading ? "Đang tải…" : `${filtered.length} / ${rows.length} bài viết`}
          </p>
        </div>
        <Link
          href="/admin/tin-tuc/moi"
          className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
        >
          + Viết bài mới
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tiêu đề, chuyên mục…"
          className="h-10 min-w-[240px] flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-ink"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-10 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-body outline-none focus:border-cvr-ink"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="published">Đã đăng</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux">
        {filtered.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-cvr-line/70 px-4 py-3 last:border-0 hover:bg-cvr-surface/60">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/tin-tuc/${r.id}`} className="block truncate font-medium text-cvr-ink hover:text-cvr-blue-ink">
                {r.title}
              </Link>
              <p className="truncate text-xs text-cvr-muted">
                {r.category} · /tin-tuc/{r.slug} · {fmtDate(r.published_at ?? r.created_at)}
              </p>
            </div>
            {contentStatusBadge(r.status)}
            <span className="flex items-center gap-3">
              {r.status === "draft" ? (
                <button type="button" onClick={() => setRowStatus(r.id, "published")} className="text-sm font-medium text-green-700 hover:text-green-800">
                  Đăng
                </button>
              ) : (
                <button type="button" onClick={() => setRowStatus(r.id, "draft")} className="text-sm font-medium text-cvr-muted hover:text-cvr-ink">
                  Ẩn
                </button>
              )}
              <Link href={`/admin/tin-tuc/${r.id}`} className="text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
                Sửa
              </Link>
            </span>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-cvr-muted">
            {rows.length === 0 ? "Chưa có bài viết nào — bấm “+ Viết bài mới”." : "Không có bài nào khớp bộ lọc."}
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-cvr-faint">
        Khi chưa có bài thật nào <strong>Đã đăng</strong>, web tạm hiện các bài mẫu. Đăng bài thật đầu tiên → chỉ hiện bài thật.
      </p>
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
