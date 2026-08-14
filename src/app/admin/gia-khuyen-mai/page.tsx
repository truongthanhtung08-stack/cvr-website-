"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BILLING_DEFAULT,
  freeNote,
  goiDuAn,
  soAnhDuAnToiDa,
  soAnhToiDa,
  tenGoiMienPhi,
  vnd,
  type Plan,
  type BillingData,
  type Promo,
  type PromoAudience,
} from "@/lib/billing";
import { getTier, type TierId } from "@/lib/packages";

// ============================================================================
// ADMIN — GIÁ & KHUYẾN MÃI (chủ dự án tự quản lý, không cần sửa code)
//   1) Gói đăng tin: giá chuẩn từng cấp tin × thời hạn
//   2) Khuyến mãi: giảm %, cho ai, trong thời gian nào
//   3) Miễn phí thành viên mới: bật/tắt, số tin, số ngày
//   4) Điểm thưởng & cấp thành viên
// Lưu vào site_content key "billing" → web đọc no-store nên đổi là hiện NGAY.
// ============================================================================

const TABS = [
  { id: "plans", label: "Gói đăng tin & giá" },
  { id: "projects", label: "Gói dự án" },
  { id: "promos", label: "Khuyến mãi" },
  { id: "free", label: "Miễn phí thành viên mới" },
  { id: "points", label: "Điểm & cấp thành viên" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const AUDIENCES: { id: PromoAudience; label: string }[] = [
  { id: "all", label: "Tất cả khách hàng" },
  { id: "new", label: "Thành viên mới" },
  { id: "agent", label: "Môi giới" },
  { id: "company", label: "Công ty / Sàn" },
];

export default function AdminBillingPage() {
  const [tab, setTab] = useState<TabId>("plans");
  const [data, setData] = useState<BillingData>(BILLING_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: rows } = await supabase
          .from("site_content")
          .select("data")
          .eq("key", "billing")
          .limit(1);
        const saved = rows?.[0]?.data as Partial<BillingData> | undefined;
        if (saved) setData({ ...BILLING_DEFAULT, ...saved });
      } catch {
        /* chưa cấu hình Supabase → dùng giá chuẩn trong code */
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("site_content").upsert({ key: "billing", data });
      setMsg(error ? `Lỗi lưu: ${error.message}` : "Đã lưu — giá mới áp dụng ngay trên web.");
    } catch {
      setMsg("Không kết nối được cơ sở dữ liệu.");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải bảng giá…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Giá & khuyến mãi</h1>
          <p className="mt-1 text-sm text-cvr-muted">
            Giá chuẩn, chương trình giảm giá và chính sách miễn phí — sửa xong bấm Lưu là web đổi ngay.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </div>

      {msg && (
        <p className={`rounded-lg px-4 py-2.5 text-sm ${msg.startsWith("Đã lưu") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plans" && <PlansTab data={data} setData={setData} />}
      {tab === "promos" && <PromosTab data={data} setData={setData} />}
      {tab === "projects" && <ProjectPlansTab data={data} setData={setData} />}
      {tab === "free" && <FreeTab data={data} setData={setData} />}
      {tab === "points" && <PointsTab data={data} setData={setData} />}
    </div>
  );
}

// ── 1) GÓI ĐĂNG TIN & GIÁ ───────────────────────────────────────────────────
function PlansTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  // Số ảnh tối đa mỗi tin theo cấp — giữ dung lượng kho ảnh, đồng thời là quyền lợi
  // để khách nâng cấp gói (xem trang Dung lượng để biết còn bao nhiêu chỗ).
  const setMaxImages = (tierId: TierId, maxImages: number) =>
    setData({
      ...data,
      plans: data.plans.map((p) => (p.tierId === tierId ? { ...p, maxImages } : p)),
    });

  const setPrice = (tierId: TierId, days: number, price: number) =>
    setData({
      ...data,
      plans: data.plans.map((p) =>
        p.tierId === tierId
          ? { ...p, terms: p.terms.map((t) => (t.days === days ? { ...t, price } : t)) }
          : p,
      ),
    });

  return (
    <Panel title="Giá chuẩn từng gói đăng tin" desc="Đây là giá gốc. Khuyến mãi và ưu đãi cấp thành viên sẽ trừ trên giá này.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2.5">Gói</th>
              {data.plans[0]?.terms.map((t) => (
                <th key={t.days} className="py-2.5">{t.days} ngày</th>
              ))}
              <th className="py-2.5">Số ảnh tối đa</th>
            </tr>
          </thead>
          <tbody>
            {data.plans.map((p) => (
              <tr key={p.tierId} className="border-b border-cvr-line/70">
                <td className="py-3 pr-4">
                  <p className="font-semibold text-cvr-ink">{getTier(p.tierId).name}</p>
                  {p.note && <p className="text-xs text-cvr-muted">{p.note}</p>}
                </td>
                {p.terms.map((t) => (
                  <td key={t.days} className="py-3 pr-3">
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={t.price}
                      onChange={(e) => setPrice(p.tierId, t.days, Number(e.target.value) || 0)}
                      className="h-10 w-36 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
                    />
                    <p className="mt-1 text-[11px] text-cvr-faint">{vnd(t.price)}</p>
                  </td>
                ))}
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={p.maxImages ?? soAnhToiDa(data, p.tierId)}
                    onChange={(e) => setMaxImages(p.tierId, Math.max(1, Number(e.target.value) || 1))}
                    className="h-10 w-24 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
                  />
                  <p className="mt-1 text-[11px] text-cvr-faint">ảnh / tin</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ── 2) KHUYẾN MÃI ───────────────────────────────────────────────────────────
function PromosTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  const add = () =>
    setData({
      ...data,
      promos: [
        ...data.promos,
        {
          id: `km-${data.promos.length + 1}-${data.plans.length}`,
          name: "Chương trình mới",
          percent: 10,
          audience: "all",
          tiers: [],
          from: "",
          to: "",
          active: true,
        },
      ],
    });
  const update = (i: number, patch: Partial<Promo>) =>
    setData({ ...data, promos: data.promos.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  const remove = (i: number) => setData({ ...data, promos: data.promos.filter((_, k) => k !== i) });

  return (
    <Panel
      title="Chương trình khuyến mãi"
      desc="Giảm theo phần trăm trên giá chuẩn. Nhiều chương trình cùng chạy thì hệ thống áp cái giảm nhiều nhất."
    >
      <div className="space-y-4">
        {data.promos.length === 0 && (
          <p className="rounded-lg border border-dashed border-cvr-line bg-cvr-surface px-4 py-6 text-center text-sm text-cvr-muted">
            Chưa có chương trình nào. Bấm “Thêm chương trình” để tạo.
          </p>
        )}

        {data.promos.map((p, i) => (
          <div key={i} className="rounded-xl border border-cvr-line p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Tên chương trình">
                <input value={p.name} onChange={(e) => update(i, { name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Giảm (%)">
                <input
                  type="number" min={0} max={100}
                  value={p.percent}
                  onChange={(e) => update(i, { percent: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
              </Field>
              <Field label="Áp dụng cho">
                <select value={p.audience} onChange={(e) => update(i, { audience: e.target.value as PromoAudience })} className={inputCls}>
                  {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </Field>
              <Field label="Đang bật">
                <button
                  type="button"
                  onClick={() => update(i, { active: !p.active })}
                  className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${p.active ? "bg-green-600 text-white" : "border border-cvr-line text-cvr-muted"}`}
                >
                  {p.active ? "Đang chạy" : "Đã tắt"}
                </button>
              </Field>
              <Field label="Từ ngày">
                <input type="date" value={p.from} onChange={(e) => update(i, { from: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Đến ngày">
                <input type="date" value={p.to} onChange={(e) => update(i, { to: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Gói áp dụng (bỏ trống = tất cả)">
                <div className="flex flex-wrap gap-1.5">
                  {data.plans.map((pl) => {
                    const on = p.tiers.includes(pl.tierId);
                    return (
                      <button
                        key={pl.tierId}
                        type="button"
                        onClick={() =>
                          update(i, { tiers: on ? p.tiers.filter((t) => t !== pl.tierId) : [...p.tiers, pl.tierId] })
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${on ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body"}`}
                      >
                        {pl.name.replace("CVR ", "")}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label=" ">
                <button type="button" onClick={() => remove(i)} className="h-10 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50">
                  Xoá chương trình
                </button>
              </Field>
            </div>
          </div>
        ))}

        <button type="button" onClick={add} className="rounded-lg border border-cvr-line px-4 py-2.5 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface">
          + Thêm chương trình
        </button>
      </div>
    </Panel>
  );
}

// ── 2B) GÓI DỰ ÁN (CVR-PJ) ──────────────────────────────────────────────────
// Cùng cấu trúc với gói đăng tin: giá theo cấp × thời hạn + số ảnh tối đa.
// Khách là Chủ đầu tư/phân phối đã duyệt sẽ thấy đúng bảng giá này khi đăng dự án.
function ProjectPlansTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  const ds = goiDuAn(data);

  const sua = (tierId: TierId, patch: Partial<Plan>) =>
    setData({ ...data, projectPlans: ds.map((p) => (p.tierId === tierId ? { ...p, ...patch } : p)) });

  const suaGia = (tierId: TierId, days: number, price: number) =>
    setData({
      ...data,
      projectPlans: ds.map((p) =>
        p.tierId === tierId ? { ...p, terms: p.terms.map((t) => (t.days === days ? { ...t, price } : t)) } : p,
      ),
    });

  return (
    <Panel
      title="Giá gói dự án (CVR-PJ)"
      desc="Áp cho dự án do Chủ đầu tư / Công ty phân phối đăng. Để 0đ = miễn phí giai đoạn đầu."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2.5">Gói dự án</th>
              {ds[0]?.terms.map((t) => (
                <th key={t.days} className="py-2.5">{t.days} ngày</th>
              ))}
              <th className="py-2.5">Số ảnh tối đa</th>
            </tr>
          </thead>
          <tbody>
            {ds.map((p) => (
              <tr key={p.tierId} className="border-b border-cvr-line/70">
                <td className="py-3 pr-4">
                  <p className="font-semibold text-cvr-ink">{p.name}</p>
                  {p.note && <p className="text-xs text-cvr-muted">{p.note}</p>}
                </td>
                {p.terms.map((t) => (
                  <td key={t.days} className="py-3 pr-3">
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      value={t.price}
                      onChange={(e) => suaGia(p.tierId, t.days, Number(e.target.value) || 0)}
                      className="h-10 w-36 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
                    />
                    <p className="mt-1 text-[11px] text-cvr-faint">{t.price === 0 ? "Miễn phí" : vnd(t.price)}</p>
                  </td>
                ))}
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={p.maxImages ?? soAnhDuAnToiDa(data, p.tierId)}
                    onChange={(e) => sua(p.tierId, { maxImages: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-10 w-24 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
                  />
                  <p className="mt-1 text-[11px] text-cvr-faint">ảnh / dự án</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-cvr-muted">
        Khuyến mãi và ưu đãi cấp hội viên áp chung cho cả tin đăng và dự án.
      </p>
    </Panel>
  );
}

// ── 3) MIỄN PHÍ THÀNH VIÊN MỚI ──────────────────────────────────────────────
function FreeTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  const f = data.free;
  const set = (patch: Partial<typeof f>) => setData({ ...data, free: { ...f, ...patch } });

  return (
    <Panel title="Miễn phí cho thành viên mới" desc="Chính sách đang áp dụng — bật/tắt và đặt thời hạn tuỳ ý.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Trạng thái">
          <button
            type="button"
            onClick={() => set({ active: !f.active })}
            className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${f.active ? "bg-green-600 text-white" : "border border-cvr-line text-cvr-muted"}`}
          >
            {f.active ? "Đang áp dụng" : "Đã tắt"}
          </button>
        </Field>
        <Field label="Số tin miễn phí (0 = không giới hạn)">
          <input type="number" min={0} value={f.quota} onChange={(e) => set({ quota: Number(e.target.value) || 0 })} className={inputCls} />
        </Field>
        <Field label="Trong bao nhiêu ngày (30 = 1 tháng)">
          <input type="number" min={0} value={f.days} onChange={(e) => set({ days: Number(e.target.value) || 0 })} className={inputCls} />
        </Field>
        <Field label="Đăng ở gói">
          <select value={f.tierId} onChange={(e) => set({ tierId: e.target.value as TierId })} className={inputCls}>
            {data.plans.map((p) => <option key={p.tierId} value={p.tierId}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Đối tượng">
          <select value={f.audience} onChange={(e) => set({ audience: e.target.value as PromoAudience })} className={inputCls}>
            {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </Field>
        {/* Câu thông báo TỰ SINH từ đúng cài đặt trên — không cho gõ tay nữa để web
            không bao giờ nói sai ưu đãi (trước đây đổi số tin mà quên sửa câu). */}
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="text-xs font-medium text-cvr-muted">Khách sẽ đọc thấy đúng câu này:</p>
          <p className="mt-1.5 rounded-lg border border-cvr-blue/25 bg-cvr-blue/[0.06] px-4 py-3 text-sm font-medium text-cvr-blue-ink">
            {freeNote(f, tenGoiMienPhi(data))}
          </p>
          <p className="mt-1.5 text-xs text-cvr-muted">
            Câu này tự viết theo 4 ô ở trên — sửa số tin hoặc số ngày là câu đổi theo ngay.
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ── 4) ĐIỂM THƯỞNG & CẤP THÀNH VIÊN ────────────────────────────────────────
function PointsTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  const p = data.points;
  const set = (patch: Partial<typeof p>) => setData({ ...data, points: { ...p, ...patch } });
  const setLevel = (i: number, patch: Partial<BillingData["levels"][number]>) =>
    setData({ ...data, levels: data.levels.map((l, k) => (k === i ? { ...l, ...patch } : l)) });

  return (
    <div className="space-y-4">
      <Panel title="Điểm thưởng" desc="Khách nạp tiền được cộng điểm, điểm dùng để trừ vào phí đăng tin.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Trạng thái">
            <button
              type="button"
              onClick={() => set({ active: !p.active })}
              className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${p.active ? "bg-green-600 text-white" : "border border-cvr-line text-cvr-muted"}`}
            >
              {p.active ? "Đang bật" : "Đã tắt"}
            </button>
          </Field>
          <Field label="Nạp bao nhiêu ₫ được 1 điểm">
            <input type="number" min={1000} step={1000} value={p.earnPerVnd} onChange={(e) => set({ earnPerVnd: Number(e.target.value) || 1000 })} className={inputCls} />
          </Field>
          <Field label="1 điểm đổi được (₫)">
            <input type="number" min={1} value={p.redeemRate} onChange={(e) => set({ redeemRate: Number(e.target.value) || 1 })} className={inputCls} />
          </Field>
          <Field label="Đổi tối thiểu (điểm)">
            <input type="number" min={0} value={p.minRedeem} onChange={(e) => set({ minRedeem: Number(e.target.value) || 0 })} className={inputCls} />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Cấp hội viên"
        desc="Bốn cấp: Basic · Silver · Gold · Diamond. Khách LÊN CẤP theo TỔNG TIỀN ĐÃ NẠP vào ví — nạp đủ mốc nào là tự lên cấp đó, tiền còn trong ví vẫn được tính. Cấp càng cao càng được giảm thêm khi đăng tin."
      >
        <div className="space-y-3">
          {data.levels.map((l, i) => (
            <div key={l.id} className="grid grid-cols-1 gap-3 rounded-xl border border-cvr-line p-3 sm:grid-cols-4">
              <Field label="Tên cấp">
                <input value={l.name} onChange={(e) => setLevel(i, { name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tổng tiền nạp từ (₫)">
                <input type="number" min={0} step={100000} value={l.minTopup} onChange={(e) => setLevel(i, { minTopup: Number(e.target.value) || 0 })} className={inputCls} />
              </Field>
              <Field label="Giảm thêm (%)">
                <input type="number" min={0} max={100} value={l.discount} onChange={(e) => setLevel(i, { discount: Number(e.target.value) || 0 })} className={inputCls} />
              </Field>
              <Field label="Màu nhãn">
                <input type="color" value={l.color} onChange={(e) => setLevel(i, { color: e.target.value })} className="h-10 w-full rounded-lg border border-cvr-line" />
              </Field>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ── Thành phần dùng chung ───────────────────────────────────────────────────
const inputCls = "h-10 w-full rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink";

function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-cvr-ink">{title}</h2>
      {desc && <p className="mb-3 mt-1 text-sm text-cvr-muted">{desc}</p>}
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-cvr-muted">{label}</span>
      {children}
    </label>
  );
}
