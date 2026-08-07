"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// ADMIN — DUYỆT HỒ SƠ CHỦ ĐẦU TƯ / CÔNG TY PHÂN PHỐI
// Duyệt = bật profiles.can_post_project → khách vào /tai-khoan/du-an đăng dự án
// (dự án của họ vẫn phải qua bước duyệt từng dự án ở trang Dự án).
// Cần chạy migration 0012_project_poster.sql trước.
// ============================================================================

type HoSo = {
  id: string;
  user_id: string;
  loai: string;
  project_name: string | null;
  company_name: string | null;
  tax_code: string | null;
  website: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  note: string | null;
  documents: string[];
  status: "cho_duyet" | "da_duyet" | "tu_choi";
  admin_note: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null; can_post_project: boolean } | null;
};

const NHAN: Record<HoSo["status"], { chu: string; lop: string }> = {
  cho_duyet: { chu: "Chờ duyệt", lop: "bg-amber-50 text-amber-700" },
  da_duyet: { chu: "Đã duyệt", lop: "bg-green-50 text-green-700" },
  tu_choi: { chu: "Từ chối", lop: "bg-red-50 text-red-700" },
};

const LOAI: Record<string, string> = {
  chu_dau_tu: "Chủ đầu tư",
  phan_phoi: "Công ty phân phối",
};

