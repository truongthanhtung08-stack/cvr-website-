"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Role, Status } from "@/lib/useProfile";
import { Panel, Field } from "@/components/Ui";
import { thieuHoSoDn } from "@/lib/hoSoDoanhNghiep";

// THÍCH · BÌNH LUẬN (bảng tuong_tac_tin, 0061 — chủ dự án 10/10/2026): khách này đã tương tác tin nào,
// và ai đã thích / bình luận tin của khách này (bấm tên để sang hồ sơ người đó).
type DongTT = { listing_id: string; anh_so: number; loai: string; noi_dung: string | null; created_at: string; user_id: string };
function TuongTacKhach({ id }: { id: string }) {
  const [cuaKhach, setCuaKhach] = useState<DongTT[]>([]);
  const [vaoTinKhach, setVaoTinKhach] = useState<DongTT[]>([]);
  const [tieuDe, setTieuDe] = useState<Map<string, string>>(new Map());
  const [ten, setTen] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const db = createClient();
    (async () => {
      // Lệnh nào không phụ thuộc nhau thì hỏi CÙNG LÚC (27/10/2026: trước đây 5 lệnh nối đuôi → 3 nhịp mạng). Kết quả như cũ.
      const [{ data: a }, { data: tinKhach }] = await Promise.all([
        db.from("tuong_tac_tin").select("listing_id, anh_so, loai, noi_dung, created_at, user_id").eq("user_id", id).order("created_at", { ascending: false }).limit(200),
        db.from("listings").select("id").eq("owner_id", id).limit(1000),
      ]);
      const idsTin = (tinKhach ?? []).map((x) => x.id as string);
      const { data: b } = idsTin.length
        ? await db.from("tuong_tac_tin").select("listing_id, anh_so, loai, noi_dung, created_at, user_id").in("listing_id", idsTin).neq("user_id", id).order("created_at", { ascending: false }).limit(300)
        : { data: [] };
      const ds = [...(a ?? []), ...(b ?? [])] as DongTT[];
      const maTin = [...new Set(ds.map((x) => x.listing_id))];
      const maNguoi = [...new Set((b ?? []).map((x) => x.user_id as string))];
      const [{ data: t }, { data: p }] = await Promise.all([
        maTin.length ? db.from("listings").select("id, title").in("id", maTin) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        maNguoi.length ? db.from("profiles").select("id, full_name, phone").in("id", maNguoi) : Promise.resolve({ data: [] as { id: string; full_name: string | null; phone: string | null }[] }),
      ]);
      setTieuDe(new Map((t ?? []).map((x) => [x.id as string, x.title as string])));
      setTen(new Map((p ?? []).map((x) => [x.id as string, `${x.full_name || "Thành viên"}${x.phone ? " · " + x.phone : ""}`])));
      setCuaKhach((a ?? []) as DongTT[]);
      setVaoTinKhach((b ?? []) as DongTT[]);
    })();
  }, [id]);
  const ngay = (x: string) => new Date(x).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const dong = (x: DongTT, k: number, coNguoi: boolean) => (
    <li key={k} className="flex flex-wrap items-baseline gap-x-2 border-b border-cvr-line/60 py-2 text-[13px] last:border-0">
      <span className={x.loai === "thich" ? "font-semibold text-red-500" : "font-semibold text-cvr-blue-ink"}>{x.loai === "thich" ? "♥ Thích" : "💬 Bình luận"}</span>
      {coNguoi && <Link href={`/admin/khach-hang/${x.user_id}`} className="font-medium text-cvr-ink underline">{ten.get(x.user_id) ?? "Thành viên"}</Link>}
      <Link href={`/bat-dong-san/${x.listing_id}`} target="_blank" className="min-w-0 truncate text-cvr-body underline">{tieuDe.get(x.listing_id) ?? x.listing_id}</Link>
      <span className="text-cvr-muted">· ảnh {x.anh_so + 1} · {ngay(x.created_at)}</span>
      {x.noi_dung && <span className="w-full text-cvr-body">“{x.noi_dung}”</span>}
    </li>
  );
  return (
    <Panel title="Thích · Bình luận">
      <p className="text-sm font-semibold text-cvr-ink">Người khác tương tác với tin của khách ({vaoTinKhach.length})</p>
      {vaoTinKhach.length ? <ul className="mt-1">{vaoTinKhach.map((x, k) => dong(x, k, true))}</ul> : <p className="mt-1 text-sm text-cvr-muted">Chưa có.</p>}
      <p className="mt-4 text-sm font-semibold text-cvr-ink">Khách đã thích / bình luận ({cuaKhach.length})</p>
      {cuaKhach.length ? <ul className="mt-1">{cuaKhach.map((x, k) => dong(x, k, false))}</ul> : <p className="mt-1 text-sm text-cvr-muted">Chưa có.</p>}
    </Panel>
  );
}

