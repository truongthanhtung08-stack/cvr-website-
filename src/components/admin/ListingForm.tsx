"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saleTypeGroups, rentTypeGroups } from "@/lib/filters";
import {
  type ListingRow,
  type ListingPurpose,
  type ListingTier,
  type ListingStatus,
} from "@/lib/listingAdmin";

// Form Thêm/Sửa tin đăng (admin). Giá nhập theo đơn vị tự nhiên:
//   Mua bán → TỶ đồng (7.2 = 7,2 tỷ) · Cho thuê → TRIỆU/tháng (18 = 18 triệu/tháng)
// Ảnh: mỗi dòng 1 đường dẫn (vd /images/tin/1.jpg) — upload Storage làm ở bước sau.
export default function ListingForm({ initial }: { initial?: ListingRow }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [purpose, setPurpose] = useState<ListingPurpose>(initial?.purpose ?? "ban");
  const [type, setType] = useState(initial?.type ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [negotiable, setNegotiable] = useState(initial ? initial.price_vnd == null : false);
  const [priceUnit, setPriceUnit] = useState(() => {
    if (!initial?.price_vnd) return "";
    return initial.purpose === "thue"
      ? String(initial.price_vnd / 1e6)
      : String(initial.price_vnd / 1e9);
  });
  const [area, setArea] = useState(initial?.area_m2 != null ? String(initial.area_m2) : "");
  const [beds, setBeds] = useState(initial?.beds != null ? String(initial.beds) : "");
  const [baths, setBaths] = useState(initial?.baths != null ? String(initial.baths) : "");
  const [ward, setWard] = useState(initial?.ward ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [images, setImages] = useState((initial?.images ?? []).join("\n"));
  const [tier, setTier] = useState<ListingTier>(initial?.tier ?? "basic");
  const [status, setStatus] = useState<ListingStatus>(initial?.status ?? "approved");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeGroups = purpose === "thue" ? rentTypeGroups : saleTypeGroups;

  // VNĐ từ ô giá theo mục đích (bán = tỷ · thuê = triệu/tháng)
  const priceVnd = negotiable
    ? null
    : priceUnit.trim() === ""
      ? null
      : Math.round(parseFloat(priceUnit.replace(",", ".")) * (purpose === "thue" ? 1e6 : 1e9));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Chưa nhập tiêu đề tin.");
    if (!type) return setError("Chưa chọn loại hình.");
    if (!province.trim()) return setError("Chưa nhập Tỉnh/Thành.");
    if (!negotiable && (priceVnd == null || Number.isNaN(priceVnd)))
      return setError("Giá không hợp lệ — nhập số, hoặc tick \"Giá thỏa thuận\".");

    setSaving(true);
    const payload = {
      purpose,
      type,
      title: title.trim(),
      description: description.trim() || null,
      price_vnd: priceVnd,
      area_m2: area.trim() ? parseFloat(area.replace(",", ".")) : null,
      beds: beds.trim() ? parseInt(beds, 10) : null,
      baths: baths.trim() ? parseInt(baths, 10) : null,
      ward: ward.trim() || null,
      district: district.trim() || null,
      province: province.trim(),
      images: images.split("\n").map((s) => s.trim()).filter(Boolean),
      tier,
      status,
      // Duyệt đăng lần đầu → ghi thời điểm đăng (giữ nguyên khi sửa tin cũ)
      published_at: status === "approved" ? (initial?.published_at ?? new Date().toISOString()) : initial?.published_at ?? null,
    };

    const supabase = createClient();
    const { error: err } = editing
      ? await supabase.from("listings").update(payload).eq("id", initial!.id)
      : await supabase.from("listings").insert(payload);

    setSaving(false);
    if (err) return setError(`Lưu thất bại: ${err.message}`);
    router.push("/admin/tin-dang");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mục đích + Loại hình + Hạng + Trạng thái */}
      <Card title="Phân loại">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Mục đích">
            <select value={purpose} onChange={(e) => { setPurpose(e.target.value as ListingPurpose); setType(""); }} className={inputCls}>
              <option value="ban">Mua bán</option>
              <option value="thue">Cho thuê</option>
            </select>
          </Field>
          <Field label="Loại hình">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="">— Chọn loại hình —</option>
              {typeGroups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((t) => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Hạng tin (CVR)">
            <select value={tier} onChange={(e) => setTier(e.target.value as ListingTier)} className={inputCls}>
              <option value="diamond">Diamond — rất lớn, trang chủ</option>
              <option value="gold">Gold — nổi bật</option>
              <option value="silver">Silver — ưu tiên</option>
              <option value="basic">Thường</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)} className={inputCls}>
              <option value="approved">Đang đăng (hiện trên web)</option>
              <option value="pending">Chờ duyệt</option>
              <option value="hidden">Ẩn tạm</option>
              <option value="rejected">Từ chối</option>
              <option value="expired">Hết hạn</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Nội dung tin */}
      <Card title="Nội dung">
        <div className="space-y-4">
          <Field label="Tiêu đề tin">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Căn hộ 2PN view sông Hàn, full nội thất" className={inputCls} />
          </Field>
          <Field label="Mô tả (bỏ trống → web tự tóm tắt)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Mô tả chi tiết: vị trí, nội thất, pháp lý, tiện ích xung quanh…" className={`${inputCls} h-auto py-2.5`} />
          </Field>
        </div>
      </Card>

      {/* Giá & thông số */}
      <Card title="Giá & thông số">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={purpose === "thue" ? "Giá thuê (TRIỆU/tháng)" : "Giá bán (TỶ đồng)"}>
            <input
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              disabled={negotiable}
              inputMode="decimal"
              placeholder={purpose === "thue" ? "VD: 18 hoặc 4,5" : "VD: 7,2 hoặc 33"}
              className={`${inputCls} disabled:bg-cvr-surface disabled:text-cvr-faint`}
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-cvr-body">
              <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="h-4 w-4 rounded border-cvr-line" />
              Giá thỏa thuận
            </label>
          </Field>
          <Field label="Diện tích (m²)">
            <input value={area} onChange={(e) => setArea(e.target.value)} inputMode="decimal" placeholder="VD: 95" className={inputCls} />
          </Field>
          <Field label="Phòng ngủ">
            <input value={beds} onChange={(e) => setBeds(e.target.value)} inputMode="numeric" placeholder="VD: 2" className={inputCls} />
          </Field>
          <Field label="Phòng tắm">
            <input value={baths} onChange={(e) => setBaths(e.target.value)} inputMode="numeric" placeholder="VD: 2" className={inputCls} />
          </Field>
        </div>
      </Card>

      {/* Vị trí */}
      <Card title="Vị trí">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Phường/Xã">
            <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="VD: Hải Châu I" className={inputCls} />
          </Field>
          <Field label="Quận/Huyện">
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="VD: Hải Châu" className={inputCls} />
          </Field>
          <Field label="Tỉnh/Thành (bắt buộc)">
            <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="VD: Đà Nẵng" className={inputCls} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Viết đúng tên như bộ lọc đang dùng (Đà Nẵng, Huế, Quảng Ngãi, Gia Lai…) để tin hiện đúng khi lọc theo khu vực.
        </p>
      </Card>

      {/* Ảnh */}
      <Card title="Ảnh (mỗi dòng 1 đường dẫn — dòng đầu là ảnh chính)">
        <textarea
          value={images}
          onChange={(e) => setImages(e.target.value)}
          rows={3}
          placeholder={"/images/tin/1.jpg\n/images/tin/2.jpg"}
          className={`${inputCls} h-auto py-2.5 font-mono text-xs`}
        />
        <p className="mt-2 text-xs text-cvr-faint">
          Tạm thời dùng ảnh có sẵn trong <code>public/images/</code>. Upload ảnh trực tiếp sẽ làm ở bước Storage.
        </p>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Đăng tin"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/tin-dang")}
          className="rounded-lg border border-cvr-line px-5 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          Huỷ
        </button>
        {priceVnd != null && !Number.isNaN(priceVnd) && (
          <span className="ml-auto text-sm text-cvr-muted">
            = {priceVnd.toLocaleString("vi-VN")} đ{purpose === "thue" ? "/tháng" : ""}
          </span>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
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