export default function DuyetHoSoDuAnPage() {
  const [ds, setDs] = useState<HoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangXuLy, setDangXuLy] = useState("");
  const [loc, setLoc] = useState<"cho_duyet" | "all">("cho_duyet");

  async function tai() {
    setLoi("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("project_poster_requests")
        .select("*, profiles:user_id (full_name, email, can_post_project)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDs((data as HoSo[]) ?? []);
    } catch (e) {
      setLoi(
        /relation .* does not exist|schema cache/i.test(String(e))
          ? "Chưa có bảng hồ sơ. Vào Supabase → SQL Editor chạy file supabase/migrations/0012_project_poster.sql."
          : `Không tải được danh sách: ${e instanceof Error ? e.message : "lỗi không rõ"}`,
      );
    }
    setLoading(false);
  }

  useEffect(() => { tai(); }, []);

  // Duyệt = bật quyền đăng dự án cho tài khoản đó · Từ chối = tắt quyền
  async function xuLy(h: HoSo, duyet: boolean) {
    setDangXuLy(h.id);
    setLoi("");
    try {
      const supabase = createClient();
      const { error: e1 } = await supabase
        .from("profiles")
        .update({ can_post_project: duyet })
        .eq("id", h.user_id);
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("project_poster_requests")
        .update({ status: duyet ? "da_duyet" : "tu_choi", reviewed_at: new Date().toISOString() })
        .eq("id", h.id);
      if (e2) throw e2;

      await tai();
    } catch (e) {
      setLoi(`Không lưu được: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    }
    setDangXuLy("");
  }

  const hienThi = loc === "all" ? ds : ds.filter((h) => h.status === "cho_duyet");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Hồ sơ đăng dự án</h1>
          <p className="mt-1 text-sm text-cvr-muted">
            Duyệt hồ sơ Chủ đầu tư / Công ty phân phối — duyệt xong khách mới đăng được dự án.
          </p>
        </div>
        <select
          value={loc}
          onChange={(e) => setLoc(e.target.value as typeof loc)}
          className="h-10 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-body outline-none focus:border-cvr-ink"
        >
          <option value="cho_duyet">Chờ duyệt</option>
          <option value="all">Tất cả hồ sơ</option>
        </select>
      </div>

      {loi && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loi}</p>}

      <MoQuyenNhanh onXong={tai} />

      {loading ? (
        <p className="text-sm text-cvr-muted">Đang tải…</p>
      ) : hienThi.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cvr-line bg-white p-8 text-center">
          <p className="text-sm text-cvr-muted">
            {loc === "cho_duyet" ? "Không có hồ sơ nào đang chờ duyệt." : "Chưa có hồ sơ nào."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hienThi.map((h) => (
            <div key={h.id} className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* Thông tin quan trọng nhất: AI gọi cho ai, về DỰ ÁN NÀO */}
                  <p className="font-semibold text-cvr-ink">
                    {h.contact_name || h.profiles?.full_name || "(chưa có tên)"}
                    {h.contact_phone && (
                      <a href={`tel:${h.contact_phone}`} className="ml-2 font-normal text-cvr-blue-ink underline">
                        {h.contact_phone}
                      </a>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-cvr-body">
                    Dự án: <strong>{h.project_name || "(chưa ghi)"}</strong>
                  </p>
                  <p className="mt-0.5 text-sm text-cvr-muted">
                    {LOAI[h.loai] ?? h.loai}
                    {h.company_name ? ` · ${h.company_name}` : ""}
                    {h.tax_code ? ` · MST ${h.tax_code}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${NHAN[h.status]?.lop}`}>
                  {NHAN[h.status]?.chu}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <Dong nhan="Tài khoản" gt={h.profiles?.email || h.user_id} />
                <Dong nhan="Website" gt={h.website} />
                <Dong nhan="Ghi chú của khách" gt={h.note} />
              </dl>

              <p className="mt-3 rounded-lg bg-cvr-surface px-3 py-2 text-xs text-cvr-muted">
                Gọi số trên để xác minh hồ sơ Chủ đầu tư / uỷ quyền phân phối, xong mới bấm Duyệt.
              </p>

              {h.documents?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {h.documents.map((d, i) => (
                    <a
                      key={d}
                      href={d}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
                    >
                      Giấy tờ {i + 1} ↗
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={dangXuLy === h.id}
                  onClick={() => xuLy(h, true)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {dangXuLy === h.id ? "Đang lưu…" : "Duyệt — mở quyền đăng dự án"}
                </button>
                <button
                  type="button"
                  disabled={dangXuLy === h.id}
                  onClick={() => xuLy(h, false)}
                  className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                >
                  Từ chối / thu hồi quyền
                </button>
                {h.profiles?.can_post_project && (
                  <span className="text-xs font-medium text-green-700">Tài khoản này đang có quyền đăng dự án</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MỞ QUYỀN NHANH ──────────────────────────────────────────────────────────
// Duyệt trực tiếp theo email tài khoản, KHÔNG cần khách gửi hồ sơ qua web —
// dùng khi đã xác minh hồ sơ ngoài đời (gặp trực tiếp, gửi qua Zalo/email),
// hoặc khi chính chủ dự án muốn tự thử chức năng đăng dự án.
function MoQuyenNhanh({ onXong }: { onXong: () => void }) {
  const [email, setEmail] = useState("");
  const [dangChay, setDangChay] = useState(false);
  const [thongBao, setThongBao] = useState("");
  const [ds, setDs] = useState<{ id: string; email: string | null; full_name: string | null }[]>([]);

  async function taiDsCoQuyen() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("can_post_project", true);
      setDs(data ?? []);
    } catch {
      /* bỏ qua */
    }
  }

  useEffect(() => { taiDsCoQuyen(); }, []);

  async function doiQuyen(mail: string, bat: boolean) {
    const m = mail.trim().toLowerCase();
    if (!m) return setThongBao("Nhập email tài khoản cần mở quyền.");
    setDangChay(true);
    setThongBao("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .update({ can_post_project: bat })
        .eq("email", m)
        .select("id, email");
      if (error) throw error;
      if (!data?.length) {
        setThongBao(`Không tìm thấy tài khoản có email "${m}". Kiểm tra lại email đã đăng ký.`);
      } else {
        setThongBao(bat ? `Đã mở quyền đăng dự án cho ${m}.` : `Đã thu hồi quyền của ${m}.`);
        setEmail("");
        await taiDsCoQuyen();
        onXong();
      }
    } catch (e) {
      setThongBao(`Không lưu được: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    }
    setDangChay(false);
  }

  return (
    <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <h2 className="text-base font-semibold text-cvr-ink">Mở quyền nhanh theo email</h2>
      <p className="mt-1 text-sm text-cvr-muted">
        Đã xác minh hồ sơ bên ngoài (hoặc muốn tự thử) thì mở quyền thẳng ở đây, khách không cần gửi hồ sơ qua web.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doiQuyen(email, true); } }}
          placeholder="email@tai-khoan.com"
          className="h-10 min-w-[240px] flex-1 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none focus:border-cvr-ink"
        />
        <button
          type="button"
          disabled={dangChay}
          onClick={() => doiQuyen(email, true)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {dangChay ? "Đang lưu…" : "Mở quyền đăng dự án"}
        </button>
      </div>
      {thongBao && (
        <p className={`mt-2 rounded-lg px-4 py-2.5 text-sm ${thongBao.startsWith("Đã") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {thongBao}
        </p>
      )}

      {ds.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cvr-muted">
            Tài khoản đang có quyền đăng dự án ({ds.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {ds.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-cvr-body">{p.full_name || "(chưa đặt tên)"} · {p.email}</span>
                <button
                  type="button"
                  onClick={() => p.email && doiQuyen(p.email, false)}
                  className="text-xs font-medium text-red-700 underline hover:text-red-800"
                >
                  Thu hồi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Dong({ nhan, gt }: { nhan: string; gt?: string | null }) {
  if (!gt) return null;
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-cvr-muted">{nhan}:</dt>
      <dd className="min-w-0 truncate text-cvr-body">{gt}</dd>
    </div>
  );
}