// HỒ SƠ DOANH NGHIỆP (chủ dự án 23/10/2026) — chỉ hiện khi vai trò "Công ty / Sàn". Đủ ô bắt buộc + tích
// đồng ý → hiện ở /chuyen-gia/cong-ty kèm dữ liệu cho Google (src/lib/hoSoDoanhNghiep.ts). Lưu riêng nút
// của mình để lỗi ở đây không chặn lưu thông tin cơ bản.
const O_DN: [string, string, boolean?][] = [
  ["hd_ten_cong_ty", "Tên pháp nhân (theo đăng ký kinh doanh)"],
  ["hd_mst", "Mã số doanh nghiệp"],
  ["hd_dia_chi", "Địa chỉ trụ sở"],
  ["hd_email", "Email"],
  ["dn_website", "Website"],
  ["dn_logo", "Link logo"],
  ["dn_gioi_thieu", "Giới thiệu (2–3 câu)", true],
  ["dn_mang_xa_hoi", "Facebook / Zalo OA / YouTube (mỗi dòng một link)", true],
];
function HoSoDoanhNghiep({ profile }: { profile: Profile }) {
  const goc = profile as unknown as Record<string, unknown>;
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(O_DN.map(([k]) => [k, String(goc[k] ?? "")])));
  const [dongY, setDongY] = useState(Boolean(goc.dn_dong_y_dang));
  const [bao, setBao] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  async function luu() {
    setDangLuu(true);
    setBao("");
    const payload: Record<string, unknown> = Object.fromEntries(O_DN.map(([k]) => [k, v[k].trim() || null]));
    payload.dn_dong_y_dang = dongY;
    const { error } = await createClient().from("profiles").update(payload).eq("id", profile.id);
    setDangLuu(false);
    setBao(error ? "Lưu thất bại: " + error.message : "Đã lưu hồ sơ doanh nghiệp ✓");
  }
  const thieu = thieuHoSoDn({ ...goc, ...v, company_name: goc.company_name, dn_dong_y_dang: dongY });
  return (
    <Panel title="Hồ sơ doanh nghiệp">
      <p className={"text-sm " + (thieu.length ? "text-amber-700" : "text-green-700")}>
        {thieu.length ? `Chưa hiện trên trang Sàn / công ty — thiếu: ${thieu.join(", ")}` : "Đủ — đang hiện trên trang Sàn / công ty"}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {O_DN.map(([k, nhan, dai]) => (
          <div key={k} className={dai ? "sm:col-span-2" : ""}>
            <Field label={nhan}>
              {dai ? (
                <textarea value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} rows={3} className={inp + " h-auto py-2"} />
              ) : (
                <input value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={inp} />
              )}
            </Field>
          </div>
        ))}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-cvr-ink">
        <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} className="h-4 w-4" />
        Doanh nghiệp đồng ý cho đăng hồ sơ
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={luu} disabled={dangLuu}
          className="rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
          {dangLuu ? "Đang lưu…" : "Lưu hồ sơ doanh nghiệp"}
        </button>
        {bao && <span className="text-sm text-cvr-body">{bao}</span>}
      </div>
    </Panel>
  );
}

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

        {profile.role === "company" && <HoSoDoanhNghiep profile={profile} />}

        <TuongTacKhach id={id} />

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

// Section + Field đã gom về @/components/Ui.
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
