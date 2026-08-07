"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { provinceNamesFor, districtsOf, wardsOf, wardsOfNew, type GeoMode } from "@/lib/locations";
import ImagePicker from "@/components/admin/ImagePicker";
import ContentEditor from "@/components/admin/ContentEditor";
import { uploadImageFile } from "@/lib/uploadImage";
import {
  type ProjectRow,
  type ProjectScaleItem,
  type ProjectPurpose,
  type ProjectPriceRow,
  type ProjectFloorPlan,
  type ProjectPlace,
  type ProjectTier,
  type ContentStatus,
  projectStatusOptions,
  projectTierOptions,
  placeCategories,
  slugify,
} from "@/lib/contentAdmin";
import { directions } from "@/lib/listingSpec";

// Nhãn gợi ý cho bảng "Quy mô dự án" (sửa tự do được)
const DEFAULT_SCALE: ProjectScaleItem[] = [
  { label: "Giá tham khảo", value: "" },
  { label: "Loại hình", value: "" },
  { label: "Quy mô", value: "" },
  { label: "Điểm nhấn", value: "" },
  { label: "Pháp lý", value: "" },
  { label: "Bàn giao (dự kiến)", value: "" },
];

// Gợi ý dòng bảng giá mặc định (sửa/xoá tự do)
const DEFAULT_PRICE_ROWS: ProjectPriceRow[] = [
  { unit: "Căn 1 phòng ngủ", area: "45 – 55 m²", direction: "", price: "" },
  { unit: "Căn 2 phòng ngủ", area: "65 – 85 m²", direction: "", price: "" },
  { unit: "Căn 3 phòng ngủ", area: "95 – 125 m²", direction: "", price: "" },
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

  // ── Dữ liệu cấu trúc mới (cột details) ──
  const [tier, setTier] = useState<ProjectTier>(initial?.details?.tier ?? "basic");
  const [contactName, setContactName] = useState(initial?.details?.contact?.name ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.details?.contact?.phone ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.details?.contact?.email ?? "");
  const [purposes, setPurposes] = useState<ProjectPurpose[]>(initial?.details?.purposes ?? ["ban"]);
  const [priceMode, setPriceMode] = useState<"show" | "hidden">(initial?.details?.priceMode ?? "hidden");
  const [priceRows, setPriceRows] = useState<ProjectPriceRow[]>(
    initial?.details?.priceTable?.length ? initial.details.priceTable : DEFAULT_PRICE_ROWS,
  );
  const [floorPlans, setFloorPlans] = useState<ProjectFloorPlan[]>(initial?.details?.floorPlans ?? []);
  const [places, setPlaces] = useState<ProjectPlace[]>(initial?.details?.places ?? []);
  const [devEstablished, setDevEstablished] = useState(initial?.details?.developerInfo?.established ?? "");
  const [devWebsite, setDevWebsite] = useState(initial?.details?.developerInfo?.website ?? "");
  const [devDesc, setDevDesc] = useState(initial?.details?.developerInfo?.desc ?? "");
  const [devLogo, setDevLogo] = useState(initial?.details?.developerInfo?.logo ?? "");
  const [fpUploading, setFpUploading] = useState<number | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function togglePurpose(p: ProjectPurpose) {
    setPurposes((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]));
  }

  // Bảng giá
  const setPriceAt = (i: number, patch: Partial<ProjectPriceRow>) =>
    setPriceRows((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  // Mặt bằng
  const setFloorAt = (i: number, patch: Partial<ProjectFloorPlan>) =>
    setFloorPlans((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  async function uploadFloorImage(i: number, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setFpUploading(i);
    const { url, error: e } = await uploadImageFile(file);
    setFpUploading(null);
    if (e) return setError(e);
    if (url) setFloorAt(i, { image: url });
  }

  // Tiện ích xung quanh
  const setPlaceAt = (i: number, patch: Partial<ProjectPlace>) =>
    setPlaces((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  // Logo chủ đầu tư
  async function uploadLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setLogoUploading(true);
    const { url, error: e } = await uploadImageFile(file);
    setLogoUploading(false);
    if (e) return setError(e);
    if (url) setDevLogo(url);
  }

  // Hệ đơn vị hành chính: MỚI (sau sáp nhập, bỏ cấp Quận/Huyện) hoặc CŨ
  const [geoMode, setGeoMode] = useState<GeoMode>("moi");
  const provinceOptions = provinceNamesFor(geoMode);
  const districtOptions = geoMode === "moi" ? [] : province ? districtsOf(province) : [];
  const wardOptions =
    geoMode === "moi"
      ? province ? wardsOfNew(province) : []
      : province && district ? wardsOf(province, district) : [];

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
      details: {
        tier,
        // Bỏ trống hết → không lưu contact → trang dự án KHÔNG hiện khối liên hệ
        contact:
          contactName.trim() || contactPhone.trim() || contactEmail.trim()
            ? { name: contactName.trim(), phone: contactPhone.trim(), email: contactEmail.trim() }
            : undefined,
        purposes,
        priceMode,
        priceTable: priceRows
          .map((r) => ({ unit: r.unit.trim(), area: r.area.trim(), direction: r.direction.trim(), price: r.price.trim() }))
          .filter((r) => r.unit || r.area || r.price),
        floorPlans: floorPlans
          .map((f) => ({ label: f.label.trim(), image: f.image.trim(), note: f.note.trim() }))
          .filter((f) => f.image),
        places: places
          .map((p) => ({ category: p.category, name: p.name.trim(), distance: p.distance.trim() }))
          .filter((p) => p.name),
        developerInfo:
          devEstablished.trim() || devWebsite.trim() || devDesc.trim() || devLogo.trim()
            ? { established: devEstablished.trim(), website: devWebsite.trim(), desc: devDesc.trim(), logo: devLogo.trim() }
            : undefined,
      },
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
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-4">
      <Card title="Thông tin dự án">
        <div className="space-y-4">
          <Field label="Tên dự án">
            <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="VD: Sun Cosmo Residence" className={inputCls} />
          </Field>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
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

      {/* Cấp dự án — quyết định thứ tự trong slide "Dự án nổi bật" ở trang chủ */}
      <Card title="Cấp dự án (CVR-PJ)">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cấp hiển thị">
            <select value={tier} onChange={(e) => setTier(e.target.value as ProjectTier)} className={inputCls}>
              {projectTierOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Cấp càng cao càng đứng trước trong slide “Dự án nổi bật” ở trang chủ và mục “Dự án liên quan”.
        </p>
      </Card>

      {/* Thông tin liên hệ dự án — BỎ TRỐNG thì trang dự án không hiện khối liên hệ */}
      <Card title="Thông tin liên hệ">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Người phụ trách">
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="VD: Nguyễn Văn A" className={inputCls} />
          </Field>
          <Field label="Số điện thoại">
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Để trống toàn bộ → trang dự án KHÔNG hiện khối liên hệ (không hiện số điện thoại mặc định nào).
        </p>
      </Card>

      {/* Mục đích: dự án bán / cho thuê — quyết định tab tin liên quan trên web */}
      <Card title="Mục đích">
        <div className="flex flex-wrap gap-2">
          <Chip active={purposes.includes("ban")} onClick={() => togglePurpose("ban")}>Mua bán</Chip>
          <Chip active={purposes.includes("thue")} onClick={() => togglePurpose("thue")}>Cho thuê</Chip>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">Chọn 1 hoặc cả 2 — hiện huy hiệu trên trang dự án và tách tab “Tin bán / cho thuê” liên quan.</p>
      </Card>

      {/* Vị trí — GIỐNG HỆT form Tin đăng: chọn hệ địa chỉ MỚI (sau sáp nhập, bỏ cấp
          Quận/Huyện) hoặc CŨ, rồi chọn liên động Tỉnh → (Quận/Huyện) → Phường/Xã. */}
      <Card title="Vị trí">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Hệ địa chỉ">
            <div className="inline-flex rounded-lg border border-cvr-line bg-white p-1">
              {([{ id: "moi" as GeoMode, label: "Tỉnh/Thành mới" }, { id: "cu" as GeoMode, label: "Địa chỉ cũ" }]).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setGeoMode(m.id); setProvince(""); setDistrict(""); setWard(""); }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${geoMode === m.id ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tỉnh/Thành (bắt buộc)">
            <select
              value={province}
              onChange={(e) => { setProvince(e.target.value); setDistrict(""); setWard(""); }}
              className={inputCls}
            >
              <option value="">— Chọn Tỉnh/Thành —</option>
              {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          {geoMode === "cu" && (
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
          )}

          <Field label="Phường/Xã">
            {wardOptions.length > 0 ? (
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                disabled={geoMode === "moi" ? !province : !district}
                className={`${inputCls} disabled:bg-cvr-surface disabled:text-cvr-faint`}
              >
                <option value="">
                  {(geoMode === "moi" ? province : district) ? "— Chọn Phường/Xã —" : geoMode === "moi" ? "Chọn tỉnh trước" : "Chọn quận/huyện trước"}
                </option>
                {wardOptions.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            ) : (
              <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Nhập Phường/Xã" className={inputCls} />
            )}
          </Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Hệ MỚI (sau sáp nhập) bỏ cấp Quận/Huyện: Tỉnh/Thành → thẳng Phường/Xã.
        </p>
      </Card>

      {/* Tiện ích xung quanh — hiện dưới bản đồ (sân bay, trường, siêu thị… + khoảng cách) */}
      <Card title="Tiện ích xung quanh (dưới bản đồ)">
        <div className="space-y-2.5">
          {places.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
              <select
                value={row.category}
                onChange={(e) => setPlaceAt(i, { category: e.target.value })}
                className={`${inputCls} sm:max-w-[170px]`}
              >
                {placeCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                value={row.name}
                onChange={(e) => setPlaceAt(i, { name: e.target.value })}
                placeholder="Tên (VD: Sân bay Đà Nẵng)"
                className={inputCls}
              />
              <input
                value={row.distance}
                onChange={(e) => setPlaceAt(i, { distance: e.target.value })}
                placeholder="Khoảng cách (VD: 3,5 km / 8 phút)"
                className={`${inputCls} sm:max-w-[220px]`}
              />
              <button type="button" onClick={() => setPlaces((rows) => rows.filter((_, j) => j !== i))} aria-label="Xoá dòng" className="shrink-0 rounded-lg px-2 py-2 text-cvr-faint transition hover:text-red-600">✕</button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPlaces((rows) => [...rows, { category: placeCategories[0], name: "", distance: "" }])}
          className="mt-3 rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          + Thêm tiện ích xung quanh
        </button>
        <p className="mt-2 text-xs text-cvr-faint">Chỉ dòng có Tên mới hiện. Nhập khoảng cách để người xem dễ hình dung (kiểu Batdongsan).</p>
      </Card>

      <Card title="Tổng quan dự án — mỗi ĐOẠN xuống 1 dòng">
        <ContentEditor
          value={overview}
          onChange={setOverview}
          placeholder={"Giới thiệu vị trí, chủ đầu tư…\nĐiểm nổi bật về thiết kế, tiện ích…\nPhù hợp với ai, chính sách bán hàng…"}
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

      {/* Mặt bằng dự án — mỗi mặt bằng 1 ảnh + chú thích (tháp/tầng/loại căn) */}
      <Card title="Mặt bằng dự án (từng tháp / tầng / loại căn)">
        <div className="space-y-3">
          {floorPlans.map((f, i) => (
            <div key={i} className="rounded-xl border border-cvr-line p-3">
              <div className="flex items-start gap-3">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-cvr-surface ring-1 ring-cvr-line">
                  {f.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={f.image} alt={f.label || "Mặt bằng"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-cvr-faint">Chưa có ảnh</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={f.label}
                    onChange={(e) => setFloorAt(i, { label: e.target.value })}
                    placeholder="Chú thích (VD: Tháp A – Mặt bằng tầng điển hình / Căn 2PN)"
                    className={inputCls}
                  />
                  <input
                    value={f.note}
                    onChange={(e) => setFloorAt(i, { note: e.target.value })}
                    placeholder="Ghi chú thêm (VD: Diện tích 78m², 2PN 2WC)"
                    className={inputCls}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById(`fp-file-${i}`)?.click()}
                      disabled={fpUploading === i}
                      className="rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
                    >
                      {fpUploading === i ? "Đang tải…" : f.image ? "Đổi ảnh mặt bằng" : "Tải ảnh mặt bằng"}
                    </button>
                    <input id={`fp-file-${i}`} type="file" accept="image/*" onChange={(e) => uploadFloorImage(i, e.target.files)} className="hidden" />
                    <button type="button" onClick={() => setFloorPlans((rows) => rows.filter((_, j) => j !== i))} className="text-xs font-medium text-cvr-muted transition hover:text-red-600">Xoá mặt bằng</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFloorPlans((rows) => [...rows, { label: "", image: "", note: "" }])}
          className="mt-3 rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          + Thêm mặt bằng
        </button>
        <p className="mt-2 text-xs text-cvr-faint">Tải ảnh mặt bằng từng tháp/tầng/loại căn kèm chú thích rõ ràng. Người xem bấm ảnh để phóng to.</p>
      </Card>

      {/* Bảng giá — bật/tắt hiện giá cụ thể; cấu trúc Loại căn – Diện tích – Hướng – Giá */}
      <Card title="Bảng giá dự án">
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-cvr-body">
            <input type="radio" name="priceMode" checked={priceMode === "hidden"} onChange={() => setPriceMode("hidden")} className="h-4 w-4" />
            Ẩn giá — hiện “Liên hệ”
          </label>
          <label className="flex items-center gap-2 text-sm text-cvr-body">
            <input type="radio" name="priceMode" checked={priceMode === "show"} onChange={() => setPriceMode("show")} className="h-4 w-4" />
            Hiện giá cụ thể (theo từng dòng)
          </label>
        </div>
        <div className="space-y-2.5">
          <div className="hidden gap-2.5 px-1 text-xs font-medium uppercase tracking-wide text-cvr-faint sm:flex">
            <span className="flex-1">Loại căn</span>
            <span className="w-[150px]">Diện tích</span>
            <span className="w-[130px]">Hướng</span>
            <span className="w-[150px]">Giá</span>
            <span className="w-6" />
          </div>
          {priceRows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
              <input value={row.unit} onChange={(e) => setPriceAt(i, { unit: e.target.value })} placeholder="VD: Căn 2 phòng ngủ" className={inputCls} />
              <input value={row.area} onChange={(e) => setPriceAt(i, { area: e.target.value })} placeholder="VD: 65 – 85 m²" className={`${inputCls} sm:w-[150px]`} />
              <select value={row.direction} onChange={(e) => setPriceAt(i, { direction: e.target.value })} className={`${inputCls} sm:w-[130px]`}>
                <option value="">Hướng</option>
                {directions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <input value={row.price} onChange={(e) => setPriceAt(i, { price: e.target.value })} placeholder="VD: 3,2 tỷ" className={`${inputCls} sm:w-[150px]`} />
              <button type="button" onClick={() => setPriceRows((rows) => rows.filter((_, j) => j !== i))} aria-label="Xoá dòng" className="shrink-0 rounded-lg px-2 py-2 text-cvr-faint transition hover:text-red-600">✕</button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPriceRows((rows) => [...rows, { unit: "", area: "", direction: "", price: "" }])}
          className="mt-3 rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          + Thêm loại căn
        </button>
        <p className="mt-2 text-xs text-cvr-faint">
          Chọn <strong>“Ẩn giá”</strong> → mọi dòng hiện “Liên hệ”. Chọn <strong>“Hiện giá cụ thể”</strong> → dòng nào có nhập giá sẽ hiện giá, bỏ trống vẫn “Liên hệ”.
        </p>
      </Card>

      {/* Chủ đầu tư — thông tin mở rộng (tên đã nhập ở mục Thông tin dự án) */}
      <Card title="Chủ đầu tư">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {devLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={devLogo} alt="Logo chủ đầu tư" className="h-16 w-16 rounded-lg object-contain ring-1 ring-cvr-line" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-cvr-surface text-[11px] text-cvr-faint ring-1 ring-cvr-line">Logo</div>
            )}
            <button
              type="button"
              onClick={() => document.getElementById("dev-logo-file")?.click()}
              disabled={logoUploading}
              className="mt-2 w-16 rounded-lg border border-cvr-line px-1 py-1 text-[11px] font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
            >
              {logoUploading ? "…" : "Logo"}
            </button>
            <input id="dev-logo-file" type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files)} className="hidden" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Thành lập / Kinh nghiệm">
                <input value={devEstablished} onChange={(e) => setDevEstablished(e.target.value)} placeholder="VD: Thành lập 2007" className={inputCls} />
              </Field>
              <Field label="Website">
                <input value={devWebsite} onChange={(e) => setDevWebsite(e.target.value)} placeholder="VD: sungroup.com.vn" className={inputCls} />
              </Field>
            </div>
            <Field label="Giới thiệu chủ đầu tư">
              <textarea value={devDesc} onChange={(e) => setDevDesc(e.target.value)} rows={3} placeholder="Vài dòng về chủ đầu tư, các dự án tiêu biểu, uy tín…" className={`${inputCls} h-auto py-2.5`} />
            </Field>
          </div>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">Tên chủ đầu tư lấy ở mục “Thông tin dự án”. Phần này bổ sung logo &amp; giới thiệu để mục Chủ đầu tư trên web chuyên nghiệp hơn.</p>
      </Card>

      <Card title="Ảnh & video dự án (ảnh đầu = ảnh đại diện)">
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
    <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-lux">
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
    <button type="button" onClick={onClick} className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition ${active ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}>
      {children}
    </button>
  );
}
