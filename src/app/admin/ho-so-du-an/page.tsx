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
  company_name: string;
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
                  <p className="font-semibold text-cvr-ink">{h.company_name}</p>
                  <p className="mt-0.5 text-sm text-cvr-muted">
                    {LOAI[h.loai] ?? h.loai}
                    {h.tax_code ? ` · MST ${h.tax_code}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${NHAN[h.status]?.lop}`}>
                  {NHAN[h.status]?.chu}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <Dong nhan="Tài khoản" gt={h.profiles?.full_name || h.profiles?.email || h.user_id} />
                <Dong nhan="Người phụ trách" gt={[h.contact_name, h.contact_phone].filter(Boolean).join(" · ")} />
                <Dong nhan="Website" gt={h.website} />
                <Dong nhan="Ghi chú của khách" gt={h.note} />
              </dl>

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

function Dong({ nhan, gt }: { nhan: string; gt?: string | null }) {
  if (!gt) return null;
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-cvr-muted">{nhan}:</dt>
      <dd className="min-w-0 truncate text-cvr-body">{gt}</dd>
    </div>
  );
}
