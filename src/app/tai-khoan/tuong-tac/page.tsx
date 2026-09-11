"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/Ui";

// ════════════════════════════════════════════════════════════════════════════
// TƯƠNG TÁC — AI ĐANG QUAN TÂM TIN CỦA TÔI
// ----------------------------------------------------------------------------
// Mục tiêu: người đăng tin thấy con số thì BẤM VÀO XEM ĐƯỢC NGAY — tin nào đang
// chạy, ai vừa hỏi số, gọi lại được luôn. Con số không bấm được thì chỉ để ngắm,
// không giúp bán được gì (chủ dự án chốt 11/9/2026).
//
// Dữ liệu: listing_view_daily (lượt xem theo ngày) + listing_leads (người bấm
// xem số). Cả hai bảng đều có RLS: chỉ CHỦ TIN đọc được tin của mình.
// ════════════════════════════════════════════════════════════════════════════

type Lead = {
  id: string;
  listing_id: string;
  viewer_name: string | null;
  viewer_phone: string | null;
  created_at: string;
};

type DongTin = { id: string; title: string; xem7: number; xem30: number; tong: number; hoiSo: number };

export default function TuongTacPage() {
  const [tin, setTin] = useState<DongTin[] | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tenTin, setTenTin] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setTin([]);

      const { data: ds } = await supabase
        .from("listings")
        .select("id,title,view_count")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      const list = (ds ?? []) as { id: string; title: string; view_count: number | null }[];
      if (!list.length) return setTin([]);
      const ids = list.map((l) => l.id);
      setTenTin(new Map(list.map((l) => [l.id, l.title])));

      const moc = (lui: number) => {
        const d = new Date();
        d.setDate(d.getDate() - lui);
        return d.toISOString().slice(0, 10);
      };
      const moc7 = moc(7);
      const moc30 = moc(30);

      const [{ data: xem }, { data: ld }] = await Promise.all([
        supabase.from("listing_view_daily").select("listing_id,ngay,luot").in("listing_id", ids).gte("ngay", moc30),
        supabase
          .from("listing_leads")
          .select("id,listing_id,viewer_name,viewer_phone,created_at")
          .in("listing_id", ids)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const bay = new Map<string, number>();
      const bamuoi = new Map<string, number>();
      for (const d of (xem ?? []) as { listing_id: string; ngay: string; luot: number }[]) {
        const n = String(d.ngay).slice(0, 10);
        const l = Number(d.luot) || 0;
        bamuoi.set(d.listing_id, (bamuoi.get(d.listing_id) ?? 0) + l);
        if (n >= moc7) bay.set(d.listing_id, (bay.get(d.listing_id) ?? 0) + l);
      }

      const dsLead = (ld ?? []) as Lead[];
      setLeads(dsLead);
      const demLead = new Map<string, number>();
      for (const l of dsLead) demLead.set(l.listing_id, (demLead.get(l.listing_id) ?? 0) + 1);

      setTin(
        list
          .map((l) => ({
            id: l.id,
            title: l.title,
            xem7: bay.get(l.id) ?? 0,
            xem30: bamuoi.get(l.id) ?? 0,
            tong: Number(l.view_count ?? 0),
            hoiSo: demLead.get(l.id) ?? 0,
          }))
          .sort((a, b) => b.xem7 - a.xem7 || b.tong - a.tong),
      );
    })();
  }, []);

  if (tin === null) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  if (tin.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Tương tác" />
        <div className="rounded-2xl border border-cvr-line bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-cvr-muted">Đăng tin đầu tiên để bắt đầu theo dõi lượt xem và khách quan tâm.</p>
          <Link
            href="/dang-tin"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-cvr-ink px-6 text-sm font-semibold text-white"
          >
            Đăng tin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Tương tác" />

      {/* ── AI VỪA HỎI SỐ ─────────────────────────────────────────────────────
          Để TRÊN CÙNG: đây là việc cần làm ngay (gọi lại khách), còn bảng lượt
          xem chỉ để tham khảo. */}
      <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Khách đã hỏi số</h2>
        {leads.length === 0 ? (
          <p className="mt-2 text-sm text-cvr-muted">Chưa có ai bấm xem số điện thoại trong tin của bạn.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {leads.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-cvr-surface px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-cvr-ink">
                    {l.viewer_name || "Khách"}
                    {l.viewer_phone && <span className="font-normal text-cvr-body"> · {l.viewer_phone}</span>}
                  </p>
                  <p className="truncate text-xs text-cvr-muted">
                    <Link href={`/tai-khoan/tin-dang/${l.listing_id}`} className="hover:underline">
                      {tenTin.get(l.listing_id) ?? "Tin đã xoá"}
                    </Link>{" "}
                    · {truocDay(l.created_at)}
                  </p>
                </div>
                {l.viewer_phone && (
                  <a
                    href={`tel:${l.viewer_phone.replace(/\s/g, "")}`}
                    className="shrink-0 rounded-full bg-cvr-ink px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    Gọi lại
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── TIN NÀO ĐANG CHẠY ────────────────────────────────────────────────
          Bấm vào tên tin là sang trang thống kê riêng của tin đó (biểu đồ 30
          ngày + danh sách người quan tâm của chính tin ấy). */}
      <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Lượt xem theo tin</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                <th className="py-2.5">Tin đăng</th>
                <th className="py-2.5 text-right">7 ngày</th>
                <th className="py-2.5 text-right">30 ngày</th>
                <th className="py-2.5 text-right">Tổng</th>
                <th className="py-2.5 text-right">Hỏi số</th>
              </tr>
            </thead>
            <tbody>
              {tin.map((t) => (
                <tr key={t.id} className="border-b border-cvr-line/70 last:border-0">
                  <td className="max-w-[220px] py-3 pr-3">
                    <Link href={`/tai-khoan/tin-dang/${t.id}`} className="line-clamp-2 font-medium text-cvr-ink hover:underline">
                      {t.title}
                    </Link>
                  </td>
                  <td className="py-3 text-right font-semibold text-cvr-ink">{t.xem7}</td>
                  <td className="py-3 text-right text-cvr-body">{t.xem30}</td>
                  <td className="py-3 text-right text-cvr-body">{t.tong}</td>
                  <td className="py-3 text-right font-semibold text-cvr-blue-ink">{t.hoiSo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// "12 phút trước" dễ hình dung hơn ngày giờ — khách cần biết lead còn nóng hay
// đã nguội để quyết gọi ngay hay để sau.
function truocDay(iso: string): string {
  const phut = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (phut < 1) return "vừa xong";
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.round(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.round(gio / 24);
  return ngay < 30 ? `${ngay} ngày trước` : new Date(iso).toLocaleDateString("vi-VN");
}
