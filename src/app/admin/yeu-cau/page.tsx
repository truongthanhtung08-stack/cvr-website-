"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// ADMIN — HỘP THƯ YÊU CẦU CỦA KHÁCH (mọi loại yêu cầu gửi từ web)
// Khách để lại: tên · điện thoại · email (nếu có) · nội dung.
// Riêng yêu cầu "Đăng dự án": bấm Duyệt là MỞ LUÔN quyền đăng dự án cho tài khoản.
// Cần chạy migration 0015_yeu_cau_khach.sql.
// ============================================================================

type YeuCau = {
  id: string;
  user_id: string | null;
  loai: string;
  ten: string;
  dien_thoai: string;
  email: string | null;
  noi_dung: string | null;
  status: "moi" | "dang_xu_ly" | "xong" | "tu_choi";
  admin_note: string | null;
  created_at: string;
};

const LOAI: Record<string, string> = {
  dang_du_an: "Đăng dự án",
  ho_tro: "Hỗ trợ",
  hop_tac: "Hợp tác",
  khac: "Khác",
};

const NHAN: Record<YeuCau["status"], { chu: string; lop: string }> = {
  moi: { chu: "Mới", lop: "bg-amber-50 text-amber-700" },
  dang_xu_ly: { chu: "Đang xử lý", lop: "bg-blue-50 text-blue-700" },
  xong: { chu: "Đã xong", lop: "bg-green-50 text-green-700" },
  tu_choi: { chu: "Từ chối", lop: "bg-red-50 text-red-700" },
};

