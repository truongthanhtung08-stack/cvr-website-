"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  categorySpecs, propertyCategories, demandTypes,
  legalOptions, furnishLevels, amenityGroups, interiorItems, directions,
  purposeOfDemand, demandOfPurpose,
} from "@/lib/listingSpec";
import { provinceNamesFor, districtsOf, wardsOf, wardsOfNew, type GeoMode } from "@/lib/locations";
import ImagePicker from "@/components/admin/ImagePicker";
import ContentEditor from "@/components/admin/ContentEditor";
import { freeNote, tenGoiMienPhi, vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import type { TierId } from "@/lib/packages";
import type { ListingRow } from "@/lib/listingAdmin";

// Form đăng tin cho KHÁCH HÀNG (/dang-tin) — nối Supabase thật.
// Cùng cấu trúc với form admin: Lưu nháp (làm dở) / Đăng tin (gửi duyệt).
// Khách đăng → status 'pending' (chờ admin duyệt). Nháp → 'draft'.
// CHỈNH SỬA tin cũ: mở /dang-tin?id=<id tin> — form tự nạp tin (RLS chỉ cho chủ tin),
// lưu = update. Tin đã duyệt sửa xong sẽ quay về "Chờ duyệt".
export default function PostListingForm() {
  const router = useRouter();
  const editId = useSearchParams().get("id");

  // Ai đang đăng nhập (cần để gắn owner_id + prefill liên hệ)
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [done, setDone] = useState<"" | "draft" | "pending">("");
  // Chế độ SỬA: nạp tin cũ ("loading") · nạp xong ("ok") · không thấy/không có quyền ("notfound")
  const [editLoad, setEditLoad] = useState<"" | "loading" | "ok" | "notfound">(editId ? "loading" : "");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editOwner, setEditOwner] = useState<string | null>(null);
  const [demand, setDemand] = useState(demandTypes[0]);
  const [category, setCategory] = useState(propertyCategories[0]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  // Hệ đơn vị hành chính: "moi" = tỉnh/thành sau sáp nhập (mặc định) · "cu" = trước sáp nhập
  const [geoMode, setGeoMode] = useState<GeoMode>("moi");
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
  // Tin thuộc dự án nào (không bắt buộc) — hiện trong mục tin liên quan của dự án đó
  // Gói đăng tin khách chọn (giá do quản trị đặt ở /admin/gia-khuyen-mai)
  // Bảng giá HIỆN HÀNH (bản admin đã lưu ở /admin/gia-khuyen-mai), không phải giá cứng trong code
  const { billing, loading: billingLoading } = useBilling();
  const [planTier, setPlanTier] = useState<TierId>("basic");
  const [planDays, setPlanDays] = useState<number>(billing.plans[0]?.terms[0]?.days ?? 7);
  const [planStart, setPlanStart] = useState<string>("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectOptions, setProjectOptions] = useState<{ slug: string; name: string }[]>([]);

  // Đang lưu nút nào — để 2 nút hiện trạng thái riêng, không lẫn nhau
  const [saving, setSaving] = useState<"" | "draft" | "publish">("");
  const [error, setError] = useState("");

  // Ngay bat dau mac dinh = hom nay; ngay ket thuc tu tinh theo so ngay cua goi
  useEffect(() => { if (!planStart) setPlanStart(new Date().toISOString().slice(0, 10)); }, [planStart]);
  const planEnd = useMemo(() => {
    if (!planStart) return "";
    const d = new Date(planStart);
    d.setDate(d.getDate() + planDays);
    return d.toISOString().slice(0, 10);
  }, [planStart, planDays]);
  // Tải xong bảng giá admin → đưa thời hạn về mốc đầu tiên của bảng giá hiện hành
  useEffect(() => {
    if (!billingLoading) {
      const terms = billing.plans.find((p) => p.tierId === planTier)?.terms ?? [];
      if (terms.length && !terms.some((t) => t.days === planDays)) setPlanDays(terms[0].days);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingLoading, planTier, billing.plans]);

  const planPrice = useMemo(() => {
    const p = billing.plans.find((x) => x.tierId === planTier);
    return (p?.terms.find((t) => t.days === planDays) ?? p?.terms[0])?.price ?? 0;
  }, [billing.plans, planTier, planDays]);

  const spec = useMemo(() => categorySpecs.find((c) => c.label === category) ?? categorySpecs[0], [category]);
  // Hệ MỚI (sau sáp nhập): bỏ cấp Quận/Huyện — Tỉnh/Thành → thẳng Phường/Xã
  const provinceOptions = provinceNamesFor(geoMode);
  const districts = geoMode === "moi" ? [] : province ? districtsOf(province) : [];
  const wards =
    geoMode === "moi"
      ? province ? wardsOfNew(province) : []
      : province && district ? wardsOf(province, district) : [];

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

  // CHẾ ĐỘ SỬA: nạp tin cũ vào form (RLS đảm bảo chỉ chủ tin/admin đọc được tin chưa duyệt)
  useEffect(() => {
    if (!editId) return;
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", editId).single();
      if (error || !data) { setEditLoad("notfound"); return; }
      const r = data as ListingRow;
      setDemand(demandOfPurpose(r.purpose));
      if (propertyCategories.includes(r.type)) setCategory(r.type);
      setProvince(r.province ?? "");
      setDistrict(r.district ?? "");
      setWard(r.ward ?? "");
      setTitle(r.title ?? "");
      setDescription(r.description ?? "");
      // Giá VNĐ → ô nhập + đơn vị (ngược với priceToVnd)
      if (r.price_vnd == null) { setPriceUnit("Thoả thuận"); setPriceValue(""); }
      else if (r.price_vnd >= 1e9) { setPriceUnit("tỷ"); setPriceValue(String(Math.round((r.price_vnd / 1e9) * 100) / 100)); }
      else { setPriceUnit("triệu"); setPriceValue(String(Math.round(r.price_vnd / 1e6))); }
      setArea(r.area_m2 != null ? String(r.area_m2) : "");
      setBuiltArea(r.built_area_m2 != null ? String(r.built_area_m2) : "");
      setBeds(r.beds != null ? String(r.beds) : "");
      setBaths(r.baths != null ? String(r.baths) : "");
      setImages(r.images ?? []);
      const d = r.details ?? {};
      setSpecValues(d.specs ?? {});
      setInterior(d.interior ?? []);
      setAmenities(d.amenities ?? []);
      setLegal(d.legal ?? "");
      setFurnish(d.furnish ?? "");
      setDirection(d.direction ?? "");
      setAddressDetail(d.addressDetail ?? "");
      setProjectSlug(d.project ?? "");
      if (d.contact) {
        setContactName(d.contact.name ?? "");
        setContactPhone(d.contact.phone ?? "");
        setContactEmail(d.contact.email ?? "");
      }
      setEditStatus(r.status);
      setEditOwner(r.owner_id);
      setEditLoad("ok");
    })();
  }, [editId]);

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

    setSaving(asDraft ? "draft" : "publish");
    // Dữ liệu chung cho cả THÊM MỚI và CẬP NHẬT
    const values = {
      // Nhu cầu: Cần bán · Cho thuê · Cần mua · Cần thuê
      purpose: purposeOfDemand(demand),
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
        plan: { tier: planTier, days: planDays },
        project: projectSlug || undefined,
        contact: (contactName.trim() || contactPhone.trim() || contactEmail.trim())
          ? { name: contactName.trim(), phone: contactPhone.trim(), email: contactEmail.trim() }
          : undefined,
      },
      status: asDraft ? ("draft" as const) : ("pending" as const), // khách đăng → chờ admin duyệt
    };

    const supabase = createClient();
    let err: { message: string } | null = null;

    if (!editId) {
      // TIN MỚI
      ({ error: err } = await supabase
        .from("listings")
        .insert({ ...values, owner_id: userId, tier: "basic", published_at: null }));
    } else if (editStatus === "draft" && !asDraft) {
      // ĐĂNG TIN NHÁP: tạo tin mới "chờ duyệt" + xoá nháp cũ.
      // (2 thao tác này chủ tin luôn có quyền — không phụ thuộc quyền đổi status trong DB)
      ({ error: err } = await supabase
        .from("listings")
        .insert({ ...values, owner_id: editOwner ?? userId, tier: "basic", published_at: null }));
      if (!err) await supabase.from("listings").delete().eq("id", editId);
    } else {
      // SỬA tin (nháp→nháp, chờ duyệt, đã duyệt…)
      ({ error: err } = await supabase.from("listings").update(values).eq("id", editId));
      if (err && /đặc quyền|dac quyen|privileged/i.test(err.message)) {
        // DB chưa cho chủ tin đổi trạng thái (chưa chạy migration 0007)
        // → vẫn lưu TOÀN BỘ nội dung, giữ nguyên trạng thái cũ.
        const { status: _ignored, ...noStatus } = values;
        ({ error: err } = await supabase.from("listings").update(noStatus).eq("id", editId));
      }
    }

    setSaving("");
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
          {done === "draft" ? "Đã lưu nháp!" : editId ? "Đã cập nhật — tin chờ duyệt lại!" : "Tin đăng đã được gửi!"}
        </h3>
        <p className="mt-2 text-sm text-cvr-muted">
          {done === "draft"
            ? "Tin nháp được lưu trong tài khoản. Bạn có thể vào làm tiếp bất cứ lúc nào."
            : "Tin của bạn đang chờ Coastal Land kiểm duyệt và sẽ hiển thị sau ít phút."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/tai-khoan/tin-dang" className="rounded-full bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">Tin đăng của tôi</Link>
          {!editId && (
            <button type="button" onClick={() => { setDone(""); setTitle(""); setImages([]); }} className="rounded-full border border-cvr-line px-5 py-2 text-sm font-medium text-cvr-body hover:border-cvr-ink hover:text-cvr-ink">Đăng tin khác</button>
          )}
        </div>
      </div>
    );
  }

  // Chế độ sửa: đang nạp tin / không tìm thấy (sai id hoặc tin không thuộc tài khoản này)
  if (editLoad === "loading") {
    return <p className="py-16 text-center text-sm text-cvr-muted">Đang tải tin để chỉnh sửa…</p>;
  }
  if (editLoad === "notfound") {
    return (
      <div className="rounded-none border border-cvr-line bg-white p-10 text-center shadow-lux">
        <h3 className="text-xl font-semibold tracking-tight text-cvr-ink">Không tìm thấy tin</h3>
        <p className="mt-2 text-sm text-cvr-muted">Tin không tồn tại hoặc không thuộc tài khoản của bạn.</p>
        <Link href="/tai-khoan/tin-dang" className="mt-5 inline-block rounded-full bg-cvr-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">Về Tin đăng của tôi</Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-6">
      {/* Băng rôn chế độ SỬA — nói rõ đang sửa tin nào, trạng thái gì */}
      {editId && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-none border border-cvr-blue/30 bg-cvr-blue/[0.06] px-4 py-3">
          <p className="text-sm font-medium text-cvr-blue-ink">
            Đang chỉnh sửa tin{editStatus === "draft" ? " nháp" : editStatus === "approved" ? " (đã duyệt — lưu xong sẽ duyệt lại)" : ""}
          </p>
          <Link href="/tai-khoan/tin-dang" className="text-sm font-medium text-cvr-muted transition hover:text-cvr-ink">← Về danh sách tin</Link>
        </div>
      )}

      {/* 1. Loại tin & loại hình */}
      <Card step="1" title="Loại tin đăng">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <Pick label="Nhu cầu" value={demand} onChange={setDemand} options={demandTypes} />
          <Pick label="Loại hình bất động sản" value={category} onChange={(v) => { setCategory(v); setSpecValues({}); }} options={propertyCategories} />
        </div>
      </Card>

      {/* 2. Địa chỉ */}
      <Card step="2" title="Địa chỉ bất động sản">
        {/* Chọn hệ đơn vị hành chính: MỚI (sau sáp nhập) hay CŨ */}
        <div className="mb-3 inline-flex rounded-lg border border-cvr-line bg-white p-1">
          {([
            { id: "moi" as GeoMode, label: "Tỉnh/Thành mới (sau sáp nhập)" },
            { id: "cu" as GeoMode, label: "Địa chỉ cũ" },
          ]).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setGeoMode(m.id); setProvince(""); setDistrict(""); setWard(""); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                geoMode === m.id ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className={`grid grid-cols-1 gap-4 ${geoMode === "moi" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          <Pick label="Tỉnh / Thành" value={province} onChange={(v) => { setProvince(v); setDistrict(""); setWard(""); }} options={provinceOptions} placeholder="Chọn Tỉnh / Thành" />
          {geoMode === "cu" && (
            <Pick label="Quận / Huyện" value={district} onChange={(v) => { setDistrict(v); setWard(""); }} options={districts} placeholder="Chọn Quận / Huyện" disabled={!province} />
          )}
          <Pick label="Phường / Xã" value={ward} onChange={setWard} options={wards} placeholder="Chọn Phường / Xã" disabled={geoMode === "moi" ? !province : !district} />
        </div>
        <Text label="Địa chỉ cụ thể (số nhà, đường, dự án)" value={addressDetail} onChange={setAddressDetail} placeholder="VD: 123 Võ Nguyên Giáp / Dự án ..." />
      </Card>

      {/* 3. Thông tin chính */}
      <Card step="3" title="Thông tin chính">
        <Text label="Tiêu đề tin đăng *" value={title} onChange={setTitle} placeholder="VD: Bán căn hộ 2PN view sông Hàn, full nội thất" required />
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
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
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
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
        {/* Cùng bộ công cụ với trang quản trị: in đậm · in nghiêng · canh
            trái/giữa/phải/đều · chèn ảnh, video giữa bài. */}
        <ContentEditor
          value={description}
          onChange={setDescription}
          rows={5}
          placeholder="Mô tả vị trí, kết cấu, tiện ích, pháp lý, lý do bán… (nội dung càng đầy đủ càng dễ chốt)"
        />
      </Card>

      {/* 8. Hình ảnh — tải từ máy / dán link, ảnh đầu là ảnh đại diện */}
      <Card step="8" title="Hình ảnh">
        <ImagePicker value={images} onChange={setImages} />
      </Card>

      {/* 9. Liên hệ */}
      {/* Chọn gói hiển thị — giá và khuyến mãi do quản trị đặt ở /admin/gia-khuyen-mai */}
      <Card step="9" title="Chọn gói tin — thanh toán">
        <p className="-mt-1 mb-3 text-sm text-cvr-muted">
          Tin ở gói cao hiển thị nổi bật hơn — <span className="font-semibold text-cvr-ink">Diamond</span> có lượt xem trung bình cao gấp 20 lần tin thường.
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Loại tin</Label>
            <select value={planTier} onChange={(e) => setPlanTier(e.target.value as TierId)} className={inputCls}>
              {billing.plans.map((p) => (
                <option key={p.tierId} value={p.tierId}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Thời gian</Label>
            <select value={planDays} onChange={(e) => setPlanDays(Number(e.target.value))} className={inputCls}>
              {(billing.plans.find((p) => p.tierId === planTier)?.terms ?? []).map((t) => (
                <option key={t.days} value={t.days}>{t.days} ngày</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Ngày bắt đầu</Label>
            <input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} className={inputCls} />
          </div>
          <div>
            <Label>Ngày kết thúc</Label>
            <input type="date" value={planEnd} readOnly className={`${inputCls} bg-cvr-surface text-cvr-muted`} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cvr-surface px-4 py-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-cvr-body">Giá trị tin đăng</span>
          <span className="text-lg font-bold text-cvr-blue-ink">{vnd(planPrice)}</span>
        </div>
        {billing.free.active && (
          <p className="mt-3 rounded-lg border border-cvr-blue/25 bg-cvr-blue/[0.06] px-3 py-2 text-xs text-cvr-blue-ink">
            {freeNote(billing.free, tenGoiMienPhi(billing))}
          </p>
        )}
      </Card>

      <Card step="10" title="Thông tin liên hệ">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <div><Label>Họ và tên *</Label><input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} /></div>
          <div><Label>Số điện thoại *</Label><input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} /></div>
          <div><Label>Email</Label><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" className={inputCls} /></div>
        </div>
      </Card>

      {/* 10. Thuộc dự án (không bắt buộc) */}
      <Card step="10" title="Thuộc dự án">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Dự án</Label>
            <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)} className={inputCls}>
              <option value="">— Không thuộc dự án nào —</option>
              {projectOptions.map((o) => (
                <option key={o.slug} value={o.slug}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Chọn dự án → tin của bạn hiện thêm ở trang dự án đó, tiếp cận đúng khách đang quan tâm dự án.
        </p>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}

      {/* 2 nút TÁCH BIỆT RÕ (pill Apple): ĐĂNG TIN = đen đặc nổi bật (gửi duyệt) ·
          LƯU NHÁP = xám nhạt kín đáo (cất tạm, làm tiếp sau) */}
      <div className="flex flex-col gap-3 border-t border-cvr-line pt-5 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={!!saving}
          className="btn-dangtin flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full px-8 text-base font-bold text-white disabled:opacity-50 "
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
          </svg>
          {saving === "publish" ? "Đang gửi duyệt…" : editId ? "Cập nhật & gửi duyệt" : "Đăng tin ngay"}
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={!!saving}
          className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-cvr-surface px-7 text-base font-semibold text-cvr-body ring-1 ring-inset ring-cvr-line transition hover:bg-cvr-line/40 hover:text-cvr-ink active:scale-[0.98] disabled:opacity-50 "
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          </svg>
          {saving === "draft" ? "Đang lưu nháp…" : "Lưu nháp"}
        </button>
      </div>
      <p className="text-center text-xs text-cvr-muted">
        <strong className="text-cvr-ink">Đăng tin</strong>: gửi Coastal Land kiểm duyệt, duyệt xong tin hiển thị công khai. ·{" "}
        <strong className="text-cvr-ink">Lưu nháp</strong>: cất tạm trong tài khoản, chưa ai thấy, vào làm tiếp bất cứ lúc nào.
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
