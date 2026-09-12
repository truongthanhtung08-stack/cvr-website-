"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { lamMoiWeb } from "@/lib/lamMoiWeb";
import {
  BILLING_DEFAULT,
  freeNote,
  goiDuAn,
  bangUp,
  goiPr,
  ghiChuPr,
  bangBanner,
  soAnhDuAnToiDa,
  soAnhToiDa,
  soVideoToiDa,
  ANH_CHUNG_MAC_DINH,
  VIDEO_CHUNG_MAC_DINH,
  tenGoiMienPhi,
  vnd,
  type Plan,
  type BillingData,
  type Promo,
  type UpRow,
  type PrPkg,
  type BannerTable,
  type PromoAudience,
} from "@/lib/billing";
import { getTier, type TierId } from "@/lib/packages";
import { Panel, Field as UiField } from "@/components/Ui";

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
  { id: "up", label: "Đẩy tin" },
  { id: "pr", label: "Bài PR" },
  { id: "banners", label: "Banner" },
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
  // Hàng mục cuộn ngang: mục đang xem phải nằm trong tầm mắt, không thì người dùng
  // tưởng web chỉ có mấy mục đầu.
  const hangMuc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = hangMuc.current?.querySelector(`[data-tab="${tab}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [tab]);
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
    if (!error) await lamMoiWeb();  // nội dung đổi → web bỏ cache, hiện ngay
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
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Giá & khuyến mãi</h1>
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

      {/* HÀNG MỤC DÍNH THEO TRANG. Mỗi mục ở đây dài cả màn hình, cuộn xuống giữa
          bảng giá là hàng mục trôi mất, muốn sang mục khác phải cuộn ngược lên đầu.
          Nay nó dính ngay dưới thanh điều hướng (mobile) / thanh trên (PC), cuộn
          ngang một dòng, và mục đang xem tự trượt vào tầm mắt. */}
      <div
        ref={hangMuc}
        className="no-scrollbar sticky top-[104px] z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-cvr-line bg-white/95 px-4 py-2 backdrop-blur sm:top-[116px] md:top-16 md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            data-tab={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
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
      {tab === "up" && <UpTab data={data} setData={setData} />}
      {tab === "pr" && <PrTab data={data} setData={setData} />}
      {tab === "banners" && <BannerTab data={data} setData={setData} />}
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

  const setMaxVideos = (tierId: TierId, maxVideos: number) =>
    setData({
      ...data,
      plans: data.plans.map((p) => (p.tierId === tierId ? { ...p, maxVideos } : p)),
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

  const theoCap = data.mediaTheoCap === true;

  return (
    <>
    {/* ── GIỚI HẠN ẢNH / VIDEO ────────────────────────────────────────────
        Giai đoạn đầu để CHUNG một mức cho mọi tin (15 ảnh + 1 video). Khi bắt
        đầu thu tiền theo cấp thì bật công tắc → mỗi cấp một mức riêng. */}
    <Panel
      title="Giới hạn ảnh & video mỗi tin"
      desc="Đang để chung một mức cho mọi tin. Bật công tắc khi muốn mỗi cấp tin một mức riêng (quyền lợi để khách nâng gói)."
    >
      <label className="flex items-center gap-3 text-sm text-cvr-ink">
        <input
          type="checkbox"
          checked={theoCap}
          onChange={(e) => setData({ ...data, mediaTheoCap: e.target.checked })}
          className="h-4 w-4 accent-cvr-ink"
        />
        <span className="font-medium">Giới hạn ảnh theo cấp tin</span>
        <span className="text-cvr-muted">{theoCap ? "(đang bật — dùng cột trong bảng dưới)" : "(đang tắt — mọi tin dùng mức chung)"}</span>
      </label>

      {!theoCap && (
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-cvr-muted">Số ảnh tối đa / tin</p>
            <input
              type="number"
              min={1}
              max={50}
              value={data.anhChung ?? ANH_CHUNG_MAC_DINH}
              onChange={(e) => setData({ ...data, anhChung: Math.max(1, Number(e.target.value) || 1) })}
              className="h-10 w-24 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
            />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-cvr-muted">Số video tối đa / tin</p>
            <input
              type="number"
              min={0}
              max={10}
              value={data.videoChung ?? VIDEO_CHUNG_MAC_DINH}
              onChange={(e) => setData({ ...data, videoChung: Math.max(0, Number(e.target.value) || 0) })}
              className="h-10 w-24 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
            />
          </div>
        </div>
      )}
    </Panel>

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
              <th className="py-2.5">Số video tối đa</th>
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
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={p.maxVideos ?? soVideoToiDa(data, p.tierId)}
                    onChange={(e) => setMaxVideos(p.tierId, Math.max(0, Number(e.target.value) || 0))}
                    className="h-10 w-24 rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
                  />
                  <p className="mt-1 text-[11px] text-cvr-faint">video / tin</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!theoCap && (
        <p className="mt-3 text-xs text-cvr-muted">
          Công tắc đang TẮT nên hai cột ảnh/video ở đây chưa có hiệu lực — mọi tin dùng mức chung phía trên.
        </p>
      )}
    </Panel>
    </>
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

// Panel đã gom về @/components/Ui. Riêng bảng giá dùng nhãn DÀY ĐẶC
// (nhiều cột trên một hàng) nên giữ biến thể `nho` của Field dùng chung.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <UiField nho label={label}>{children}</UiField>;
}

// ════════════════════════════════════════════════════════════════════════════
// ĐẨY TIN · BÀI PR · BANNER
// Ba bảng này trước đây ghi cứng trong trang Báo giá dịch vụ, sửa ở admin không
// ăn thua. Nay chúng nằm cùng một chỗ với giá gói tin: sửa xong bấm Lưu là trang
// Báo giá đổi ngay.
// ════════════════════════════════════════════════════════════════════════════

// Bốn cột của bảng Đẩy tin, đúng thứ tự dùng ở trang Báo giá.
const COT_UP: TierId[] = ["diamond", "gold", "silver", "basic"];

function UpTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  const ds = bangUp(data);
  const ghi = (rows: UpRow[]) => setData({ ...data, up: rows });
  const suaO = (iDong: number, iCot: number, patch: { giaGoc?: number; gia?: number }) =>
    ghi(ds.map((r, i) => (i !== iDong ? r : { ...r, values: r.values.map((v, j) => (j === iCot ? { ...v, ...patch } : v)) })));

  return (
    <Panel title="Đẩy tin (UP)" desc="Giá mỗi lượt đẩy tin lên đầu danh sách, theo từng cấp tin. Giá gốc để 0 thì không hiện giá gạch ngang.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
              <th className="py-2.5">Gói đẩy</th>
              {COT_UP.map((t) => <th key={t} className="py-2.5">{getTier(t).name}</th>)}
              <th className="py-2.5" />
            </tr>
          </thead>
          <tbody>
            {ds.map((r, iDong) => (
              <tr key={iDong} className="border-b border-cvr-line/70 align-top">
                <td className="py-3 pr-3">
                  <input
                    value={r.label}
                    onChange={(e) => ghi(ds.map((x, i) => (i === iDong ? { ...x, label: e.target.value } : x)))}
                    className={inputCls + " min-w-[150px]"}
                  />
                </td>
                {COT_UP.map((_, iCot) => {
                  const v = r.values[iCot] ?? { gia: 0 };
                  return (
                    <td key={iCot} className="py-3 pr-3">
                      <Field label="Giá bán (₫)">
                        <input type="number" min={0} step={1000} value={v.gia}
                          onChange={(e) => suaO(iDong, iCot, { gia: Number(e.target.value) || 0 })}
                          className={inputCls + " w-32"} />
                      </Field>
                      <div className="mt-1.5">
                        <Field label="Giá gốc (₫)">
                          <input type="number" min={0} step={1000} value={v.giaGoc ?? 0}
                            onChange={(e) => suaO(iDong, iCot, { giaGoc: Number(e.target.value) || undefined })}
                            className={inputCls + " w-32"} />
                        </Field>
                      </div>
                    </td>
                  );
                })}
                <td className="py-3">
                  <NutXoa onClick={() => ghi(ds.filter((_, i) => i !== iDong))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NutThem
        onClick={() => ghi([...ds, { label: "Gói đẩy mới", values: COT_UP.map(() => ({ gia: 0 })) }])}
        chu="Thêm gói đẩy"
      />
    </Panel>
  );
}

function PrTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  const ds = goiPr(data);
  const notes = ghiChuPr(data);
  const ghi = (pr: PrPkg[]) => setData({ ...data, pr });
  const sua = (i: number, patch: Partial<PrPkg>) => ghi(ds.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-4">
      <Panel title="Gói bài PR" desc="Giá mỗi bài viết truyền thông và những chỗ bài đó được hiện.">
        <div className="space-y-3">
          {ds.map((p, i) => (
            <div key={i} className="rounded-xl border border-cvr-line p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Tên gói">
                  <input value={p.name} onChange={(e) => sua(i, { name: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Giá mỗi bài (₫)">
                  <input type="number" min={0} step={100000} value={p.gia}
                    onChange={(e) => sua(i, { gia: Number(e.target.value) || 0 })} className={inputCls} />
                </Field>
                <Field label="Cấp tin (lấy màu nhãn)">
                  <select value={p.tierId} onChange={(e) => sua(i, { tierId: e.target.value as TierId })} className={inputCls}>
                    {COT_UP.map((t) => <option key={t} value={t}>{getTier(t).name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Bài PR hiện ở đâu — mỗi dòng một chỗ">
                  <textarea
                    value={p.displays.join("\n")}
                    onChange={(e) => sua(i, { displays: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
                    rows={3}
                    className="w-full rounded-lg border border-cvr-line p-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
                  />
                </Field>
              </div>
              <div className="mt-2 flex justify-end">
                <NutXoa onClick={() => ghi(ds.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
        </div>
        <NutThem onClick={() => ghi([...ds, { tierId: "silver", name: "CVR-PR mới", gia: 0, displays: [] }])} chu="Thêm gói PR" />
      </Panel>

      <Panel title="Điều kiện kèm bảng PR" desc="Mỗi dòng một điều kiện — hiện ngay dưới bảng giá PR.">
        <textarea
          value={notes.join("\n")}
          onChange={(e) => setData({ ...data, prNotes: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
          rows={4}
          className="w-full rounded-lg border border-cvr-line p-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
        />
      </Panel>
    </div>
  );
}

function BannerTab({ data, setData }: { data: BillingData; setData: (d: BillingData) => void }) {
  const ds = bangBanner(data);
  const ghi = (banners: BannerTable[]) => setData({ ...data, banners });
  const suaBang = (i: number, patch: Partial<BannerTable>) => ghi(ds.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const suaDong = (iBang: number, iDong: number, patch: Partial<BannerTable["rows"][number]>) =>
    suaBang(iBang, { rows: ds[iBang].rows.map((r, j) => (j === iDong ? { ...r, ...patch } : r)) });

  return (
    <div className="space-y-4">
      {ds.map((tbl, iBang) => (
        <Panel key={iBang} title={tbl.title} desc="Giá tính theo tuần.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tên bảng">
              <input value={tbl.title} onChange={(e) => suaBang(iBang, { title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Tiêu đề cột thứ hai">
              <input value={tbl.sizeLabel} onChange={(e) => suaBang(iBang, { sizeLabel: e.target.value })} className={inputCls} />
            </Field>
          </div>

          <div className="mt-3 space-y-3">
            {tbl.rows.map((r, iDong) => (
              <div key={iDong} className="rounded-xl border border-cvr-line p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Tên gói">
                    <input value={r.name} onChange={(e) => suaDong(iBang, iDong, { name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label={tbl.sizeLabel}>
                    <input value={r.size} onChange={(e) => suaDong(iBang, iDong, { size: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Giá mỗi tuần (₫)">
                    <input type="number" min={0} step={100000} value={r.gia}
                      onChange={(e) => suaDong(iBang, iDong, { gia: Number(e.target.value) || 0 })} className={inputCls} />
                  </Field>
                  <Field label="Vị trí hiển thị">
                    <input value={r.pos} onChange={(e) => suaDong(iBang, iDong, { pos: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Ghi chú">
                    <input value={r.note} onChange={(e) => suaDong(iBang, iDong, { note: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <div className="mt-2 flex justify-end">
                  <NutXoa onClick={() => suaBang(iBang, { rows: tbl.rows.filter((_, j) => j !== iDong) })} />
                </div>
              </div>
            ))}
          </div>

          <NutThem
            onClick={() => suaBang(iBang, { rows: [...tbl.rows, { name: "Banner mới", size: "", gia: 0, pos: "", note: "" }] })}
            chu="Thêm vị trí banner"
          />
        </Panel>
      ))}
    </div>
  );
}

function NutThem({ onClick, chu }: { onClick: () => void; chu: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
    >
      + {chu}
    </button>
  );
}

function NutXoa({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm font-medium text-red-600 transition hover:text-red-700">
      Xoá
    </button>
  );
}
