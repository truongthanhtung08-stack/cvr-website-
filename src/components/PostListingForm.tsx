"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  categorySpecs, demandTypes, specForType,
  coPhongNgu, coPhongTam, coDienTichXayDung, coNoiThat, fieldsSplit, thieuMucBatBuoc, nhanDienTich, type Field,
  legalOptions, furnishLevels, amenityGroups, interiorItems, directions,
  purposeOfDemand, demandOfPurpose,
} from "@/lib/listingSpec";
import { typeGroupsFor } from "@/lib/filters";
import { provinceNamesFor, districtsOf, wardsOf, wardsOfNew, type GeoMode } from "@/lib/locations";
import { ganDiaGioi, type DiaGioiBanDo } from "@/lib/diaGioiTuBanDo";
import ImagePicker from "@/components/admin/ImagePicker";
// BẢN ĐỒ GHIM — dùng bản Leaflet/OpenStreetMap. Bản chạy nền Google
// (components/MapPicker.tsx) GIỮ LẠI để sau này Google thông thì đổi về, chỉ
// phải sửa đúng dòng import này.
import MapPicker from "@/components/MapPickerLeaflet";
import ContentEditor from "@/components/admin/ContentEditor";
import { freeNote, levelOf, quotePrice, soAnhToiDa, soVideoToiDa, tenGoiMienPhi, vnd } from "@/lib/billing";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { useBilling } from "@/lib/useBilling";
import { getTier, type TierId } from "@/lib/packages";
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
  // LOẠI HÌNH phải lấy từ ĐÚNG danh mục của cả web (filters.ts) — trước đây form
  // này dùng danh sách riêng nên khách chọn "Đất nền / Đất" trong khi bộ lọc và
  // trang /mua-ban dùng "Đất nền / Đất nền dự án": tin đăng xong KHÔNG lọc ra được.
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  // Hệ đơn vị hành chính: "moi" = tỉnh/thành sau sáp nhập (mặc định) · "cu" = trước sáp nhập
  const [geoMode, setGeoMode] = useState<GeoMode>("moi");
  const [addressDetail, setAddressDetail] = useState("");
  // GHIM VỊ TRÍ: rất nhiều bất động sản chưa có địa chỉ chính xác (đất nền, lô
  // dự án, nhà trong hẻm). Cho người đăng tự bấm đúng điểm trên bản đồ thay vì
  // để máy đoán theo tên đường. Lưu chuỗi "lat, lng" vào details.mapPin.
  const [mapPin, setMapPin] = useState("");
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
  // Thông tin ví/hồ sơ dùng để tính ưu đãi (null = chưa đăng nhập hoặc chưa tải xong)
  const [hoSoVi, setHoSoVi] = useState<{
    created_at: string | null;
    free_quota: number;
    role: string;
    total_topup: number;
  } | null>(null);
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

  // ── SỐ TIỀN THỰC PHẢI TRẢ ─────────────────────────────────────────────────
  // Giá gói → trừ khuyến mãi đang chạy → trừ ưu đãi theo cấp thành viên.
  // Riêng gói nằm trong chính sách MIỄN PHÍ (vd: thành viên mới, 1 tháng đầu,
  // không giới hạn tin) thì thành tiền = 0đ; các gói còn lại vẫn tính tiền —
  // đó là phần nâng cấp để tin hiển thị nổi bật hơn.
  const laThanhVienMoi = useMemo(() => {
    if (!hoSoVi?.created_at) return false;
    const soNgay = (Date.now() - new Date(hoSoVi.created_at).getTime()) / 86_400_000;
    return soNgay <= billing.free.days;
  }, [hoSoVi, billing.free.days]);

  const capThanhVien = useMemo(
    () => levelOf(billing, hoSoVi?.total_topup ?? 0),
    [billing, hoSoVi],
  );

  const baoGia = useMemo(
    () =>
      quotePrice({
        data: billing,
        tierId: planTier,
        days: planDays,
        today: new Date().toISOString().slice(0, 10),
        isNewMember: laThanhVienMoi,
        levelId: capThanhVien?.id, // chưa có cấp hội viên → không giảm theo cấp
      }),
    [billing, planTier, planDays, laThanhVienMoi, capThanhVien],
  );

  // Gói này có được miễn phí cho khách đang đăng nhập không?
  const duocMienPhi = useMemo(() => {
    const f = billing.free;
    if (!f.active || planTier !== f.tierId || !hoSoVi) return false;
    const hopDoiTuong =
      f.audience === "all" || (f.audience === "new" && laThanhVienMoi) || f.audience === hoSoVi.role;
    const conLuot = f.quota === 0 || hoSoVi.free_quota > 0; // quota 0 = không giới hạn
    return hopDoiTuong && laThanhVienMoi && conLuot;
  }, [billing.free, planTier, hoSoVi, laThanhVienMoi]);

  const thanhTien = duocMienPhi ? 0 : baoGia.total;

  // Giá niêm yết CHƯA gồm VAT → khách trả thêm 8%. Phải hiện rõ ngay tại đây,
  // nếu không khách thấy giá 1.050.000đ mà ví bị trừ 1.134.000đ là khiếu nại.
  const tienThue = tachThue(thanhTien);

  // Giá hiển thị cạnh tên từng gói trong ô chọn (để nhìn là biết chọn gì)
  const giaCuaGoi = (tierId: TierId): string => {
    const p = billing.plans.find((x) => x.tierId === tierId);
    const gia = (p?.terms.find((t) => t.days === planDays) ?? p?.terms[0])?.price ?? 0;
    const mienPhi =
      billing.free.active && tierId === billing.free.tierId && hoSoVi && laThanhVienMoi;
    return mienPhi ? "Miễn phí (ưu đãi thành viên mới)" : vnd(gia);
  };

  // Danh mục loại hình đổi theo mục đích: bán và cho thuê KHÔNG giống nhau
  const nhomLoaiHinh = useMemo(
    () => typeGroupsFor(purposeOfDemand(demand) === "thue" ? "thue" : "ban"),
    [demand],
  );
  // Đổi mục đích thì danh mục loại hình đổi theo (bán và thuê khác nhau). Loại
  // hình đang chọn không còn trong danh mục mới thì coi như CHƯA chọn — không để
  // lưu tin mang loại hình không tồn tại ở mục đích đó.
  const loaiHinh = nhomLoaiHinh.some((g) => g.items.includes(category)) ? category : "";

  const spec = useMemo(() => (loaiHinh ? specForType(loaiHinh) : categorySpecs[0]), [loaiHinh]);
  // ── ĐƠN VỊ GIÁ THEO MỤC ĐÍCH ─────────────────────────────────────────────
  // BÁN tính trọn giá trị bất động sản; CHO THUÊ luôn tính THEO THÁNG. Trước đây
  // dùng chung một bộ đơn vị nên tin cho thuê vẫn hiện "tỷ" — sai hoàn toàn.
  // Văn phòng / mặt bằng / kho thường báo giá theo nghìn đồng mỗi m² mỗi tháng.
  const laThue = purposeOfDemand(demand) === "thue";
  const donViGia = laThue
    ? ["triệu/tháng", "triệu/6 tháng", "triệu/năm", "Thoả thuận"]
    : ["tỷ", "triệu", "triệu/m²", "Thoả thuận"];
  // Đổi mục đích mà đơn vị cũ không còn hợp lệ → tự về đơn vị đầu của nhóm mới.
  const donVi = donViGia.includes(priceUnit) ? priceUnit : donViGia[0];

  // Bộ mục của loại hình đang chọn, tách sẵn 2 khối:
  //   · chinh    → nằm ngay trong "Thông tin chính" (bắt buộc, hiện đầu trang tin)
  //   · dacDiem  → xuống khối "Đặc điểm", để trống thì web không hiện
  // Tin CHO THUÊ có thêm 3 mục: thời gian vào ở · giá điện · giá nước.
  const { chinh: specChinh, dacDiem: specDacDiem } = useMemo(
    () => fieldsSplit(loaiHinh, purposeOfDemand(demand)),
    [loaiHinh, demand],
  );

  // SỐ THỨ TỰ BƯỚC TỰ CHẠY — ẩn một khối (vd Nội thất với đất nền) thì các bước
  // sau tự dồn lên, không bao giờ nhảy số hay trùng số như trước.
  let demBuoc = 0;
  const buoc = () => String(++demBuoc);

  // Ô nhập một mục đặc điểm — dùng chung cho cả hai khối để hai bên không lệch nhau
  const ONhapSpec = ({ f }: { f: Field }) => (
    <div className="min-w-0">
      <Label>{f.label}{f.unit ? ` (${f.unit})` : ""}{f.batBuoc ? " *" : ""}</Label>
      {f.type === "select" ? (
        <select value={specValues[f.key] ?? ""} onChange={(e) => setSpecValues((s) => ({ ...s, [f.key]: e.target.value }))} className={inputCls}>
          <option value="">Chọn</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" inputMode={f.type === "number" ? "decimal" : undefined} value={specValues[f.key] ?? ""} onChange={(e) => setSpecValues((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder ?? ""} className={inputCls} />
      )}
    </div>
  );
  // Hệ MỚI (sau sáp nhập): bỏ cấp Quận/Huyện — Tỉnh/Thành → thẳng Phường/Xã
  const provinceOptions = provinceNamesFor(geoMode);
  const districts = geoMode === "moi" ? [] : province ? districtsOf(province) : [];
  const wards =
    geoMode === "moi"
      ? province ? wardsOfNew(province) : []
      : province && district ? wardsOf(province, district) : [];


  // GHIM TRÊN BẢN ĐỒ → TỰ ĐIỀN ba ô Tỉnh/Thành · Quận/Huyện · Phường/Xã.
  // Cách khớp tên nằm ở src/lib/diaGioiTuBanDo.ts (dùng chung với form admin).
  // Nhớ lại địa giới đọc được để KHÁCH ĐỔI HỆ ĐỊA CHỈ lúc nào cũng điền lại được
  // ngay, không bắt họ ghim lại từ đầu.
  const diaGioiTuBanDoRef = useRef<DiaGioiBanDo | null>(null);

  function apDungDiaGioi(dc: DiaGioiBanDo, heDiaChi: GeoMode, tinhCu: string, quanCu: string) {
    const kq = ganDiaGioi(dc, heDiaChi, { province: tinhCu, district: quanCu });
    setProvince(kq.province);
    setDistrict(kq.district);
    setWard(kq.ward);
  }

  function nhanDiaGioiTuBanDo(dc: DiaGioiBanDo) {
    diaGioiTuBanDoRef.current = dc;
    apDungDiaGioi(dc, geoMode, province, district);
  }

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
        // Lấy thêm ngày tạo · hạn mức tin miễn phí · vai trò · tổng chi tiêu
        // để tính ĐÚNG số tiền phải trả (ưu đãi thành viên mới, khuyến mãi, cấp).
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, phone, email, created_at, free_quota, role, total_topup")
          .eq("id", user.id)
          .single();
        if (p) {
          setContactName((v) => v || p.full_name || "");
          setContactPhone((v) => v || p.phone || "");
          setContactEmail((v) => v || p.email || "");
          setHoSoVi({
            created_at: p.created_at ?? null,
            free_quota: (p as { free_quota?: number }).free_quota ?? 0,
            role: (p as { role?: string }).role ?? "buyer",
            total_topup: (p as { total_topup?: number }).total_topup ?? 0,
          });
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
      if (r.type) setCategory(r.type);
      setProvince(r.province ?? "");
      setDistrict(r.district ?? "");
      setWard(r.ward ?? "");
      setTitle(r.title ?? "");
      setDescription(r.description ?? "");
      // Giá VNĐ → ô nhập + đơn vị (ngược với priceToVnd)
      if (r.price_vnd == null) { setPriceUnit("Thoả thuận"); setPriceValue(""); }
      else if (r.purpose === "thue") { setPriceUnit("triệu/tháng"); setPriceValue(String(Math.round((r.price_vnd / 1e6) * 10) / 10)); }
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
      setMapPin(d.mapPin ?? "");
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

  // Giá → VNĐ. Tin CHO THUÊ quy về VNĐ MỖI THÁNG (trang tin tự thêm chữ "/tháng").
  function priceToVnd(): number | null {
    if (donVi === "Thoả thuận" || !priceValue.trim()) return null;
    const n = parseFloat(priceValue.replace(",", "."));
    if (Number.isNaN(n)) return null;
    const a = parseFloat(area.replace(",", "."));
    if (donVi === "tỷ") return Math.round(n * 1e9);
    if (donVi === "triệu" || donVi === "triệu/tháng") return Math.round(n * 1e6);
    if (donVi === "triệu/m²") return Number.isNaN(a) ? null : Math.round(n * a * 1e6);
    // Báo giá theo kỳ dài thì QUY VỀ MỖI THÁNG — để tin cho thuê nào cũng cùng
    // một thước đo, bộ lọc khoảng giá và sắp xếp mới chạy đúng.
    if (donVi === "triệu/6 tháng") return Math.round((n * 1e6) / 6);
    if (donVi === "triệu/năm") return Math.round((n * 1e6) / 12);
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
      if (!area.trim()) return setError("Chưa nhập diện tích.");
      // THÔNG TIN CHÍNH THEO LOẠI HÌNH — thiếu mục nào báo đúng tên mục đó,
      // không báo chung chung để người đăng khỏi phải dò cả trang.
      if (!loaiHinh) return setError("Chưa chọn loại hình bất động sản.");
      const thieu = thieuMucBatBuoc(loaiHinh, purposeOfDemand(demand), specValues);
      if (thieu.length) return setError(`Chưa nhập: ${thieu.join(" · ")}.`);
    }
    // LƯU NHÁP thì không chặn gì thêm — người đăng ghi tới đâu lưu tới đó.

    setSaving(asDraft ? "draft" : "publish");
    // Dữ liệu chung cho cả THÊM MỚI và CẬP NHẬT
    const values = {
      // Nhu cầu: Cần bán · Cho thuê · Cần mua · Cần thuê
      purpose: purposeOfDemand(demand),
      type: loaiHinh,
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
        mapPin: mapPin.trim() || undefined,
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
      <Card step={buoc()} title="Loại tin đăng">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <Pick label="Nhu cầu" value={demand} onChange={setDemand} options={demandTypes} />
          {/* Loại hình theo NHÓM cho dễ tìm — cùng danh mục với bộ lọc của web */}
          <div>
            <Label>Loại hình bất động sản *</Label>
            <select
              value={loaiHinh}
              onChange={(e) => { setCategory(e.target.value); setSpecValues({}); }}
              className={inputCls}
            >
              <option value="">Chọn loại hình</option>
              {nhomLoaiHinh.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((o) => <option key={o} value={o}>{o}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 2. Địa chỉ */}
      <Card step={buoc()} title="Địa chỉ bất động sản">
        {/* Chọn hệ đơn vị hành chính: MỚI (sau sáp nhập) hay CŨ */}
        <div className="mb-3 inline-flex rounded-lg border border-cvr-line bg-white p-1">
          {([
            { id: "moi" as GeoMode, label: "Tỉnh/Thành mới (sau sáp nhập)" },
            { id: "cu" as GeoMode, label: "Địa chỉ cũ" },
          ]).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setGeoMode(m.id);
                setProvince("");
                setDistrict("");
                setWard("");
                // Đã ghim trên bản đồ rồi thì đổi hệ xong ĐIỀN LẠI NGAY theo hệ mới
                // chọn — khách không phải ghim lại lần nữa.
                const dc = diaGioiTuBanDoRef.current;
                if (dc) setTimeout(() => apDungDiaGioi(dc, m.id, "", ""), 0);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                geoMode === m.id ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {/* Trên ĐIỆN THOẠI xếp 2 cột: ba ô khu vực gói trong 1–2 dòng, để ô địa chỉ
            và bản đồ ngay bên dưới vẫn nằm chung một màn hình, khỏi kéo lên kéo xuống
            đối chiếu. */}
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${geoMode === "moi" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          <Pick label="Tỉnh / Thành" value={province} onChange={(v) => { setProvince(v); setDistrict(""); setWard(""); }} options={provinceOptions} placeholder="Chọn Tỉnh / Thành" />
          {geoMode === "cu" && (
            <Pick label="Quận / Huyện" value={district} onChange={(v) => { setDistrict(v); setWard(""); }} options={districts} placeholder="Chọn Quận / Huyện" disabled={!province} />
          )}
          <Pick label="Phường / Xã" value={ward} onChange={setWard} options={wards} placeholder="Chọn Phường / Xã" disabled={geoMode === "moi" ? !province : !district} />
        </div>
        {/* THANH ĐỊA CHỈ LÀ Ô RIÊNG, NẰM NGOÀI BẢN ĐỒ — chủ dự án chốt.
            Gõ tới đâu bản đồ bên dưới tự thu lại và trôi tới đó; ghim trên bản đồ
            thì ô này tự điền ngược lại. ĐỪNG nhét ô này vào trong khung bản đồ. */}
        <Text
          label="Địa chỉ cụ thể (số nhà, tên đường)"
          value={addressDetail}
          onChange={setAddressDetail}
          placeholder="VD: 123 Võ Nguyên Giáp / Dự án ..."
        />
        <div className="mt-3">
          <MapPicker
            value={mapPin}
            onChange={setMapPin}
            onDiaChi={setAddressDetail}
            onDiaGioi={nhanDiaGioiTuBanDo}
            hint={`${addressDetail}, ${ward}, ${district}, ${province}`}
          />
        </div>
      </Card>

      {/* 3. Thông tin chính */}
      <Card step={buoc()} title="Thông tin chính">
        <Text label="Tiêu đề tin đăng *" value={title} onChange={setTitle} placeholder="VD: Bán căn hộ 2PN view sông Hàn, full nội thất" required />
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>{laThue ? "Giá thuê *" : "Giá bán *"}</Label>
            {/* ĐIỆN THOẠI: ô nhập giá chiếm TRỌN một hàng, ô đơn vị xuống hàng dưới.
                Trước đây hai ô nằm cùng hàng mà ô đơn vị lại mang cả w-full lẫn
                w-32 (hai lớp chiều rộng đá nhau) nên nó chiếm gần hết, ô nhập giá
                teo lại chỉ còn một mẩu, không gõ nổi. Từ màn hình sm trở lên mới
                xếp cạnh nhau, cột đơn vị cố định 9rem. */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_9rem]">
              {/* KHÔNG dùng type="number": trình duyệt loại bỏ dấu PHẨY nên khách gõ
                  "4,2" (đúng như gợi ý trong ô) thì ô thành rỗng, không lưu được giá.
                  Dùng text + inputMode="decimal" → điện thoại vẫn hiện bàn phím số,
                  mà gõ được cả dấu phẩy lẫn dấu chấm. */}
              <input type="text" inputMode="decimal" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} disabled={donVi === "Thoả thuận"} placeholder={laThue ? "VD: 12 hoặc 8,5" : "VD: 4,2"} className={inputCls + " disabled:opacity-50"} />
              <select value={donVi} onChange={(e) => setPriceUnit(e.target.value)} className={inputCls}>
                {donViGia.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {laThue && (donVi === "triệu/6 tháng" || donVi === "triệu/năm") && priceValue.trim() && (
              <p className="mt-1.5 text-xs text-cvr-muted">
                Tin sẽ hiển thị <strong>{(priceToVnd() ?? 0) / 1e6 >= 1
                  ? `${Math.round(((priceToVnd() ?? 0) / 1e6) * 10) / 10} triệu/tháng`
                  : "—"}</strong> để khách so sánh với các tin thuê khác.
              </p>
            )}
          </div>
          <div>
            <Label>{nhanDienTich(loaiHinh)} *</Label>
            <input type="text" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="VD: 100" className={inputCls} />
          </div>
        </div>
        {/* CHỈ HIỆN MỤC THUỘC LOẠI HÌNH ĐANG CHỌN — đất nền không có phòng ngủ,
            phòng tắm hay diện tích xây dựng; kho xưởng/mặt bằng không có phòng ngủ.
            Số cột co theo số mục còn lại nên không bao giờ chừa ô trống lửng lơ. */}
        {(() => {
          const oChinh = [
            coDienTichXayDung(loaiHinh) && (
              <div key="dtxd">
                <Label>Diện tích xây dựng (m²)</Label>
                <input type="text" inputMode="decimal" value={builtArea} onChange={(e) => setBuiltArea(e.target.value)} placeholder="VD: 95" className={inputCls} />
              </div>
            ),
            coPhongNgu(loaiHinh) && (
              <div key="pn">
                <Label>Số phòng ngủ</Label>
                <input type="text" inputMode="numeric" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="VD: 3" className={inputCls} />
              </div>
            ),
            coPhongTam(loaiHinh) && (
              <div key="pt">
                <Label>Số phòng tắm</Label>
                <input type="text" inputMode="numeric" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="VD: 2" className={inputCls} />
              </div>
            ),
          ].filter(Boolean);
          if (!oChinh.length) return null;
          const cot = oChinh.length === 1 ? "" : oChinh.length === 2 ? " sm:grid-cols-2" : " sm:grid-cols-3";
          return <div className={`grid min-w-0 grid-cols-1 gap-4${cot}`}>{oChinh}</div>;
        })()}

        {/* THÔNG TIN CHÍNH RIÊNG CỦA LOẠI HÌNH — đất thì chiều ngang · chiều dài ·
            đường vào · loại đất; căn hộ thì tầng số; nhà thì số tầng · mặt tiền…
            Lưới 2/3 cột tự co theo số mục nên không chừa ô trống, không xén chữ. */}
        {specChinh.length > 0 && (
          <div className={`mt-4 grid min-w-0 grid-cols-1 gap-4 ${specChinh.length === 2 ? "sm:grid-cols-2" : specChinh.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
            {specChinh.map((f) => <ONhapSpec key={f.key} f={f} />)}
          </div>
        )}
      </Card>

      {/* 4. Đặc điểm theo loại hình (động) */}
      <Card step={buoc()} title={`Đặc điểm — ${spec.label}`}>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specDacDiem.map((f) => <ONhapSpec key={f.key} f={f} />)}
          {/* Trường DÙNG CHUNG mọi loại hình: Hướng · Nội thất · Pháp lý */}
          <div>
            <Label>Hướng nhà / đất</Label>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {directions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {coNoiThat(loaiHinh) && (
            <div>
              <Label>Tình trạng nội thất</Label>
              <select value={furnish} onChange={(e) => setFurnish(e.target.value)} className={inputCls}>
                <option value="">Chọn</option>
                {furnishLevels.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}
          <div>
            <Label>Tình trạng pháp lý</Label>
            <select value={legal} onChange={(e) => setLegal(e.target.value)} className={inputCls}>
              <option value="">Chọn</option>
              {legalOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Nội thất — ĐẤT và KHO XƯỞNG không có nội thất nên ẩn hẳn cả khối */}
      {coNoiThat(loaiHinh) && (
        <Card step={buoc()} title="Nội thất (tick mục có sẵn)">
          <div className="flex flex-wrap gap-2">
            {interiorItems.map((it) => (
              <Chip key={it} active={interior.includes(it)} onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Tiện ích */}
      <Card step={buoc()} title="Tiện ích (tick mục có sẵn)">
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
      <Card step={buoc()} title="Mô tả chi tiết">
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
      <Card step={buoc()} title="Hình ảnh">
        <ImagePicker
          value={images}
          onChange={setImages}
          maxImages={soAnhToiDa(billing, planTier)}
          maxVideos={soVideoToiDa(billing, planTier)}
          tierName={getTier(planTier).name}
        />
      </Card>

      {/* 9. Liên hệ */}
      {/* Chọn gói hiển thị — giá và khuyến mãi do quản trị đặt ở /admin/gia-khuyen-mai */}
      <Card step={buoc()} title="Chọn gói tin — thanh toán">
        <p className="-mt-1 mb-3 text-sm text-cvr-muted">
          Tin ở gói cao hiển thị nổi bật hơn — <span className="font-semibold text-cvr-ink">Diamond</span> có lượt xem trung bình cao gấp 20 lần tin thường.
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Loại tin</Label>
            <select value={planTier} onChange={(e) => setPlanTier(e.target.value as TierId)} className={inputCls}>
              {billing.plans.map((p) => (
                <option key={p.tierId} value={p.tierId}>
                  {getTier(p.tierId).name} — {giaCuaGoi(p.tierId)}
                </option>
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
        {/* BẢNG TÍNH TIỀN — nói rõ từng khoản để khách không bao giờ thấy giá "trên trời" */}
        <div className="mt-4 rounded-xl bg-cvr-surface px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-sm text-cvr-body">
            <span>Giá gói {getTier(planTier).name} · {planDays} ngày</span>
            <span className={thanhTien < baoGia.base ? "text-cvr-muted line-through" : "font-semibold text-cvr-ink"}>
              {vnd(baoGia.base)}
            </span>
          </div>

          {duocMienPhi ? (
            <div className="mt-1.5 flex items-center justify-between gap-2 text-sm text-cvr-blue-ink">
              <span>Ưu đãi thành viên mới</span>
              <span className="font-semibold">− {vnd(baoGia.base)}</span>
            </div>
          ) : (
            <>
              {baoGia.promo && baoGia.promoOff > 0 && (
                <div className="mt-1.5 flex items-center justify-between gap-2 text-sm text-cvr-blue-ink">
                  <span>Khuyến mãi: {baoGia.promo.name} (−{baoGia.promo.percent}%)</span>
                  <span className="font-semibold">− {vnd(baoGia.promoOff)}</span>
                </div>
              )}
              {baoGia.levelOff > 0 && capThanhVien && (
                <div className="mt-1.5 flex items-center justify-between gap-2 text-sm text-cvr-blue-ink">
                  <span>Ưu đãi hội viên {capThanhVien.name} (−{capThanhVien.discount}%)</span>
                  <span className="font-semibold">− {vnd(baoGia.levelOff)}</span>
                </div>
              )}
            </>
          )}

          {thanhTien > 0 && (
            <>
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-cvr-line pt-2.5 text-sm text-cvr-body">
                <span>Cộng tiền dịch vụ</span>
                <span className="font-semibold text-cvr-ink">{vnd(tienThue.tienHang)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-sm text-cvr-body">
                <span>Thuế GTGT {(THUE_SUAT_GTGT * 100).toFixed(0)}%</span>
                <span className="font-semibold text-cvr-ink">{vnd(tienThue.tienThue)}</span>
              </div>
            </>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-cvr-line pt-2.5">
            <span className="text-sm font-semibold uppercase tracking-wide text-cvr-body">Thành tiền</span>
            <span className="text-lg font-bold text-cvr-blue-ink">
              {thanhTien === 0 ? "0 ₫ — Miễn phí" : vnd(tienThue.tongTra)}
            </span>
          </div>

          {thanhTien > 0 && (
            <p className="mt-2 text-xs text-cvr-muted">
              Trừ vào ví khi tin được duyệt và lên sóng. Tin bị từ chối thì không trừ đồng nào.
            </p>
          )}
        </div>

        {billing.free.active && (
          <p className="mt-3 rounded-lg border border-cvr-blue/25 bg-cvr-blue/[0.06] px-3 py-2 text-xs text-cvr-blue-ink">
            {freeNote(billing.free, tenGoiMienPhi(billing))}
            {!hoSoVi && " Đăng nhập để hệ thống áp ưu đãi cho bạn."}
            {hoSoVi && !duocMienPhi && planTier !== billing.free.tierId &&
              ` Gói ${tenGoiMienPhi(billing)} đang miễn phí cho bạn — các gói khác là bản nâng cấp hiển thị nổi bật hơn, có tính phí.`}
          </p>
        )}
      </Card>

      <Card step={buoc()} title="Thông tin liên hệ">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <div><Label>Họ và tên *</Label><input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} /></div>
          <div><Label>Số điện thoại *</Label><input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} /></div>
          <div><Label>Email</Label><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" className={inputCls} /></div>
        </div>
      </Card>

      {/* 10. Thuộc dự án (không bắt buộc) */}
      <Card step={buoc()} title="Thuộc dự án">
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
