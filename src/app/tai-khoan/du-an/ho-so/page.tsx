"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";

// ============================================================================
// KHÁCH GỬI YÊU CẦU ĐĂNG DỰ ÁN — GỌN: HỌ TÊN · SỐ ĐIỆN THOẠI · TÊN DỰ ÁN.
// KHÔNG bắt tải giấy tờ ở đây: hồ sơ pháp nhân do quản trị viên kiểm ở khâu
// duyệt (nhận trực tiếp / Zalo / email). Mục đích của bước này chỉ là báo cho
// quản trị viên biết có người muốn đăng dự án và liên hệ được với họ.
// Quản trị viên duyệt ở /admin/ho-so-du-an → mở quyền đăng dự án.
// ============================================================================

type TrangThai = "cho_duyet" | "da_duyet" | "tu_choi";

const NHAN: Record<TrangThai, { chu: string; lop: string }> = {
  cho_duyet: { chu: "Đang chờ duyệt", lop: "bg-amber-50 text-amber-700" },
  da_duyet: { chu: "Đã duyệt", lop: "bg-green-50 text-green-700" },
  tu_choi: { chu: "Chưa được duyệt", lop: "bg-red-50 text-red-700" },
};

export default function YeuCauDangDuAnPage() {
  const { profile, loading } = useProfile();

  const [hoTen, setHoTen] = useState("");
  const [dienThoai, setDienThoai] = useState("");
  const [tenDuAn, setTenDuAn] = useState("");
  const [loai, setLoai] = useState("chu_dau_tu");
  const [tenCty, setTenCty] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [daGui, setDaGui] = useState<{ status: TrangThai; admin_note: string | null } | null>(null);

  // Đã gửi yêu cầu trước đó chưa?
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
        if (data?.[0]) setDaGui(data[0] as { status: TrangThai; admin_note: string | null });
      } catch {
        /* chưa chạy migration → coi như chưa gửi */
      }
    })();
  }, [profile]);

  // Điền sẵn từ hồ sơ tài khoản cho khách đỡ gõ
  useEffect(() => {
    if (!profile) return;
    setHoTen((v) => v || profile.full_name || "");
    setDienThoai((v) => v || profile.phone || "");
    setTenCty((v) => v || profile.company_name || "");
  }, [profile]);

  async function gui() {
    setLoi("");
    if (!hoTen.trim()) return setLoi("Chưa nhập họ tên.");
    if (!dienThoai.trim()) return setLoi("Chưa nhập số điện thoại.");
    if (!tenDuAn.trim()) return setLoi("Chưa nhập tên dự án muốn đăng.");

    setDangGui(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("project_poster_requests").insert({
        user_id: profile!.id,
        loai,
        contact_name: hoTen.trim(),
        contact_phone: dienThoai.trim(),
        project_name: tenDuAn.trim(),
        company_name: tenCty.trim() || null,
        note: ghiChu.trim() || null,
      });
      if (error) throw error;
      setDaGui({ status: "cho_duyet", admin_note: null });
    } catch (e) {
      setLoi(
        /relation .* does not exist|schema cache|project_name/i.test(String(e))
          ? "Hệ thống chưa sẵn sàng nhận yêu cầu. Vui lòng liên hệ quản trị viên."
          : `Gửi yêu cầu thất bại: ${e instanceof Error ? e.message : "lỗi không rõ"}`,
      );
    }
    setDangGui(false);
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  // Đã gửi rồi → chỉ hiện trạng thái
  if (daGui) {
    const nhan = NHAN[daGui.status];
    return (
      <div className="rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Yêu cầu đăng dự án</h1>
        <p className="mt-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${nhan.lop}`}>{nhan.chu}</span>
        </p>
        {daGui.admin_note && (
          <p className="mt-3 rounded-lg bg-cvr-surface px-4 py-3 text-sm text-cvr-body">
            Ghi chú từ Coastal Land: {daGui.admin_note}
          </p>
        )}
        <p className="mt-3 text-sm text-cvr-muted">
          {daGui.status === "da_duyet"
            ? "Bạn đã có quyền đăng dự án."
            : daGui.status === "cho_duyet"
              ? "Coastal Land sẽ liên hệ theo số điện thoại bạn để lại để xác minh hồ sơ chủ đầu tư / phân phối."
              : "Vui lòng liên hệ Coastal Land để được hướng dẫn."}
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
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Yêu cầu đăng dự án</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Để lại thông tin liên hệ và tên dự án — Coastal Land sẽ gọi lại để xác minh hồ sơ
          Chủ đầu tư / Công ty phân phối rồi mở quyền đăng dự án cho bạn.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <O nhan="Họ và tên *">
            <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} />
          </O>
          <O nhan="Số điện thoại *">
            <input value={dienThoai} onChange={(e) => setDienThoai(e.target.value)} placeholder="0905 123 456" className={inputCls} />
          </O>
        </div>

        <O nhan="Tên dự án muốn đăng *">
          <input value={tenDuAn} onChange={(e) => setTenDuAn(e.target.value)} placeholder="VD: Sun Cosmo Residence" className={inputCls} />
        </O>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <O nhan="Bạn là">
            <select value={loai} onChange={(e) => setLoai(e.target.value)} className={inputCls}>
              <option value="chu_dau_tu">Chủ đầu tư</option>
              <option value="phan_phoi">Công ty phân phối / đại lý được uỷ quyền</option>
            </select>
          </O>
          <O nhan="Công ty (nếu có)">
            <input value={tenCty} onChange={(e) => setTenCty(e.target.value)} placeholder="Công ty CP Bất động sản ABC" className={inputCls} />
          </O>
        </div>

        <O nhan="Ghi chú thêm">
          <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={3} className={`${inputCls} h-auto py-2.5`} />
        </O>

        {loi && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loi}</p>}

        <button
          type="button"
          onClick={gui}
          disabled={dangGui}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
        >
          {dangGui ? "Đang gửi…" : "Gửi yêu cầu"}
        </button>
        <p className="text-xs text-cvr-muted">
          Không cần tải giấy tờ ở bước này — Coastal Land nhận và kiểm hồ sơ khi liên hệ với bạn.
        </p>
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
