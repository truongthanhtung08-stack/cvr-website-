"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { provinceNames, districtsOf, wardsOf } from "@/lib/locations";
import ImagePicker from "@/components/admin/ImagePicker";
import {
  type ProjectRow,
  type ProjectScaleItem,
  type ContentStatus,
  projectStatusOptions,
  slugify,
} from "@/lib/contentAdmin";

// Nhãn gợi ý cho bảng "Quy mô dự án" (sửa tự do được)
const DEFAULT_SCALE: ProjectScaleItem[] = [
  { label: "Giá tham khảo", value: "" },
  { label: "Loại hình", value: "" },
  { label: "Quy mô", value: "" },
  { label: "Điểm nhấn", value: "" },
  { label: "Pháp lý", value: "" },
  { label: "Bàn giao (dự kiến)", value: "" },
];

// Form Thêm/Sửa DỰ ÁN (admin). Tổng quan: mỗi ĐOẠN xuống 1 dòng.
// Slug tự sinh từ tên dự án (sửa được) — là đường dẫn /du-an/[slug].
export default function ProjectForm({ initial }: { initial?: ProjectRow }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [type, setType] = useState(initial?.type ?? "");
  const [statusText, setStatusText] = useState(initial?.status_text ?? "Đang mở bán");
  const [priceFrom, setPriceFrom] = useState(initial?.price_from ?? "");
  const [developer, setDeveloper] = useState(initial?.developer ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [ward, setWard] = useState(initial?.ward ?? "");
  const [overview, setOverview] = useState(initial?.overview ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [scale, setScale] = useState<ProjectScaleItem[]>(
    initial?.scale?.length ? initial.scale : DEFAULT_SCALE,
  );
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities ?? []);
  const [amenityInput, setAmenityInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const districtOptions = province ? districtsOf(province) : [];
  const wardOptions = province && district ? wardsOf(province, district) : [];

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function setScaleAt(i: number, patch: Partial<ProjectScaleItem>) {
    setScale((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function addAmenity() {
    const v = amenityInput.trim();
    if (!v) return;
    if (!amenities.includes(v)) setAmenities([...amenities, v]);
    setAmenityInput("");
  }

  // asDraft = true → LƯU NHÁP (chỉ cần tên, chưa hiện trên web).
  // asDraft = false → ĐĂNG DỰ ÁN (đủ thông tin, hiện ngay trên /du-an + trang chủ).
  async function save(asDraft: boolean) {
    setError("");
    if (!name.trim())
      return setError(asDraft ? "Nhập tên dự án để lưu nháp." : "Chưa nhập tên dự án.");
    const finalSlug = slugify(slug.trim() || name);
    if (!finalSlug) return setError("Slug (đường dẫn) không hợp lệ.");
    if (!asDraft) {
      if (!province.trim()) return setError("Chưa chọn Tỉnh/Thành của dự án.");
      if (!type.trim()) return setError("Chưa nhập loại hình dự án.");
    }

    const newStatus: ContentStatus = asDraft ? "draft" : "published";
    setSaving(true);
    const payload = {
      slug: finalSlug,
      name: name.trim(),
      ward: ward.trim() || null,
      district: district.trim() || null,
      province: province.trim() || null,
      price_from: priceFrom.trim() || null,
      type: type.trim() || null,
      status_text: statusText,
      developer: developer.trim() || null,
      images: images.map((s) => s.trim()).filter(Boolean),
      scale: scale
        .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
        .filter((r) => r.label && r.value),
      amenities,
      overview: overview.trim() || null,
      status: newStatus,
      published_at:
        newStatus === "published" ? (initial?.published_at ?? new Date().toISOString()) : initial?.published_at ?? null,
    };

    const supabase = createClient();
    const { error: err } = editing
      ? await supabase.from("projects").update(payload).eq("id", initial!.id)
      : await supabase.from("projects").insert(payload);

    setSaving(false);
    if (err) {
      return setError(
        /duplicate key|unique/i.test(err.message)
          ? `Slug "${finalSlug}" đã có dự án khác dùng — đổi slug rồi lưu lại.`
          : `Lưu thất bại: ${err.message}`,
      );
    }
    router.push("/admin/du-an");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-5">
      <Card title="Thông tin dự án">
        <div className="space-y-4">
          <Field label="Tên dự án">
            <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="VD: Sun Cosmo Residence" className={inputCls} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Slug (đường dẫn /du-an/…)">
              <input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                placeholder="tu-sinh-tu-ten-du-an"
                className={inputCls}
              />
            </Field>
            <Field label="Chủ đầu tư">
              <input value={developer} onChange={(e) => setDeveloper(e.target.value)} placeholder="VD: Sun Property (Sun Group)" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Loại hình dự án">
              <input value={type} onChange={(e) => setType(e.target.value)} placeholder="VD: Căn hộ cao cấp ven sông" className={inputCls} />
            </Field>
            <Field label="Trạng thái">
              <select value={statusText} onChange={(e) => setStatusText(e.target.value)} className={inputCls}>
                {projectStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Giá bán từ (chuỗi hiển thị)">
              <input value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} placeholder="VD: Từ 3,2 tỷ" className={inputCls} />
            </Field>
          </div>
        </div>
      </Card>

      {/* Vị trí — 3 cấp chọn liên động, giống form Tin đăng */}
      <Card title="Vị trí">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tỉnh/Thành (bắt buộc)">
            <select
              value={province}
              onChange={(e) => { setProvince(e.target.value); setDistrict(""); setWard(""); }}
              className={inputCls}
            >
              <option value="">— Chọn Tỉnh/Thành —</option>
              {provinceNames.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Quận/Huyện">
            {districtOptions.length > 0 ? (
              <select
                value={district}
                onChange={(e) => { setDistrict(e.target.value); setWard(""); }}
                disabled={!province}
                className={`${inputCls} disabled:bg-cvr-surface disabled:text-cvr-faint`}
              >
                <option value="">{province ? "— Chọn Quận/Huyện —" : "Chọn tỉnh trước"}</option>
                {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Nhập Quận/Huyện" className={inputCls} />
            )}
          </Field>
          <Field label="Phường/Xã">
            {wardOptions.length > 0 ? (
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                disabled={!district}
                className={`${inputCls} disabled:bg-cvr-surface disabled:text-cvr-faint`}
              >
                <option value="">{district ? "— Chọn Phường/Xã —" : "Chọn quận/huyện trước"}</option>
                {wardOptions.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            ) : (
              <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Nhập Phường/Xã" className={inputCls} />
            )}
          </Field>
        </div>
      </Card>

      <Card title="Tổng quan dự án — mỗi ĐOẠN xuống 1 dòng">
        <textarea
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
          rows={8}
          placeholder={"Giới thiệu vị trí, chủ đầu tư…\nĐiểm nổi bật về thiết kế, tiện ích…\nPhù hợp với ai, chính sách bán hàng…"}
          className={`${inputCls} h-auto py-2.5`}
        />
      </Card>

      {/* Bảng quy mô: cặp Nhãn — Giá trị (chỉ lưu dòng có đủ cả 2) */}
      <Card title="Quy mô dự án (bảng thông số)">
        <div className="space-y-2.5">
          {scale.map((row, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <input
                value={row.label}
                onChange={(e) => setScaleAt(i, { label: e.target.value })}
                placeholder="Nhãn (VD: Pháp lý)"
                className={`${inputCls} sm:max-w-[220px]`}
              />
              <input
                value={row.value}
                onChange={(e) => setScaleAt(i, { value: e.target.value })}
                placeholder="Giá trị (VD: Sổ hồng lâu dài)"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setScale((rows) => rows.filter((_, j) => j !== i))}
                aria-label="Xoá dòng"
                className="shrink-0 rounded-lg px-2 py-2 text-cvr-faint transition hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setScale((rows) => [...rows, { label: "", value: "" }])}
          className="mt-3 rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          + Thêm dòng
        </button>
        <p className="mt-2 text-xs text-cvr-faint">Chỉ dòng có đủ Nhãn + Giá trị mới hiện trên web.</p>
      </Card>

      {/* Tiện ích: gõ rồi Enter/Thêm — bấm chip để xoá */}
      <Card title="Tiện ích dự án">
        {amenities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {amenities.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmenities(amenities.filter((x) => x !== a))}
                title="Bấm để xoá"
                className="rounded-lg border border-cvr-ink bg-cvr-ink px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-80"
              >
                {a} ✕
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(); } }}
            placeholder="VD: Hồ bơi tràn bờ — gõ xong bấm Enter"
            className={inputCls}
          />
          <button
            type="button"
            onClick={addAmenity}
            className="shrink-0 rounded-lg border border-cvr-line px-3 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Thêm
          </button>
        </div>
      </Card>

      <Card title="Ảnh dự án (ảnh đầu = ảnh đại diện)">
        <ImagePicker value={images} onChange={setImages} />
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : editing ? "Cập nhật & đăng" : "Đăng dự án"}
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving}
          className="rounded-lg border border-cvr-line px-5 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-50"
        >
          Lưu nháp
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/du-an")}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-cvr-muted transition hover:text-cvr-ink"
        >
          Huỷ
        </button>
      </div>
      <p className="text-xs text-cvr-faint">
        <strong>Lưu nháp</strong>: chỉ cần tên dự án, chưa hiện trên web.
        <strong> Đăng dự án</strong>: dự án hiện ngay tại trang Dự án và trang chủ.
      </p>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <h2 className="mb-4 text-base font-semibold text-cvr-ink">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}
