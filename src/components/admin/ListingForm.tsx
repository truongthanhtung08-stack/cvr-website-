"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { useEffect, useRef, useState } from "react";
import ChonHoacGhi from "@/components/ChonHoacGhi";
import ThemTuGhi from "@/components/ThemTuGhi";
import OGoTuGian from "@/components/OGoTuGian";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { lamMoiWeb } from "@/lib/lamMoiWeb";
import { saleTypeGroups, rentTypeGroups } from "@/lib/filters";
import { provinceNamesFor, districtsOf, wardsOf, wardsOfNew, wardsOfAny, chuanTen, type GeoMode } from "@/lib/locations";
import { haiDongDiaChi, doiHeGiuNguyen, chuoiTimBanDo, diemTimBanDo, ungVienPhuongCu, type NhoHaiHe } from "@/lib/diaChiHaiHe";
import { ganDiaGioi, phuongCuTheoGhim, type DiaGioiBanDo } from "@/lib/diaGioiTuBanDo";
import { fieldsFor, interiorItems, amenityGroups, coNoiThat, tienIchCho, phapLyCho, legalOptions, furnishLevels, directions, coPhongNgu, coPhongTam, coDienTichXayDung, nhanDienTich, coDonGiaM2 } from "@/lib/listingSpec";
import { chuanHoaSdt } from "@/lib/phone";
import ImagePicker from "@/components/admin/ImagePicker";
import OTieuDe from "@/components/OTieuDe";
// BẢN ĐỒ GHIM — dùng bản Leaflet/OpenStreetMap. Bản chạy nền Google
// (components/MapPicker.tsx) GIỮ LẠI để sau này Google thông thì đổi về, chỉ
// phải sửa đúng dòng import này.
import MapPicker from "@/components/MapPickerMo";
import ODiaChiGoiY from "@/components/ODiaChiGoiY";
import { ganNhanPhimEnter, enterSangOTiep } from "@/lib/oTiepTheo";
import ChonCoTim from "@/components/ChonCoTim";
import { bietDanhTinh, bietDanhPhuongMoi } from "@/lib/timDiaDanh";
import ContentEditor from "@/components/admin/ContentEditor";
import { uploadImageFile } from "@/lib/uploadImage";
import { soAnhToiDa, soVideoToiDa, bangTheoMucDich, huongKhuyenMai } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { getTier } from "@/lib/packages";
import { isVideoUrl } from "@/lib/media";
import { Panel, Field } from "@/components/Ui";
import {
  type ListingRow,
  type ListingPurpose,
  type ListingTier,
  type ListingStatus,
} from "@/lib/listingAdmin";
import { homNayVn } from "@/lib/gioVn";

