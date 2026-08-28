"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, Panel } from "@/components/Ui";

type Stats = {
  total: number; newWeek: number; agents: number;
  khachChoDuyet: number;
  // Tin đăng — null khi bảng listings chưa tạo
  tinPending: number | null; tinLive: number | null;
  // Yêu cầu khách hàng chưa xử lý — null khi bảng chưa tạo
  yeuCauMoi: number | null;
  // Dự án khách gửi chờ duyệt — LUẬT: mọi tin & dự án phải được duyệt mới publish
  duAnPending: number | null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [total, newWeek, khachChoDuyet, agents, tinPending, tinLive, yeuCauMoi, duAnPending] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["agent", "company"]),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("customer_requests").select("*", { count: "exact", head: true }).eq("status", "moi"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({
        total: total.count ?? 0,
        newWeek: newWeek.count ?? 0,
        khachChoDuyet: khachChoDuyet.count ?? 0,
        agents: agents.count ?? 0,
        // Bảng chưa tạo → error → null (ẩn hẳn mục đó thay vì hiện ô rỗng)
        tinPending: tinPending.error ? null : tinPending.count ?? 0,
        tinLive: tinLive.error ? null : tinLive.count ?? 0,
        yeuCauMoi: yeuCauMoi.error ? null : yeuCauMoi.count ?? 0,
        duAnPending: duAnPending.error ? null : duAnPending.count ?? 0,
      });
    })();
  }, []);

  // ── VIỆC CẦN LÀM ─────────────────────────────────────────────────────────
  // Trước đây trang này chỉ có 8 con số CHẾT, trong đó 3 ô ghi "Chờ B2" (chưa có
  // dữ liệu) nên nhìn như làm dở; thấy "5 chờ duyệt" cũng phải tự mò vào menu.
  // Nay việc nào đang chờ thì hiện thành DÒNG BẤM ĐƯỢC, đi thẳng tới nơi xử lý.
  // LUẬT: mọi tin đăng và mọi dự án đều phải được quản trị viên duyệt mới lên web.
  const viec = [
    { n: stats?.tinPending ?? 0, chu: "tin đăng chờ duyệt", href: "/admin/tin-dang" },
    { n: stats?.duAnPending ?? 0, chu: "dự án chờ duyệt", href: "/admin/du-an" },
    { n: stats?.yeuCauMoi ?? 0, chu: "yêu cầu khách hàng mới", href: "/admin/yeu-cau" },
    { n: stats?.khachChoDuyet ?? 0, chu: "khách hàng chờ duyệt", href: "/admin/khach-hang" },
  ].filter((v) => v.n > 0);

  return (
    <div>
      <PageHeader title="Tổng quan" desc="Việc đang chờ xử lý và số liệu nền tảng Coastal Land." />

      {/* 0. SỰ CỐ — đứng TRÊN cả việc cần làm. Email báo lỗi có thể rơi vào spam
             hoặc chính Resend hỏng; đây là đường thứ hai để lỗi không nằm im. */}
      <SuCoBang />

      {/* 1. VIỆC CẦN LÀM — luôn đứng đầu. Hết việc thì báo rõ "không còn việc",
             không để khoảng trống khiến người dùng tưởng trang lỗi. */}
      <Panel title="Việc cần làm" className="mt-6">
        {!stats ? (
          <p className="text-sm text-cvr-muted">Đang tải…</p>
        ) : viec.length === 0 ? (
          <p className="text-sm text-cvr-muted">Không còn việc nào chờ xử lý.</p>
        ) : (
          <div className="space-y-2">
            {viec.map((v) => (
              <Link
                key={v.href}
                href={v.href}
                className="flex items-center gap-3 rounded-xl border border-cvr-line px-4 py-3 transition hover:border-cvr-blue hover:shadow-lux"
              >
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-cvr-blue px-2 text-sm font-bold text-white">
                  {v.n}
                </span>
                <span className="flex-1 text-sm font-medium text-cvr-ink">{v.chu}</span>
                <span className="text-sm text-cvr-muted">Xử lý →</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      {/* 2. SỐ LIỆU — chia đúng 2 nhóm có nhãn (trước là 2 hàng ô không nhãn,
             không biết hàng nào nói về cái gì). Ô nào cũng bấm được. */}
      <Panel title="Tin đăng" className="mt-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ChiSo label="Đang đăng" value={stats?.tinLive} href="/admin/tin-dang" accent />
          <ChiSo label="Chờ duyệt" value={stats?.tinPending} href="/admin/tin-dang" />
        </div>
      </Panel>

      <Panel title="Khách hàng" className="mt-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ChiSo label="Tổng khách hàng" value={stats?.total} href="/admin/khach-hang" />
          <ChiSo label="Đăng ký mới (7 ngày)" value={stats?.newWeek} href="/admin/khach-hang" accent />
          <ChiSo label="Chờ duyệt" value={stats?.khachChoDuyet} href="/admin/khach-hang" />
          <ChiSo label="Môi giới / Công ty" value={stats?.agents} href="/admin/khach-hang" />
        </div>
      </Panel>

      {/* 3. BẮT ĐẦU NHANH — nút chính (đăng tin) tách khỏi nhóm nút phụ. */}
      <Panel title="Bắt đầu nhanh" className="mt-4">
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/tin-dang/moi" className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
            + Đăng tin mới
          </Link>
          <Link href="/admin/tin-dang/nhap-hang-loat" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Đăng nhiều tin bằng file
          </Link>
          <Link href="/admin/du-an/moi" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            + Thêm dự án
          </Link>
          <Link href="/admin/tin-tuc/moi" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            + Viết bài tin tức
          </Link>
          <Link href="/admin/noi-dung" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Sửa nội dung web
          </Link>
        </div>
      </Panel>
    </div>
  );
}

// ── SỰ CỐ HỆ THỐNG ─────────────────────────────────────────────────────────
// Những lỗi web từng nuốt im (trừ tiền mà không ghi sổ, tiền về không rõ của ai,
// token Zalo chết…) nay được ghi vào bảng `su_co` và hiện ở đây.
// Bảng chưa tạo (chưa chạy migration 0020) → ẩn hẳn, không báo lỗi đỏ vô nghĩa.
type SuCoRow = {
  id: string;
  xay_ra_luc: string;
  noi: string;
  muc_do: "chet" | "nang" | "nhe";
  tom_tat: string;
  chi_tiet: string | null;
  hau_qua: string | null;
  can_lam: string | null;
};

function SuCoBang() {
  const [ds, setDs] = useState<SuCoRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("su_co")
        .select("id,xay_ra_luc,noi,muc_do,tom_tat,chi_tiet,hau_qua,can_lam")
        .eq("da_xu_ly", false)
        .order("xay_ra_luc", { ascending: false })
        .limit(10);
      setDs((data ?? []) as SuCoRow[]);
    })();
  }, []);

  // Đánh dấu đã xử lý = giấu khỏi danh sách, KHÔNG xoá — còn tra lại được về sau.
  async function xong(id: string) {
    const { error } = await createClient()
      .from("su_co")
      .update({ da_xu_ly: true, xu_ly_luc: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      window.alert(`Không đánh dấu được: ${error.message}`);
      return;
    }
    setDs((rs) => rs.filter((r) => r.id !== id));
  }

  if (ds.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-red-300 bg-red-50/70 p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-red-900">
        Sự cố hệ thống · {ds.length} việc chưa xử lý
      </h2>
      <div className="mt-4 space-y-3">
        {ds.map((s) => (
          <div key={s.id} className="rounded-xl border border-red-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-cvr-ink">
                {s.muc_do === "chet" && <span className="mr-2 text-red-700">KHẨN</span>}
                {s.tom_tat}
              </p>
              <span className="text-xs text-cvr-faint">
                {new Date(s.xay_ra_luc).toLocaleString("vi-VN")} · {s.noi}
              </span>
            </div>
            {s.hau_qua && <p className="mt-1.5 text-sm text-red-800">Không sửa thì: {s.hau_qua}</p>}
            {s.can_lam && <p className="mt-1 text-sm text-cvr-body">Cần làm: {s.can_lam}</p>}
            {s.chi_tiet && (
              <p className="mt-1 break-words text-xs text-cvr-faint">Máy báo: {s.chi_tiet}</p>
            )}
            <button
              type="button"
              onClick={() => xong(s.id)}
              className="mt-3 rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
            >
              Đã xử lý
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ô số liệu bấm được — nền xám nhạt trong Panel, KHÔNG còn là thẻ nổi riêng
// (8 thẻ nổi cạnh nhau trông rất nặng và không phân nhóm được).
function ChiSo({ label, value, href, accent }: { label: string; value?: number | null; href: string; accent?: boolean }) {
  return (
    <Link href={href} className="rounded-xl bg-cvr-surface p-4 transition hover:bg-cvr-blue/[0.07]">
      <p className="text-sm text-cvr-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${accent ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>
        {value ?? "…"}
      </p>
    </Link>
  );
}
