"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Role, Status } from "@/lib/useProfile";
import { roleLabel, statusBadge } from "@/lib/adminLabels";

export default function CustomersPage() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [status, setStatus] = useState<"all" | Status>("all");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setRows(data as Profile[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (role !== "all" && r.role !== role) return false;
      if (status !== "all" && r.status !== status) return false;
      if (!kw) return true;
      return [r.full_name, r.phone, r.email, r.company_name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(kw));
    });
  }, [rows, q, role, status]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Khách hàng</h1>
          <p className="mt-1 text-sm text-cvr-muted">
            {loading ? "Đang tải…" : `${filtered.length} / ${rows.length} khách hàng`}
          </p>
        </div>
        <Link
          href="/admin/khach-hang/moi"
          className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
        >
          + Tạo khách hàng
        </Link>
      </div>

      {/* Bộ lọc */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, SĐT, email, công ty…"
          className="h-10 min-w-[240px] flex-1 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-ink"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "all" | Role)}
          className="h-10 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-body outline-none focus:border-cvr-ink"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="buyer">Người mua</option>
          <option value="agent">Môi giới</option>
          <option value="company">Công ty / Sàn</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | Status)}
          className="h-10 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-body outline-none focus:border-cvr-ink"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="pending">Chờ duyệt</option>
          <option value="suspended">Đã khoá</option>
        </select>
      </div>

      {/* Bảng (desktop) */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wider text-cvr-faint">
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">Liên hệ</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày đăng ký</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-cvr-line/70 last:border-0 hover:bg-cvr-surface/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-cvr-ink">{r.full_name || "(chưa đặt tên)"}</div>
                  {r.company_name && <div className="text-xs text-cvr-muted">{r.company_name}</div>}
                </td>
                <td className="px-4 py-3 text-cvr-body">
                  <div>{r.phone || "—"}</div>
                  <div className="text-xs text-cvr-muted">{r.email || "—"}</div>
                </td>
                <td className="px-4 py-3 text-cvr-body">{roleLabel(r.role)}</td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-cvr-muted">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/khach-hang/${r.id}`} className="text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-cvr-muted">
                  Không có khách hàng nào khớp bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Thẻ (mobile) */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/admin/khach-hang/${r.id}`}
            className="block rounded-2xl border border-cvr-line bg-white p-4 shadow-lux"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-cvr-ink">{r.full_name || "(chưa đặt tên)"}</span>
              {statusBadge(r.status)}
            </div>
            <div className="mt-1 text-sm text-cvr-body">{r.phone || "—"} · {r.email || "—"}</div>
            <div className="mt-1 text-xs text-cvr-muted">{roleLabel(r.role)} · {fmtDate(r.created_at)}</div>
          </Link>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-cvr-muted">Không có khách hàng nào khớp bộ lọc.</p>
        )}
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
