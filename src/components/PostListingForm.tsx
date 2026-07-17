"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  categorySpecs, propertyCategories, demandTypes,
  legalOptions, furnishLevels, amenityGroups, interiorItems, directions,
} from "@/lib/listingSpec";
import { provinceNames, districtsOf, wardsOf } from "@/lib/locations";
import ImagePicker from "@/components/admin/ImagePicker";

// Form đăng tin cho KHÁCH HÀNG (/dang-tin) — nối Supabase thật.
// Cùng cấu trúc với form admin: Lưu nháp (làm dở) / Đăng tin (gửi duyệt).
// Khách đăng → status 'pending' (chờ admin duyệt). Nháp → 'draft'.
export default function PostListingForm() {
  const router = useRouter();

  // Ai đang đăng nhập (cần để gắn owner_id + prefill liên hệ)
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [done, setDone] = useState<"" | "draft" | "pending">("");
  const [demand, setDemand] = useState(demandTypes[0]);
  const [category, setCategory] = useState(propertyCategories[0]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [title, setTitle] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [priceUnit, setPriceUnit] = useState("tỷ");
  const [area, setArea] = useState("");
  const [builtArea, setBuiltArea] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [legal, setLegal] = useState("");
  const [furnish, setFurnish] = useState("");
  const [direction, setDirection] = useState("");
  const [interior, setInterior] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const spec = useMemo(() => categorySpecs.find((c) => c.label === category) ?? categorySpecs[0], [category]);
  const districts = province ? districtsOf(province) : [];
  const wards = province && district ? wardsOf(province, district) : [];

  // Lấy phiên đăng nhập + prefill liên hệ từ hồ sơ
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (user) {
        const { data: p } = await supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).single();
        if (p) {
          setContactName((v) => v || p.full_name || "");
          setContactPhone((v) => v || p.phone || "");
          setContactEmail((v) => v || p.email || "");
        }
      }
      setAuthReady(true);
    })();
  }, []);

  function toggle(list: string[], set: (v: string[]) => void, v: string) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  // Giá → VNĐ theo đơn vị (tỷ / triệu / triệu/m² / Thoả thuận)
  function priceToVnd(): number | null {
    if (priceUnit === "Thoả thuận" || !priceValue.trim()) return null;
    const n = parseFloat(priceValue.replace(",", "."));
    if (Number.isNaN(n)) return null;
    const a = parseFloat(area.replace(",", "."));
    if (priceUnit === "tỷ") return Math.round(n * 1e9);
    if (priceUnit === "triệu") return Math.round(n * 1e6);
    if (priceUnit === "triệu/m²") return Number.isNaN(a) ? null : Math.round(n * a * 1e6);
    return null;
  }

  async function save(asDraft: boolean) {
    setError("");
    if (!userId) {
      router.push("/dang-nhap?next=/dang-tin");
      return;
    }
    if (!title.trim()) return setError(asDraft ? "Nhập tiêu đề để lưu nháp." : "Chưa nhập tiêu đề tin.");
    if (!asDraft) {
      if (!province) return setError("Chưa chọn Tỉnh/Thành.");
      if (!contactName.trim() || !contactPhone.trim()) return setError("Nhập họ tên và số điện thoại liên hệ.");
    }

    setSaving(true);
    const { error: err } = await createClient().from("listings").insert({
      owner_id: userId,
      purpose: demand === "Cho thuê" ? "thue" : "ban",
      type: category,
      title: title.trim(),
      description: description.trim() || null,
      price_vnd: priceToVnd(),
      area_m2: area.trim() ? parseFloat(area.replace(",", ".")) : null,
      built_area_m2: builtArea.trim() ? parseFloat(builtArea.replace(",", ".")) : null,
      beds: beds.trim() ? parseInt(beds, 10) : null,
      baths: baths.trim() ? parseInt(baths, 10) : null,
      ward: ward || null,
      district: district || null,
      province: province || null,
      images: images.map((s) => s.trim()).filter(Boolean),
      // Thuộc tính thật → cột details (trang chi tiết hiện đúng)
      details: {
        specs: Object.fromEntries(Object.entries(specValues).filter(([, v]) => v && v.trim())),
        interior,
        amenities,
        legal: legal || undefined,
        furnish: furnish || undefined,
        direction: direction || undefined,
        addressDetail: addressDetail.trim() || undefined,
        contact: (contactName.trim() || contactPhone.trim() || contactEmail.trim())
          ? { name: contactName.trim(), phone: contactPhone.trim(), email: contactEmail.trim() }
          : undefined,
      },
      tier: "basic",
      status: asDraft ? "draft" : "pending", // khách đăng → chờ admin duyệt
      published_at: null,
    });
    setSaving(false);
    if (err) return setError(`Lưu thất bại: ${err.message}`);
    setDone(asDraft ? "draft" : "pending");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Chưa đăng nhập → mời đăng nhập (tin gắn với tài khoản để quản lý sau)
  if (authReady && !userId) {
    return (
      <div className="rounded-none border border-cvr-line bg-white p-10 text-center shadow-lux">
        <h3 className="text-xl font-semibold tracking-tight text-cvr-ink">Đăng nhập để đăng tin</h3>
        <p className="mt-2 text-sm text-cvr-muted">Tin đăng được gắn với tài khoản để bạn quản lý, chỉnh sửa và theo dõi trạng thái duyệt.</p>
        <Link href="/dang-nhap?next=/dang-tin" className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-cvr-ink px-6 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          Đăng nhập / Đăng ký
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-none border border-cvr-line bg-white p-10 text-center shadow-lux">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cvr-ink text-white">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-cvr-ink">
          {done === "draft" ? "Đã lưu nháp!" : "Tin đăng đã được gửi!"}
        </h3>
        <p className="mt-2 text-sm text-cvr-muted">
          {done === "draft"
            ? "Tin nháp được lưu trong tài khoản. Bạn có thể vào làm tiếp bất cứ lúc nào."
            : "Tin của bạn đang chờ Coastal Land kiểm duyệt và sẽ hiển thị sau ít phút."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/tai-khoan/tin-dang" className="rounded-lg bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">Tin đăng của tôi</Link>
          <button type="button" onClick={() => { setDone(""); setTitle(""); setImages([]); }} className="rounded-lg border border-cvr-line px-5 py-2 text-sm font-medium text-cvr-body hover:border-cvr-ink hover:text-cvr-ink">Đăng tin khác</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-6">
      {/* 1. Loại tin & loại hình */}
      <Card step="1" title="Loại tin đăng">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Pick label="Nhu cầu" value={demand} onChange={setDemand} options={demandTypes} />
          <Pick label="Loại hình bất động sản" value={category} onChange={(v) => { setCategory(v); setSpecValues({}); }} options={propertyCategories} />
        </div>
      </Card>

      {/* 2. Địa chỉ */}
      <Card step="2" title="Địa chỉ bất động sản">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Pick label="Tỉnh / Thành" value={province} onChange={(v) => { setProvince(v); setDistrict(""); setWard(""); }} options={provinceNames} placeholder="Chọn Tỉnh / Thành" />
          <Pick label="Quận / Huyện" value={district} onChange={(v) => { setDistrict(v); setWard(""); }} options={districts} placeholder="Chọn Quận / Huyện" disabled={!province} />
          <Pick label="Phường / Xã" value={ward} onChange={setWard} options={wards} placeholder="Chọn Phường / Xã" disabled={!district} />
        </div>
        <Text label="Địa chỉ cụ thể (số nhà, đường, dự án)" value={addressDetail} onChange={setAddressDetail} placeholder="VD: 123 Võ Nguyên Giáp / Dự án ..." />
      </Card>

      {/* 3. Thông tin chính */}
      <Card step="3" title="Thông tin chính">
        <Text label="Tiêu đề tin đăng *" value={title} onChange={setTitle} placeholder="VD: Bán căn hộ 2PN view sông Hàn, full nội thất" required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>Mức giá</Label>
            <div className="flex gap-2">
              <input type="number" min="0" step="0.1" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} disabled={priceUnit === "Thoả thuận"} placeholder="VD: 4,2" className={inputCls + " flex-1 disabled:opacity-50"} />
              <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className={inputCls + " w-32"}>
                {["tỷ", "triệu", "triệu/m²", "Thoả thuận"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Diện tích đất (m²)</Label>
            <input type="number" min="0" value={area} onChange={(e) => setArea(e.target.value)} placeholder="VD: 100" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Diện tích xây dựng (m²)</Label>
            <input type="number" min="0" value={builtArea} onChange={(e) => setBuiltArea(e.target.value)} placeholder="VD: 95 (đất nền bỏ trống)" className={inputCls} />
          </div>
          <div>
            <Label>Số phòng ngủ</Label>
            <input type="number" min="0" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="VD: 3" className={inputCls} />
          </div>
          <div>
            <Label>Số phòng tắm</Label>
            <input type="number" min="0" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="VD: 2" className={inputCls} />
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
                <select value={specValues[f.key] ?? ""} onChange={(e) => setSpecValues((s) => ({ ...s, [f.key]: e.target.value }))} className={inputCls}>
                  <option value="">Chọn</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type === "number" ? "number" : "text"} value={specValues[f.key] ?? ""} onChange={(e) => setSpecValues((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder ?? ""} className={inputCls} />
              )}
            </div>
          ))}
          {/* Trường DÙNG CHUNG mọi loại hình: Hướng · Nội thất · Pháp lý */}
          <div>
            <Label>Hướng nhà / đất</Label>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {directions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label>Tình trạng nội thất</Label>
            <select value={furnish} onChange={(e) => setFurnish(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {furnishLevels.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label>Tình trạng pháp lý</Label>
            <select value={legal} onChange={(e) => setLegal(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {legalOptions.map((o) => <option key={o} value={o}>{o}</option>)}
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
        <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả vị trí, kết cấu, tiện ích, pháp lý, lý do bán… (nội dung càng đầy đủ càng dễ chốt)" className={inputCls + " resize-y"} />
      </Card>

      {/* 8. Hình ảnh — tải từ máy / dán link, ảnh đầu là ảnh đại diện */}
      <Card step="8" title="Hình ảnh">
        <ImagePicker value={images} onChange={setImages} />
      </Card>

      {/* 9. Liên hệ */}
      <Card step="9" title="Thông tin liên hệ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><Label>Họ và tên *</Label><input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} /></div>
          <div><Label>Số điện thoại *</Label><input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} /></div>
          <div><Label>Email</Label><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" className={inputCls} /></div>
        </div>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}

      {/* 2 nút: ĐĂNG TIN (gửi duyệt) · LƯU NHÁP (làm tiếp sau) */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="btn-dangtin flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-cvr-ink disabled:opacity-50">
          {saving ? "Đang gửi…" : "Đăng tin ngay"}
        </button>
        <button type="button" onClick={() => save(true)} disabled={saving} className="rounded-xl border border-cvr-line px-6 py-3.5 text-base font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-50">
          Lưu nháp
        </button>
      </div>
      <p className="text-center text-[11px] text-cvr-faint">
        <strong>Lưu nháp</strong>: lưu vào tài khoản, làm tiếp sau. <strong>Đăng tin</strong>: gửi Coastal Land kiểm duyệt trước khi hiển thị.
      </p>
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

function Text({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
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
