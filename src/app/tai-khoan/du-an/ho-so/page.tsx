"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { uploadImageFile } from "@/lib/uploadImage";

// ============================================================================
// KHÁCH HÀNG GỬI HỒ SƠ XIN QUYỀN ĐĂNG DỰ ÁN (Chủ đầu tư / Công ty phân phối).
// Quản trị viên duyệt ở /admin/ho-so-du-an → bật quyền → khách đăng dự án được.
// Cần chạy migration 0012_project_poster.sql.
// ============================================================================

type TrangThai = "cho_duyet" | "da_duyet" | "tu_choi";

const NHAN: Record<TrangThai, { chu: string; lop: string }> = {
  cho_duyet: { chu: "Đang chờ duyệt", lop: "bg-amber-50 text-amber-700" },
  da_duyet: { chu: "Đã duyệt", lop: "bg-green-50 text-green-700" },
  tu_choi: { chu: "Chưa được duyệt", lop: "bg-red-50 text-red-700" },
};

export default function HoSoDuAnPage() {
  const { profile, loading } = useProfile();

  const [loai, setLoai] = useState("chu_dau_tu");
  const [tenCty, setTenCty] = useState("");
  const [mst, setMst] = useState("");
  const [website, setWebsite] = useState("");
  const [nguoiPT, setNguoiPT] = useState("");
  const [dienThoai, setDienThoai] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [giayTo, setGiayTo] = useState<string[]>([]);

  const [dangTai, setDangTai] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [hoSoCu, setHoSoCu] = useState<{ status: TrangThai; admin_note: string | null } | null>(null);

  // Đã gửi hồ sơ trước đó chưa?
  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("project_poster_requests")
          .select("status, admin_note")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (data?.[0]) setHoSoCu(data[0] as { status: TrangThai; admin_note: string | null });
      } catch {
        /* chưa chạy migration → coi như chưa gửi */
      }
    })();
  }, [profile]);

  // Prefill từ hồ sơ tài khoản
  useEffect(() => {
    if (!profile) return;
    setNguoiPT((v) => v || profile.full_name || "");
    setDienThoai((v) => v || profile.phone || "");
    setTenCty((v) => v || profile.company_name || "");
  }, [profile]);

  async function taiGiayTo(files: FileList) {
    setDangTai(true);
    setLoi("");
    const them: string[] = [];
    for (const f of Array.from(files)) {
      const { url, error } = await uploadImageFile(f);
      if (error) setLoi(error);
      else if (url) them.push(url);
    }
    setGiayTo((cu) => [...cu, ...them]);
    setDangTai(false);
  }

  async function gui() {
    setLoi("");
    if (!tenCty.trim()) return setLoi("Chưa nhập tên công ty / pháp nhân.");
    if (!giayTo.length) return setLoi("Cần tải lên ít nhất 1 giấy tờ (đăng ký kinh doanh / văn bản phân phối).");

    setDangGui(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("project_poster_requests").insert({
        user_id: profile!.id,
        loai,
        company_name: tenCty.trim(),
        tax_code: mst.trim() || null,
        website: website.trim() || null,
        contact_name: nguoiPT.trim() || null,
        contact_phone: dienThoai.trim() || null,
        note: ghiChu.trim() || null,
        documents: giayTo,
      });
      if (error) throw error;
      setHoSoCu({ status: "cho_duyet", admin_note: null });
    } catch (e) {
      setLoi(
        /relation .* does not exist|schema cache/i.test(String(e))
          ? "Hệ thống chưa sẵn sàng nhận hồ sơ. Vui lòng liên hệ quản trị viên."
          : `Gửi hồ sơ thất bại: ${e instanceof Error ? e.message : "lỗi không rõ"}`,
      );
    }
    setDangGui(false);
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  // Đã gửi rồi → hiện trạng thái, không cho gửi trùng
  if (hoSoCu) {
    const nhan = NHAN[hoSoCu.status];
    return (
      <div className="rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Hồ sơ đăng dự án</h1>
        <p className="mt-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${nhan.lop}`}>{nhan.chu}</span>
        </p>
        {hoSoCu.admin_note && (
          <p className="mt-3 rounded-lg bg-cvr-surface px-4 py-3 text-sm text-cvr-body">
            Ghi chú từ Coastal Land: {hoSoCu.admin_note}
          </p>
        )}
        <p className="mt-3 text-sm text-cvr-muted">
          {hoSoCu.status === "da_duyet"
            ? "Bạn đã có quyền đăng dự án."
            : hoSoCu.status === "cho_duyet"
              ? "Hồ sơ đang được xem xét, thường trong 1–2 ngày làm việc."
              : "Vui lòng liên hệ Coastal Land để được hướng dẫn bổ sung hồ sơ."}
        </p>
        <Link
          href="/tai-khoan/du-an"
          className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về trang Dự án của tôi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Gửi hồ sơ đăng dự án</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Dành cho Chủ đầu tư và Công ty phân phối. Coastal Land xét duyệt trong 1–2 ngày làm việc.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        <O nhan="Bạn là">
          <select value={loai} onChange={(e) => setLoai(e.target.value)} className={inputCls}>
            <option value="chu_dau_tu">Chủ đầu tư</option>
            <option value="phan_phoi">Công ty phân phối / đại lý được uỷ quyền</option>
          </select>
        </O>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <O nhan="Tên công ty / pháp nhân *">
            <input value={tenCty} onChange={(e) => setTenCty(e.target.value)} placeholder="VD: Công ty CP Bất động sản ABC" className={inputCls} />
          </O>
          <O nhan="Mã số thuế">
            <input value={mst} onChange={(e) => setMst(e.target.value)} placeholder="VD: 0401234567" className={inputCls} />
          </O>
          <O nhan="Người phụ trách">
            <input value={nguoiPT} onChange={(e) => setNguoiPT(e.target.value)} className={inputCls} />
          </O>
          <O nhan="Điện thoại">
            <input value={dienThoai} onChange={(e) => setDienThoai(e.target.value)} className={inputCls} />
          </O>
          <O nhan="Website (nếu có)">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={inputCls} />
          </O>
        </div>

        <O nhan="Giấy tờ chứng minh *">
          <p className="mb-2 text-xs text-cvr-muted">
            Ảnh chụp hoặc bản scan: Giấy chứng nhận đăng ký kinh doanh · văn bản chứng minh là chủ đầu tư
            hoặc được uỷ quyền phân phối.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body hover:border-cvr-ink hover:text-cvr-ink">
            {dangTai ? "Đang tải…" : "Tải giấy tờ lên"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { const f = e.target.files; if (f?.length) taiGiayTo(f); e.target.value = ""; }}
            />
          </label>
          {giayTo.length > 0 && (
            <p className="mt-2 text-sm font-medium text-green-700">Đã tải {giayTo.length} tệp</p>
          )}
        </O>

        <O nhan="Ghi chú thêm">
          <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={3} className={inputCls} />
        </O>

        {loi && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loi}</p>}

        <button
          type="button"
          onClick={gui}
          disabled={dangGui}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
        >
          {dangGui ? "Đang gửi…" : "Gửi hồ sơ xét duyệt"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

function O({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-cvr-muted">{nhan}</span>
      {children}
    </label>
  );
}
