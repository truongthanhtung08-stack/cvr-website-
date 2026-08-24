"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { PageHeader } from "@/components/Ui";

// Cài đặt tài khoản: thành viên tự sửa thông tin cơ bản của mình
// (các cột đặc quyền role/status/plan/quota bị DB chặn — chỉ admin đổi được).
export default function AccountSettingsPage() {
  const { profile, loading } = useProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.city ?? "");
    }
  }, [profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setNotice("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    setNotice(error ? "Lưu thất bại: " + error.message : "Đã lưu thay đổi ✓");
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-cvr-muted">Không tải được hồ sơ. Vui lòng đăng nhập lại.</p>;

  return (
    <div className="space-y-5">
      <PageHeader title="Cài đặt tài khoản" desc="Sửa thông tin cá nhân của bạn." />
      <form onSubmit={onSubmit} className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-cvr-ink">Thông tin cá nhân</h2>

        {notice && (
          <div className="mt-3 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-sm text-cvr-body">
            {notice}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Họ và tên">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inp} />
          </Field>
          <Field label="Số điện thoại">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} />
          </Field>
          <Field label="Email (không thể đổi)">
            <input value={profile.email ?? ""} disabled className={inp + " opacity-60"} />
          </Field>
          <Field label="Khu vực">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Đà Nẵng / Huế…" className={inp} />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-lg bg-cvr-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>

      <KhoiHoaDon profile={profile} />

      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-cvr-ink">Mật khẩu</h2>
        <p className="mt-1 text-sm text-cvr-muted">
          Để đổi mật khẩu, dùng chức năng &ldquo;Quên mật khẩu&rdquo; — liên kết đặt lại sẽ gửi về email của bạn.
        </p>
        <a href="/quen-mat-khau" className="mt-3 inline-block rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
          Đặt lại mật khẩu
        </a>
      </div>
    </div>
  );
}

// ── THÔNG TIN XUẤT HÓA ĐƠN ──────────────────────────────────────────────────
// Khai MỘT LẦN, dùng cho mọi giao dịch sau đó — khách không phải nhập lại mỗi lần.
// Không bật: giao dịch vẫn được xuất hóa đơn theo quy định, nhưng gộp vào HÓA ĐƠN
// TỔNG cuối ngày (NĐ 123/2020 Điều 9 khoản 4) — đa số môi giới cá nhân chọn cách này.
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
      <p className="mt-1 text-sm text-cvr-muted">
        Mua dịch vụ cho công ty và cần hóa đơn giá trị gia tăng để hạch toán? Khai một lần ở đây,
        các lần sau tự động xuất hóa đơn mang tên công ty bạn.
      </p>

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
              placeholder={profile.email ?? "ketoan@congty.vn"}
            />
          </Field>
        </div>
      )}

      {!bat && (
        <p className="mt-3 text-sm text-cvr-muted">
          Không bật cũng không sao — giao dịch của bạn vẫn được xuất hóa đơn đầy đủ theo quy định,
          chỉ là không xuất riêng thành hóa đơn mang tên công ty.
        </p>
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
