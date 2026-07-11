"use client";

import { useMemo, useState } from "react";
import {
  categorySpecs, propertyCategories, demandTypes,
  legalOptions, furnishLevels, amenityGroups, interiorItems,
} from "@/lib/listingSpec";
import { provinceNames, districtsOf, wardsOf } from "@/lib/locations";

export default function PostListingForm() {
  const [sent, setSent] = useState(false);
  const [demand, setDemand] = useState(demandTypes[0]);
  const [category, setCategory] = useState(propertyCategories[0]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [priceUnit, setPriceUnit] = useState("tỷ");
  const [furnish, setFurnish] = useState("");
  const [legal, setLegal] = useState("");
  const [interior, setInterior] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photoCount, setPhotoCount] = useState(0);

  const spec = useMemo(() => categorySpecs.find((c) => c.label === category) ?? categorySpecs[0], [category]);
  const districts = province ? districtsOf(province) : [];
  const wards = province && district ? wardsOf(province, district) : [];

  function toggle(list: string[], set: (v: string[]) => void, v: string) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  if (sent) {
    return (
      <div className="rounded-none border border-cvr-line bg-white p-10 text-center shadow-lux">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cvr-ink text-white">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-cvr-ink">Tin đăng đã được gửi!</h3>
        <p className="mt-2 text-sm text-cvr-muted">Tin của bạn đang chờ AI kiểm duyệt và sẽ hiển thị sau ít phút. Chuyên viên Coastal Land sẽ liên hệ hỗ trợ nếu cần.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-5 rounded-lg border border-cvr-line px-5 py-2 text-sm font-medium text-cvr-ink hover:bg-black/5">Đăng tin khác</button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="space-y-6">
      {/* 1. Loại tin & loại hình */}
      <Card step="1" title="Loại tin đăng">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Pick label="Nhu cầu" value={demand} onChange={setDemand} options={demandTypes} />
          <Pick label="Loại hình bất động sản" value={category} onChange={setCategory} options={propertyCategories} />
        </div>
      </Card>

      {/* 2. Địa chỉ */}
      <Card step="2" title="Địa chỉ bất động sản">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Pick label="Tỉnh / Thành" value={province} onChange={(v) => { setProvince(v); setDistrict(""); setWard(""); }} options={provinceNames} placeholder="Chọn Tỉnh / Thành" />
          <Pick label="Quận / Huyện" value={district} onChange={(v) => { setDistrict(v); setWard(""); }} options={districts} placeholder="Chọn Quận / Huyện" disabled={!province} />
          <Pick label="Phường / Xã" value={ward} onChange={setWard} options={wards} placeholder="Chọn Phường / Xã" disabled={!district} />
        </div>
        <Text label="Địa chỉ cụ thể (số nhà, đường, dự án)" placeholder="VD: 123 Võ Nguyên Giáp / Dự án ..." />
      </Card>

      {/* 3. Thông tin chính */}
      <Card step="3" title="Thông tin chính">
        <Text label="Tiêu đề tin đăng *" placeholder="VD: Bán căn hộ 2PN view sông Hàn, full nội thất" required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>Mức giá *</Label>
            <div className="flex gap-2">
              <input required type="number" min="0" step="0.1" placeholder="VD: 4,2" className={inputCls + " flex-1"} />
              <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className={inputCls + " w-28"}>
                {["tỷ", "triệu", "triệu/m²", "Thoả thuận"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Diện tích (m²) *</Label>
            <input required type="number" min="0" placeholder="VD: 95" className={inputCls} />
          </div>
        </div>
      </Card>

      {/* 4. Đặc điểm theo loại hình (động) */}
      <Card step="4" title={`Đặc điểm — ${spec.label}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spec.fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}{f.unit ? ` (${f.unit})` : ""}</Label>
              {f.type === "select" ? (
                <select className={inputCls}>
                  <option value="">Chọn</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type === "number" ? "number" : "text"} placeholder={f.placeholder ?? ""} className={inputCls} />
              )}
            </div>
          ))}
          <div>
            <Label>Tình trạng pháp lý</Label>
            <select value={legal} onChange={(e) => setLegal(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {legalOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label>Tình trạng nội thất</Label>
            <select value={furnish} onChange={(e) => setFurnish(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {furnishLevels.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* 5. Nội thất */}
      <Card step="5" title="Nội thất (tick mục có sẵn)">
        <div className="flex flex-wrap gap-2">
          {interiorItems.map((it) => (
            <Chip key={it} active={interior.includes(it)} onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
          ))}
        </div>
      </Card>

      {/* 6. Tiện ích */}
      <Card step="6" title="Tiện ích (tick mục có sẵn)">
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

      {/* 7. Mô tả */}
      <Card step="7" title="Mô tả chi tiết">
        <textarea rows={6} placeholder="Mô tả vị trí, kết cấu, tiện ích, pháp lý, lý do bán… (nội dung càng đầy đủ càng dễ chốt)" className={inputCls + " resize-y"} />
      </Card>

      {/* 8. Hình ảnh */}
      <Card step="8" title="Hình ảnh & video">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-10 text-center transition hover:border-cvr-ink/40">
          <svg className="h-9 w-9 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2 2 0 002 2h14a2 2 0 002-2v-1.5M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="text-sm text-cvr-body">Kéo thả hoặc bấm để tải ảnh (tối đa 20 ảnh)</span>
          <span className="text-xs text-cvr-faint">{photoCount > 0 ? `Đã chọn ${photoCount} ảnh` : "JPG, PNG — nên ≥ 1200px"}</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)} />
        </label>
      </Card>

      {/* 9. Liên hệ */}
      <Card step="9" title="Thông tin liên hệ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><Label>Họ và tên *</Label><input required placeholder="Nguyễn Văn A" className={inputCls} /></div>
          <div><Label>Số điện thoại *</Label><input required type="tel" placeholder="09xx xxx xxx" className={inputCls} /></div>
          <div><Label>Email</Label><input type="email" placeholder="email@example.com" className={inputCls} /></div>
        </div>
      </Card>

      <button type="submit" className="btn-dangtin flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold text-cvr-ink">
        Đăng tin ngay
      </button>
      <p className="text-center text-[11px] text-cvr-faint">Tin đăng được AI kiểm duyệt trước khi hiển thị.</p>
    </form>
  );
}

const inputCls = "h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-cvr-body">{children}</label>;
}

function Card({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-none border border-cvr-line bg-white p-5 shadow-lux sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-cvr-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cvr-ink text-sm text-white">{step}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Pick({ label, value, onChange, options, placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inputCls + " disabled:cursor-not-allowed disabled:opacity-45"}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Text({ label, placeholder, required }: { label: string; placeholder: string; required?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <input required={required} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${active ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}>
      {children}
    </button>
  );
}

