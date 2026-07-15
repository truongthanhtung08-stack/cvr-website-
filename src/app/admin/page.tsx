"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Stats = { total: number; newWeek: number; pending: number; agents: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [total, newWeek, pending, agents] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["agent", "company"]),
      ]);
      setStats({
        total: total.count ?? 0,
        newWeek: newWeek.count ?? 0,
        pending: pending.count ?? 0,
        agents: agents.count ?? 0,
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

      {/* KPI cần dữ liệu tin đăng (B2) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tin chờ duyệt" value={undefined} pending />
        <StatCard label="Tin đang đăng" value={undefined} pending />
        <StatCard label="Tỷ lệ giữ chân" value={undefined} pending />
        <StatCard label="Mật độ tin / thành viên" value={undefined} pending />
      </div>

      <div className="mt-6 rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Bắt đầu nhanh</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/admin/khach-hang" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
            Quản lý khách hàng
          </Link>
          <Link href="/admin/khach-hang/moi" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Tạo khách hàng
          </Link>
        </div>
        <p className="mt-3 text-xs text-cvr-faint">
          Các chỉ số về tin đăng (chờ duyệt, giữ chân, mật độ tin) sẽ hiển thị sau khi hoàn thành phần Tin đăng (B2).
        </p>
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
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
      <p className="text-sm text-cvr-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>
        {pending ? <span className="text-base font-medium text-cvr-faint">Chờ B2</span> : value ?? "…"}
      </p>
    </div>
  );
}
