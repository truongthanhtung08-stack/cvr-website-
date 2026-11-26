"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { soCuaTaiKhoan } from "@/lib/soTaiKhoan";
import { PageHeader } from "@/components/Ui";
import SoDienThoaiKhac from "@/components/SoDienThoaiKhac";
import XacMinhSdt from "@/components/XacMinhSdt";
import { loiEmail } from "@/lib/kiemNhap";
import DoiAnhDaiDien from "@/components/DoiAnhDaiDien";
import KhoiMatKhau from "@/components/KhoiMatKhau";
import { dongBoTenAnhTin } from "@/lib/dongBoTenAnh";
import { useAuth, anhDaiDien, emailThat } from "@/lib/useAuth";

// Cài đặt tài khoản: thành viên tự sửa thông tin cơ bản của mình
// (các cột đặc quyền role/status/plan/quota bị DB chặn — chỉ admin đổi được).
export default function AccountSettingsPage() {
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const tenDaLuu = useRef<string | null>(null); // tên vừa lưu — lần đổi tiếp theo trong cùng phiên lấy làm tên cũ

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(soCuaTaiKhoan(profile as { phone?: string | null; sdt_lien_he_xac_minh?: boolean }, user)); // một luật: lib/soTaiKhoan (26/11/2026)
      setCity(profile.city ?? "");
    }
  }, [profile, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setNotice("");
    // tên trước khi đổi — tin đang hiện tên này đổi theo; lần đổi thứ hai trong cùng phiên lấy tên vừa lưu (tenDaLuu)
    const tenCu = tenDaLuu.current ?? profile.full_name;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        city: city.trim() || null,
      })
      .eq("id", profile.id);
    // Tên mới hiện ngay ở đầu trang (đầu trang đọc tên trong phiên đăng nhập)
    if (!error) await supabase.auth.updateUser({ data: { full_name: fullName.trim() || null, tu_dat: true, tu_dat_ten: true } }); // tu_dat: khách tự đặt → đăng nhập lại không đè (datDaiDien) · tu_dat_ten: riêng TÊN (gộp tài khoản — xac-minh-sdt)
    if (!error && (tenCu ?? "").trim() !== fullName.trim()) await dongBoTenAnhTin({ tenCu });
    if (!error) tenDaLuu.current = fullName.trim() || null;
    setSaving(false);
    setNotice(error ? "Lưu thất bại: " + error.message : "Đã lưu thay đổi ✓");
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  return (
    <div className="space-y-5">
      <PageHeader title="Cài đặt tài khoản" />

      <form onSubmit={onSubmit} className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-cvr-ink">Thông tin cá nhân</h2>

        {notice && (
          <div className="mt-3 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-sm text-cvr-body">
            {notice}
          </div>
        )}

        <div className="mt-4 flex">
          <DoiAnhDaiDien idHoSo={profile.id} url={profile.avatar_url || anhDaiDien(user)} ten={fullName || "T"} className="h-16 w-16 bg-cvr-surface text-cvr-ink ring-1 ring-cvr-line" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Họ và tên">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inp} />
          </Field>
          {/* Số điện thoại: MỘT mục riêng bên dưới (26/11/2026). Email chỉ hiện khi có email thật */}
          {emailThat(profile.email) && (
            <Field label="Email">
              <input value={emailThat(profile.email)} disabled className={inp + " opacity-60"} />
            </Field>
          )}
          <Field label="Khu vực">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Đà Nẵng / Huế…" className={inp} />
          </Field>
        </div>

        {/* "Lưu thay đổi" CHỈ HIỆN khi khách đã sửa tên / khu vực (anh 26/11/2026: "nút nào cần thì hiện, không cần thì ẩn") */}
        {(fullName.trim() !== (tenDaLuu.current ?? profile.full_name ?? "").trim() || city.trim() !== (profile.city ?? "").trim()) && (
          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-lg bg-cvr-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
          >
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        )}
      </form>

      {/* SỐ ĐIỆN THOẠI — MỘT MỤC (anh 26/11/2026: "lủng củng"): chưa có số → một nút "+ Thêm số điện thoại" (xác thực mã Zalo, ghi vào
          tài khoản). Có số → danh sách: số chính + số khác, một nút "+ Thêm số". Không còn khối "Đổi số" riêng. */}
      {phone ? (
        <SoDienThoaiKhac soChinh={phone} />
      ) : (
        <ThemSoChinh />
      )}

      {/* Thông tin cá nhân (ảnh, tên) đứng ĐẦU trang như chuẩn — khối số phụ xếp sau (05/11/2026) */}
      {/* Môi giới hay dùng 2 số để đăng tin — khai đủ ở đây thì tin mới gom về
          một tài khoản được. Xem src/components/SoDienThoaiKhac.tsx */}

      <KhoiHoaDon profile={profile} />

      <KhoiMatKhau />
    </div>
  );
}