// Form Thêm/Sửa tin đăng (admin). Giá nhập theo đơn vị tự nhiên:
//   Mua bán → TỶ đồng (7.2 = 7,2 tỷ) · Cho thuê → TRIỆU/tháng (18 = 18 triệu/tháng)
// Ảnh: mỗi dòng 1 đường dẫn (vd /images/tin/1.jpg) — upload Storage làm ở bước sau.
export default function ListingForm({ initial }: { initial?: ListingRow }) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
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
  // THỜI HẠN GÓI — admin cũng chọn đúng gói trong Giá & quy định, không ngoại lệ (01/10/2026).
  // Đổi hạng / thời hạn của tin đang hiển thị = bắt đầu kỳ mới, CSDL tự tính hạn (0053).
  const [soNgayGoi, setSoNgayGoi] = useState<number>(initial?.tier_days ?? 0);

  // Thuộc tính chi tiết (lưu vào cột details JSONB) — nhập gì web hiện nấy
  const [addressDetail, setAddressDetail] = useState(initial?.details?.addressDetail ?? "");
  // Toạ độ gợi ý địa chỉ vừa chọn — bản đồ tới đó và ghim (chọn gợi ý = chọn vị trí, 22/10/2026)
  const [diemGoiY, setDiemGoiY] = useState<{ lat: number; lng: number; n: number } | null>(null);
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

  // ĐỔI LOẠI HÌNH / MỤC ĐÍCH → MỌI MỤC ĐI THEO — cùng luật form đăng tin của khách (chủ dự án 22/10/2026).
  const khoaLoai = `${type}|${purpose}`;
  const khoaLoaiTruoc = useRef(khoaLoai);
  /* eslint-disable react-hooks/set-state-in-effect -- lọc lại dữ liệu khi admin đổi loại hình */
  useEffect(() => {
    if (khoaLoaiTruoc.current === khoaLoai) return;
    khoaLoaiTruoc.current = khoaLoai;
    if (!type) return;
    const coO = new Set(fieldsFor(type, purpose).map((f) => f.key));
    setSpecValues((v) => Object.fromEntries(Object.entries(v).filter(([k]) => coO.has(k))));
    if (!coNoiThat(type)) { setInterior([]); setFurnish(""); }
    const tienIchDuoc = new Set(tienIchCho(type).flatMap((g) => g.items));
    const tienIchChuan = new Set(amenityGroups.flatMap((g) => g.items));
    setAmenities((ds) => ds.filter((x) => tienIchDuoc.has(x) || !tienIchChuan.has(x)));
    setLegal((l: string) => (l && legalOptions.includes(l) && !phapLyCho(type).includes(l) ? "" : l));
  }, [khoaLoai, type, purpose]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Danh sách quận/huyện & phường/xã liên động theo lựa chọn cấp trên
  // Hệ đơn vị hành chính: MỚI (sau sáp nhập) bỏ cấp Quận/Huyện
  const [geoMode, setGeoMode] = useState<GeoMode>("moi");
  // Phường/xã CŨ do người nhập chỉ đích danh — chỉ hỏi khi một phường mới gộp
  // nhiều phường cũ, lúc đó máy không có cách nào suy ra (xem ungVienPhuongCu).
  // Giữ theo NHÃN trong danh sách vì hai phường cũ khác quận có thể trùng tên.
  const [phuongCu, setPhuongCu] = useState(
    () =>
      ungVienPhuongCu("moi", initial?.province ?? "", initial?.ward ?? "").find(
        (x) => chuanTen(x.phuong) === chuanTen(initial?.details?.diaChiCu?.phuong ?? ""),
      )?.nhan ?? "",
  );
  // Nhớ chỗ đã chọn Ở CẢ HAI HỆ → đổi hệ qua lại là trả nguyên, không suy diễn lại.
  const nhoHai = useRef<NhoHaiHe | null>(null);
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
      // Tỉnh cũ nào web chưa nhập danh mục phường (Hà Nội, TP.HCM…) thì lấy danh
      // mục phường hệ MỚI của tỉnh đó — cùng một chỗ, chỉ khác cách gọi cấp.
      // Để ô rỗng là người nhập tưởng web hỏng.
      : province && district
        ? wardsOf(province, district).length ? wardsOf(province, district) : wardsOfAny(province)
        : [];

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // ── GIÁ TRỊ NGOÀI DANH MỤC CHUẨN — PHẢI GIỮ, KHÔNG ĐƯỢC XOÁ ───────────────
  // Tin nhập từ file hay ghi theo cách nói của người đăng ("Kiệt ô tô", "Sổ hồng
  // riêng", "Đầy đủ"). Trước đây ô chọn không có giá trị đó → mở form ra là ô
  // trống, bấm Lưu là xoá sạch dữ liệu của khách. Nay bổ sung chính giá trị đang
  // có vào danh sách chọn / thành thẻ riêng để giữ nguyên.
  const themNeuThieu = (ds: string[], v: string) => (v && !ds.includes(v) ? [...ds, v] : ds);
  // Danh mục pháp lý theo ĐÚNG loại hình: đất chỉ sổ đỏ, căn hộ chỉ sổ hồng.
  const chonPhapLy = themNeuThieu(phapLyCho(type), legal);
  const chonNoiThat = themNeuThieu(furnishLevels, furnish);
  const tienIchKhac = amenities.filter((a) => !amenityGroups.some((g) => g.items.includes(a)));
  const noiThatKhac = interior.filter((a) => !interiorItems.includes(a));

  // ── ĐƠN GIÁ THUÊ THEO M² — KHO XƯỞNG · KHO BÃI · VĂN PHÒNG · MẶT BẰNG ─────
  // Thị trường báo "35.000đ/m²/tháng". Ô giá vẫn nhập TRIỆU/tháng (một thước đo
  // duy nhất cho bộ lọc), nhưng hiện thêm đơn giá quy đổi ngay dưới ô để chủ dự
  // án đối chiếu với tin gốc — nhập lệch một số 0 là thấy ngay.
  const laGiaTheoM2 = coDonGiaM2(type, purpose);

  // VNĐ từ ô giá theo mục đích (bán = tỷ · thuê = triệu/tháng)
  const priceVnd = negotiable
    ? null
    : priceUnit.trim() === ""
      ? null
      : Math.round(parseFloat(priceUnit.replace(",", ".")) * (purpose === "thue" ? 1e6 : 1e9));

  // Đơn giá quy đổi cho kho xưởng / kho bãi / văn phòng / mặt bằng cho thuê.
  const dienTichSo = parseFloat(area.replace(",", "."));
  const donGiaM2 =
    laGiaTheoM2 && priceVnd != null && !Number.isNaN(priceVnd) && dienTichSo > 0
      ? Math.round(priceVnd / dienTichSo)
      : null;

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
      // Hạn tin = số ngày gói theo bảng giá ĐÃ DUYỆT. Hạng chưa có giá đã duyệt thì hạn = 0 ngày
      // → tin hết hạn ngay khi lưu (vụ 09/10: nâng 5 tin VIP, cả 5 tự hết hạn sau 1 phút).
      const bang = bangTheoMucDich(billing, purpose);
      const coGia = (bang.plans.find((p) => p.tierId === tier)?.terms ?? []).length > 0;
      const mienPhi = huongKhuyenMai(bang.free, { goi: tier, homNay: homNayVn(), coChu: Boolean(initial?.owner_id), soNgayMoTk: 0 });
      if (!coGia && !mienPhi)
        return setError(`Hạng ${getTier(tier).name} chưa có bảng giá đã duyệt nên tin sẽ hết hạn ngay. Vào Bảng giá bấm Duyệt trước.`);
    }

    // TIN ĐĂNG HỘ (không có chủ): ảnh đại diện = ảnh hợp khung 4:3 nhất trong 5 ảnh đầu (chủ dự án
    // 09/10/2026). Tin của khách giữ đúng ảnh khách chọn.
    const anhBia = initial?.owner_id ? undefined : await (async () => {
      const ds = images.map((x) => x.trim()).filter((x) => x && !isVideoUrl(x)).slice(0, 5);
      if (ds.length < 2) return undefined;
      const tl = await Promise.all(ds.map((u) => new Promise<number | null>((ok) => {
        const im = new window.Image();
        im.onload = () => ok(im.naturalHeight ? im.naturalWidth / im.naturalHeight : null);
        im.onerror = () => ok(null);
        im.src = u;
      })));
      const lech = (x: number | null) => (x ? Math.abs(Math.log(x / (4 / 3))) : 9);
      let tot = 0;
      tl.forEach((x, k) => { if (lech(x) < lech(tl[tot])) tot = k; });
      return tot > 0 && lech(tl[0]) - lech(tl[tot]) >= Math.log(1.1) ? ds[tot] : undefined;
    })();

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
        // Phường/xã cũ vừa chọn → dòng "Địa chỉ cũ" trên trang tin đủ 3 cấp.
        // KHÔNG chọn thì giữ nguyên cái đã có (file nhập tin có thể đã ghi sẵn).
        ...((): { diaChiCu?: { phuong: string; quan: string; tinh: string } } => {
          const c = ungVienPhuongCu(geoMode, province, ward).find((x) => x.nhan === phuongCu);
          if (c) return { diaChiCu: { phuong: c.phuong, quan: c.quan, tinh: c.tinh } };
          // Không có ô chọn phường cũ mà ghim chỉ ra phường cũ đúng chỗ đó → lưu theo ghim (như form khách).
          const dc = diaGioiTuBanDoRef.current;
          const g = geoMode === "moi" && mapPin.trim() && dc ? phuongCuTheoGhim(dc, province, ward) : null;
          return g ? { diaChiCu: g } : {};
        })(),
        project: projectSlug || undefined,
        ...(initial?.owner_id ? {} : { anh_bia: anhBia }),
        // NÂNG VIP TỪ TIN BASIC ĐANG CHẠY (chủ dự án chốt 15/10/2026, thay cách 09/10): VIP chạy
        // SONG SONG với kỳ Basic; hết VIP thì tin về Basic TỚI ĐÚNG NGÀY HẾT HẠN BASIC GỐC
        // (đăng 01/10 Basic tới 31/10, nâng Gold 7 ngày ngày 10/10 → Gold tới 17/10, Basic tới 31/10).
        // Ghi lại ngày hết hạn Basic gốc; cron hết hạn (hetHanTin.ts) đọc khoá này.
        ...((): { han_basic?: string } => {
          const d0 = initial?.details as { han_basic?: string; sau_vip_con_lai_ms?: number } | undefined;
          if (tier === "basic") return {};
          if (d0?.han_basic) return { han_basic: d0.han_basic };
          // Khoá cũ (09/10): số ms Basic còn lại tính từ lúc nâng = published_at của kỳ VIP.
          if (d0?.sau_vip_con_lai_ms && initial?.published_at)
            return { han_basic: new Date(new Date(initial.published_at).getTime() + d0.sau_vip_con_lai_ms).toISOString() };
          const han = initial?.status === "approved" && initial.tier === "basic" && initial.tier_expires_at
            && new Date(initial.tier_expires_at).getTime() > Date.now() ? initial.tier_expires_at : "";
          return han ? { han_basic: han } : {};
        })(),
        contact: (cName.trim() || cPhone.trim() || cEmail.trim() || cAvatar.trim())
          ? { name: cName.trim(), phone: chuanHoaSdt(cPhone), email: cEmail.trim(), avatar: cAvatar.trim() || undefined }
          : undefined,
      },
      tier,
      tier_days: soNgayGoi || null,
      status: newStatus,
      // Ghi thời điểm đăng lần đầu khi công khai (giữ nguyên nếu tin đã có)
      published_at: newStatus === "approved" ? (initial?.published_at ?? new Date().toISOString()) : initial?.published_at ?? null,
    };

    const supabase = createClient();
    const { error: err } = editing
      ? await supabase.from("listings").update(payload).eq("id", initial!.id)
      // Tin MỚI: bumped_at = ngày đăng — danh sách xếp theo `bumped_at desc nulls last`,
      // bỏ trống là tin chìm dưới mọi tin cũ (bẫy 20/09; nhập hàng loạt đã ghi từ trước).
      : await supabase.from("listings").insert({ ...payload, bumped_at: payload.published_at });

    // Lưu xong → web bỏ cache, hiện ngay (xem src/lib/lamMoiWeb.ts)
    if (!err) await lamMoiWeb("listings");
    setSaving(false);
    if (err) return setError(`Lưu thất bại: ${err.message}`);
    // Tin đăng hộ (chưa có chủ): gắn về tài khoản theo SĐT liên hệ (chủ dự án 09/10/2026)
    if (!initial?.owner_id) await fetch("/api/admin/gom-tin-dang-ho", { method: "POST" }).catch(() => {});
    router.push("/admin/tin-dang");
    router.refresh();
  }

  return (
    <form
      // Enter ở ô MỘT DÒNG không được tự gửi tin — là nút "Tiếp" sang ô kế tiếp, ô cuối "Xong" (lib/oTiepTheo, chung với form
      // khách đăng). Ô nhiều dòng (textarea) vẫn xuống dòng bình thường.
      onFocus={ganNhanPhimEnter}
      onKeyDown={enterSangOTiep}
      onSubmit={(e) => { e.preventDefault(); save(false); }}
      className="space-y-4">
      {/* Mục đích + Loại hình + Hạng (trạng thái do 2 nút Lưu nháp / Đăng tin quyết định) */}
      <Panel title="Phân loại">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Field label="Thời hạn">
            <select value={soNgayGoi} onChange={(e) => setSoNgayGoi(Number(e.target.value))} className={inputCls}>
              {(() => {
                const bang = bangTheoMucDich(billing, purpose);
                // Tin admin đăng hộ tính như thành viên mới: chương trình đang chạy thì đúng số ngày của chương trình.
                if (huongKhuyenMai(bang.free, { goi: tier, homNay: homNayVn(), coChu: Boolean(initial?.owner_id), soNgayMoTk: 0 })) {
                  return <option value={0}>{bang.free.hienThi ?? bang.free.days} ngày · khuyến mãi thành viên mới</option>;
                }
                const ds = [...(bang.plans.find((p) => p.tierId === tier)?.terms ?? [])].sort((a, b) => a.days - b.days);
                // Giá gói theo bảng giá ĐÃ DUYỆT (chưa VAT) — để admin nâng hạng thấy ngay giá từng gói.
                const gia = (n: number) => (n > 0 ? `${n.toLocaleString("vi-VN")}đ` : "0đ");
                if (!ds.length) return <option value={0}>Chưa có bảng giá đã duyệt</option>;
                return <>
                  <option value={0}>{`${ds[0].days} ngày · ${gia(ds[0].price)} (gói ngắn nhất)`}</option>
                  {ds.map((t) => <option key={t.days} value={t.days}>{`${t.days} ngày · ${gia(t.price)}`}</option>)}
                </>;
              })()}
            </select>
          </Field>
        </div>
      </Panel>

      {/* Nội dung tin */}
      <Panel title="Nội dung">
        <div className="space-y-4">
          <Field label="Tiêu đề tin (bắt buộc — tối thiểu 30 ký tự, nên có tên quận/phường)">
            {/* Ô tự giãn cao — tiêu đề dài mấy cũng thấy trọn, không trôi mất
                phần đầu như ô một dòng. */}
            <OTieuDe value={title} onChange={setTitle} placeholder="VD: Bán căn hộ 2PN view sông Hàn, Hải Châu, Đà Nẵng" className={inputCls} />
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
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="VD: 100" className={inputCls} />
            </Field>,
            coDienTichXayDung(type) && (
              <Field key="dtxd" label="Diện tích sử dụng (m²)">
                <input value={builtArea} onChange={(e) => setBuiltArea(e.target.value)} placeholder="VD: 95" className={inputCls} />
              </Field>
            ),
            coPhongNgu(type) && (
              <Field key="pn" label="Phòng ngủ">
                <input value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="VD: 2" className={inputCls} />
              </Field>
            ),
            coPhongTam(type) && (
              <Field key="pt" label="Phòng tắm">
                <input value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="VD: 2" className={inputCls} />
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
            {/* Hai nút chia đôi hàng, chữ không gãy dòng — cùng cách với form
                đăng tin của khách. */}
            <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-cvr-line bg-white p-1">
              {([{ id: "moi" as GeoMode, label: "Địa chỉ mới" }, { id: "cu" as GeoMode, label: "Địa chỉ cũ" }]).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (m.id === geoMode) return;
                    // ĐỔI HỆ = TỰ ĐỒNG BỘ, KHÔNG XOÁ TRẮNG BẮT NHẬP LẠI.
                    // Trước đây bấm sang hệ kia là ba ô về rỗng hết, người nhập
                    // phải chọn lại từ tỉnh — vừa mất công vừa dễ nhập sai khu vực.
                    // Nay suy thẳng sang hệ mới: suy được tới đâu điền tới đó,
                    // chỗ không chắc để trống cho người nhập tự chọn.
                    const { ket: d, nho } = doiHeGiuNguyen(
                      geoMode,
                      m.id,
                      { tinh: province, quan: district, phuong: ward },
                      nhoHai.current,
                    );
                    nhoHai.current = nho;
                    setGeoMode(m.id);
                    setProvince(d.province);
                    setDistrict(d.district);
                    setWard(d.ward);
                    // Đổi hệ là đổi luôn phường/xã đang chọn → lựa chọn cũ không
                    // còn thuộc về nó nữa, phải bỏ chứ không để lại giá trị lạc.
                    setPhuongCu("");
                    // Chưa suy ra được phường mà đã ghim bản đồ thì lấy từ điểm ghim.
                    const dc = diaGioiTuBanDoRef.current;
                    if (dc && !d.ward) setTimeout(() => apDungDiaGioi(dc, m.id, d.province, d.district, ""), 0);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${geoMode === m.id ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tỉnh/Thành (bắt buộc)">
            <ChonCoTim
              value={province}
              onChange={(v) => { setProvince(v); setDistrict(""); setWard(""); }}
              options={provinceOptions}
              placeholder="— Chọn Tỉnh/Thành —"
              timPlaceholder="Tìm Tỉnh / Thành"
              bietDanh={bietDanhTinh(geoMode, provinceOptions)}
              className={inputCls}
            />
          </Field>

          {/* Hệ MỚI bỏ cấp Quận/Huyện → ẩn hẳn ô này (giống form đăng tin của khách) */}
          {geoMode === "cu" && (
          <Field label="Quận/Huyện (bắt buộc)">
            {districtOptions.length > 0 ? (
              <ChonCoTim
                value={district}
                onChange={(v) => { setDistrict(v); setWard(""); }}
                disabled={!province}
                options={districtOptions}
                placeholder={province ? "— Chọn Quận/Huyện —" : "Chọn tỉnh trước"}
                timPlaceholder="Tìm Quận / Huyện"
                className={inputCls}
              />
            ) : (
              <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Nhập Quận/Huyện" className={inputCls} />
            )}
          </Field>
          )}

          <Field label={geoMode === "moi" ? "Phường/Xã (bắt buộc)" : "Phường/Xã"}>
            {wardOptions.length > 0 ? (
              <ChonCoTim
                value={ward}
                onChange={setWard}
                disabled={geoMode === "moi" ? !province : !district}
                options={wardOptions}
                placeholder={(geoMode === "moi" ? province : district) ? "— Chọn Phường/Xã —" : geoMode === "moi" ? "Chọn tỉnh trước" : "Chọn quận/huyện trước"}
                timPlaceholder="Tìm Phường / Xã" bietDanh={geoMode === "moi" ? bietDanhPhuongMoi(province, wardOptions) : undefined}
                className={inputCls}
              />
            ) : (
              <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Nhập Phường/Xã" className={inputCls} />
            )}
          </Field>

          {/* PHƯỜNG/XÃ CŨ — CHỈ HIỆN KHI MÁY BÍ. Phường mới gộp 2–10 phường cũ thì
              không suy ngược ra được, mà người mua quen hệ cũ lại tìm theo đúng tên
              đó. Danh sách lấy thẳng từ bảng sáp nhập chính thức, không gõ tay. */}
          {(() => {
            const uv = ungVienPhuongCu(geoMode, province, ward);
            if (!uv.length) return null;
            return (
              <Field label="Phường/Xã trước sáp nhập">
                <select
                  // Lựa chọn lạc (đổi tỉnh, ghim lại bản đồ…) coi như chưa chọn.
                  value={uv.some((x) => x.nhan === phuongCu) ? phuongCu : ""}
                  onChange={(e) => setPhuongCu(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— {ward} gộp {uv.length} phường/xã cũ —</option>
                  {uv.map((x) => <option key={x.nhan} value={x.nhan}>{x.nhan}</option>)}
                </select>
              </Field>
            );
          })()}
        </div>
        {/* ĐỊA CHỈ HAI HỆ — admin nhập hệ nào cũng thấy ngay cách gọi hệ kia,
            giống hệt form của khách. Nhập sai hệ là tin không lên đúng tìm kiếm
            khu vực, nên phải thấy ngay tại chỗ nhập chứ không đợi lên web mới biết. */}
        {province && (() => {
          const hai = haiDongDiaChi(geoMode, { tinh: province, quan: district, phuong: ward });
          if (!hai.moi) return null;
          // Vừa chọn phường/xã cũ thì dòng dưới phải đổi theo NGAY.
          const chon = ungVienPhuongCu(geoMode, province, ward).find((x) => x.nhan === phuongCu);
          const cuHien = chon ? [chon.phuong, chon.quan, chon.tinh].filter(Boolean).join(", ") : hai.cu;
          return (
            <p className="mt-3 rounded-lg bg-cvr-surface px-3 py-2 text-xs leading-relaxed text-cvr-muted">
              Tin sẽ hiện: <strong className="font-semibold text-cvr-ink">{hai.moi}</strong>
              {cuHien ? <> · <span className="text-cvr-faint">Địa chỉ cũ: {cuHien}</span></> : null}
            </p>
          );
        })()}
        <div className="mt-4">
          <Field label="Địa chỉ cụ thể (số nhà, tên đường, số lô, block…)">
            {/* Có gợi ý như form khách đăng; chọn gợi ý = chọn vị trí trên bản đồ (22/10/2026) */}
            <ODiaChiGoiY
              value={addressDetail}
              onChange={setAddressDetail}
              onChonDiem={(p) => setDiemGoiY({ ...p, n: Date.now() })}
              placeholder="VD: 123 Võ Nguyên Giáp · Lô A12 khu B · Block 3 · hoặc chỉ tên đường"
              khuVuc={(() => { const d = diemTimBanDo(geoMode, { tinh: province, quan: district, phuong: ward }); return { tinh: d.tinh, phuong: d.phuong }; })()}
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
              diemChon={diemGoiY}
              value={mapPin}
              onChange={setMapPin}
              onDiaChi={setAddressDetail}
              onDiaGioi={(dc) => {
                diaGioiTuBanDoRef.current = dc;
                const kq = ganDiaGioi(dc, geoMode, { province, district, ward });
                setProvince(kq.province);
                setDistrict(kq.district);
                setWard(kq.ward);
                // Đồng bộ hai hệ theo ghim — như form khách (PostListingForm.nhanDiaGioiTuBanDo).
                if (geoMode !== "moi") return;
                const cu = phuongCuTheoGhim(dc, kq.province, kq.ward);
                nhoHai.current = cu ? { moi: { tinh: kq.province, quan: kq.district, phuong: kq.ward }, cu } : null;
                const uv = cu ? ungVienPhuongCu("moi", kq.province, kq.ward).find((x) => x.phuong === cu.phuong && x.quan === cu.quan) : undefined;
                if (uv) setPhuongCu(uv.nhan);
              }}
              hint={chuoiTimBanDo(geoMode, { tinh: province, quan: district, phuong: ward }, addressDetail)}
              tim={diemTimBanDo(geoMode, { tinh: province, quan: district, phuong: ward }, addressDetail)}
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
                // Mọi ô chọn (kể cả Hướng — 8 hướng) đều có dòng "Khác — tự ghi" (chủ dự án 15/10/2026).
                <ChonHoacGhi value={specValues[f.key] ?? ""} onChange={(v) => setSpecValues((s) => ({ ...s, [f.key]: v }))} options={f.options ?? []} batBuoc={f.batBuoc} className={inputCls} />
              ) : (
                <OGoTuGian value={specValues[f.key] ?? ""} onChange={(v) => setSpecValues((s) => ({ ...s, [f.key]: v }))} placeholder={f.placeholder ?? ""} className={inputCls} />
              )}
            </Field>
          ))}
          <Field label="Hướng nhà / đất">
            <ChonHoacGhi value={direction} onChange={setDirection} options={directions} className={inputCls} />
          </Field>
          <Field label="Tình trạng pháp lý">
            <ChonHoacGhi value={legal} onChange={setLegal} options={chonPhapLy} className={inputCls} />
          </Field>
          <Field label="Tình trạng nội thất">
            <ChonHoacGhi value={furnish} onChange={setFurnish} options={chonNoiThat} className={inputCls} />
          </Field>
        </div>
      </Panel>

      {/* Nội thất — tick mục có sẵn. Đất / kho xưởng không có nội thất (cùng luật form khách, 22/10/2026) */}
      {coNoiThat(type) && (
      <Panel title="Nội thất bàn giao (tick mục có)">
        <div className="flex flex-wrap gap-2">
          {interiorItems.map((it) => (
            <Chip key={it} active={interior.includes(it)} onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
          ))}
          {/* Mục người đăng ghi mà danh mục chuẩn không có — giữ nguyên, bấm để bỏ */}
          {noiThatKhac.map((it) => (
            <Chip key={it} active onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
          ))}
        </div>
        <ThemTuGhi onThem={(v) => setInterior((ds) => (ds.includes(v) ? ds : [...ds, v]))} className={inputCls} />
      </Panel>
      )}

      {/* Tiện ích — tick mục có sẵn, theo nhóm */}
      <Panel title="Tiện ích (tick mục có)">
        <div className="space-y-4">
          {tienIchCho(type).map((g) => (
            <div key={g.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cvr-faint">{g.group}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <Chip key={it} active={amenities.includes(it)} onClick={() => toggle(amenities, setAmenities, it)}>{it}</Chip>
                ))}
              </div>
            </div>
          ))}
          {tienIchKhac.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cvr-faint">Tiện ích khác (người đăng tự ghi)</p>
              <div className="flex flex-wrap gap-2">
                {tienIchKhac.map((it) => (
                  <Chip key={it} active onClick={() => toggle(amenities, setAmenities, it)}>{it}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>
        <ThemTuGhi onThem={(v) => setAmenities((ds) => (ds.includes(v) ? ds : [...ds, v]))} className={inputCls} />
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
          <Field label="Số điện thoại"><input type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="09xx xxx xxx" className={inputCls} /></Field>
          <Field label="Email"><input type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="email@vidu.com" className={inputCls} /></Field>
        </div>
        <p className="mt-2 text-xs text-cvr-faint">
          Số điện thoại này hiện ở khung liên hệ trang tin, và <strong>nút Zalo tự trỏ tới chính số này</strong>. Bỏ trống → dùng hotline Coastal Land.
        </p>
      </Panel>

      {/* Tin thuộc dự án nào — nguồn của mục "Tin mua bán liên quan tại dự án …" */}
      <Panel title="Thuộc dự án">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Dự án">
            {/* Ô chọn có tìm (15/10/2026). Tin gắn dự án CHƯA có trang trên web vẫn hiện đúng tên/slug
                đang gắn — trước đây ô hiện trống, bấm lưu là tưởng mất dự án. */}
            <ChonCoTim
              value={projectSlug ? projectOptions.find((o) => o.slug === projectSlug)?.name
                ?? ((initial?.details as { projectName?: string } | undefined)?.projectName || projectSlug) : ""}
              onChange={(v) => setProjectSlug(v === "— Không thuộc dự án nào —" ? "" : projectOptions.find((o) => o.name === v)?.slug ?? projectSlug)}
              options={["— Không thuộc dự án nào —", ...projectOptions.map((o) => o.name)]}
              placeholder="Chọn dự án"
              timPlaceholder="Tìm dự án"
              className={inputCls}
            />
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
            {/* Kho xưởng · kho bãi · văn phòng · mặt bằng: tin gốc báo giá theo m²
                nên hiện luôn đơn giá quy đổi — lệch một số 0 là thấy ngay. */}
            {donGiaM2 != null && (
              <strong className="ml-2 text-cvr-ink">
                ({donGiaM2.toLocaleString("vi-VN")} đ/m²/tháng)
              </strong>
            )}
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
