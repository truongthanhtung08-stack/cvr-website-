"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Stats = {
  total: number; newWeek: number; pending: number; agents: number;
  // Tin đăng (B2) — null khi bảng listings chưa tạo
  tinPending: number | null; tinLive: number | null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [total, newWeek, pending, agents, tinPending, tinLive] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["agent", "company"]),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
      ]);
      setStats({
        total: total.count ?? 0,
        newWeek: newWeek.count ?? 0,
        pending: pending.count ?? 0,
        agents: agents.count ?? 0,
        // Bảng listings chưa tạo → error → null (hiện "Chờ B2")
        tinPending: tinPending.error ? null : tinPending.count ?? 0,
        tinLive: tinLive.error ? null : tinLive.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Tổng quan</h1>
      <p className="mt-1 text-sm text-cvr-muted">Số liệu thành viên trên nền tảng Coastal Land.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng khách hàng" value={stats?.total} />
        <StatCard label="Đăng ký mới (7 ngày)" value={stats?.newWeek} accent />
        <StatCard label="Chờ duyệt" value={stats?.pending} />
        <StatCard label="Môi giới / Công ty" value={stats?.agents} />
      </div>

      {/* KPI tin đăng (B2) — "Chờ B2" khi bảng listings chưa tạo trên Supabase */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tin chờ duyệt" value={stats?.tinPending ?? undefined} pending={stats ? stats.tinPending == null : false} />
        <StatCard label="Tin đang đăng" value={stats?.tinLive ?? undefined} pending={stats ? stats.tinLive == null : false} accent />
        <StatCard label="Tỷ lệ giữ chân" value={undefined} pending />
        <StatCard label="Mật độ tin / thành viên" value={undefined} pending />
      </div>

      <div className="mt-6 rounded-2xl border border-cvr-line bg-white p-4 shadow-lux">
        <h2 className="text-base font-semibold text-cvr-ink">Bắt đầu nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/admin/tin-dang/moi" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
            + Đăng tin mới
          </Link>
          <Link href="/admin/tin-dang" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Quản lý tin đăng
          </Link>
          <Link href="/admin/du-an/moi" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            + Thêm dự án
          </Link>
          <Link href="/admin/tin-tuc/moi" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            + Viết bài tin tức
          </Link>
          <Link href="/admin/khach-hang" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Quản lý khách hàng
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  pending,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-lux">
      <p className="text-sm text-cvr-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>
        {pending ? <span className="text-base font-medium text-cvr-faint">Chờ B2</span> : value ?? "…"}
      </p>
    </div>
  );
}