export default function YeuCauKhachPage() {
  const [ds, setDs] = useState<YeuCau[]>([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangXuLy, setDangXuLy] = useState("");
  const [locTrangThai, setLocTrangThai] = useState<"chua_xong" | "all">("chua_xong");
  const [locLoai, setLocLoai] = useState<"all" | string>("all");

  async function tai() {
    setLoi("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("customer_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDs((data as YeuCau[]) ?? []);
    } catch (e) {
      setLoi(
        /relation .* does not exist|schema cache/i.test(String(e))
          ? "Chưa có bảng yêu cầu. Vào Supabase → SQL Editor chạy file supabase/migrations/0015_yeu_cau_khach.sql."
          : `Không tải được danh sách: ${e instanceof Error ? e.message : "lỗi không rõ"}`,
      );
    }
    setLoading(false);
  }

  useEffect(() => { tai(); }, []);

  async function doiTrangThai(y: YeuCau, status: YeuCau["status"]) {
    setDangXuLy(y.id);
    setLoi("");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("customer_requests")
        .update({ status, xu_ly_luc: new Date().toISOString() })
        .eq("id", y.id);
      if (error) throw error;
      await tai();
    } catch (e) {
      setLoi(`Không lưu được: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    }
    setDangXuLy("");
  }

  // Duyệt yêu cầu ĐĂNG DỰ ÁN = mở quyền đăng dự án cho tài khoản đó
  async function duyetDangDuAn(y: YeuCau) {
    if (!y.user_id) {
      setLoi("Yêu cầu này gửi khi chưa đăng nhập — dùng ô 'Mở quyền theo email' bên dưới.");
      return;
    }
    setDangXuLy(y.id);
    setLoi("");
    try {
      const supabase = createClient();
      const { error: e1 } = await supabase
        .from("profiles")
        .update({ can_post_project: true })
        .eq("id", y.user_id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("customer_requests")
        .update({ status: "xong", xu_ly_luc: new Date().toISOString() })
        .eq("id", y.id);
      if (e2) throw e2;
      await tai();
    } catch (e) {
      setLoi(`Không lưu được: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    }
    setDangXuLy("");
  }

  const hienThi = ds
    .filter((y) => (locTrangThai === "all" ? true : y.status === "moi" || y.status === "dang_xu_ly"))
    .filter((y) => (locLoai === "all" ? true : y.loai === locLoai));

  const soMoi = ds.filter((y) => y.status === "moi").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">
            Yêu cầu khách hàng
            {soMoi > 0 && (
              <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{soMoi} mới</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-cvr-muted">
            Mọi yêu cầu gửi từ web đổ về đây — gọi lại theo số điện thoại rồi đánh dấu đã xử lý.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={locLoai}
            onChange={(e) => setLocLoai(e.target.value)}
            className="h-10 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-body outline-none focus:border-cvr-ink"
          >
            <option value="all">Mọi loại yêu cầu</option>
            {Object.entries(LOAI).map(([id, nhan]) => (
              <option key={id} value={id}>{nhan}</option>
            ))}
          </select>
          <select
            value={locTrangThai}
            onChange={(e) => setLocTrangThai(e.target.value as typeof locTrangThai)}
            className="h-10 rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-body outline-none focus:border-cvr-ink"
          >
            <option value="chua_xong">Chưa xử lý</option>
            <option value="all">Tất cả</option>
          </select>
        </div>
      </div>

      {loi && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loi}</p>}

      {loading ? (
        <p className="text-sm text-cvr-muted">Đang tải…</p>
      ) : hienThi.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cvr-line bg-white p-8 text-center">
          <p className="text-sm text-cvr-muted">
            {locTrangThai === "chua_xong" ? "Không có yêu cầu nào đang chờ xử lý." : "Chưa có yêu cầu nào."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hienThi.map((y) => (
            <div key={y.id} className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-cvr-ink">
                    {y.ten}
                    <a href={`tel:${y.dien_thoai}`} className="ml-2 font-normal text-cvr-blue-ink underline">
                      {y.dien_thoai}
                    </a>
                  </p>
                  <p className="mt-0.5 text-sm text-cvr-muted">
                    {LOAI[y.loai] ?? y.loai}
                    {y.email ? ` · ${y.email}` : ""}
                    {" · "}
                    {new Date(y.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${NHAN[y.status]?.lop}`}>
                  {NHAN[y.status]?.chu}
                </span>
              </div>

              {y.noi_dung && (
                <p className="mt-3 whitespace-pre-line rounded-lg bg-cvr-surface px-4 py-3 text-sm text-cvr-body">
                  {y.noi_dung}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {y.loai === "dang_du_an" && y.status !== "xong" && (
                  <button
                    type="button"
                    disabled={dangXuLy === y.id}
                    onClick={() => duyetDangDuAn(y)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {dangXuLy === y.id ? "Đang lưu…" : "Duyệt — mở quyền đăng dự án"}
                  </button>
                )}
                {y.status !== "xong" && (
                  <button
                    type="button"
                    disabled={dangXuLy === y.id}
                    onClick={() => doiTrangThai(y, "xong")}
                    className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-50"
                  >
                    Đánh dấu đã xử lý
                  </button>
                )}
                {y.status !== "tu_choi" && (
                  <button
                    type="button"
                    disabled={dangXuLy === y.id}
                    onClick={() => doiTrangThai(y, "tu_choi")}
                    className="text-sm font-medium text-red-700 transition hover:text-red-800 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <MoQuyenNhanh />
    </div>
  );
}

// ── MỞ QUYỀN ĐĂNG DỰ ÁN NHANH THEO EMAIL ────────────────────────────────────
// Dùng khi đã xác minh hồ sơ ngoài web, hoặc khi tự thử chức năng đăng dự án.
function MoQuyenNhanh() {
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
        .select("id");
      if (error) throw error;
      if (!data?.length) setThongBao(`Không tìm thấy tài khoản có email "${m}".`);
      else {
        setThongBao(bat ? `Đã mở quyền đăng dự án cho ${m}.` : `Đã thu hồi quyền của ${m}.`);
        setEmail("");
        await taiDsCoQuyen();
      }
    } catch (e) {
      setThongBao(`Không lưu được: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    }
    setDangChay(false);
  }

  return (
    <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <h2 className="text-base font-semibold text-cvr-ink">Mở quyền đăng dự án theo email</h2>
      <p className="mt-1 text-sm text-cvr-muted">
        Đã xác minh hồ sơ bên ngoài (hoặc muốn tự thử) thì mở quyền thẳng ở đây.
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
          {dangChay ? "Đang lưu…" : "Mở quyền"}
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
            Đang có quyền đăng dự án ({ds.length})
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