// ── THÔNG TIN XUẤT HÓA ĐƠN ──────────────────────────────────────────────────
// Khai MỘT LẦN, dùng cho mọi giao dịch sau đó — khách không phải nhập lại mỗi lần.
// Không bật: giao dịch vẫn được kê khai đủ theo quy định, nhưng gộp vào HÓA ĐƠN
// TỔNG cuối ngày — đa số môi giới cá nhân chọn cách này.
// ⚠️ Căn cứ cũ là NĐ 123/2020 Điều 9 khoản 4, nay đã bị NĐ 254/2026/NĐ-CP thay từ
//    01/07/2026. Cách gom đang chờ chốt lại — xem ghi chú đầy đủ ở
//    src/app/admin/hoa-don-thue/page.tsx, khối "Hóa đơn chờ phát hành".
function KhoiHoaDon({ profile }: { profile: { id: string; email: string | null } }) {
  // Các cột này chỉ có sau khi chạy migration 0017 → đọc phòng thủ, chưa có coi như trống.
  const hd = profile as unknown as {
    xuat_hoa_don?: boolean | null;
    hd_ten_cong_ty?: string | null;
    hd_mst?: string | null;
    hd_dia_chi?: string | null;
    hd_email?: string | null;
  };

  const [bat, setBat] = useState(false);
  const [tenCty, setTenCty] = useState("");
  const [mst, setMst] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setBat(Boolean(hd.xuat_hoa_don));
    setTenCty(hd.hd_ten_cong_ty ?? "");
    setMst(hd.hd_mst ?? "");
    setDiaChi(hd.hd_dia_chi ?? "");
    setEmail(hd.hd_email ?? "");
  }, [hd.xuat_hoa_don, hd.hd_ten_cong_ty, hd.hd_mst, hd.hd_dia_chi, hd.hd_email]);

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    if (bat && (!tenCty.trim() || !mst.trim())) {
      setNotice("Cần điền Tên công ty và Mã số thuế thì mới xuất hóa đơn công ty được.");
      return;
    }
    if (loiEmail(email)) return setNotice(loiEmail(email)); // chuẩn định dạng chung toàn web
    setSaving(true);
    setNotice("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        xuat_hoa_don: bat,
        hd_ten_cong_ty: tenCty.trim() || null,
        hd_mst: mst.trim() || null,
        hd_dia_chi: diaChi.trim() || null,
        hd_email: email.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) return setNotice("Đã lưu thông tin xuất hóa đơn ✓");
    // Chưa chạy migration 0017 thì cột chưa tồn tại — báo bằng tiếng người.
    setNotice(
      /column .* does not exist|schema cache/i.test(error.message)
        ? "Tính năng hóa đơn chưa được bật trên hệ thống. Vui lòng thử lại sau."
        : "Lưu thất bại: " + error.message,
    );
  }

  return (
    <form onSubmit={luu} className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-cvr-ink">Thông tin xuất hóa đơn</h2>
      {notice && (
        <div className="mt-3 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-sm text-cvr-body">
          {notice}
        </div>
      )}

      <label className="mt-4 flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={bat}
          onChange={(e) => setBat(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-cvr-ink"
        />
        <span className="text-sm text-cvr-body">
          Tôi cần <strong className="font-semibold text-cvr-ink">hóa đơn công ty</strong> cho mỗi giao dịch
        </span>
      </label>

      {bat && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên công ty *">
            <input value={tenCty} onChange={(e) => setTenCty(e.target.value)} className={inp} placeholder="CÔNG TY TNHH ..." />
          </Field>
          <Field label="Mã số thuế *">
            <input value={mst} onChange={(e) => setMst(e.target.value)} className={inp} placeholder="0402xxxxxx" inputMode="numeric" />
          </Field>
          <Field label="Địa chỉ trên hóa đơn">
            <input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} className={inp} />
          </Field>
          <Field label="Email nhận hóa đơn">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inp}
              placeholder={emailThat(profile.email) || "ketoan@congty.vn"}
            />
          </Field>
        </div>
      )}
      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-lg bg-cvr-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
      >
        {saving ? "Đang lưu…" : "Lưu thông tin hóa đơn"}
      </button>
    </form>
  );
}

const inp = "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}

// Tài khoản CHƯA CÓ SỐ: một nút, bấm mới mở khung xác thực (mã Zalo tới chính số đó) — xong số ghi vào tài khoản (26/11/2026)
function ThemSoChinh() {
  const [mo, setMo] = useState(false);
  return (
    <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <h2 className="text-base font-semibold text-cvr-ink">Số điện thoại</h2>
      {mo ? (
        <div className="mt-4"><XacMinhSdt tieuDe="Thêm số điện thoại" onXong={() => window.location.reload()} /></div>
      ) : (
        <button type="button" onClick={() => setMo(true)} className="mt-3 text-sm font-semibold text-cvr-blue hover:underline">+ Thêm số điện thoại</button>
      )}
    </section>
  );
}
