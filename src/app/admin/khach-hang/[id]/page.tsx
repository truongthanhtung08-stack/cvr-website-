"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Role, Status } from "@/lib/useProfile";
import { Panel, Field } from "@/components/admin/Ui";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // Các trường sửa được
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [status, setStatus] = useState<Status>("active");
  const [plan, setPlan] = useState("");
  const [freeQuota, setFreeQuota] = useState(3);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
      if (data) {
        const p = data as Profile;
        setProfile(p);
        setFullName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setCompanyName(p.company_name ?? "");
        setCity(p.city ?? "");
        setRole(p.role);
        setStatus(p.status);
        setPlan(p.plan ?? "");
        setFreeQuota(p.free_quota);
      }
      setLoading(false);
    })();
  }, [id]);

  async function save(next?: Partial<{ status: Status }>) {
    setSaving(true);
    setNotice("");
    const supabase = createClient();
    const payload = {
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      company_name: companyName.trim() || null,
      city: city.trim() || null,
      role,
      status: next?.status ?? status,
      plan: plan.trim() || null,
      free_quota: Number.isFinite(freeQuota) ? freeQuota : 3,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", id);
    setSaving(false);
    if (error) {
      setNotice("Lưu thất bại: " + error.message);
      return;
    }
    if (next?.status) setStatus(next.status);
    setNotice("Đã lưu thay đổi ✓");
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!profile)
    return (
      <div className="text-sm text-cvr-muted">
        Không tìm thấy khách hàng.{" "}
        <Link href="/admin/khach-hang" className="text-cvr-blue-ink">← Về danh sách</Link>
      </div>
    );

  return (
    <div className="max-w-3xl">
      <Link href="/admin/khach-hang" className="text-sm text-cvr-muted hover:text-cvr-ink">← Danh sách khách hàng</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">
          {profile.full_name || profile.email || "Khách hàng"}
        </h1>
        {status === "suspended" ? (
          <button onClick={() => save({ status: "active" })} disabled={saving}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60">
            Mở khoá tài khoản
          </button>
        ) : (
          <button onClick={() => save({ status: "suspended" })} disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
            Khoá tài khoản
          </button>
        )}
      </div>

      {notice && (
        <div className="mt-4 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-sm text-cvr-body">
          {notice}
        </div>
      )}

      <div className="mt-5 space-y-5">
        <Panel title="Thông tin cơ bản">
          <Grid>
            <Field label="Họ và tên"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inp} /></Field>
            <Field label="Số điện thoại"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} /></Field>
            <Field label="Email (không sửa ở đây)"><input value={profile.email ?? ""} disabled className={inp + " opacity-60"} /></Field>
            <Field label="Khu vực"><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Đà Nẵng / Huế…" className={inp} /></Field>
            <Field label="Công ty / Sàn"><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inp} /></Field>
          </Grid>
        </Panel>

        <Panel title="Phân quyền & gói">
          <Grid>
            <Field label="Vai trò">
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inp}>
                <option value="buyer">Người mua</option>
                <option value="agent">Môi giới</option>
                <option value="company">Công ty / Sàn</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Trạng thái">
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inp}>
                <option value="active">Hoạt động</option>
                <option value="pending">Chờ duyệt</option>
                <option value="suspended">Đã khoá</option>
              </select>
            </Field>
            <Field label="Gói (slug)"><input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="vd: moi-gioi-ca-nhan" className={inp} /></Field>
            <Field label="Hạn mức tin free"><input type="number" value={freeQuota} onChange={(e) => setFreeQuota(parseInt(e.target.value || "0", 10))} className={inp} /></Field>
          </Grid>
        </Panel>

        <button onClick={() => save()} disabled={saving}
          className="rounded-lg bg-cvr-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

const inp = "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink";

// Section + Field đã gom về @/components/admin/Ui.
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
