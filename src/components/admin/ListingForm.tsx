"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saleTypeGroups, rentTypeGroups } from "@/lib/filters";
import { provinceNames, districtsOf, wardsOf } from "@/lib/locations";
import { specForType, interiorItems, amenityGroups, legalOptions, furnishLevels, directions } from "@/lib/listingSpec";
import ImagePicker from "@/components/admin/ImagePicker";
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
  const [builtArea, setBuiltArea] = useState(initial?.built_area_m2 != null ? String(initial.built_area_m2) : "");
  const [beds, setBeds] = useState(initial?.beds != null ? String(initial.beds) : "");
  const [baths, setBaths] = useState(initial?.baths != null ? String(initial.baths) : "");
  const [ward, setWard] = useState(initial?.ward ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [tier, setTier] = useState<ListingTier>(initial?.tier ?? "basic");

  // Thuộc tính chi tiết (lưu vào cột details JSONB) — nhập gì web hiện nấy
  const [addressDetail, setAddressDetail] = useState(initial?.details?.addressDetail ?? "");
  const [specValues, setSpecValues] = useState<Record<string, string>>(initial?.details?.specs ?? {});
  const [direction, setDirection] = useState(initial?.details?.direction ?? "");
  const [legal, setLegal] = useState(initial?.details?.legal ?? "");
  const [furnish, setFurnish] = useState(initial?.details?.furnish ?? "");
  const [interior, setInterior] = useState<string[]>(initial?.details?.interior ?? []);
  const [amenities, setAmenities] = useState<string[]>(initial?.details?.amenities ?? []);
  const [cName, setCName] = useState(initial?.details?.contact?.name ?? "");
  const [cPhone, setCPhone] = useState(initial?.details?.contact?.phone ?? "");
  const [cEmail, setCEmail] = useState(initial?.details?.contact?.email ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeGroups = purpose === "thue" ? rentTypeGroups : saleTypeGroups;
  const specFields = type ? specForType(type).fields : [];

  // Danh sách quận/huyện & phường/xã liên động theo lựa chọn cấp trên
  const districtOptions = province ? districtsOf(province) : [];
  const wardOptions = province && district ? wardsOf(province, district) : [];

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // VNĐ từ ô giá theo mục đích (bán = tỷ · thuê = triệu/tháng)
  const priceVnd = negotiable
    ? null
    : priceUnit.trim() === ""
      ? null
      : Math.round(parseFloat(priceUnit.replace(",", ".")) * (purpose === "thue" ? 1e6 : 1e9));

  // asDraft = true → LƯU NHÁP (chỉ cần tiêu đề, không hiện trên web, vào tiếp được).
  // asDraft = false → ĐĂNG TIN (kiểm tra đủ thông tin rồi công khai — status 'approved').
  async function save(asDraft: boolean) {
    setError("");
    if (!title.trim())
      return setError(asDraft ? "Nhập tiêu đề để lưu nháp." : "Chưa nhập tiêu đề tin.");

    if (!asDraft) {
      if (!type) return setError("Chưa chọn loại hình.");
      if (!province.trim()) return setError("Chưa chọn Tỉnh/Thành.");
      if (!negotiable && (priceVnd == null || Number.isNaN(priceVnd)))
        return setError("Giá không hợp lệ — nhập số, hoặc tick \"Giá thỏa thuận\".");
    }

    // Đăng tin → 'approved' (admin công khai ngay). Lưu nháp → 'draft'.
    const newStatus: ListingStatus = asDraft ? "draft" : "approved";
    setSaving(true);
    const payload = {
      purpose,
      type: type || null,
      title: title.trim(),
      description: description.trim() || null,
      price_vnd: priceVnd,
      area_m2: area.trim() ? parseFloat(area.replace(",", ".")) : null,
      built_area_m2: builtArea.trim() ? parseFloat(builtArea.replace(",", ".")) : null,
      beds: beds.trim() ? parseInt(beds, 10) : null,
      baths: baths.trim() ? parseInt(baths, 10) : null,
      ward: ward.trim() || null,
      district: district.trim() || null,
      province: province.trim() || null,
      images: images.map((s) => s.trim()).filter(Boolean),
      // Thuộc tính thật → cột details (trang chi tiết hiện đúng những gì nhập)
      details: {
        specs: Object.fromEntries(Object.entries(specValues).filter(([, v]) => v && v.trim())),
        interior,
        amenities,
        legal: legal || undefined,
        furnish: furnish || undefined,
        direction: direction || undefined,
        addressDetail: addressDetail.trim() || undefined,
        contact: (cName.trim() || cPhone.trim() || cEmail.trim())
          ? { name: cName.trim(), phone: cPhone.trim(), email: cEmail.trim() }
          : undefined,
      },
      tier,
      status: newStatus,
      // Ghi thời điểm đăng lần đầu khi công khai (giữ nguyên nếu tin đã có)
      published_at: newStatus === "approved" ? (initial?.published_at ?? new Date().toISOString()) : initial?.published_at ?? null,
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
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-5">
      {/* Mục đích + Loại hình + Hạng (trạng thái do 2 nút Lưu nháp / Đăng tin quyết định) */}
      <Card title="Phân loại">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        {/* Giá + Giá thỏa thuận */}
        <Field label={purpose === "thue" ? "Giá thuê (TRIỆU/tháng)" : "Giá bán (TỶ đồng)"}>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              disabled={negotiable}
              inputMode="decimal"
              placeholder={purpose === "thue" ? "VD: 18 hoặc 4,5" : "VD: 7,2 hoặc 33"}
              className={`${inputCls} sm:max-w-xs disabled:bg-cvr-surface disabled:text-cvr-faint`}
            />
            <label className="flex items-center gap-2 text-sm text-cvr-body">
              <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="h-4 w-4 rounded border-cvr-line" />
              Giá thỏa thuận
            </label>
          </div>
        </Field>

        {/* Diện tích đất · Diện tích xây dựng · Phòng ngủ · Phòng tắm */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Diện tích đất (m²)">
            <input value={area} onChange={(e) => setArea(e.target.value)} inputMode="decimal" placeholder="VD: 100" className={inputCls} />
          </Field>
          <Field label="Diện tích xây dựng (m²)">
            <input value={builtArea} onChange={(e) => setBuiltArea(e.target.value)} inputMode="decimal" placeholder="VD: 95 (đất nền bỏ trống)" className={inputCls} />
          </Field>
          <Field label="Phòng ngủ">
            <input value={beds} onChange={(e) => setBeds(e.target.value)} inputMode="numeric" placeholder="VD: 2" className={inputCls} />
          </Field>
          <Field label="Phòng tắm">
            <input value={baths} onChange={(e) => setBaths(e.target.value)} inputMode="numeric" placeholder="VD: 2" className={inputCls} />
          </Field>
        </div>
      </Card>

      {/* Vị trí — 3 cấp CHỌN từ danh sách, liên động: Tỉnh → Quận/Huyện → Phường/Xã.
          Chọn tỉnh mới → xoá quận + phường cũ; chọn quận mới → xoá phường cũ.
          Tỉnh chưa có dữ liệu quận/huyện (ngoài 8 tỉnh lõi) → cho gõ tay để không kẹt. */}
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
        <div className="mt-4">
          <Field label="Địa chỉ cụ thể (số nhà, đường, dự án)">
            <input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="VD: 123 Võ Nguyên Giáp / Dự án ..." className={inputCls} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Chọn theo danh sách để tin hiện đúng khi lọc khu vực. Tỉnh chưa có sẵn quận/huyện thì gõ tay.
        </p>
      </Card>

      {/* Đặc điểm theo loại hình (động) + Hướng + Pháp lý + Mức nội thất */}
      <Card title={`Đặc điểm bất động sản${type ? ` — ${type}` : ""}`}>
        {!type && <p className="mb-3 text-sm text-cvr-muted">Chọn loại hình ở trên để hiện đúng bộ đặc điểm.</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specFields.map((f) => (
            <Field key={f.key} label={f.label + (f.unit ? ` (${f.unit})` : "")}>
              {f.type === "select" ? (
                <select value={specValues[f.key] ?? ""} onChange={(e) => setSpecValues((s) => ({ ...s, [f.key]: e.target.value }))} className={inputCls}>
                  <option value="">Chọn</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type === "number" ? "number" : "text"} value={specValues[f.key] ?? ""} onChange={(e) => setSpecValues((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder ?? ""} className={inputCls} />
              )}
            </Field>
          ))}
          <Field label="Hướng nhà / đất">
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {directions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Tình trạng pháp lý">
            <select value={legal} onChange={(e) => setLegal(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {legalOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Tình trạng nội thất">
            <select value={furnish} onChange={(e) => setFurnish(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {furnishLevels.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {/* Nội thất — tick mục có sẵn */}
      <Card title="Nội thất bàn giao (tick mục có)">
        <div className="flex flex-wrap gap-2">
          {interiorItems.map((it) => (
            <Chip key={it} active={interior.includes(it)} onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
          ))}
        </div>
      </Card>

      {/* Tiện ích — tick mục có sẵn, theo nhóm */}
      <Card title="Tiện ích (tick mục có)">
        <div className="space-y-4">
          {amenityGroups.map((g) => (
            <div key={g.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cvr-faint">{g.group}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <Chip key={it} active={amenities.includes(it)} onClick={() => toggle(amenities, setAmenities, it)}>{it}</Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ảnh — tải từ máy / dán link · ảnh đầu là ảnh đại diện */}
      <Card title="Ảnh tin đăng">
        <ImagePicker value={images} onChange={setImages} />
      </Card>

      {/* Thông tin người đăng — hiện ở khung liên hệ trang chi tiết */}
      <Card title="Thông tin người đăng / liên hệ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Họ và tên"><input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} /></Field>
          <Field label="Số điện thoại"><input type="tel" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} /></Field>
          <Field label="Email"><input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="email@vidu.com" className={inputCls} /></Field>
        </div>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}

      {/* 2 nút: ĐĂNG TIN (công khai) · LƯU NHÁP (làm dở, vào tiếp không mất) */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : editing ? "Cập nhật & đăng" : "Đăng tin"}
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
          onClick={() => router.push("/admin/tin-dang")}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-cvr-muted transition hover:text-cvr-ink"
        >
          Huỷ
        </button>
        {priceVnd != null && !Number.isNaN(priceVnd) && (
          <span className="ml-auto text-sm text-cvr-muted">
            = {priceVnd.toLocaleString("vi-VN")} đ{purpose === "thue" ? "/tháng" : ""}
          </span>
        )}
      </div>
      <p className="text-xs text-cvr-faint">
        <strong>Lưu nháp</strong>: chỉ cần tiêu đề, tin chưa hiện trên web — vào <em>Sửa</em> để làm tiếp bất cứ lúc nào.
        <strong> Đăng tin</strong>: cần đủ thông tin, tin hiện ngay trên web.
      </p>
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${active ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}>
      {children}
    </button>
  );
}
