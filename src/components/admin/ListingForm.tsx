"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saleTypeGroups, rentTypeGroups } from "@/lib/filters";
import { provinceNamesFor, districtsOf, wardsOf, wardsOfNew, type GeoMode } from "@/lib/locations";
import { ganDiaGioi, type DiaGioiBanDo } from "@/lib/diaGioiTuBanDo";
import { fieldsFor, interiorItems, amenityGroups, legalOptions, furnishLevels, directions, coPhongNgu, coPhongTam, coDienTichXayDung, nhanDienTich } from "@/lib/listingSpec";
import ImagePicker from "@/components/admin/ImagePicker";
// BẢN ĐỒ GHIM — dùng bản Leaflet/OpenStreetMap. Bản chạy nền Google
// (components/MapPicker.tsx) GIỮ LẠI để sau này Google thông thì đổi về, chỉ
// phải sửa đúng dòng import này.
import MapPicker from "@/components/MapPickerGoogle";
import ContentEditor from "@/components/admin/ContentEditor";
import { uploadImageFile } from "@/lib/uploadImage";
import { soAnhToiDa, soVideoToiDa } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { getTier } from "@/lib/packages";
import { Panel, Field } from "@/components/Ui";
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

  const { billing } = useBilling(); // giới hạn số ảnh theo cấp tin (admin đặt)
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
  // GHIM VỊ TRÍ: khi địa chỉ không đủ chính xác, admin dán toạ độ (hoặc link
  // Google Maps) — bản đồ trang tin sẽ trỏ ĐÚNG điểm đã ghim thay vì đoán theo tên.
  const [mapPin, setMapPin] = useState(initial?.details?.mapPin ?? "");
  const [specValues, setSpecValues] = useState<Record<string, string>>(initial?.details?.specs ?? {});
  const [direction, setDirection] = useState(initial?.details?.direction ?? "");
  const [legal, setLegal] = useState(initial?.details?.legal ?? "");
  const [furnish, setFurnish] = useState(initial?.details?.furnish ?? "");
  const [interior, setInterior] = useState<string[]>(initial?.details?.interior ?? []);
  const [amenities, setAmenities] = useState<string[]>(initial?.details?.amenities ?? []);
  const [cName, setCName] = useState(initial?.details?.contact?.name ?? "");
  const [cPhone, setCPhone] = useState(initial?.details?.contact?.phone ?? "");
  const [cEmail, setCEmail] = useState(initial?.details?.contact?.email ?? "");
  const [cAvatar, setCAvatar] = useState(initial?.details?.contact?.avatar ?? "");
  // Tin thuộc dự án nào — quyết định mục "Tin mua bán liên quan tại dự án …"
  const [projectSlug, setProjectSlug] = useState(initial?.details?.project ?? "");
  const [projectOptions, setProjectOptions] = useState<{ slug: string; name: string }[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Đăng tin GIÙM khách: chọn tin này thuộc khách hàng nào (owner_id).
  type Cust = { id: string; full_name: string | null; phone: string | null; email: string | null; role: string };
  const [ownerId, setOwnerId] = useState<string>(initial?.owner_id ?? "");
  const [customers, setCustomers] = useState<Cust[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Nạp danh sách dự án đã đăng — cho ô "Thuộc dự án"
  useEffect(() => {
    (async () => {
      const { data } = await createClient()
        .from("projects")
        .select("slug, name")
        .eq("status", "published")
        .order("name");
      if (data) setProjectOptions(data as { slug: string; name: string }[]);
    })();
  }, []);

  // Nạp danh sách khách hàng (để admin chọn đăng giùm) + mặc định người đăng.
  // Tin mới chưa gán chủ → mặc định là admin đang đăng nhập. Prefill liên hệ theo chủ.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: list } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, role")
        .order("created_at", { ascending: false });
      if (list) setCustomers(list as Cust[]);

      const defaultOwner = initial?.owner_id || (!editing && user ? user.id : "");
      if (!ownerId && defaultOwner) setOwnerId(defaultOwner);

      // Điền liên hệ từ hồ sơ chủ tin — CHỈ KHI ĐANG TẠO TIN MỚI.
      // ⚠️ Tin ĐÃ CÓ mà thiếu liên hệ thì để TRỐNG. Trước đây tin không có chủ
      // (nhập bằng file) rơi về hồ sơ ADMIN, nên admin chỉ cần mở tin của khách ra
      // sửa một chữ là SỐ ĐIỆN THOẠI CỦA ADMIN bị đóng vào tin đó — khách gọi vào
      // nhầm số chủ sàn. Đã xảy ra ngày 5/9/2026 với 8 tin.
      const src = editing
        ? null
        : (list as Cust[] | null)?.find((x) => x.id === (initial?.owner_id || user?.id));
      if (src) {
        setCName((v) => v || src.full_name || "");
        setCPhone((v) => v || src.phone || "");
        setCEmail((v) => v || src.email || "");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chọn khách hàng chủ tin → tự điền tên/SĐT/email của khách đó (đăng giùm).
  function pickOwner(id: string) {
    setOwnerId(id);
    const c = customers.find((x) => x.id === id);
    if (c) {
      setCName(c.full_name ?? "");
      setCPhone(c.phone ?? "");
      setCEmail(c.email ?? "");
    }
  }

  // Tải ảnh đại diện người đăng lên Supabase → lưu URL vào cAvatar.
  async function handleAvatar(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setAvatarUploading(true);
    const { url, error: e } = await uploadImageFile(file);
    setAvatarUploading(false);
    if (e) return setError(e);
    if (url) setCAvatar(url);
    if (avatarRef.current) avatarRef.current.value = "";
  }

  const typeGroups = purpose === "thue" ? rentTypeGroups : saleTypeGroups;
  // Tin CHO THUÊ có thêm 3 mục: thời gian vào ở · giá điện · giá nước
  const specFields = type ? fieldsFor(type, purpose) : [];

  // Danh sách quận/huyện & phường/xã liên động theo lựa chọn cấp trên
  // Hệ đơn vị hành chính: MỚI (sau sáp nhập) bỏ cấp Quận/Huyện
  const [geoMode, setGeoMode] = useState<GeoMode>("moi");
  // Nhớ địa giới đọc được từ điểm ghim → đổi hệ địa chỉ là điền lại được ngay
  // theo hệ vừa chọn, không phải ghim lại.
  const diaGioiTuBanDoRef = useRef<DiaGioiBanDo | null>(null);

  function apDungDiaGioi(dc: DiaGioiBanDo, he: GeoMode, tinhCu: string, quanCu: string, phuongCu: string) {
    const kq = ganDiaGioi(dc, he, { province: tinhCu, district: quanCu, ward: phuongCu });
    setProvince(kq.province);
    setDistrict(kq.district);
    setWard(kq.ward);
  }
  const provinceOptions = provinceNamesFor(geoMode);
  const districtOptions = geoMode === "moi" ? [] : province ? districtsOf(province) : [];
  const wardOptions =
    geoMode === "moi"
      ? province ? wardsOfNew(province) : []
      : province && district ? wardsOf(province, district) : [];

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
      // ── ĐIỀU KIỆN ĐỂ GOOGLE NHẬN TIN ──────────────────────────────────────
      // Thiếu một trong các mục dưới đây thì tin vẫn lên web nhưng Google coi là
      // "nội dung mỏng" và gần như không lập chỉ mục / không xếp hạng.
      // Lưu nháp KHÔNG bị chặn — chỉ cần tiêu đề, vào sửa tiếp lúc nào cũng được.
      if (title.trim().length < 30)
        return setError("Tiêu đề quá ngắn (tối thiểu 30 ký tự). Nên có loại hình + tên quận/phường — VD: \"Bán căn hộ 2PN view sông Hàn, Hải Châu, Đà Nẵng\".");
      if (!type) return setError("Chưa chọn loại hình.");
      if (!province.trim()) return setError("Chưa chọn Tỉnh/Thành.");
      // Hệ MỚI (2 cấp) KHÔNG còn Quận/Huyện → cấp bắt buộc thứ 2 là Phường/Xã.
      // Hệ CŨ (3 cấp) vẫn bắt buộc Quận/Huyện như trước.
      if (geoMode === "moi" ? !ward.trim() : !district.trim())
        return setError(
          `Chưa chọn ${geoMode === "moi" ? "Phường/Xã" : "Quận/Huyện"} — đây là yếu tố quyết định tin có lên được các tìm kiếm theo khu vực hay không.`,
        );
      if (description.trim().length < 50)
        return setError(`Mô tả quá ngắn (${description.trim().length}/50 ký tự). Google cần nội dung thật để lập chỉ mục — viết ít nhất 1–2 câu về vị trí, pháp lý, tiện ích.`);
      if (images.filter((s) => s.trim()).length === 0)
        return setError("Chưa có ảnh nào. Tin không ảnh gần như không được Google hiển thị và khách cũng bỏ qua.");
      if (!area.trim() || Number.isNaN(parseFloat(area.replace(",", "."))))
        return setError("Chưa nhập diện tích — thiếu diện tích thì tin bị loại khỏi bộ lọc và thiếu dữ liệu gửi cho Google.");
      if (!negotiable && (priceVnd == null || Number.isNaN(priceVnd)))
        return setError("Giá không hợp lệ — nhập số, hoặc tick \"Giá thỏa thuận\".");
    }

    // Đăng tin → 'approved' (admin công khai ngay). Lưu nháp → 'draft'.
    const newStatus: ListingStatus = asDraft ? "draft" : "approved";
    setSaving(true);
    const payload = {
      owner_id: ownerId || null, // tin thuộc khách hàng nào (admin đăng giùm)
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
        // GIỮ NGUYÊN những trường form KHÔNG quản: mã ảnh (maAnh), nguồn tin, ghi chú
        // nội bộ, link ảnh gốc… Trước đây mỗi lần sửa tin bằng form là xoá sạch chúng
        // → mất mã ảnh, lần nhập file sau không nhận ra tin cũ nên đăng trùng.
        ...(initial?.details ?? {}),
        specs: Object.fromEntries(Object.entries(specValues).filter(([, v]) => v && v.trim())),
        interior,
        amenities,
        legal: legal || undefined,
        furnish: furnish || undefined,
        direction: direction || undefined,
        addressDetail: addressDetail.trim() || undefined,
        mapPin: mapPin.trim() || undefined,
        project: projectSlug || undefined,
        contact: (cName.trim() || cPhone.trim() || cEmail.trim() || cAvatar.trim())
          ? { name: cName.trim(), phone: cPhone.trim(), email: cEmail.trim(), avatar: cAvatar.trim() || undefined }
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
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-4">
      {/* Mục đích + Loại hình + Hạng (trạng thái do 2 nút Lưu nháp / Đăng tin quyết định) */}
      <Panel title="Phân loại">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Mục đích">
            <select value={purpose} onChange={(e) => { setPurpose(e.target.value as ListingPurpose); setType(""); }} className={inputCls}>
              <option value="ban">Mua bán</option>
              <option value="thue">Cho thuê</option>
              <option value="mua">Cần mua</option>
              <option value="can-thue">Cần thuê</option>
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
      </Panel>

      {/* Nội dung tin */}
      <Panel title="Nội dung">
        <div className="space-y-4">
          <Field label="Tiêu đề tin (bắt buộc — tối thiểu 30 ký tự, nên có tên quận/phường)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Bán căn hộ 2PN view sông Hàn, Hải Châu, Đà Nẵng" className={inputCls} />
          </Field>
          <Field label="Mô tả (bắt buộc — tối thiểu 50 ký tự)">
            <ContentEditor value={description} onChange={setDescription} placeholder="Mô tả chi tiết: vị trí, nội thất, pháp lý, tiện ích xung quanh…" />
          </Field>
        </div>
      </Panel>

      {/* Giá & thông số */}
      <Panel title="Giá & thông số">
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

        {/* Diện tích · Phòng ngủ · Phòng tắm — CHỈ HIỆN MỤC THUỘC LOẠI HÌNH.
            Đất nền không có phòng ngủ/phòng tắm/diện tích xây dựng; kho xưởng và
            mặt bằng không có phòng ngủ. Số cột co theo số mục còn lại. */}
        {(() => {
          const o = [
            <Field key="dt" label={`${nhanDienTich(type)} — bắt buộc`}>
              <input value={area} onChange={(e) => setArea(e.target.value)} inputMode="decimal" placeholder="VD: 100" className={inputCls} />
            </Field>,
            coDienTichXayDung(type) && (
              <Field key="dtxd" label="Diện tích xây dựng (m²)">
                <input value={builtArea} onChange={(e) => setBuiltArea(e.target.value)} inputMode="decimal" placeholder="VD: 95" className={inputCls} />
              </Field>
            ),
            coPhongNgu(type) && (
              <Field key="pn" label="Phòng ngủ">
                <input value={beds} onChange={(e) => setBeds(e.target.value)} inputMode="numeric" placeholder="VD: 2" className={inputCls} />
              </Field>
            ),
            coPhongTam(type) && (
              <Field key="pt" label="Phòng tắm">
                <input value={baths} onChange={(e) => setBaths(e.target.value)} inputMode="numeric" placeholder="VD: 2" className={inputCls} />
              </Field>
            ),
          ].filter(Boolean);
          const cot = o.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : o.length === 3 ? "sm:grid-cols-3" : o.length === 2 ? "sm:grid-cols-2" : "";
          return <div className={`mt-4 grid grid-cols-1 gap-4 ${cot}`}>{o}</div>;
        })()}
      </Panel>

      {/* Vị trí — 3 cấp CHỌN từ danh sách, liên động: Tỉnh → Quận/Huyện → Phường/Xã.
          Chọn tỉnh mới → xoá quận + phường cũ; chọn quận mới → xoá phường cũ.
          Tỉnh chưa có dữ liệu quận/huyện (ngoài 8 tỉnh lõi) → cho gõ tay để không kẹt. */}
      <Panel title="Vị trí">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Hệ địa chỉ">
            <div className="inline-flex rounded-lg border border-cvr-line bg-white p-1">
              {([{ id: "moi" as GeoMode, label: "Tỉnh/Thành mới" }, { id: "cu" as GeoMode, label: "Địa chỉ cũ" }]).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setGeoMode(m.id);
                    setProvince("");
                    setDistrict("");
                    setWard("");
                    // Đã ghim rồi thì đổi hệ xong điền lại NGAY theo hệ vừa chọn.
                    const dc = diaGioiTuBanDoRef.current;
                    if (dc) setTimeout(() => apDungDiaGioi(dc, m.id, "", "", ""), 0);
                  }}
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

          {/* Hệ MỚI bỏ cấp Quận/Huyện → ẩn hẳn ô này (giống form đăng tin của khách) */}
          {geoMode === "cu" && (
          <Field label="Quận/Huyện (bắt buộc)">
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

          <Field label={geoMode === "moi" ? "Phường/Xã (bắt buộc)" : "Phường/Xã"}>
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
        <div className="mt-4">
        </div>
        <div className="mt-4">
          <Field label="Địa chỉ cụ thể (số nhà, tên đường, số lô, block…)">
            <input
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="VD: 123 Võ Nguyên Giáp · Lô A12 khu B · Block 3 · hoặc chỉ tên đường"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Ghim vị trí trên bản đồ (toạ độ hoặc link Google Maps)">
            <input
              value={mapPin}
              onChange={(e) => setMapPin(e.target.value)}
              placeholder="VD: 16.0678, 108.2208  —  hoặc dán link Google Maps"
              className={inputCls}
            />
          </Field>
          <p className="mt-1.5 text-xs text-cvr-faint">
            Bỏ trống → bản đồ tự tìm theo địa chỉ ở trên. Không cần dán toạ độ tay nữa:
            bấm thẳng lên bản đồ dưới đây là ghim.
          </p>
          <div className="mt-3">
            <MapPicker
              value={mapPin}
              onChange={setMapPin}
              onDiaChi={setAddressDetail}
              onDiaGioi={(dc) => {
                diaGioiTuBanDoRef.current = dc;
                apDungDiaGioi(dc, geoMode, province, district, ward);
              }}
              hint={`${addressDetail}, ${ward}, ${district}, ${province}`}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-cvr-faint">
          Chọn theo danh sách để tin hiện đúng khi lọc khu vực. Tỉnh chưa có sẵn quận/huyện thì gõ tay.
        </p>
      </Panel>

      {/* Đặc điểm theo loại hình (động) + Hướng + Pháp lý + Mức nội thất */}
      <Panel title={`Đặc điểm bất động sản${type ? ` — ${type}` : ""}`}>
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
      </Panel>

      {/* Nội thất — tick mục có sẵn */}
      <Panel title="Nội thất bàn giao (tick mục có)">
        <div className="flex flex-wrap gap-2">
          {interiorItems.map((it) => (
            <Chip key={it} active={interior.includes(it)} onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
          ))}
        </div>
      </Panel>

      {/* Tiện ích — tick mục có sẵn, theo nhóm */}
      <Panel title="Tiện ích (tick mục có)">
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
      </Panel>

      {/* Ảnh — tải từ máy / dán link · ảnh đầu là ảnh đại diện */}
      <Panel title="Ảnh tin đăng">
        <ImagePicker
          value={images}
          onChange={setImages}
          maxImages={soAnhToiDa(billing, tier)}
          maxVideos={soVideoToiDa(billing, tier)}
          tierName={getTier(tier).name}
        />
      </Panel>

      {/* Thông tin người đăng — hiện ở khung liên hệ trang chi tiết */}
      <Panel title="Thông tin người đăng / liên hệ">
        {/* Đăng GIÙM khách: chọn khách hàng → tự điền tên/SĐT của họ */}
        <Field label="Tin này của khách hàng nào (đăng giùm)">
          <select value={ownerId} onChange={(e) => pickOwner(e.target.value)} className={inputCls}>
            <option value="">— Chọn khách hàng / đăng dưới tên admin —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.full_name || c.email || "(chưa đặt tên)")}{c.phone ? ` · ${c.phone}` : ""}{c.role === "admin" ? " · (admin)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <p className="mt-1.5 mb-3 text-xs text-cvr-faint">
          Chọn khách → tự điền tên &amp; SĐT của khách vào ô dưới. Tin sẽ thuộc về tài khoản khách đó (họ thấy trong &quot;Tin đăng của tôi&quot;).
        </p>
        {/* Ảnh đại diện người đăng — hiện trên thẻ tin cấp cao (Diamond/Gold) & trang chi tiết */}
        <div className="mb-4 flex items-center gap-4">
          {cAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={cAvatar} alt="Ảnh đại diện" className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-cvr-line" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-xl font-bold text-cvr-faint ring-1 ring-cvr-line">
              {(cName.trim().split(" ").pop()?.[0] ?? "?").toUpperCase()}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              disabled={avatarUploading}
              className="rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
            >
              {avatarUploading ? "Đang tải…" : cAvatar ? "Đổi ảnh đại diện" : "Tải ảnh đại diện"}
            </button>
            {cAvatar && (
              <button
                type="button"
                onClick={() => setCAvatar("")}
                className="text-xs font-medium text-cvr-muted transition hover:text-red-600"
              >
                Xoá ảnh
              </button>
            )}
            <input ref={avatarRef} type="file" accept="image/*" onChange={(e) => handleAvatar(e.target.files)} className="hidden" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Họ và tên"><input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} /></Field>
          <Field label="Số điện thoại"><input type="tel" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} /></Field>
          <Field label="Email"><input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="email@vidu.com" className={inputCls} /></Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Số điện thoại này hiện ở khung liên hệ trang tin, và <strong>nút Zalo tự trỏ tới chính số này</strong>. Bỏ trống → dùng hotline Coastal Land.
        </p>
      </Panel>

      {/* Tin thuộc dự án nào — nguồn của mục "Tin mua bán liên quan tại dự án …" */}
      <Panel title="Thuộc dự án">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Dự án">
            <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)} className={inputCls}>
              <option value="">— Không thuộc dự án nào —</option>
              {projectOptions.map((o) => (
                <option key={o.slug} value={o.slug}>{o.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Chọn dự án → tin này hiện trong mục “Tin mua bán liên quan tại dự án …” ở trang dự án đó.
          Để trống nếu tin không thuộc dự án nào.
        </p>
      </Panel>

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

// Card + Field đã gom về @/components/Ui (dùng chung cho cả khu quản trị).

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${active ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"}`}>
      {children}
    </button>
  );
}
