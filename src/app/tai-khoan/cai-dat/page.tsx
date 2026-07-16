"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";

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

const inp = "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}
