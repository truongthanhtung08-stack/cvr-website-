"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import LichChonNgay from "@/components/LichChonNgay";
import LoginForm from "@/components/LoginForm";
import BangGiaGoiTin from "@/components/BangGiaGoiTin";
import NoiDungChuongTrinh from "@/components/NoiDungChuongTrinh";
import MucAnHien, { goiYDanhSach } from "@/components/MucAnHien";
import ChonCoTim from "@/components/ChonCoTim";
import { bietDanhTinh, bietDanhPhuongMoi, type BietDanh } from "@/lib/timDiaDanh";
import { linkHopLe } from "@/lib/linkChen";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChonHoacGhi from "@/components/ChonHoacGhi";
import { isVideoUrl } from "@/lib/media";
import ThemTuGhi from "@/components/ThemTuGhi";
import OGoTuGian from "@/components/OGoTuGian";
import { donViGiaNenDung, goiYDienTich, goiYGia, goiYTieuDe } from "@/lib/goiYNhapTin";
import { doiHeGiuNguyen, chuoiTimBanDo, diemTimBanDo, ungVienPhuongCu, type NhoHaiHe } from "@/lib/diaChiHaiHe";
import {
  demandTypes,
  coPhongNgu, coPhongTam, coDienTichXayDung, coNoiThat, fieldsSplit, thieuMucBatBuoc, nhanDienTich, type Field,
  phapLyCho, legalOptions, fieldsFor, furnishLevels, amenityGroups, tienIchCho, interiorItems, directions,
  purposeOfDemand, demandOfPurpose,
} from "@/lib/listingSpec";
import { typeGroupsFor, normalizeVi } from "@/lib/filters";
import { khoaDuAn } from "@/lib/duAnTen";
import { slugify } from "@/lib/contentAdmin";
import { provinceNamesFor, districtsOf, wardsOf, wardsOfNew, wardsOfAny, chuanTen, type GeoMode } from "@/lib/locations";
import { ganDiaGioi, phuongCuTheoGhim, type DiaGioiBanDo } from "@/lib/diaGioiTuBanDo";
import ImagePicker from "@/components/admin/ImagePicker";
import OTieuDe from "@/components/OTieuDe";
// BẢN ĐỒ GHIM — dùng bản Leaflet/OpenStreetMap. Bản chạy nền Google
// (components/MapPicker.tsx) GIỮ LẠI để sau này Google thông thì đổi về, chỉ
// phải sửa đúng dòng import này.
import MapPicker from "@/components/MapPickerMo";
import ContentEditor from "@/components/admin/ContentEditor";
import { bangTheoMucDich, chuongTrinhTvMoi, freeDangChay, huongKhuyenMai, thanhVienMoi, isPromoRunning, ngayVn, soNgayHienThi, quotePrice, soAnhToiDa, soVideoToiDa, vnd, loaiVoucherTin } from "@/lib/billing";
import { banChuyenDoi } from "@/lib/gtagChuyenDoi";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { useBilling } from "@/lib/useBilling";
import { getTier, type TierId } from "@/lib/packages";
import type { ListingRow } from "@/lib/listingAdmin";
import { chuanHoaSdt, tachNhieuSdt } from "@/lib/phone";
import XacMinhSdt from "@/components/XacMinhSdt";
import { uploadImageFile } from "@/lib/uploadImage";
import ODiaChiGoiY from "@/components/ODiaChiGoiY";
import { ganNhanPhimEnter, enterSangOTiep } from "@/lib/oTiepTheo";
import { loiEmail, loiSdt } from "@/lib/kiemNhap";
import { anhDaiDien, emailThat } from "@/lib/useAuth";
import type { xemTruocTin } from "@/lib/listingsDb";
import { useKhoaCuon } from "@/lib/khoaCuon";
import { homNayVn } from "@/lib/gioVn";
import { taiKhiRanh } from "@/lib/taiKhiRanh";
// Thẻ tin mẫu (nút "Tin hiển thị" ở mục gói tin) — chỉ tải khi khách bấm, không nặng lúc mở trang đăng tin.
const TinHienThiMau = dynamic(() => import("@/components/TinHienThiMau"));
// Khung "Xem trước" (kèm bộ xem ảnh và lớp dựng chi tiết tin ~60 KB mã) — tách khỏi lúc mở trang, tải ngầm khi máy rảnh
// (taiKhiRanh trong form) nên lúc bấm đã có sẵn (27/10/2026: /dang-tin nặng).
const taiTruocXemTruoc = () => Promise.all([import("@/components/XemTruocTin"), import("@/lib/listingsDb")]);
const XemTruocTin = dynamic(() =>
  taiTruocXemTruoc().then(([m, l]) => {
    const Khung = m.default;
    return function XemTruocTinMo({ row, ...p }: Omit<React.ComponentProps<typeof Khung>, "du"> & { row: Parameters<typeof xemTruocTin>[0] }) {
      return <Khung du={l.xemTruocTin(row)} {...p} />;
    };
  }),
);

// Đơn vị giá "Khác — tự ghi" (chủ dự án 14/10/2026): khách ghi nguyên văn, lưu details.giaTuGhi.
const KHAC_GIA = "Khác — tự ghi";

// Form đăng tin cho KHÁCH HÀNG (/dang-tin) — nối Supabase thật.
// Cùng cấu trúc với form admin: Lưu nháp (làm dở) / Đăng tin (gửi duyệt).
// Khách đăng → status 'pending' (chờ admin duyệt). Nháp → 'draft'.
// CHỈNH SỬA tin cũ: mở /dang-tin?id=<id tin> — form tự nạp tin (RLS chỉ cho chủ tin),
// lưu = update. Tin đã duyệt sửa xong sẽ quay về "Chờ duyệt".
// Giá trị đánh dấu "dự án chưa có trên web" trong ô chọn dự án — KHÔNG lưu
// xuống DB, chỉ để biết phải hiện ô gõ tên.
// 7 BƯỚC, MỌI MỤC LUÔN MỞ (chủ dự án 15/10/2026 bỏ kiểu thu gọn + "Tiếp tục"). Ngữ cảnh này chỉ để
// báo lỗi ô bắt buộc ngay đầu bước có ô đó và cuộn tới bước đó.
const MucMoCtx = createContext<{ moMuc: (step: string) => void; loi?: { buoc: string; msg: string } } | null>(null);

const DU_AN_KHAC = "__khac";
const DU_AN_TU_GHI = "Khác — tự ghi";
// Khoá trình duyệt giữ bản nháp tự lưu của form đăng tin mới — RIÊNG TỪNG TÀI KHOẢN
// (máy dùng chung thì người sau không thấy bản nháp của người trước).
const KHOA_NHAP_MAY = "cvr-dang-tin-nhap";
const khoaNhap = (uid: string) => `${KHOA_NHAP_MAY}:${uid}`;

export default function PostListingForm() {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const router = useRouter();
  const thamSo = useSearchParams();
  const editId = thamSo.get("id");
  // Khung "Xem trước" tải ngầm khi máy rảnh → lúc khách bấm đã có sẵn, không chờ (taiKhiRanh)
  useEffect(() => taiKhiRanh(taiTruocXemTruoc), []);
  // Đăng nhập xong quay lại ĐÚNG link khách bấm (giữ ?goi=… của chương trình quảng bá).
  const linkDangNhap = `/dang-nhap?next=${encodeURIComponent(thamSo.toString() ? `/dang-tin?${thamSo.toString()}` : "/dang-tin")}`;

  // Ai đang đăng nhập (cần để gắn owner_id + prefill liên hệ)
  const [userId, setUserId] = useState<string | null>(null);
  // Tài khoản Zalo vừa GỘP vào tài khoản cũ của số (XacMinhSdt) → lưu tin vào tài khoản cũ
  // ngay trong lần bấm Đăng tin này (state userId chưa kịp đổi trong lần save đang chạy).
  const uidGop = useRef<string | null>(null);
  // details GỐC của tin đang sửa — tin đã đăng giữ nguyên gói (plan) và các khoá nội bộ.
  const chiTietGoc = useRef<Record<string, unknown>>({});
  const [authReady, setAuthReady] = useState(false);
  // Tài khoản đã có số điện thoại XÁC MINH chưa (bắt buộc trước khi đăng — chốt 27/09/2026).
  // null = chưa biết; admin không phải qua bước này.
  const [soDaXacMinh, setSoDaXacMinh] = useState<boolean | null>(null);
  const [moXacMinh, setMoXacMinh] = useState(false); // hộp "Số điện thoại của bạn" bật lên khi bấm Đăng tin
  useKhoaCuon(moXacMinh, () => setMoXacMinh(false));
  const [soTaiKhoan, setSoTaiKhoan] = useState(""); // số của TÀI KHOẢN (khác số liên hệ trong tin)
  const [soXacMinh, setSoXacMinh] = useState(""); // số liên hệ khách vừa gõ, đã có tài khoản → hộp xác nhận điền sẵn

  const [done, setDone] = useState<"" | "draft" | "pending" | "capNhat">("");
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
  // Phường/xã CŨ do chính người đăng chọn — chỉ hỏi khi một phường mới gộp nhiều
  // phường cũ, lúc đó máy không có cách nào suy ra (xem ungVienPhuongCu).
  const [phuongCu, setPhuongCu] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  // Toạ độ gợi ý địa chỉ khách vừa chọn — bản đồ tới đó và ghim (chọn gợi ý = chọn vị trí, 22/10/2026)
  const [diemGoiY, setDiemGoiY] = useState<{ lat: number; lng: number; n: number } | null>(null);
  // LINK CHÈN DƯỚI TIN — quyền lợi CVR Diamond (quy định gói); hạng khác không có ô này.
  const [linkChen, setLinkChen] = useState("");
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
  // TÊN TÀI KHOẢN (chủ dự án 26/10/2026): ô Họ tên trong form KHÔNG bắt buộc, tự điền tên này; khách để trống thì tin
  // lấy tên tài khoản. Đăng nhập bằng số chưa đổi tên → tên = số điện thoại. Đổi tên tài khoản ở Cài đặt.
  const [tenTaiKhoan, setTenTaiKhoan] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  // ẢNH ĐẠI DIỆN NGƯỜI ĐĂNG — hiện trên thẻ tin và trong danh bạ chuyên gia.
  // Người có ảnh thật được khách bấm gọi nhiều hơn hẳn ảnh chữ cái mặc định.
  const [contactAvatar, setContactAvatar] = useState("");
  const [dangTaiAvatar, setDangTaiAvatar] = useState(false);
  // Tin thuộc dự án nào (không bắt buộc) — hiện trong mục tin liên quan của dự án đó
  // Gói đăng tin khách chọn (giá do quản trị đặt ở /admin/gia-khuyen-mai)
  // Bảng giá HIỆN HÀNH (bản admin đã lưu ở /admin/gia-khuyen-mai), không phải giá cứng trong code
  const { billing, loading: billingLoading } = useBilling();
  // Bảng giá gói tin theo NHU CẦU đang chọn (bán / cho thuê) — cùng bảng máy chủ
  // dùng lúc duyệt tin, nên số báo ở đây là số bị trừ.
  const bangGia = useMemo(() => bangTheoMucDich(billing, purposeOfDemand(demand)), [billing, demand]);
  // KHÔNG chọn sẵn gói nào — người đăng phải tự chọn, kể cả khi gói đó đang miễn
  // phí. Chọn sẵn thì họ bấm đăng luôn mà không biết mình vừa mua gói gì, đến lúc
  // ví bị trừ là khiếu nại.
  const [planTier, setPlanTier] = useState<TierId | "">("");
  const [planDays, setPlanDays] = useState<number>(billing.plans[0]?.terms[0]?.days ?? 0);
  // KHÁCH CHỌN Ô GÓI KHUYẾN MÃI (true) hay gói thường trong bảng giá (false) — chủ dự án 15/10/2026:
  // hiện đủ gói thường · gói khuyến mãi · chương trình khác; đúng đối tượng mới chọn được ô khuyến mãi,
  // thành viên mới vẫn chọn được gói thường.
  const [chonKm, setChonKm] = useState(false);
  // HẸN NGÀY ĐĂNG (chuẩn Batdongsan): "" = hiển thị ngay khi duyệt; "YYYY-MM-DD" = duyệt xong
  // tin ở mục Chờ hiển thị, tới 0h ngày đó (giờ VN) mới lên — hạn tính từ ngày đó.
  const [batDau, setBatDau] = useState("");
  const [moLich, setMoLich] = useState(false); // bảng lịch chọn ngày (máy tính)
  // Tin ĐANG HIỂN THỊ / ĐÃ HẾT HẠN đang sửa → gói cố định, chỉ hiện thông tin gói (không chọn lại).
  const [goiDangDung, setGoiDangDung] = useState<{ tier: TierId; het: string | null } | null>(null);
  // Thông tin ví/hồ sơ dùng để tính ưu đãi (null = chưa đăng nhập hoặc chưa tải xong)
  const [hoSoVi, setHoSoVi] = useState<{
    created_at: string | null;
    free_quota: number;
    role: string;
    total_topup: number;
    balance: number;
  } | null>(null);
  const [projectSlug, setProjectSlug] = useState("");
  // TÊN DỰ ÁN GÕ TAY — dự án của khách chưa có trên web thì vẫn ghi được tên,
  // trang tin hiện tên đó (chưa có trang dự án thì hiện chữ trơn, tạo dự án sau
  // là tự thành liên kết). Không bắt buộc, bỏ trống cũng được.
  const [projectName, setProjectName] = useState("");
  const [projectOptions, setProjectOptions] = useState<{ slug: string; name: string; province: string | null }[]>([]);

  // Đang lưu nút nào — để 2 nút hiện trạng thái riêng, không lẫn nhau
  const [saving, setSaving] = useState<"" | "draft" | "publish">("");
  // Ví không đủ tiền để đăng gói đã chọn — tin đã được lưu nháp, còn thiếu bao nhiêu.
  const [thieuTien, setThieuTien] = useState<{ can: number; du: number; id?: string | null } | null>(null);
  // Nạp tiền ngay từ tin mới: mốc trang đã đổi sang /dang-tin?id=<tin nháp> thì mới sang trang nạp (hai lệnh liền nhau Next huỷ một)
  const diNapSau = useRef<string | null>(null);
  useEffect(() => {
    if (!diNapSau.current || !editId || editId !== thieuTien?.id) return;
    const den = diNapSau.current;
    diNapSau.current = null;
    router.push(den);
  }, [editId, thieuTien, router]);
  // Tiền đang tạm giữ cho các tin chờ duyệt khác của khách (0056).
  const [tamGiu, setTamGiu] = useState(0);
  const [error, setError] = useState("");
  // MỤC GÓI TIN (chủ dự án 23/10/2026): hai phần "Chương trình" · "Chọn giá"; dưới bảng giá chỉ "Mẫu tin hiển thị" (chủ dự án 23/10/2026: "Tin hiển thị = Mẫu tin hiển thị"), bấm mới hiện.
  const [phanGoi, setPhanGoi] = useState<"ct" | "gia" | null>(null);
  const [xemTinMau, setXemTinMau] = useState(false);
  // Voucher gói hội viên còn lượt của khách (0040) — Tổng tiền trừ y như máy chủ trừ lúc duyệt.
  const [vouchers, setVouchers] = useState<{ loai: string; giam: number; con_lai: number; tu: string; den: string }[]>([]);
  useKhoaCuon(xemTinMau, () => setXemTinMau(false)); // bảng Tin hiển thị: khoá cuộn nền, nút Quay lại điện thoại = đóng bảng
  const [xemChiTietTien, setXemChiTietTien] = useState(false); // khối Tổng tiền: bấm "Chi tiết" mới hiện từng khoản
  const [daRoiO, setDaRoiO] = useState<{ sdt?: boolean; email?: boolean }>({});
  const [giaTuGhi, setGiaTuGhi] = useState("");
  // XEM TRƯỚC TIN — khách thấy tin hiện ra thế nào trước khi bấm đăng (15/10/2026)
  const [xemTruoc, setXemTruoc] = useState(false);

  // TỰ LƯU NHÁP TRÊN MÁY (chủ dự án 10/10/2026): mọi thứ khách đã nhập được cất vào trình
  // duyệt sau mỗi lần gõ, theo TỪNG TÀI KHOẢN; đăng nhập lại, mở /dang-tin trên cùng máy là
  // hiện lại để làm tiếp. Đăng / lưu nháp vào tài khoản thành công thì xoá. Không lưu gói tin
  // (khách phải tự chọn lại, giá theo admin lúc đăng). Chế độ sửa tin (?id=) không dùng.
  const [daNapNhap, setDaNapNhap] = useState(false);
  // TIN ĐANG SOẠN DỞ (chủ dự án duyệt 22/10/2026): vào lại mà còn bản soạn dở → KHÔNG tự đổ vào form; hỏi khách
  // "Soạn tiếp" hay "Đăng tin mới" ở đầu trang. Chờ khách chọn thì không tự lưu (khỏi ghi đè bản cũ bằng form trống).
  const [nhapCho, setNhapCho] = useState<Record<string, unknown> | null>(null);
  // Tin nháp TỰ LƯU VÀO TÀI KHOẢN (chủ dự án 10/10/2026: "vào bất cứ máy nào cũng thao tác
  // tiếp") — mã tin nháp đang dùng + lượt lưu đang chạy (Đăng tin đợi lượt này xong).
  const maNhapTk = useRef<string | null>(null);
  const tuLuuDangChay = useRef<Promise<void> | null>(null);
  const dangBamLuu = useRef(false); // khách đang bấm Lưu nháp / Đăng tin → tự lưu nhường
  const ngungTuLuu = useRef(false); // tin nháp đã gửi duyệt / bị xoá ở máy khác → thôi tự lưu
  // Đổ bản soạn dở vào form (khách bấm "Soạn tiếp", hoặc bản nháp chưa có gì đáng hỏi).
  function apDungNhap(d: Record<string, unknown>) {
    if (typeof d.maNhap === "string") maNhapTk.current = d.maNhap;
    const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
    const ds = (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []);
    if (s("demand")) setDemand(s("demand"));
    setCategory(s("category"));
    if (s("geoMode") === "cu" || s("geoMode") === "moi") setGeoMode(s("geoMode") as GeoMode);
    setProvince(s("province"));
    setDistrict(s("district"));
    setWard(s("ward"));
    setPhuongCu(s("phuongCu"));
    setAddressDetail(s("addressDetail"));
    setLinkChen(s("linkChen"));
    setMapPin(s("mapPin"));
    setTitle(s("title"));
    setPriceValue(s("priceValue"));
    setGiaTuGhi(s("giaTuGhi"));
    if (s("priceUnit")) setPriceUnit(s("priceUnit"));
    setArea(s("area"));
    setBuiltArea(s("builtArea"));
    setBeds(s("beds"));
    setBaths(s("baths"));
    if (d.specValues && typeof d.specValues === "object") setSpecValues(d.specValues as Record<string, string>);
    setLegal(s("legal"));
    setFurnish(s("furnish"));
    setDirection(s("direction"));
    setInterior(ds("interior"));
    setAmenities(ds("amenities"));
    setDescription(s("description"));
    setImages(ds("images"));
    // Gói khách đã chọn đi theo bản soạn dở (đi nạp tiền rồi quay về không phải chọn lại — chủ dự án 26/10/2026)
    if (s("planTier")) { setPlanTier(s("planTier") as TierId); setPlanDays(Number(d.planDays) || 0); setChonKm(d.chonKm === true); }
    if (s("batDau")) setBatDau(s("batDau"));
    // Liên hệ: chỉ ghi đè khi bản nháp có — không xoá phần đã điền sẵn từ hồ sơ.
    if (s("contactName")) setContactName(s("contactName"));
    if (s("contactPhone")) setContactPhone(s("contactPhone"));
    if (emailThat(s("contactEmail"))) setContactEmail(emailThat(s("contactEmail")));
    setProjectSlug(s("projectSlug"));
    setProjectName(s("projectName"));
  }
  // HUỶ THANH TOÁN / QUAY LẠI từ trang nạp tiền (chủ dự án 27/10 + 29/10/2026): về đúng công đoạn khách đang làm — đầu mục
  // Gói tin — thanh toán (#b-goi). Nhận biết: ?huy-tt=1 hoặc cờ veGoiTin trang nạp ghi
  // (mã tin nháp, hoặc "moi" = tin mới chưa lưu được nháp). Trả true khi đúng là đang quay về.
  function veThanhToan(ma: string): boolean {
    const dc = new URL(window.location.href);
    let coCo = false;
    try {
      // Cờ chỉ tính khi vừa từ trang nạp sang (khách bỏ nạp đi trang khác rồi mới vào Đăng tin → cờ cũ, vẫn hỏi Soạn tiếp / Đăng tin mới)
      const tuNap = [sessionStorage.getItem("cl_trang_truoc"), sessionStorage.getItem("cl_trang_hien")].includes("/tai-khoan/nap-tien");
      coCo = tuNap && sessionStorage.getItem("veGoiTin") === ma;
      if (coCo || !tuNap) sessionStorage.removeItem("veGoiTin");
    } catch {}
    if (dc.searchParams.get("huy-tt") !== "1" && !coCo) return false;
    dc.searchParams.delete("huy-tt");
    window.history.replaceState(window.history.state, "", dc.pathname + dc.search);
    // Về ĐẦU mục "Gói tin — thanh toán" (chủ dự án 29/10/2026: "về chỗ nộp tiền là ở phần gói") — thấy gói đã chọn + Tổng tiền
    const toi = () => document.getElementById("b-goi") ?? document.getElementById("b-thanhtoan");
    // Điện thoại thật (29/10/2026: từ app ngân hàng về vẫn đứng đầu trang): máy chậm dựng khối sau 3 giây, trình duyệt / Next khôi
    // phục vị trí cuộn cũ → soát mỗi 300 ms tới 12 giây: lệch thì đưa khối lên lại, đứng đúng 3 lượt liền thì thôi; khách tự chạm /
    // cuộn thì thôi ngay, không giật trang của khách.
    let dung = 0, lan = 0;
    const thoi = () => { clearInterval(t); ["touchstart", "wheel", "keydown"].forEach((e) => removeEventListener(e, thoi)); };
    ["touchstart", "wheel", "keydown"].forEach((e) => addEventListener(e, thoi, { passive: true }));
    const t = setInterval(() => {
      const el = toi();
      if (++lan > 40) return thoi();
      if (!el) return;
      if (Math.abs(el.getBoundingClientRect().top - 70) > 120) { dung = 0; el.scrollIntoView({ block: "start" }); }
      else if (++dung >= 3) thoi();
    }, 300);
    return true;
  }
  /* eslint-disable react-hooks/set-state-in-effect -- nạp bản nháp một lần, khi đã biết tài khoản */
  useEffect(() => {
    if (!authReady || daNapNhap) return;
    if (!editId && userId) {
      try {
        // Bản nháp cũ chưa gắn tài khoản (trước khi tách theo tài khoản) → nhận về tài khoản này.
        const cu = localStorage.getItem(KHOA_NHAP_MAY);
        if (cu && !localStorage.getItem(khoaNhap(userId))) localStorage.setItem(khoaNhap(userId), cu);
        if (cu) localStorage.removeItem(KHOA_NHAP_MAY);
        const d = JSON.parse(localStorage.getItem(khoaNhap(userId)) ?? "null") as Record<string, unknown> | null;
        // Vừa huỷ thanh toán quay về → mở lại ngay bản đang soạn, không hỏi "tiếp tục bản nháp?"
        const veLai = veThanhToan("moi");
        if (d) {
          // Có bất cứ gì khách đã điền / đã chọn (kể cả chỉ chọn gói, up ảnh) → hỏi Soạn tiếp / Đăng tin mới (chủ dự án 29/10/2026)
          const coNoiDung = ["title", "category", "province", "priceValue", "area", "description", "addressDetail", "planTier"]
            .some((k) => typeof d[k] === "string" && (d[k] as string).trim()) || (Array.isArray(d.images) && d.images.length > 0);
          if (coNoiDung && !veLai) setNhapCho(d);
          else apDungNhap(d);
        }
      } catch {}
    }
    setDaNapNhap(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editId || !daNapNhap || nhapCho || !userId || done || thieuTien) return;
    try {
      localStorage.setItem(khoaNhap(userId), JSON.stringify({
        demand, category, geoMode, province, district, ward, phuongCu, addressDetail, linkChen, mapPin,
        title, priceValue, priceUnit, giaTuGhi, area, builtArea, beds, baths, specValues, legal, furnish, direction,
        interior, amenities, description, images, contactName, contactPhone, contactEmail, projectSlug, projectName,
        planTier, planDays, chonKm, batDau,
        maNhap: maNhapTk.current,
      }));
    } catch {}
  }, [editId, daNapNhap, nhapCho, userId, done, thieuTien, demand, category, geoMode, province, district, ward, phuongCu, addressDetail, linkChen, mapPin,
    title, priceValue, priceUnit, giaTuGhi, area, builtArea, beds, baths, specValues, legal, furnish, direction,
    interior, amenities, description, images, contactName, contactPhone, contactEmail, projectSlug, projectName,
    planTier, planDays, chonKm, batDau]);

  // KHÔNG còn ô "Ngày bắt đầu" tự chọn: tin bắt đầu hiển thị LÚC ĐƯỢC DUYỆT (một luật,
  // 01/10/2026) — cho chọn ngày là hứa một mốc web không làm đúng.

  // ── SỐ TIỀN THỰC PHẢI TRẢ ─────────────────────────────────────────────────
  // Giá gói → trừ khuyến mãi đang chạy → trừ ưu đãi theo cấp thành viên.
  // Riêng gói nằm trong chính sách MIỄN PHÍ (vd: thành viên mới, 1 tháng đầu,
  // không giới hạn tin) thì thành tiền = 0đ; các gói còn lại vẫn tính tiền —
  // đó là phần nâng cấp để tin hiển thị nổi bật hơn.
  const laThanhVienMoi = useMemo(() => {
    if (!hoSoVi?.created_at) return false;
    // Đọc giờ hiện tại để biết tài khoản mở được bao nhiêu ngày — chỉ tính lại khi
    // hồ sơ hoặc chính sách miễn phí đổi, không phụ thuộc lần vẽ lại nào.
    // eslint-disable-next-line react-hooks/purity
    const soNgay = (Date.now() - new Date(hoSoVi.created_at).getTime()) / 86_400_000;
    // MỘT định nghĩa thành viên mới (thanhVienMoi) — y như duyệt tin, đăng lại (22/10/2026).
    return thanhVienMoi(billing.free, {
      coChu: true, homNay: homNayVn(), soNgayMoTk: soNgay,
      ngayTaoTk: new Date(new Date(hoSoVi.created_at).getTime() + 7 * 3_600_000).toISOString().slice(0, 10),
    });
  }, [hoSoVi, billing.free]);


  // Gói dùng để XEM TRƯỚC khi chưa chọn (số ảnh tối đa, giá tạm tính) — lấy gói
  // đầu bảng. Việc gửi tin vẫn chặn tới khi người đăng tự chọn.
  const goiXemTruoc: TierId = (planTier || bangGia.plans[0]?.tierId || "basic") as TierId;

  const baoGia = useMemo(
    () =>
      quotePrice({
        data: bangGia,
        tierId: goiXemTruoc,
        days: planDays,
        today: homNayVn(),
        isNewMember: laThanhVienMoi,
      }),
    [bangGia, goiXemTruoc, planDays, laThanhVienMoi],
  );

  // Gói này có được miễn phí cho khách đang đăng nhập không?
  // Xét cả HẠN CỦA CHƯƠNG TRÌNH (from/to), không chỉ nút bật/tắt: hết hạn là
  // form phải tính tiền như bình thường, không được hiện "0 ₫ — Miễn phí" nữa.
  // CÙNG MỘT điều kiện với duyệt tin + đăng lại (huongKhuyenMai) — chương trình trong admin.
  const duocMienPhi = useMemo(() => {
    if (!hoSoVi || !planTier || !chonKm) return false;
    // eslint-disable-next-line react-hooks/purity
    const soNgayMoTk = hoSoVi.created_at ? (Date.now() - new Date(hoSoVi.created_at).getTime()) / 86_400_000 : Infinity;
    return huongKhuyenMai(billing.free, {
      goi: planTier as TierId, homNay: homNayVn(), coChu: true,
      soNgayMoTk, role: hoSoVi.role, freeQuota: hoSoVi.free_quota, ngayTaoTk: hoSoVi.created_at ? new Date(new Date(hoSoVi.created_at).getTime() + 7 * 3_600_000).toISOString().slice(0, 10) : undefined,
    });
  }, [billing.free, planTier, hoSoVi, chonKm]);

  const thanhTien = duocMienPhi ? 0 : baoGia.total;

  // TÍNH TIỀN Y NHƯ MÁY CHỦ TRỪ LÚC DUYỆT (api/tin-dang/duyet — chủ dự án 23/10/2026: "xem lại phần tính giá … hội viên, chiết
  // khấu · quy trình này phải chuẩn"): giá gói (chưa VAT, bảng admin) − khuyến mãi % (chương trình đang chạy) − voucher gói hội
  // viên (đúng loại tin thường / tin VIP, còn lượt, trong kỳ; hết hạn sớm nhất trước, giảm nhiều hơn trước — như dung_voucher;
  // không trừ quá số tiền) = TẠM TÍNH; + VAT 8% = TỔNG khách trả. Trước 23/10 form bỏ sót voucher → báo cao hơn số bị trừ.
  const voucherDung = useMemo(() => {
    if (!planTier || thanhTien <= 0) return null;
    const loai = loaiVoucherTin(planTier);
    // eslint-disable-next-line react-hooks/purity
    const bay = Date.now();
    return vouchers
      .filter((v) => v.loai === loai && v.con_lai > 0 && new Date(v.tu).getTime() <= bay && new Date(v.den).getTime() > bay)
      .sort((a, b) => new Date(a.den).getTime() - new Date(b.den).getTime() || b.giam - a.giam)[0] ?? null;
  }, [vouchers, planTier, thanhTien]);
  const truocVoucher = tachThue(thanhTien);
  const giamVoucher = voucherDung ? Math.min(voucherDung.giam, truocVoucher.tienHang) : 0;
  const tienThue = giamVoucher > 0 ? tachThue(truocVoucher.tienHang - giamVoucher) : truocVoucher;

  // BẢNG GÓI KIỂU BATDONGSAN — bày SẴN mọi loại tin kèm giá, không bắt chọn mới thấy.
  // Khuyến mãi xét bằng CÙNG một hàm với máy chủ (huongKhuyenMai) cho TỪNG loại tin.
  const huongKmCua = (tierId: TierId): boolean => {
    if (!hoSoVi) return false;
    // eslint-disable-next-line react-hooks/purity
    const soNgayMoTk = hoSoVi.created_at ? (Date.now() - new Date(hoSoVi.created_at).getTime()) / 86_400_000 : Infinity;
    return huongKhuyenMai(billing.free, {
      goi: tierId, homNay: homNayVn(), coChu: true,
      soNgayMoTk, role: hoSoVi.role, freeQuota: hoSoVi.free_quota, ngayTaoTk: hoSoVi.created_at ? new Date(new Date(hoSoVi.created_at).getTime() + 7 * 3_600_000).toISOString().slice(0, 10) : undefined,
    });
  };
  // Ô GÓI KHUYẾN MÃI = đúng chương trình đã duyệt trong admin (vd Basic · 30 ngày · 0đ), tách khỏi bảng
  // gói thường (chủ dự án 15/10/2026). Bảng gói thường luôn đủ như bảng giá đã công bố.
  const ngayMp = billing.free.hienThi ?? billing.free.days;
  const goiMp = billing.free.tierId;
  const plansChon = bangGia.plans;
  // eslint-disable-next-line react-hooks/purity
  const ngayHomNay = homNayVn();
  const duocChonKm = huongKmCua(goiMp);
  const coGoiKm = Boolean(ngayMp) && (freeDangChay(billing.free, ngayHomNay) || duocChonKm);
  // Chương trình giảm giá khác đang chạy (admin duyệt) — tự trừ vào gói đúng đối tượng khi tính tiền.
  const ctKhac = (billing.promos ?? []).filter((p) => isPromoRunning(p, ngayHomNay));
  const hopCtKhac = (p: (typeof ctKhac)[number]) => p.audience === "all" || (p.audience === "new" && laThanhVienMoi);
  // Mục gói tin: phần đang mở (xem ghi chú ở khối "MỤC GÓI TIN — HAI PHẦN").
  const coChuongTrinh = coGoiKm || ctKhac.length > 0;
  const phanDang = coChuongTrinh ? (phanGoi ?? (duocChonKm ? "ct" : "gia")) : "gia";
  // LINK CHƯƠNG TRÌNH QUẢNG BÁ CHỌN SẴN ĐÚNG GÓI (chủ dự án 15/10/2026):
  //   /dang-tin?goi=khuyen-mai          → ô gói khuyến mãi (chỉ khi khách đúng đối tượng)
  //   /dang-tin?goi=gold&ngay=10        → gói thường đúng hạng + số ngày có trong bảng giá
  // Áp một lần khi đã có bảng giá + hồ sơ khách; không khớp thì để khách tự chọn.
  const daApLink = useRef(false);
  useEffect(() => {
    const goiLink = thamSo.get("goi");
    if (daApLink.current || !goiLink || editId || billingLoading || !hoSoVi || planTier) return;
    daApLink.current = true;
    if (goiLink === "khuyen-mai") {
      if (!duocChonKm) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChonKm(true); setPlanTier(goiMp); setPlanDays(ngayMp);
      return;
    }
    const ngay = Number(thamSo.get("ngay"));
    const term = plansChon.find((p) => p.tierId === goiLink)?.terms.find((t) => t.days === ngay);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (term) { setChonKm(false); setPlanTier(goiLink as TierId); setPlanDays(term.days); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingLoading, hoSoVi]);
  // Tải xong bảng giá admin → đưa thời hạn về mốc đầu tiên của bảng giá hiện hành
  useEffect(() => {
    if (!billingLoading) {
      // Xét theo bảng KHÁCH ĐANG THẤY (plansChon): thành viên mới bấm ô khuyến mãi (Basic · 30
      // ngày) không có trong bảng giá thường thì không bị kéo về 7 ngày.
      if (chonKm) return; // ô khuyến mãi: số ngày theo chương trình, không theo bảng gói thường
      const terms = plansChon.find((p) => p.tierId === planTier)?.terms ?? [];
      // Bảng giá do admin đặt, tải về sau khi trang đã dựng → chỉ lúc này mới biết
      // gói có những mốc thời hạn nào. Thời hạn đang chọn không còn trong bảng giá
      // hiện hành thì kéo về mốc đầu, nếu không khách trả tiền theo mốc đã bỏ.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (terms.length && !terms.some((t) => t.days === planDays)) setPlanDays(terms[0].days);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingLoading, planTier, plansChon, chonKm]);
  // Số ngày tin THẬT SỰ hiển thị (khuyến mãi thành viên mới → số ngày của chương trình).
  const soNgayThat = planTier ? soNgayHienThi(bangGia, planTier as TierId, planDays, duocMienPhi) : planDays;

  // Danh mục loại hình đổi theo mục đích: bán và cho thuê KHÔNG giống nhau
  const nhomLoaiHinh = useMemo(
    () => typeGroupsFor(purposeOfDemand(demand) === "thue" ? "thue" : "ban"),
    [demand],
  );
  // Đổi mục đích thì danh mục loại hình đổi theo (bán và thuê khác nhau). Loại
  // hình đang chọn không còn trong danh mục mới thì coi như CHƯA chọn — không để
  // lưu tin mang loại hình không tồn tại ở mục đích đó.
  const loaiHinh = nhomLoaiHinh.some((g) => g.items.includes(category)) ? category : "";

  // ĐỔI LOẠI HÌNH HOẶC MỤC ĐÍCH (Bán ↔ Cho thuê) → MỌI MỤC ĐI THEO (chủ dự án 22/10/2026: "chọn bán đất mà còn nội
  // thất là SAI — đổi loại hình, đổi mục đích thì mọi thứ thay đổi theo, cả trong một tin"). Bỏ những gì loại mới không
  // có: đặc điểm không thuộc loại mới, nội thất + tình trạng nội thất (đất / kho xưởng), tiện ích nội khu (đất / kho
  // xưởng), pháp lý của loại khác (sổ hồng ↔ sổ đỏ). Chữ khách tự ghi ngoài danh mục thì giữ. Chạy cả khi nạp bản nháp.
  const khoaLoai = `${loaiHinh}|${purposeOfDemand(demand)}`;
  const khoaLoaiTruoc = useRef(khoaLoai);
  /* eslint-disable react-hooks/set-state-in-effect -- lọc lại dữ liệu đã nhập khi khách đổi loại hình */
  useEffect(() => {
    if (khoaLoaiTruoc.current === khoaLoai) return;
    const [loaiTruoc, mdTruoc] = khoaLoaiTruoc.current.split("|");
    // Lần nạp đầu (bản nháp / tin đang sửa: loại hình từ rỗng → có) KHÔNG tính là khách đổi — không xoá gói vừa nạp.
    const doiMucDich = !!loaiTruoc && mdTruoc !== khoaLoai.split("|")[1];
    khoaLoaiTruoc.current = khoaLoai;
    // GÓI TIN: bảng giá Bán và Cho thuê là hai bảng riêng trong admin → đổi mục đích thì bỏ gói đang chọn, khách chọn
    // lại theo đúng bảng giá mới (không để giá / số ngày của bảng cũ đi theo).
    if (doiMucDich && !goiDangDung) { setPlanTier(""); setPlanDays(0); setChonKm(false); }
    if (!loaiHinh) return;
    const coO = new Set(fieldsFor(loaiHinh, purposeOfDemand(demand)).map((f) => f.key));
    setSpecValues((v) => Object.fromEntries(Object.entries(v).filter(([k]) => coO.has(k))));
    if (!coNoiThat(loaiHinh)) { setInterior([]); setFurnish(""); }
    const tienIchDuoc = new Set(tienIchCho(loaiHinh).flatMap((g) => g.items));
    const tienIchChuan = new Set(amenityGroups.flatMap((g) => g.items));
    setAmenities((ds) => ds.filter((x) => tienIchDuoc.has(x) || !tienIchChuan.has(x)));
    setLegal((l) => (l && legalOptions.includes(l) && !phapLyCho(loaiHinh).includes(l) ? "" : l));
  }, [khoaLoai, loaiHinh, demand]);
  /* eslint-enable react-hooks/set-state-in-effect */
  // ── ĐƠN VỊ GIÁ THEO MỤC ĐÍCH ─────────────────────────────────────────────
  // BÁN tính trọn giá trị bất động sản; CHO THUÊ luôn tính THEO THÁNG. Trước đây
  // dùng chung một bộ đơn vị nên tin cho thuê vẫn hiện "tỷ" — sai hoàn toàn.
  // Văn phòng / mặt bằng / kho thường báo giá theo nghìn đồng mỗi m² mỗi tháng.
  const laThue = purposeOfDemand(demand) === "thue";
  // Nhà xưởng · kho bãi · văn phòng · mặt bằng KHÔNG báo tổng tiền tháng mà báo
  // NGHÌN ĐỒNG / M² / THÁNG (35.000đ/m²). Thiếu đơn vị này thì người đăng phải tự
  // nhân với diện tích — chỗ sai nhiều nhất khi nhập tin kho xưởng.
  const donViGia = laThue
    ? ["triệu/tháng", "nghìn/m²/tháng", "triệu/6 tháng", "triệu/năm", "Thoả thuận", KHAC_GIA]
    : ["tỷ", "triệu", "triệu/m²", "Thoả thuận", KHAC_GIA];
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
  // Cuộn tới đầu một bước (báo lỗi ô bắt buộc, bấm thanh bước).
  const moMuc = (step: string) => {
    requestAnimationFrame(() => document.querySelector(`[data-buoc="${step}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // Ô nhập một mục đặc điểm — dùng chung cho cả hai khối để hai bên không lệch nhau.
  // ⛔ Gọi như HÀM (`oNhapSpec(f)`), KHÔNG dùng `<ONhapSpec />`: khai báo trong thân
  // component thì mỗi lần gõ React coi là component mới, gỡ ô cũ → ô mất con trỏ,
  // khách chỉ gõ được một ký tự (lỗi 10/10/2026).
  // Ô chữ nhận MỌI ký tự (chữ, số, ký tự đặc biệt) — không ép bàn phím số.
  const oNhapSpec = (f: Field) => (
    <div key={f.key} className="min-w-0">
      <Label>{f.label}{f.unit ? ` (${f.unit})` : ""}{f.batBuoc ? " *" : ""}</Label>
      {f.type === "select" ? (
        // Mọi ô chọn (kể cả Hướng — 8 hướng) đều có dòng "Khác — tự ghi" (chủ dự án 14/10/2026).
        <ChonHoacGhi value={specValues[f.key] ?? ""} onChange={(v) => setSpecValues((s) => ({ ...s, [f.key]: v }))} options={f.options ?? []} batBuoc={f.batBuoc} className={inputCls} />
      ) : (
        <OGoTuGian value={specValues[f.key] ?? ""} onChange={(v) => setSpecValues((s) => ({ ...s, [f.key]: v }))} placeholder={f.placeholder ?? ""} className={inputCls} />
      )}
    </div>
  );
  // Hệ MỚI (sau sáp nhập): bỏ cấp Quận/Huyện — Tỉnh/Thành → thẳng Phường/Xã
  const provinceOptions = provinceNamesFor(geoMode);
  const districts = geoMode === "moi" ? [] : province ? districtsOf(province) : [];
  // TỈNH CÓ DANH MỤC QUẬN/HUYỆN CŨ KHÔNG. Việt Nam đã BỎ cấp quận/huyện từ 2025
  // nên web chỉ nhập danh mục cũ cho các tỉnh trọng điểm; 24/34 tỉnh còn lại không có.
  // Không có thì ẨN LUÔN ô Quận/Huyện — để ô trống mà không chọn được gì thì
  // người đăng tưởng web hỏng, mà ô đó vốn KHÔNG bắt buộc.
  const coDanhMucQuan = geoMode === "cu" && !!province && districts.length > 0;

  const wards =
    geoMode === "moi"
      ? province ? wardsOfNew(province) : []
      : province
        // Việt Nam chạy SONG SONG hai hệ cho tới khi dân quen hệ mới, nên hệ CŨ
        // phải dùng được y như hệ mới — không được để ô rỗng ở bất kỳ tỉnh nào.
        // Ưu tiên danh mục phường CŨ của đúng quận/huyện đang chọn; tỉnh hoặc quận
        // nào web chưa nhập đủ danh mục cũ thì lấy danh mục phường MỚI của chính
        // tỉnh đó — cùng một chỗ trên thực địa, chỉ khác cách gọi cấp hành chính.
        ? (district ? wardsOf(province, district) : []).length
          ? wardsOf(province, district)
          : wardsOfAny(province)
        : [];


  // GHIM TRÊN BẢN ĐỒ → TỰ ĐIỀN ba ô Tỉnh/Thành · Quận/Huyện · Phường/Xã.
  // Cách khớp tên nằm ở src/lib/diaGioiTuBanDo.ts (dùng chung với form admin).
  // Nhớ lại địa giới đọc được để KHÁCH ĐỔI HỆ ĐỊA CHỈ lúc nào cũng điền lại được
  // ngay, không bắt họ ghim lại từ đầu.
  const diaGioiTuBanDoRef = useRef<DiaGioiBanDo | null>(null);
  // Nhớ chỗ đã chọn Ở CẢ HAI HỆ → đổi hệ qua lại là trả nguyên, không suy diễn lại.
  const nhoHai = useRef<NhoHaiHe | null>(null);

  function apDungDiaGioi(dc: DiaGioiBanDo, heDiaChi: GeoMode, tinhCu: string, quanCu: string, phuongCu: string) {
    const kq = ganDiaGioi(dc, heDiaChi, { province: tinhCu, district: quanCu, ward: phuongCu });
    setProvince(kq.province);
    setDistrict(kq.district);
    setWard(kq.ward);
  }

  // KHÁCH TỰ CHỌN LẠI Tỉnh / Quận / Phường = ĐỊA CHỈ MỚI (chủ dự án 15/10/2026): bỏ số nhà – tên
  // đường cũ, bỏ ghim cũ, bỏ bản nhớ đổi hệ cũ — rồi đồng bộ hai hệ theo địa chỉ mới. (Chỉ ĐỔI HỆ
  // qua lại thì giữ nguyên mọi thứ — xem doiHeGiuNguyen.) Bản đồ tự điền địa giới không đi qua đây.
  function diaChiMoi() {
    setAddressDetail("");
    setMapPin("");
    setPhuongCu("");
    diaGioiTuBanDoRef.current = null;
    nhoHai.current = null;
  }

  // DỰ ÁN THUỘC VỊ TRÍ (chủ dự án 22/10/2026): ô "Thuộc dự án" nằm trong nhóm địa chỉ, chỉ liệt kê dự án của tỉnh đã
  // chọn (so cả tên tỉnh đang chọn lẫn tỉnh hệ mới, bỏ chữ "Thành phố / Tỉnh"). Chưa chọn tỉnh thì hiện hết.
  const gonTinh = (s: string) => normalizeVi(s.replace(/^(Thành phố|Tỉnh)\s+/i, ""));
  const tinhCuaDuAn = (tinh: string) => (tinh ? [tinh, diemTimBanDo(geoMode, { tinh }).tinh].map(gonTinh) : []);
  const duAnHopTinh = (o: { province: string | null }, tinh: string) => {
    const ds = tinhCuaDuAn(tinh);
    return !ds.length || ds.includes(gonTinh(o.province ?? ""));
  };
  const duAnTrongTinh = projectOptions.filter((o) => duAnHopTinh(o, province));

  function nhanDiaGioiTuBanDo(dc: DiaGioiBanDo) {
    diaGioiTuBanDoRef.current = dc;
    const kq = ganDiaGioi(dc, geoMode, { province, district, ward });
    setProvince(kq.province);
    setDistrict(kq.district);
    setWard(kq.ward);
    // ĐỒNG BỘ HAI HỆ THEO GHIM (chủ dự án 23/10/2026): phường mới gộp nhiều phường cũ → lấy phường cũ đúng chỗ ghim, chụp
    // sẵn cả hai hệ → bấm "Địa chỉ cũ" ra đúng phường đó, bấm lại "Địa chỉ mới" về nguyên — không suy lại theo tên.
    if (geoMode !== "moi") return;
    const cu = phuongCuTheoGhim(dc, kq.province, kq.ward);
    nhoHai.current = cu ? { moi: { tinh: kq.province, quan: kq.district, phuong: kq.ward }, cu } : null;
    const uv = cu ? ungVienPhuongCu("moi", kq.province, kq.ward).find((x) => x.phuong === cu.phuong && x.quan === cu.quan) : undefined;
    if (uv) setPhuongCu(uv.nhan);
  }

  // DANH SÁCH "THUỘC DỰ ÁN" = MỌI DỰ ÁN ĐÃ BIẾT (chủ dự án 22/10/2026: "cái nào có sẵn chọn, chưa có sẵn khách tự ghi — cấu
  // trúc thế nào cho đúng"): dự án có hồ sơ + dự án khách khác đã ghi trong tin, gộp tên trùng theo tên lõi — cùng một nguồn
  // với ô tìm (/api/du-an/ten, lưu đệm 1 giờ). Trước chỉ lấy bảng dự án → dự án khách ghi trước không có trong danh sách,
  // khách sau ghi lại mỗi người một kiểu.
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/du-an/ten").catch(() => null);
      const ds = (await r?.json().catch(() => null)) as { ten: string; slug: string; tinh: string }[] | null;
      if (ds) setProjectOptions(ds.map((d) => ({ slug: d.slug, name: d.ten, province: d.tinh })).sort((a, b) => a.name.localeCompare(b.name, "vi")));
    })();
  }, []);

  // Lấy phiên đăng nhập + prefill liên hệ từ hồ sơ
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      // Cách chuẩn Supabase (SSR): máy chủ kiểm + làm mới phiên ở middleware (getUser mỗi lượt mở trang của người đã đăng nhập),
      // trình duyệt chỉ ĐỌC phiên có sẵn — không hỏi lại máy chủ Supabase lần nữa (27/10/2026: bớt một nhịp mạng trước khi
      // form hiện). Quyền thật vẫn do RLS kiểm ở từng lệnh đọc/ghi; token hết hạn thì thư viện tự làm mới.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      setUserId(user?.id ?? null);
      if (user) {
        // Lấy thêm ngày tạo · hạn mức tin miễn phí · vai trò · tổng chi tiêu
        // để tính ĐÚNG số tiền phải trả (ưu đãi thành viên mới, khuyến mãi, cấp).
        // Hồ sơ · ví · voucher hỏi CÙNG LÚC (27/10/2026, chủ dự án: "mở trang đăng tin vào và đăng, nhanh nhất") — trước đây
        // nối đuôi 4 lượt nên "Đang tải…" kéo dài thêm mỗi lượt một nhịp mạng. Vẫn đúng các câu hỏi đó, số tính như cũ.
        const [{ data: p }, { data: vi }, { data: vc }] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, phone, email, avatar_url, created_at:ngay_thanh_vien, free_quota, role, total_topup, balance, phone_verified, sdt_lien_he_xac_minh")
            .eq("id", user.id)
            .single(),
          // TẠM GIỮ (0056): tiền của các tin đang chờ duyệt đã khoá trong ví → mọi phép so
          // "đủ tiền" trong form dùng số KHẢ DỤNG (số dư − tạm giữ), y như CSDL kiểm.
          supabase.rpc("so_du_kha_dung"),
          // VOUCHER GÓI HỘI VIÊN (0040): cấp kỳ 30 ngày hiện tại (lười — như trang Tài khoản → Hội viên) rồi đọc voucher còn lượt.
          (async () => {
            await supabase.rpc("cap_voucher_hoi_vien", { p_user: user.id });
            return supabase.from("hoi_vien_voucher").select("loai,giam,con_lai,tu,den").gt("con_lai", 0);
          })(),
        ]);
        if (p) {
          const pv = p as { phone_verified?: boolean; sdt_lien_he_xac_minh?: boolean; role?: string };
          // Số khách đăng ký bằng số (Supabase đã nhận mã) cũng coi là đã xác minh; nhóm Email đã
          // nhận mã cho số liên hệ (0050) cũng được đăng tin.
          setSoDaXacMinh(!!pv.phone_verified || !!pv.sdt_lien_he_xac_minh || pv.role === "admin" || !!user.phone_confirmed_at);
          setSoTaiKhoan(chuanHoaSdt(p.phone ?? ""));
          setContactName((v) => v || p.full_name || "");
          setTenTaiKhoan((p.full_name ?? "").trim() || chuanHoaSdt(p.phone ?? ""));
          setContactPhone((v) => v || p.phone || "");
          // Email kỹ thuật (zalo_… / sdt_…@users.coastalland.vn) không bao giờ điền vào tin (26/10/2026)
          setContactEmail((v) => v || emailThat(p.email));
          // Ảnh đại diện mặc định = ảnh tài khoản (tự đặt / Google / Zalo) — chuẩn: tên + avatar theo tài khoản
          setContactAvatar((v) => v || (p as { avatar_url?: string | null }).avatar_url || anhDaiDien(user));
          setHoSoVi({
            created_at: p.created_at ?? null,
            free_quota: (p as { free_quota?: number }).free_quota ?? 0,
            role: (p as { role?: string }).role ?? "buyer",
            total_topup: (p as { total_topup?: number }).total_topup ?? 0,
            // Cột balance có thể chưa bật trong CSDL → coi như 0.
            balance: (p as { balance?: number }).balance ?? 0,
          });
          const v = (vi as { kha_dung: number; tam_giu: number }[] | null)?.[0];
          if (v) {
            setHoSoVi((h) => (h ? { ...h, balance: Number(v.kha_dung) } : h));
            setTamGiu(Number(v.tam_giu));
          }
          setVouchers(((vc ?? []) as { loai: string; giam: number; con_lai: number; tu: string; den: string }[]).map((x) => ({ ...x, giam: Number(x.giam) })));
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
      if (r.status === "approved" || r.status === "expired") setGoiDangDung({ tier: r.tier as TierId, het: r.tier_expires_at });
      // Tin NHÁP / CHỜ DUYỆT: nạp lại gói khách đã chọn (details.plan) — trước đây form mở ra trống gói, khách lưu
      // là gói của tin bị ghi thành trống (26/10/2026)
      if (r.status === "draft" || r.status === "pending") {
        const p = (r.details as { plan?: { tier?: string; days?: number; khuyenMai?: boolean; batDau?: string } } | null)?.plan;
        if (p?.tier) { setPlanTier(p.tier as TierId); setPlanDays(Number(p.days) || 0); setChonKm(p.khuyenMai === true); }
        if (p?.batDau) setBatDau(p.batDau); // Chọn ngày đi theo gói (về từ nạp tiền không mất ngày đã chọn)
      }
      veThanhToan(editId);
      setDemand(demandOfPurpose(r.purpose));
      if (r.type) setCategory(r.type);
      setProvince(r.province ?? "");
      setDistrict(r.district ?? "");
      setWard(r.ward ?? "");
      setTitle(r.title ?? "");
      setDescription(r.description ?? "");
      // Giá VNĐ → ô nhập + đơn vị (ngược với priceToVnd)
      const giaGhi = ((r.details ?? {}) as { giaTuGhi?: string }).giaTuGhi?.trim();
      if (r.price_vnd == null && giaGhi) { setPriceUnit(KHAC_GIA); setGiaTuGhi(giaGhi); setPriceValue(""); }
      else if (r.price_vnd == null) { setPriceUnit("Thoả thuận"); setPriceValue(""); }
      else if (r.purpose === "thue") { setPriceUnit("triệu/tháng"); setPriceValue(String(Math.round((r.price_vnd / 1e6) * 10) / 10)); }
      else if (r.price_vnd >= 1e9) { setPriceUnit("tỷ"); setPriceValue(String(Math.round((r.price_vnd / 1e9) * 100) / 100)); }
      else { setPriceUnit("triệu"); setPriceValue(String(Math.round(r.price_vnd / 1e6))); }
      setArea(r.area_m2 != null ? String(r.area_m2) : "");
      // Ô "Diện tích sử dụng" cũ ở Đặc điểm đã gộp vào ô chính (15/10/2026) — tin cũ chỉ ghi ở đó thì hiện sẵn.
      const dtSuDungCu = coDienTichXayDung(r.type ?? "") ? ((r.details ?? {}) as { specs?: Record<string, string> }).specs?.usableArea : undefined;
      setBuiltArea(r.built_area_m2 != null ? String(r.built_area_m2) : dtSuDungCu ? String(dtSuDungCu).replace(",", ".") : "");
      setBeds(r.beds != null ? String(r.beds) : "");
      setBaths(r.baths != null ? String(r.baths) : "");
      setImages(r.images ?? []);
      const d = r.details ?? {};
      chiTietGoc.current = d as Record<string, unknown>;
      { const bd = (d as { plan?: { batDau?: string } }).plan?.batDau; if (bd && bd > new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)) setBatDau(bd); }
      setSpecValues(d.specs ?? {});
      setInterior(d.interior ?? []);
      setAmenities(d.amenities ?? []);
      setLegal(d.legal ?? "");
      setFurnish(d.furnish ?? "");
      setDirection(d.direction ?? "");
      setAddressDetail(d.addressDetail ?? "");
      setLinkChen(d.linkChen ?? "");
      setMapPin(d.mapPin ?? "");
      // Phường/xã cũ đã lưu → chọn lại đúng dòng trong ô, đừng bắt chọn lại từ đầu.
      if (d.diaChiCu?.phuong) {
        const uv = ungVienPhuongCu("moi", r.province ?? "", r.ward ?? "");
        setPhuongCu(uv.find((x) => chuanTen(x.phuong) === chuanTen(d.diaChiCu!.phuong ?? ""))?.nhan ?? "");
      }
      setProjectSlug(d.project ? d.project : d.projectName ? DU_AN_KHAC : "");
      setProjectName(d.projectName ?? "");
      if (d.contact) {
        setContactName(d.contact.name ?? "");
        setContactPhone(d.contact.phone ?? "");
        setContactEmail(emailThat(d.contact.email));
        setContactAvatar(d.contact.avatar ?? "");
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
    if (donVi === "Thoả thuận" || donVi === KHAC_GIA || !priceValue.trim()) return null;
    const n = parseFloat(priceValue.replace(",", "."));
    if (Number.isNaN(n)) return null;
    const a = parseFloat(area.replace(",", "."));
    if (donVi === "tỷ") return Math.round(n * 1e9);
    if (donVi === "triệu" || donVi === "triệu/tháng") return Math.round(n * 1e6);
    if (donVi === "triệu/m²") return Number.isNaN(a) ? null : Math.round(n * a * 1e6);
    // 35 nghìn/m² × 2.000 m² = 70.000.000 đ/tháng
    if (donVi === "nghìn/m²/tháng") return Number.isNaN(a) ? null : Math.round(n * 1e3 * a);
    // Báo giá theo kỳ dài thì QUY VỀ MỖI THÁNG — để tin cho thuê nào cũng cùng
    // một thước đo, bộ lọc khoảng giá và sắp xếp mới chạy đúng.
    if (donVi === "triệu/6 tháng") return Math.round((n * 1e6) / 6);
    if (donVi === "triệu/năm") return Math.round((n * 1e6) / 12);
    return null;
  }

  // SLUG DỰ ÁN ĐỂ LƯU.
  // Khách gõ tay tên dự án mà tên đó TRÙNG một dự án đã có trên web thì phải nối
  // thẳng vào dự án đó — slug là thứ bộ lọc "Dự án", trang dự án và mục "Tin liên
  // quan tại dự án" chạy theo; bỏ trống slug là tin nằm ngoài mọi liên kết đó.
  // KHÁCH TỰ GHI TÊN (22/10/2026): trùng TÊN LÕI với dự án đã biết trong tỉnh (khác hoa thường, dấu, viết liền, có/không
  // "Dự án", "Khu đô thị", tên thành phố) → nối vào dự án đó; tên mới → TỰ TẠO MÃ từ tên. Tin luôn có mã dự án → có trang dự
  // án ngay (bậc 1, chưa cho Google lập chỉ mục), khách sau thấy trong danh sách để chọn; admin tạo hồ sơ cùng mã là trang
  // dự án tự đầy đủ, tin tự về đúng trang.
  function slugDuAn(): string {
    if (projectSlug && projectSlug !== DU_AN_KHAC) return projectSlug;
    const ten = projectName.trim();
    if (!ten) return "";
    const k = khoaDuAn(ten);
    return (duAnTrongTinh.find((o) => khoaDuAn(o.name) === k) ?? projectOptions.find((o) => khoaDuAn(o.name) === k))?.slug ?? slugify(ten);
  }

  // Dữ liệu chung cho THÊM MỚI, CẬP NHẬT và TỰ LƯU NHÁP (một chỗ, không lệch nhau).
  const giaTriTin = (luuNhap: boolean) => ({
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
      giaTuGhi: donVi === KHAC_GIA ? giaTuGhi.trim() || undefined : undefined,
      // Khách TỰ ghi đơn giá thuê (nghìn/m²/tháng) → được hiện trên tin; tự chia từ tổng giá thì không (20/10/2026)
      ...(donVi === "nghìn/m²/tháng" && Number(priceValue.replace(",", ".")) > 0
        ? { donGiaThue: Number(priceValue.replace(",", ".")), donGiaThueNhap: true }
        : {}),
      furnish: furnish || undefined,
      direction: direction || undefined,
      addressDetail: addressDetail.trim() || undefined,
      // Chỉ lưu khi tin là CVR Diamond (gói đang chọn hoặc gói đang dùng).
      linkChen: (goiDangDung?.tier ?? planTier) === "diamond" ? linkHopLe(linkChen) ?? undefined : undefined,
      mapPin: mapPin.trim() || undefined,
      // Phường/xã cũ người đăng tự chọn → dòng "Địa chỉ cũ" đủ 3 cấp.
      ...((): { diaChiCu?: { phuong: string; quan: string; tinh: string } } => {
        const c = ungVienPhuongCu(geoMode, province, ward).find((x) => x.nhan === phuongCu);
        if (c) return { diaChiCu: { phuong: c.phuong, quan: c.quan, tinh: c.tinh } };
        // Không có ô chọn phường cũ (bảng ánh xạ đã lấy phường cũ trùng tên) mà ghim chỉ ra phường cũ khác → lưu theo ghim.
        const dc = diaGioiTuBanDoRef.current;
        const g = geoMode === "moi" && mapPin.trim() && dc ? phuongCuTheoGhim(dc, province, ward) : null;
        return g ? { diaChiCu: g } : {};
      })(),
      // giaBao = SỐ TIỀN WEB ĐÃ BÁO CHO KHÁCH ngay lúc bấm Đăng (chưa gồm GTGT,
      // cùng thang với quotePrice). Lúc admin duyệt, máy chủ tính lại giá; nếu
      // khuyến mãi đã hết hạn hay bảng giá đã đổi thì giá mới có thể cao hơn —
      // khi đó vẫn chỉ thu đúng con số khách đã nhìn thấy ở đây.
      plan: { tier: planTier, days: planDays, giaBao: thanhTien, khuyenMai: duocMienPhi, ...(batDau ? { batDau } : {}) },
      project: slugDuAn() || undefined,
      projectName: projectName.trim() || undefined,
      contact: (contactName.trim() || contactPhone.trim() || contactEmail.trim() || contactAvatar.trim())
        ? {
            // Ô Họ tên khách ghi; để trống → tên tài khoản (admin mở tin của khách thì không lấy tên admin)
            name: contactName.trim() || (editOwner && editOwner !== userId ? "" : tenTaiKhoan) || chuanHoaSdt(contactPhone),
            phone: chuanHoaSdt(contactPhone),
            email: contactEmail.trim(),
            avatar: contactAvatar.trim() || undefined,
          }
        : undefined,
    },
    status: luuNhap ? ("draft" as const) : ("pending" as const), // khách đăng → chờ admin duyệt
  });

  // TỰ LƯU VÀO TÀI KHOẢN: khách ngừng gõ 4 giây là lưu thành tin nháp (cần Tiêu đề + Tỉnh/Thành —
  // CSDL bắt buộc hai cột này; chưa có thì vẫn lưu trên máy như trên). Sang máy khác: Tin đăng
  // của tôi → Nháp → làm tiếp. Không đổi gói, không trừ tiền, không gửi duyệt.
  const giaTriTuLuu = JSON.stringify(giaTriTin(true));
  // Mở TIN NHÁP có sẵn (?id=, vd từ máy khác) → tự lưu tiếp vào đúng tin đó, khi đã nạp xong.
  const suaNhap = Boolean(editId) && editStatus === "draft" && editLoad === "ok";
  useEffect(() => {
    if ((editId && !suaNhap) || !daNapNhap || nhapCho || !userId || done || thieuTien || saving) return;
    if (!title.trim() || !province) return;
    const hen = setTimeout(() => {
      if (tuLuuDangChay.current || dangBamLuu.current || ngungTuLuu.current) return;
      tuLuuDangChay.current = (async () => {
        try {
          const supabase = createClient();
          const v = giaTriTin(true);
          const ma = editId ?? maNhapTk.current;
          if (ma) {
            const { data } = await supabase.from("listings").update(v).eq("id", ma).eq("status", "draft").select("id");
            // Không còn là tin nháp (đã gửi duyệt / đã xoá ở máy khác) → dừng, không tạo tin trùng.
            if (!data || !data.length) ngungTuLuu.current = true;
            return;
          }
          const kq = await supabase
            .from("listings")
            .insert({ ...v, owner_id: userId, tier: (planTier || "basic") as TierId, published_at: null })
            .select("id")
            .single();
          if (!kq.error) maNhapTk.current = (kq.data as { id: string }).id;
          try {
            const k = khoaNhap(userId);
            const d = JSON.parse(localStorage.getItem(k) ?? "null");
            if (d) localStorage.setItem(k, JSON.stringify({ ...d, maNhap: maNhapTk.current }));
          } catch {}
        } finally {
          tuLuuDangChay.current = null;
        }
      })();
    }, 4000);
    return () => clearTimeout(hen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giaTriTuLuu, editId, suaNhap, daNapNhap, userId, done, thieuTien, saving]);

  // diNap: nút "Nạp thêm" — KHÔNG KIỂM Ô NÀO (chủ dự án 26/10/2026: "khi nộp tiền không bắt buộc gì hết"), lưu nháp kèm gói
  // rồi sang nạp tiền. Tin đủ thông tin thì nạp xong tự gửi duyệt; chưa đủ thì nạp xong khách về tin điền tiếp.
  async function save(asDraft: boolean, daXacMinhXong = false, diNap = false) {
    // Đợi lượt tự lưu đang chạy (nếu có) và chặn lượt mới để không tạo hai tin.
    dangBamLuu.current = true;
    try {
      await tuLuuDangChay.current;
      await luuThat(asDraft, daXacMinhXong, diNap);
    } finally {
      dangBamLuu.current = false;
    }
  }
  // Báo lỗi + MỞ ĐÚNG BƯỚC có ô còn thiếu (chủ dự án 15/10/2026) — khách không phải tự đi tìm.
  const [loiBuoc, setLoiBuoc] = useState("");
  // o = mã ô thiếu → cuộn tới ĐÚNG Ô và đặt con trỏ vào ô đó (chủ dự án 26/10/2026: báo lỗi mà không trỏ vào ô cần điền)
  function baoLoi(msg: string, buoc: string, o?: string) {
    setError(msg);
    setLoiBuoc(buoc);
    moMuc(buoc);
    if (!o) return;
    setTimeout(() => {
      const el = document.getElementById(o)?.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]), textarea, [contenteditable=true], button");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }, 350);
  }

  // KIỂM THEO ĐÚNG THỨ TỰ 7 BƯỚC (15/10/2026): thiếu nhiều ô thì trả ô ở bước SỚM NHẤT trước. null = đủ để gửi duyệt.
  function loiDangTin(): [string, string, string?] | null {
    // Bước 1 — Loại tin & vị trí
    if (!loaiHinh) return ["Chưa chọn loại hình bất động sản.", "1", "o-loaihinh"];
    if (!province) return ["Chưa chọn Tỉnh/Thành.", "1", "o-tinh"];
    // Bước 2 — Thông tin chính. GIÁ BẮT BUỘC (14/10/2026): nhập số, chọn "Thoả thuận", hoặc tự ghi.
    if (donVi === KHAC_GIA ? !giaTuGhi.trim() : donVi !== "Thoả thuận" && !priceValue.trim()) return ["Chưa nhập giá.", "2", "o-gia"];
    if (!area.trim()) return ["Chưa nhập diện tích.", "2", "o-dientich"];
    // Thông tin chính theo loại hình — thiếu mục nào báo đúng tên mục đó.
    const thieu = thieuMucBatBuoc(loaiHinh, purposeOfDemand(demand), specValues);
    if (thieu.length) return [`Chưa nhập: ${thieu.join(" · ")}.`, "2"];
    // Bước 4 — Tiêu đề
    if (!title.trim()) return ["Chưa nhập tiêu đề tin.", "4", "o-tieude"];
    // Bước 5 — GÓI TIN: bắt buộc chọn, kể cả gói đang được miễn phí. Không mặc định sẵn,
    // không tự đoán hộ — đây là thứ quyết định số tiền phải trả.
    if (!planTier) return ["Chưa chọn gói tin.", "5"];
    // Bước 6 — đổi sang gói thấp hơn sau khi đã up ảnh → số ảnh / video không được vượt mức của gói.
    const toiDaAnh = duocMienPhi && billing.free.soAnh ? billing.free.soAnh : soAnhToiDa(billing, planTier as TierId);
    const toiDaVideo = duocMienPhi && billing.free.soVideo !== undefined ? billing.free.soVideo : soVideoToiDa(billing, planTier as TierId);
    const soVideo = images.filter((x) => isVideoUrl(x)).length;
    const soAnh = images.length - soVideo;
    // BẮT BUỘC ÍT NHẤT 1 ẢNH khi đăng (chủ dự án 26/10/2026); lưu nháp thì không đòi.
    if (soAnh < 1) return ["Chưa thêm ảnh — tin cần ít nhất 1 ảnh.", "6", "b-anh"];
    if (soAnh > toiDaAnh) return [`Tin ${getTier(planTier as TierId).name} chỉ đăng tối đa ${toiDaAnh} ảnh — xoá bớt ảnh cũ hoặc nâng cấp gói tin.`, "6"];
    if (soVideo > toiDaVideo) return [`Mỗi tin chỉ đăng tối đa ${toiDaVideo} video — xoá video cũ rồi thêm lại.`, "6"];
    // Bước 7 — Liên hệ. Số điện thoại BẮT BUỘC ở mọi tin (27/09/2026) — phải là số gọi được.
    // Báo ĐÚNG Ô THIẾU (26/10/2026: đã đăng nhập, tên đã tự điền mà vẫn bị đòi "họ tên và số điện thoại")
    if (!contactPhone.trim()) return ["Nhập số điện thoại liên hệ.", "7", "o-sdt"];
    if (loiSdt(contactPhone)) return [loiSdt(contactPhone), "7", "o-sdt"];
    if (loiEmail(contactEmail)) return [loiEmail(contactEmail), "7", "o-email"];
    return null;
  }

  async function luuThat(asDraft: boolean, daXacMinhXong: boolean, diNap = false) {
    setError("");
    setLoiBuoc("");
    const uid = uidGop.current ?? userId;
    if (!uid) {
      router.push(linkDangNhap);
      return;
    }
    const loi = asDraft ? null : loiDangTin();
    // Đủ thông tin để gửi duyệt (nạp xong máy tự gửi). Nút Nạp thêm bỏ qua mọi ô bắt buộc.
    const duDeGui = !asDraft && !loi;
    if (diNap && (!province || !title.trim())) {
      // Chưa có Tỉnh/Thành + Tiêu đề (CSDL bắt buộc) → chưa lưu được tin nháp: sang nạp luôn, bản soạn dở vẫn nằm
      // trong máy (tự lưu) và hiện lại khi khách quay về form.
      const can = Math.max(0, truocVoucher.tongTra - (hoSoVi?.balance ?? 0));
      window.location.href = `/tai-khoan/nap-tien?can=${can}&ve=${encodeURIComponent("/dang-tin")}`;
      return;
    }
    if (asDraft) {
      // Lưu nháp: CSDL bắt buộc hai cột Tỉnh/Thành + Tiêu đề — còn lại ghi tới đâu lưu tới đó.
      if (!province) return baoLoi("Chọn Tỉnh/Thành để lưu nháp.", "1", "o-tinh");
      if (!title.trim()) return baoLoi("Nhập tiêu đề để lưu nháp.", "4", "o-tieude");
    } else if (loi && !diNap) {
      return baoLoi(...loi);
    }
    // LƯU NHÁP thì không chặn gì thêm — người đăng ghi tới đâu lưu tới đó.

    // SỐ CỦA TÀI KHOẢN (người đăng) — TÁCH HẲN khỏi số liên hệ trong tin (số liên hệ là quyền
    // của khách, ghi số ai cũng được). Chủ dự án chốt 28/09/2026, tài khoản email/Google:
    //   · chưa có số tài khoản → hộp nhỏ hỏi "Số điện thoại của bạn"
    //   · số MỚI → không hỏi mã, lưu làm số tài khoản, đăng luôn
    //   · số ĐANG CÓ tài khoản / tin cũ → mã Zalo 1 lần → gộp ngầm, đăng luôn
    // KHÁCH CHỈ GÕ SỐ MỘT LẦN (chuẩn các sàn lớn, chủ dự án 26/10/2026): tài khoản chưa có số → lấy chính số liên hệ
    // khách vừa gõ trong form làm số tài khoản — không bật hộp bắt gõ lại. Số mới: lưu luôn. Số đã có tài khoản / tin cũ:
    // hộp xác nhận điền sẵn số đó, tự gửi mã Zalo một lần để gộp.
    if (!asDraft && !diNap && soDaXacMinh === false && !daXacMinhXong) {
      const soDung = soTaiKhoan || chuanHoaSdt(contactPhone);
      if (!soDung) {
        setMoXacMinh(true);
        return;
      }
      const kq = await fetch("/api/xac-thuc/kiem-tai-khoan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdt: soDung }),
      }).then((r) => r.json()).catch(() => null);
      if (kq?.coTaiKhoan || Number(kq?.soTin) > 0) {
        setSoXacMinh(soDung);
        setMoXacMinh(true);
        return;
      }
      if (!soTaiKhoan) {
        if (userId) await createClient().from("profiles").update({ phone: soDung }).eq("id", userId);
        setSoTaiKhoan(soDung);
        setSoDaXacMinh(true);
      }
    }

    // VÍ KHÔNG ĐỦ TIỀN CHO GÓI ĐÃ CHỌN.
    // Không chặn khan rồi để khách mất hết công nhập: LƯU NHÁP TOÀN BỘ tin đã
    // điền, sau đó đưa thẳng sang trang nạp tiền. Nạp xong vào tin nháp bấm đăng
    // là xong, không phải nhập lại từ đầu.
    // SỐ PHẢI SO VỚI VÍ LÀ SỐ KHÁCH THỰC TRẢ = tổng đã gồm GTGT (tienThue.tongTra),
    // KHÔNG phải giá gói. Giá web niêm yết chưa gồm VAT (thue.ts: GIA_DA_GOM_VAT =
    // false) nên lấy nhầm giá gói là ví thiếu 8% mà web vẫn cho đăng.
    // VOUCHER HỘI VIÊN: lúc gửi, CSDL TẠM GIỮ đủ giá gói TRƯỚC voucher (0056 phi_tin_cho_duyet = giaBao + VAT); voucher chỉ trừ lúc
    // duyệt → kiểm ví theo số tạm giữ, không theo Tổng sau voucher (kiểm thấp hơn là khách bấm đăng bị CSDL báo thiếu ví).
    const phaiTra = truocVoucher.tongTra;
    // TIN ĐÃ ĐĂNG (đang hiển thị / đã hết hạn) — SỬA THÔNG TIN, KHÔNG phải đăng mới (chuẩn
    // Batdongsan, chốt 01/10/2026): gói, ngày đăng, hạn giữ nguyên, không tính tiền, không
    // đổi trạng thái. Đang hiển thị → bản sửa hiện NGAY, admin kiểm sau (CSDL tự đánh dấu
    // "đã sửa", 0054). Đã hết hạn → lưu nội dung, bấm Đăng lại để gửi duyệt.
    const daDang = Boolean(editId) && (editStatus === "approved" || editStatus === "expired");
    // Sửa CHÍNH tin đang chờ duyệt: tiền giữ của tin này đã nằm trong tạm giữ → cộng lại
    // phần đó vào khả dụng, chỉ so phần TĂNG thêm (đổi lên gói đắt hơn).
    const giaCu = editStatus === "pending" ? Number((chiTietGoc.current.plan as { giaBao?: number } | undefined)?.giaBao ?? 0) : 0;
    const khaDung = (hoSoVi?.balance ?? 0) + (giaCu > 0 ? tachThue(giaCu).tongTra : 0);
    const viThieu = diNap || (!asDraft && !daDang && phaiTra > 0 && khaDung < phaiTra);
    const luuNhap = asDraft || viThieu;

    setSaving(luuNhap ? "draft" : "publish");
    const values = giaTriTin(luuNhap);

    // HẠNG TIN = ĐÚNG GÓI NGƯỜI ĐĂNG ĐÃ CHỌN. Trước đây luôn ghi cứng "basic" nên
    // khách trả tiền gói Gold/Diamond mà tin vẫn nằm hạng thường, gói đã chọn chỉ
    // còn nằm trong details.plan. Tin khách vẫn qua bước admin duyệt nên không có
    // chuyện tự phong hạng cao rồi lên thẳng trang chủ.
    const hangTin: TierId = (planTier || "basic") as TierId;

    const supabase = createClient();
    let err: { message: string } | null = null;
    // Tin nháp TỰ LƯU vào tài khoản (maNhapTk) tính như đang sửa tin nháp đó — không sinh tin trùng.
    const maSua = editId ?? maNhapTk.current;
    const ttSua = editId ? editStatus : maNhapTk.current ? "draft" : "";
    let maTinNhap: string | null = maSua ?? null; // tin nháp đang chờ tiền (ví thiếu)

    if (!maSua) {
      // TIN MỚI
      const kq = await supabase
        .from("listings")
        .insert({ ...values, owner_id: uid, tier: hangTin, published_at: null })
        .select("id")
        .single();
      err = kq.error;
      maTinNhap = (kq.data as { id: string } | null)?.id ?? null;
    } else if (ttSua === "draft" && !luuNhap) {
      // ĐĂNG TIN NHÁP: tạo tin mới "chờ duyệt" + xoá nháp cũ.
      // (2 thao tác này chủ tin luôn có quyền — không phụ thuộc quyền đổi status trong DB)
      ({ error: err } = await supabase
        .from("listings")
        .insert({ ...values, owner_id: editOwner ?? uid, tier: hangTin, published_at: null }));
      if (!err) await supabase.from("listings").delete().eq("id", maSua);
    } else {
      // SỬA tin (nháp→nháp, chờ duyệt, đã duyệt…)
      const { status: _giu, ...noiDung } = values;
      void _giu;
      const capNhat = daDang
        ? { ...noiDung, details: { ...chiTietGoc.current, ...values.details, plan: chiTietGoc.current.plan } }
        : values;
      ({ error: err } = await supabase.from("listings").update(capNhat).eq("id", maSua));
      if (err && /đặc quyền|dac quyen|privileged/i.test(err.message)) {
        // DB chưa cho chủ tin đổi trạng thái (chưa chạy migration 0007)
        // → vẫn lưu TOÀN BỘ nội dung, giữ nguyên trạng thái cũ.
        const { status: _ignored, ...noStatus } = values;
        ({ error: err } = await supabase.from("listings").update(noStatus).eq("id", maSua));
      }
    }

    setSaving("");
    // Tin đã đăng đổi sang BĐS khác (0045) → nói thẳng, không kèm mã lỗi kỹ thuật.
    if (err && /BDS_KHAC/.test(err.message)) return setError(err.message.replace(/^.*BDS_KHAC:\s*/, ""));
    // CSDL chặn vì khả dụng không đủ (0056 — vd vừa tiêu tiền ở thẻ khác) → nói đúng số phải nạp.
    if (err && /VI_KHONG_DU/.test(err.message)) {
      const m = err.message.match(/(\d+)\s*đ/);
      return setError(m ? `Nạp thêm ${vnd(Number(m[1]))} để đăng tin.` : "Ví không đủ tiền để đăng tin.");
    }
    if (err) return setError(`Lưu thất bại: ${err.message}`);
    // Lưu xong (gửi duyệt hoặc lưu nháp) → tin này đã nằm trong tài khoản; tin soạn tiếp theo
    // (vd bấm "Đăng tin khác") là tin nháp MỚI, không ghi đè lên tin vừa lưu.
    maNhapTk.current = null;
    // Đo chuyển đổi cho Google Ads: chỉ tính TIN MỚI GỬI DUYỆT. Lưu nháp không
    // tính (chưa phải tin), sửa tin cũ cũng không tính (đã đếm lúc đăng lần đầu).
    if (!luuNhap && (!editId || editStatus === "draft")) banChuyenDoi("dang_tin");
    // Tin vừa vào hàng chờ duyệt → nhờ máy chủ báo khách "đã nhận tin" (máy chủ tự kiểm, không báo trùng).
    if (!luuNhap && !viThieu && (!editId || editStatus === "draft")) fetch("/api/tin-dang/da-nhan", { method: "POST" }).catch(() => {});
    // Thiếu tiền: tin đã nằm an toàn trong nháp → mời nạp ngay, kèm số còn thiếu.
    if (viThieu) {
      // Ghi "chờ nạp" (up_cho, dùng chung với Đăng lại): nạp đủ tiền là máy TỰ gửi tin
      // nháp này đi duyệt đúng gói đã chọn + báo khách — không phải quay lại bấm đăng.
      // Chỉ tin ĐỦ thông tin mới tự gửi duyệt khi nạp xong; bấm Nạp thêm lúc còn thiếu ô → nạp xong về tin điền tiếp.
      if (maTinNhap && duDeGui) {
        await fetch("/api/tin-dang/up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: maTinNhap, tier: hangTin, soNgay: planDays }),
        }).catch(() => {});
      }
      try { if (userId) localStorage.removeItem(khoaNhap(userId)); } catch {}
      setThieuTien({ can: phaiTra, du: khaDung, id: maTinNhap });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    try { if (userId) localStorage.removeItem(khoaNhap(userId)); } catch {}
    setDone(daDang ? "capNhat" : luuNhap ? "draft" : "pending");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // CHƯA BIẾT ĐĂNG NHẬP / CHƯA NẠP XONG BẢN NHÁP → giữ đúng dòng "Đang tải…" như lúc chờ trang (chủ dự án 22/10/2026:
  // mở trang đăng tin giật, nhảy lung tung). Trước đây form bung ra ngay rồi mới đổi sang khung đăng nhập, hoặc
  // bung form trống rồi các ô, bản đồ mới hiện theo bản nháp → trang dài ra từng nhịp.
  if (!authReady || (userId && !daNapNhap)) {
    return <p className="py-16 text-center text-sm text-cvr-muted">Đang tải…</p>;
  }

  // Chưa đăng nhập → mời đăng nhập (tin gắn với tài khoản để quản lý sau)
  // CHƯA ĐĂNG NHẬP → HIỆN NGAY KHUNG ĐĂNG NHẬP tại trang (chủ dự án 22/10/2026: link Đăng tin nào — Google, Zalo,
  // menu — chưa đăng nhập là ra màn hình đăng nhập, đăng nhập xong vào đúng trang). KHÔNG chuyển hướng máy chủ:
  // /dang-tin vẫn trả trang thật cho Google (có trong sitemap). Đích sau đăng nhập: dichSauDangNhap (một logic).
  // CHỈ MÁY THỬ (next dev): ?xem-thu=1 xem form không cần đăng nhập — chủ dự án duyệt giao diện trên điện thoại thật qua link
  // mạng nội bộ, nơi đăng nhập Zalo/Google không chạy. Bản thật (production) không bao giờ đi đường này.
  const xemThu = process.env.NODE_ENV !== "production" && thamSo.get("xem-thu") === "1";
  if (authReady && !userId && !xemThu) {
    return (
      <div className="flex justify-center py-4">
        <LoginForm />
      </div>
    );
  }

  // VÍ CHƯA ĐỦ TIỀN — tin đã được lưu nháp nguyên vẹn, chỉ còn thiếu tiền.
  // Đưa thẳng sang nạp tiền, kèm đúng số còn thiếu để khách khỏi phải tự tính.
  if (thieuTien) {
    const conThieu = Math.max(0, thieuTien.can - thieuTien.du);
    return (
      <div className="rounded-none border border-cvr-line bg-white p-10 text-center shadow-lux">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cvr-blue text-white">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M6 6h12a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3z" />
          </svg>
        </div>
        {/* Chủ dự án chốt 02/10/2026: nói thẳng SỐ TIỀN phải nạp + tin đã tự lưu nháp. */}
        <h3 className="text-xl font-semibold tracking-tight text-cvr-ink">Nạp thêm {vnd(conThieu)} để đăng tin</h3>

        <div className="mx-auto mt-5 max-w-sm space-y-2 rounded-xl border border-cvr-line bg-cvr-surface px-4 py-3.5 text-sm">
          <div className="flex justify-between"><span className="text-cvr-muted">Phải trả (đã gồm GTGT)</span><span className="font-semibold text-cvr-ink">{vnd(thieuTien.can)}</span></div>
          <div className="flex justify-between"><span className="text-cvr-muted">Số dư khả dụng</span><span className="font-medium text-cvr-body">{vnd(thieuTien.du)}</span></div>
          <div className="flex justify-between border-t border-cvr-line pt-2">
            <span className="font-semibold text-cvr-ink">Còn thiếu</span>
            <span className="text-base font-semibold text-cvr-blue-ink">{vnd(conThieu)}</span>
          </div>
        </div>

        {/* CTA cùng chuẩn cả vòng đăng tin + nạp tiền (26/10/2026): nút chính đen h-12 rộng hết khung, nút phụ viền cùng cỡ */}
        <div className="mx-auto mt-6 grid max-w-sm gap-2.5">
          <Link
            href={`/tai-khoan/nap-tien?can=${conThieu}&luu=1${thieuTien.id ? `&ve=${encodeURIComponent(`/dang-tin?id=${thieuTien.id}`)}` : ""}`}
            onClick={(e) => {
              // Nút Back của điện thoại từ trang nạp tiền phải về lại ĐÚNG TIN NHÁP (còn nội dung + gói), không về form trống
              // (chủ dự án 26/10/2026): đổi mốc trang này thành /dang-tin?id=<tin nháp> bằng router (Next tự ghi đè
              // replaceState tay — 27/10/2026), rồi mới sang nạp. Cờ về khối Gói tin do trang nạp ghi.
              if (!thieuTien.id || editId === thieuTien.id) return;
              e.preventDefault();
              diNapSau.current = e.currentTarget.getAttribute("href");
              router.replace(`/dang-tin?id=${thieuTien.id}`); // đổi xong (editId = tin nháp) mới sang nạp — xem diNapSau
            }}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-cvr-ink text-[15px] font-bold text-white transition hover:bg-cvr-ink/90"
          >
            Nạp tiền ngay
          </Link>
          <Link
            href="/tai-khoan/tin-dang"
            replace
            className="flex h-12 w-full items-center justify-center rounded-lg border border-cvr-line text-[15px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Xem tin nháp
          </Link>
        </div>
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
          {done === "capNhat" ? "Đã cập nhật thông tin tin đăng!" : done === "draft" ? "Đã lưu nháp!" : editId && editStatus !== "draft" ? "Đã cập nhật — tin chờ duyệt lại!" : "Tin đăng đã được gửi!"}
        </h3>
        <div className="mx-auto mt-6 grid max-w-sm gap-2.5">
          <Link href="/tai-khoan/tin-dang" replace className="flex h-12 w-full items-center justify-center rounded-lg bg-cvr-ink text-[15px] font-bold text-white transition hover:bg-cvr-ink/90">Tin đăng của tôi</Link>
          {!editId && (
            <button type="button" onClick={() => { setDone(""); setTitle(""); setImages([]); }} className="h-12 w-full rounded-lg border border-cvr-line text-[15px] font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">Đăng tin khác</button>
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
    <form
      data-vung-nhap
      // KIỂM Ô THIẾU THEO ĐÚNG THỨ TỰ TRANG (22/10/2026): tắt bóng chữ kiểm của trình duyệt — trước đây nó nhảy
      // thẳng tới ô Tiêu đề (mục 4) dù mục 1 còn thiếu. Hàm gửi tự kiểm từ mục 1 → 7, báo tiếng Việt đúng mục.
      noValidate
      // Enter ở ô MỘT DÒNG không được tự gửi tin (trước đây bấm Enter / "Đi" trên điện thoại là gửi luôn khi chưa nhập
      // xong) — nay là nút "Tiếp" sang ô kế tiếp, ô cuối "Xong" đóng bàn phím (lib/oTiepTheo, chuẩn enterkeyhint).
      // Ô nhiều dòng (textarea) vẫn xuống dòng bình thường.
      onFocus={ganNhanPhimEnter}
      onKeyDown={enterSangOTiep}
      onSubmit={(e) => { e.preventDefault(); save(false); }}
      // MÁY TÍNH HAI CỘT (chủ dự án 23/10/2026: "PC mà làm giống y mobile — PC thiếu gì không gian để tối ưu"): cột trái menu 7
      // mục dọc (đi theo chỗ đang xem, như cột menu trang Báo giá) · cột phải các mục. Điện thoại/máy tính bảng: thanh mục vuốt ngang.
      className="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <MucMoCtx.Provider value={{ moMuc, loi: error && loiBuoc ? { buoc: loiBuoc, msg: error } : undefined }}>
      <ThanhBuoc />
      <div className="mt-6 min-w-0 space-y-6 lg:mt-0">
      {nhapCho && (() => {
        const chu = (k: string) => (typeof nhapCho[k] === "string" ? (nhapCho[k] as string).trim() : "");
        const ten = chu("title") || [chu("category"), chu("province")].filter(Boolean).join(" · ");
        return (
          <div className="rounded-2xl border border-cvr-blue/30 bg-cvr-blue/[0.06] p-4">
            <p className="text-[15px] leading-snug text-cvr-ink">
              <span className="font-semibold">Bạn có tin đang soạn dở{ten ? ":" : "."}</span> {ten}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {/* eslint-disable-next-line react-hooks/refs -- apDungNhap chỉ chạy khi khách bấm, không chạy lúc vẽ */}
              <button type="button" onClick={() => { apDungNhap(nhapCho); setNhapCho(null); }}
                className="inline-flex h-10 items-center rounded-lg bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
                Soạn tiếp
              </button>
              <button type="button" onClick={() => { try { if (userId) localStorage.removeItem(khoaNhap(userId)); } catch {} setNhapCho(null); }}
                className="inline-flex h-10 items-center rounded-lg border border-cvr-line bg-white px-4 text-sm font-semibold text-cvr-ink transition hover:border-cvr-ink">
                Đăng tin mới
              </button>
            </div>
          </div>
        );
      })()}

      {xemTruoc && (
        <XemTruocTin
          row={{ ...giaTriTin(true), province: province || "", tier: (planTier || "basic") as TierId } as Parameters<typeof xemTruocTin>[0]}
          tier={planTier}
          onDong={() => setXemTruoc(false)}
          onDang={() => { setXemTruoc(false); save(false); }}
          dangLuu={saving === "publish"}
          chuaCoAnh={!images.some((x) => !isVideoUrl(x))}
        />
      )}
      {moXacMinh && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setMoXacMinh(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Thoát không đổi gì — mọi bảng nổi đều có nút thoát (chủ dự án 15/10/2026). */}
            <button type="button" aria-label="Đóng" onClick={() => setMoXacMinh(false)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-cvr-muted transition hover:bg-cvr-surface">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* Đã có số tài khoản (số đó có tài khoản/tin cũ) → mã tự gửi để gộp.
                Chưa có số → hỏi "Số điện thoại của bạn": số mới lưu luôn, số cũ mới hỏi mã. */}
            <XacMinhSdt
              tuGui={!!(soTaiKhoan || soXacMinh)}
              tieuDe={soTaiKhoan || soXacMinh ? "Xác nhận số điện thoại của bạn" : "Số điện thoại của bạn"}
              soGoiY={soTaiKhoan || soXacMinh}
              onSoMoi={async (so) => {
                const s = chuanHoaSdt(so);
                if (userId) await createClient().from("profiles").update({ phone: s }).eq("id", userId);
                setSoTaiKhoan(s);
                setSoDaXacMinh(true);
                setMoXacMinh(false);
                save(false, true);
              }}
              onXong={(_so, _gop, idMoi) => {
                if (idMoi) { uidGop.current = idMoi; setUserId(idMoi); }
                setSoDaXacMinh(true);
                setMoXacMinh(false);
                save(false, true);
              }}
            />
          </div>
        </div>
      )}

      {/* Băng rôn chế độ SỬA — nói rõ đang sửa tin nào, trạng thái gì */}
      {editId && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-none border border-cvr-blue/30 bg-cvr-blue/[0.06] px-4 py-3">
          <p className="text-sm font-medium text-cvr-blue-ink">
            Đang chỉnh sửa tin{editStatus === "draft" ? " nháp" : editStatus === "approved" ? " (đang hiển thị — lưu xong cập nhật ngay; gói và ngày đăng giữ nguyên)" : editStatus === "expired" ? " (đã hết hạn — sửa xong bấm Đăng lại)" : ""}
            {/* Quy tắc 0045: tin đã đăng chỉ sửa nội dung của chính căn đó */}
            {editStatus && editStatus !== "draft" && (
              <span className="mt-0.5 block text-[13px] font-normal text-cvr-body">
                Mục đích, loại hình và địa chỉ giữ nguyên — bất động sản khác vui lòng đăng tin mới.
              </span>
            )}
          </p>
          <Link href="/tai-khoan/tin-dang" className="text-sm font-medium text-cvr-muted transition hover:text-cvr-ink">← Về danh sách tin</Link>
        </div>
      )}

      {/* ── 7 BƯỚC THEO THỨ TỰ NGƯỜI ĐĂNG TRÊN ĐIỆN THOẠI (chủ dự án 15/10/2026): thanh bước = các mục,
          số thứ tự khớp nhau. Gói chọn TRƯỚC ảnh (10/10/2026: số ảnh / video tối đa theo gói).
          Ô bắt buộc có dấu *; thiếu thì báo lỗi và tự mở đúng bước có ô đó (baoLoi). ── */}
      {/* 1. Loại tin & vị trí */}
      <Card id="b-loai" step={buoc()} title="Loại hình & địa chỉ" khoa={editStatus === "approved"}>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Tin cũ có nhu cầu đã tạm ẩn (Cần mua / Cần thuê) vẫn hiện đúng giá trị của nó khi sửa */}
          <Pick label="Nhu cầu *" value={demand} onChange={setDemand} options={demandTypes.includes(demand) ? demandTypes : [...demandTypes, demand]} />
          {/* Loại hình theo NHÓM cho dễ tìm — cùng danh mục với bộ lọc của web */}
          <div id="o-loaihinh">
            <Label>Loại hình bất động sản *</Label>
            {/* CÙNG MỘT KIỂU BẢNG CHỌN với Tỉnh / Phường (chủ dự án 22/10/2026: ô chọn gốc của điện thoại hiện to,
                khó nhìn, không rõ cách chọn / thoát) — bảng riêng, nút quay lại, kính lúp để tìm. Thứ tự theo nhóm. */}
            <ChonCoTim
              value={loaiHinh}
              onChange={(v) => { setCategory(v); setSpecValues({}); }}
              options={nhomLoaiHinh.flatMap((g) => g.items)}
              nhom={nhomLoaiHinh}
              placeholder="Chọn loại hình"
              timPlaceholder=""
              khongTim
              className={inputCls}
            />
          </div>
        </div>
        <TieuDeCon>Địa chỉ bất động sản</TieuDeCon>
        {/* Chọn hệ đơn vị hành chính: MỚI (sau sáp nhập) hay CŨ */}
        {/* HAI NÚT CHIA ĐÔI HÀNG, CHỮ KHÔNG GÃY DÒNG. Nhãn cũ dài gần 30 ký tự nên
            trên điện thoại 375px hộp bị bóp, chữ rớt xuống hai dòng và nút bên cạnh
            cũng vỡ theo ("Địa chỉ / cũ") — chủ dự án chụp lại đúng chỗ này. */}
        <div className="mb-3 grid w-full grid-cols-2 gap-1 rounded-lg border border-cvr-line bg-white p-1 sm:max-w-md">
          {([
            { id: "moi" as GeoMode, label: "Địa chỉ mới" },
            { id: "cu" as GeoMode, label: "Địa chỉ cũ" },
          ]).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                  if (m.id === geoMode) return;
                  // ĐỔI HỆ = TỰ ĐỒNG BỘ: suy thẳng địa chỉ đang nhập sang hệ vừa
                  // chọn, không bắt người đăng chọn lại từ tỉnh.
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
                  // Đổi hệ là đổi luôn phường/xã đang chọn → lựa chọn cũ không còn
                  // thuộc về nó nữa, phải bỏ chứ không được để lại giá trị lạc.
                  setPhuongCu("");
                  const dc = diaGioiTuBanDoRef.current;
                  // Theo HỆ VỪA CHỌN (m.id) — gọi nhanDiaGioiTuBanDo ở đây là dùng hệ cũ của lượt vẽ trước, điền sai hệ.
                  if (dc && !d.ward) setTimeout(() => apDungDiaGioi(dc, m.id, d.province, d.district, ""), 0);
                }}
              className={`whitespace-nowrap rounded-md px-2 py-2 text-center text-[13px] font-medium transition ${
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
        <div id="o-tinh" className={`grid grid-cols-2 gap-3 sm:gap-4 ${coDanhMucQuan ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <PickTim label="Tỉnh / Thành *" value={province} onChange={(v) => {
            if (v !== province) diaChiMoi();
            setProvince(v); setDistrict(""); setWard("");
            // Đổi tỉnh → dự án đang chọn không thuộc tỉnh mới thì bỏ (tự ghi tên thì giữ)
            const o = projectOptions.find((x) => x.slug === projectSlug);
            if (o && !duAnHopTinh(o, v)) { setProjectSlug(""); setProjectName(""); }
          }} options={provinceOptions} placeholder="Chọn Tỉnh / Thành" timPlaceholder="Tìm Tỉnh / Thành" bietDanh={bietDanhTinh(geoMode, provinceOptions)} />
          {coDanhMucQuan && (
            <PickTim label="Quận / Huyện" value={district} onChange={(v) => { if (v !== district) diaChiMoi(); setDistrict(v); setWard(""); }} options={districts} placeholder="Chọn Quận / Huyện" timPlaceholder="Tìm Quận / Huyện" disabled={!province} />
          )}
          <PickTim label="Phường / Xã" value={ward} onChange={(v) => { if (v !== ward) diaChiMoi(); setWard(v); setPhuongCu(""); }} options={wards} placeholder="Chọn Phường / Xã" timPlaceholder="Tìm Phường / Xã" bietDanh={geoMode === "moi" ? bietDanhPhuongMoi(province, wards) : undefined} disabled={geoMode === "moi" ? !province : coDanhMucQuan ? !district : !province} />
          {/* THUỘC DỰ ÁN NẰM TRONG NHÓM ĐỊA CHỈ (chủ dự án 22/10/2026: để dưới bản đồ, tiêu đề riêng thì khách không hiểu,
              dễ bỏ qua) — một hàng ngay sau Tỉnh / Phường, nhãn như các ô địa chỉ; chỉ liệt kê dự án của tỉnh đã chọn. */}
          <div className="col-span-full min-w-0">
            <Label>Thuộc dự án</Label>
            {/* CHỌN DỰ ÁN — CÙNG CẤU TRÚC MỌI Ô CHỌN (chủ dự án 15/10/2026): dự án có sẵn thì chọn trong
                danh sách; không có thì chọn "Khác — tự ghi", ô ghi tên hiện NGAY DƯỚI. Danh sách dài nên
                "Khác — tự ghi" đứng ĐẦU danh sách (khỏi kéo hết mới thấy); có kính lúp để tìm.
                · Chọn dự án có sẵn → tin NỐI vào trang dự án (mã dự án — bộ lọc Dự án, trang dự án,
                  "Tin liên quan tại dự án", liên kết nội bộ cho SEO đều chạy theo mã này).
                · Tự ghi tên TRÙNG dự án có sẵn (khác hoa/thường, dấu) → cũng nối luôn (slugDuAn).
                · Tên chưa có trang dự án → lưu nguyên tên; sau này tạo trang dự án đúng tên đó là tin
                  tự về trang dự án. LUÔN hiện đúng tên dự án tin đang gắn. */}
            <ChonCoTim
              value={projectSlug === DU_AN_KHAC ? DU_AN_TU_GHI
                : projectSlug ? projectOptions.find((o) => o.slug === projectSlug)?.name ?? (projectName || projectSlug)
                : ""}
              onChange={(v) => {
                if (!v) { setProjectSlug(""); setProjectName(""); return; }
                if (v === DU_AN_TU_GHI) { setProjectSlug(DU_AN_KHAC); setProjectName(""); return; }
                const o = projectOptions.find((x) => x.name === v);
                if (o) { setProjectSlug(o.slug); setProjectName(o.name); }
              }}
              options={[DU_AN_TU_GHI, ...duAnTrongTinh.map((o) => o.name)]}
              xoaDuoc
              placeholder="Chọn dự án"
              timPlaceholder="Tìm dự án"
              className={inputCls}
            />
            {projectSlug === DU_AN_KHAC && (
              <OGoTuGian value={projectName} onChange={setProjectName} placeholder="Tên dự án" autoFocus={!projectName} className={inputCls + " mt-2"} />
            )}
          </div>
        </div>
        {/* Ô "Phường / Xã trước sáp nhập" ĐÃ BỎ theo yêu cầu chủ dự án 14/10/2026. */}
        {/* Dòng "Tin sẽ hiện: … · Địa chỉ cũ: …" dưới địa chỉ ĐÃ BỎ (chủ dự án 22/10/2026: khách đã thấy địa chỉ mình
            chọn, không cần nhắc lại). Trang tin vẫn hiện địa chỉ hai hệ như cũ. */}

        {/* THANH ĐỊA CHỈ LÀ Ô RIÊNG, NẰM NGOÀI BẢN ĐỒ — chủ dự án chốt.
            Gõ tới đâu bản đồ bên dưới tự thu lại và trôi tới đó; ghim trên bản đồ
            thì ô này tự điền ngược lại. ĐỪNG nhét ô này vào trong khung bản đồ. */}
        {/* Ô ĐỊA CHỈ NỔI RÕ (chủ dự án 22/10/2026 tối: "nhìn không ra chỗ này — làm gì để khách biết đây là phần gõ địa chỉ"):
            nhãn to đậm như mục con, ô cao hơn chữ 16px, ghim đỏ đầu ô cùng màu ghim bản đồ ngay dưới. Ô khác giữ kiểu thường. */}
        <div className="mt-1">
          <label className="mb-2 block text-[16px] font-semibold text-cvr-ink">
            Địa chỉ cụ thể <span className="text-[13px] font-normal text-cvr-muted">(số nhà, tên đường, số lô, block…)</span>
          </label>
          <ODiaChiGoiY
            ghim
            value={addressDetail}
            onChange={setAddressDetail}
            onChonDiem={(p) => setDiemGoiY({ ...p, n: Date.now() })}
            placeholder="VD: 123 Võ Nguyên Giáp · Lô A12 khu B · Block 3 · hoặc chỉ tên đường"
            khuVuc={(() => { const d = diemTimBanDo(geoMode, { tinh: province, quan: district, phuong: ward }); return { tinh: d.tinh, phuong: d.phuong }; })()}
            className="h-12 w-full rounded-lg border-[1.5px] border-cvr-ink/35 bg-white pl-10 pr-3 text-[16px] text-cvr-ink placeholder-cvr-faint caret-cvr-blue outline-none transition focus:border-cvr-blue focus:ring-1 focus:ring-cvr-blue"
          />
        </div>
        {/* Bản đồ LUÔN hiện (chủ dự án 22/10/2026 bác cách ẩn tới khi chọn tỉnh) — bản gọn: thấp hơn trên điện thoại,
            vuốt một ngón là cuộn trang (MapPickerMo). */}
        <div className="mt-3">
          <MapPicker
            value={mapPin}
            onChange={setMapPin}
            diemChon={diemGoiY}
            onDiaChi={setAddressDetail}
            onDiaGioi={nhanDiaGioiTuBanDo}
            hint={chuoiTimBanDo(geoMode, { tinh: province, quan: district, phuong: ward }, addressDetail)}
            tim={diemTimBanDo(geoMode, { tinh: province, quan: district, phuong: ward }, addressDetail)}
          />
        </div>
      </Card>

      {/* 2. Thông tin chính */}
      <Card id="b-thongtin" step={buoc()} title="Thông tin chính">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <div id="o-gia" className="sm:col-span-2">
            <Label>{laThue ? "Giá thuê *" : "Giá bán *"}</Label>
            {/* ĐIỆN THOẠI: ô nhập giá chiếm TRỌN một hàng, ô đơn vị xuống hàng dưới.
                Trước đây hai ô nằm cùng hàng mà ô đơn vị lại mang cả w-full lẫn
                w-32 (hai lớp chiều rộng đá nhau) nên nó chiếm gần hết, ô nhập giá
                teo lại chỉ còn một mẩu, không gõ nổi. Từ màn hình sm trở lên mới
                xếp cạnh nhau, cột đơn vị cố định 9rem. */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_9rem]">
              {/* KHÔNG dùng type="number": trình duyệt loại bỏ dấu PHẨY nên khách gõ
                  "4,2" (đúng như gợi ý trong ô) thì ô thành rỗng, không lưu được giá.
                  Dùng text, không ép bàn phím số: khách gõ được mọi ký tự (chủ dự án 10/10/2026). */}
              {donVi === KHAC_GIA
                ? <OGoTuGian value={giaTuGhi} onChange={setGiaTuGhi} className={inputCls} />
                : <input type="text" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} disabled={donVi === "Thoả thuận"} placeholder={goiYGia(donVi)} className={inputCls + " disabled:opacity-50"} />}
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

            {/* NHẮC ĐÚNG ĐƠN VỊ CHO KHO XƯỞNG · VĂN PHÒNG · MẶT BẰNG.
                Nhóm này báo giá theo m², nhưng ô đơn vị mặc định là "triệu/tháng"
                → người đăng gõ 35 thành 35 triệu/tháng trong khi ý là 35.000 đ/m².
                Chỉ GỢI Ý kèm nút đổi, KHÔNG tự đổi đơn vị của người ta. */}
            {donViGiaNenDung(loaiHinh, laThue) && donVi !== donViGiaNenDung(loaiHinh, laThue) && (
              <button
                type="button"
                onClick={() => setPriceUnit(donViGiaNenDung(loaiHinh, laThue) as string)}
                className="mt-1.5 block w-full rounded-lg bg-cvr-blue/[0.06] px-3 py-2 text-left text-xs leading-relaxed text-cvr-blue-ink transition hover:bg-cvr-blue/[0.12]"
              >
                Kho xưởng · văn phòng · mặt bằng thường báo giá <strong>nghìn/m²/tháng</strong> (gõ 35 = 35.000 đ/m²/tháng). Bấm để đổi đơn vị →
              </button>
            )}

            {/* Đơn giá theo m² thì phải cho thấy THÀNH TIỀN mỗi tháng — đó mới là
                con số hiện trên tin và khách thuê dùng để so sánh. */}
            {donVi === "nghìn/m²/tháng" && priceValue.trim() && (
              <p className="mt-1.5 text-xs text-cvr-muted">
                {area.trim() ? (
                  <>
                    {priceValue} nghìn/m² × {area} m² ={" "}
                    <strong>{Math.round(((priceToVnd() ?? 0) / 1e6) * 10) / 10} triệu/tháng</strong> — số này hiện trên tin.
                  </>
                ) : (
                  <>Nhập <strong>diện tích</strong> để web tính ra thành tiền mỗi tháng.</>
                )}
              </p>
            )}
          </div>
          <div id="o-dientich">
            <Label>{nhanDienTich(loaiHinh)} *</Label>
            <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder={goiYDienTich(loaiHinh)} className={inputCls} />
          </div>
        </div>
        {/* CHỈ HIỆN MỤC THUỘC LOẠI HÌNH ĐANG CHỌN — đất nền không có phòng ngủ,
            phòng tắm hay diện tích xây dựng; kho xưởng/mặt bằng không có phòng ngủ.
            Số cột co theo số mục còn lại nên không bao giờ chừa ô trống lửng lơ. */}
        {(() => {
          const oChinh = [
            coDienTichXayDung(loaiHinh) && (
              <div key="dtxd">
                <Label>Diện tích sử dụng (m²)</Label>
                <input type="text" value={builtArea} onChange={(e) => setBuiltArea(e.target.value)} placeholder="VD: 95" className={inputCls} />
              </div>
            ),
            coPhongNgu(loaiHinh) && (
              <div key="pn">
                <Label>Số phòng ngủ</Label>
                <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="VD: 3" className={inputCls} />
              </div>
            ),
            coPhongTam(loaiHinh) && (
              <div key="pt">
                <Label>Số phòng tắm</Label>
                <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="VD: 2" className={inputCls} />
              </div>
            ),
          ].filter(Boolean);
          if (!oChinh.length) return null;
          const cot = oChinh.length === 1 ? "" : oChinh.length === 2 ? " sm:grid-cols-2" : " sm:grid-cols-3";
          // Điện thoại: ô số ngắn (diện tích, phòng ngủ, phòng tắm…) xếp 2 cột cho gọn (chủ dự án 22/10/2026).
          return <div className={`grid min-w-0 ${oChinh.length === 1 ? "grid-cols-1" : "grid-cols-2"} items-end gap-3 sm:gap-4${cot}`}>{oChinh}</div>;
        })()}

        {/* THÔNG TIN CHÍNH RIÊNG CỦA LOẠI HÌNH — đất thì chiều ngang · chiều dài ·
            đường vào · loại đất; căn hộ thì tầng số; nhà thì số tầng · mặt tiền…
            Lưới 2/3 cột tự co theo số mục nên không chừa ô trống, không xén chữ. */}
        {specChinh.length > 0 && (
          <div className={`mt-4 grid min-w-0 grid-cols-2 items-end gap-3 sm:gap-4 ${specChinh.length === 2 ? "sm:grid-cols-2" : specChinh.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
            {specChinh.map(oNhapSpec)}
          </div>
        )}
      </Card>

      {/* 3. Đặc điểm & tiện ích (không bắt buộc) — Ô CHỈ BÀY KHI ĐÃ CHỌN LOẠI HÌNH (chủ dự án 23/10/2026: "vào đăng tin, chưa bấm
          gì đã hiện Đặc điểm — Condotel / Nghỉ dưỡng"): mọi ô ở đây theo đúng loại hình. Chưa chọn thì mục chỉ có tiêu đề, mờ —
          vẫn giữ chỗ để SỐ MỤC KHÔNG NHẢY (chủ dự án 23/10/2026: "menu vì sao mobile 7 mục mà PC 6 mục" — Gói tin luôn là mục 5). */}
      <Card id="b-dacdiem" step={buoc()} title="Đặc điểm & tiện ích" chiTieuDe={!loaiHinh}>
      {loaiHinh && (<>
        {/* Chủ dự án 22/10/2026: mục BẮT BUỘC luôn hiện; mục không bắt buộc thu gọn trong khối ẩn/hiện, theo đúng
            loại hình khách chọn (danh sách ô lấy từ listingSpec — đất không có nội thất…). */}
        {specDacDiem.some((f) => f.batBuoc) && (
          <div className="mb-3 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specDacDiem.filter((f) => f.batBuoc).map(oNhapSpec)}
          </div>
        )}
        <div className="space-y-3">
        <MucAnHien
          ten={`Đặc điểm — ${loaiHinh}`}
          goiY={goiYDanhSach([...specDacDiem.filter((f) => !f.batBuoc).map((f) => f.label), "Hướng nhà / đất", "Tình trạng pháp lý"])}
          soChon={specDacDiem.filter((f) => !f.batBuoc && String(specValues[f.key] ?? "").trim()).length + [direction, legal].filter((x) => String(x ?? "").trim()).length}
        >
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specDacDiem.filter((f) => !f.batBuoc).map(oNhapSpec)}
          {/* Trường DÙNG CHUNG mọi loại hình: Hướng · Pháp lý (Tình trạng nội thất chuyển vào khối Nội thất) */}
          <div>
            <Label>Hướng nhà / đất</Label>
            <ChonHoacGhi value={direction} onChange={setDirection} options={directions} className={inputCls} />
          </div>
          <div>
            <Label>Tình trạng pháp lý</Label>
            {/* Danh mục theo ĐÚNG loại hình: đất chỉ sổ đỏ, căn hộ chỉ sổ hồng. Giá trị ngoài danh
                mục (tin cũ, khách tự ghi) hiện ở ô gõ, không bị xoá. */}
            <ChonHoacGhi value={legal} onChange={setLegal} options={phapLyCho(loaiHinh)} className={inputCls} />
          </div>
        </div>
        </MucAnHien>
        {/* Nội thất — ĐẤT và KHO XƯỞNG không có nội thất nên ẩn hẳn.
            NỘI THẤT MỘT CHỖ (chủ dự án 22/10/2026: "Tình trạng nội thất" và danh sách nội thất từng tách xa nhau).
            Chọn tình trạng trước; có nội thất (cơ bản / đầy đủ / cao cấp) — hoặc tin đã tick sẵn — mới hiện danh sách. */}
        {coNoiThat(loaiHinh) && (
          <MucAnHien ten="Nội thất" goiY={furnish || goiYDanhSach(interiorItems)} soChon={interior.length + (furnish ? 1 : 0)}>
          <div>
            <Label>Tình trạng nội thất</Label>
            <ChonHoacGhi value={furnish} onChange={setFurnish} options={furnishLevels} className={inputCls} />
          </div>
          {(/^Nội thất/.test(furnish) || interior.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {interiorItems.map((it) => (
              <Chip key={it} active={interior.includes(it)} onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
            ))}
            {/* Mục khách tự ghi — bấm để bỏ */}
            {interior.filter((it) => !interiorItems.includes(it)).map((it) => (
              <Chip key={it} active onClick={() => toggle(interior, setInterior, it)}>{it}</Chip>
            ))}
            <ThemTuGhi boc="" onThem={(v) => setInterior((ds) => (ds.includes(v) ? ds : [...ds, v]))} className={inputCls} />
          </div>
          )}
          </MucAnHien>
        )}
        <MucAnHien ten="Tiện ích" goiY={goiYDanhSach(tienIchCho(loaiHinh).flatMap((g) => g.items))} soChon={amenities.length}>
        <div className="space-y-4">
          {tienIchCho(loaiHinh).map((g) => (
            <div key={g.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cvr-faint">{g.group}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <Chip key={it} active={amenities.includes(it)} onClick={() => toggle(amenities, setAmenities, it)}>{it}</Chip>
                ))}
              </div>
            </div>
          ))}
          {/* Tiện ích khách tự ghi — bấm để bỏ */}
          {(() => {
            const chuan = new Set(amenityGroups.flatMap((g) => g.items));
            const khac = amenities.filter((it) => !chuan.has(it));
            return (
              <div className="flex flex-wrap gap-2">
                {khac.map((it) => <Chip key={it} active onClick={() => toggle(amenities, setAmenities, it)}>{it}</Chip>)}
                <ThemTuGhi boc="" onThem={(v) => setAmenities((ds) => (ds.includes(v) ? ds : [...ds, v]))} className={inputCls} />
              </div>
            );
          })()}
        </div>
        </MucAnHien>
        </div>
      </>)}
      </Card>

      {/* 4. Tiêu đề & mô tả */}
      <Card id="b-mota" step={buoc()} title="Tiêu đề & mô tả">
        {/* TIÊU ĐỀ — ô tự giãn cao để LUÔN THẤY TRỌN CÂU. Ô một dòng làm phần
            đầu tiêu đề trôi mất khỏi khung, người đăng không soát lại được. */}
        <div id="o-tieude">
          <Label>Tiêu đề tin đăng *</Label>
          <OTieuDe value={title} onChange={setTitle} placeholder={goiYTieuDe(loaiHinh, laThue)} className={inputCls} required />
        </div>
        <div>
          <Label>Mô tả chi tiết</Label>
        {/* Cùng bộ công cụ với trang quản trị: in đậm · in nghiêng · canh
            trái/giữa/phải/đều · chèn ảnh, video giữa bài. */}
        <ContentEditor
          value={description}
          onChange={setDescription}
          rows={5}
          placeholder="Mô tả vị trí, kết cấu, tiện ích, pháp lý, lý do bán… (nội dung càng đầy đủ càng dễ chốt)"
        />
        </div>
      </Card>

      {/* Chọn gói hiển thị — giá và khuyến mãi do quản trị đặt ở /admin/gia-khuyen-mai */}
      <Card id="b-goi" step={buoc()} title="Gói tin — thanh toán *">
        {goiDangDung ? (
          // TIN ĐÃ ĐĂNG đang sửa: gói cố định (chuẩn Batdongsan) — chỉ hiện gói đang dùng.
          <div className="rounded-2xl border border-cvr-line bg-cvr-surface px-5 py-4 text-sm text-cvr-body">
            <Dong nhan="Loại tin" giaTri={getTier(goiDangDung.tier).name} />
            <Dong
              nhan={editStatus === "expired" ? "Đã hết hạn" : "Hiển thị đến"}
              giaTri={goiDangDung.het ? new Date(goiDangDung.het).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—"}
            />
            <p className="mt-3 text-xs text-cvr-muted">
              {editStatus === "expired" ? "Chọn gói mới khi bấm Đăng lại trong Tin đăng của tôi." : "Sửa thông tin không đổi gói, ngày đăng và thời hạn."}
            </p>
          </div>
        ) : (
          <>
            {/* MỤC GÓI TIN — HAI PHẦN (chủ dự án 23/10/2026: "có 2 loại là Chương trình và Chọn giá; bố trí gọn menu và bố cục để
                logic"): "Chương trình" = chương trình admin đang chạy, hiện đúng thông tin đã đặt · "Chọn giá" = phần chính, giá gói
                tin theo cấp, hiển thị như trang Báo giá. Không có chương trình nào đang chạy → không menu, chỉ phần Chọn giá. Mở sẵn:
                khách hưởng được chương trình → Chương trình; còn lại → Chọn giá. Tổng tiền chung bên dưới. Mọi số lấy từ admin. */}
            {coChuongTrinh && (
              <div className="mb-4 grid grid-cols-2 border-b border-cvr-line" role="tablist" aria-label="Gói tin">
                {([["ct", "Chương trình"], ["gia", "Chọn giá"]] as const).map(([id, ten]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={phanDang === id}
                    onClick={() => setPhanGoi(id)}
                    className={`relative -mb-px flex h-11 items-center justify-center px-3 text-[15px] transition after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t hover:text-cvr-ink ${phanDang === id ? "font-bold text-cvr-ink after:bg-cvr-gold" : "font-semibold text-cvr-muted after:bg-transparent"}`}
                  >
                    {ten}
                  </button>
                ))}
              </div>
            )}

            {phanDang === "ct" ? (
            <div className="space-y-2.5">
            {/* GÓI KHUYẾN MÃI — chương trình admin đã duyệt. Đúng đối tượng mới bấm chọn được; không đúng vẫn hiện, mờ, khoá. */}
            {coGoiKm && (
              <button
                type="button"
                disabled={!duocChonKm}
                aria-pressed={chonKm}
                onClick={() => {
                  if (chonKm) { setChonKm(false); setPlanTier(""); setPlanDays(0); return; }
                  setChonKm(true); setPlanTier(goiMp); setPlanDays(ngayMp);
                }}
                className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                  chonKm ? "border-cvr-blue bg-cvr-blue/[0.08] ring-1 ring-cvr-blue" : duocChonKm ? "border-cvr-blue/40 bg-cvr-blue/[0.04]" : "cursor-not-allowed border-cvr-line bg-cvr-surface opacity-60"
                }`}
              >
                {/* LÀ CHƯƠNG TRÌNH, KHÔNG PHẢI MỘT GÓI (chủ dự án 22/10/2026): Tên đúng như admin đặt + Nội dung — một hàm
                    chuongTrinhTvMoi dùng chung toàn web. */}
                <NoiDungChuongTrinh ct={chuongTrinhTvMoi(billing)} />
                <span className="mt-1 shrink-0 text-[16px] font-semibold tabular-nums text-cvr-blue-ink">0 ₫</span>
              </button>
            )}
            {/* CHƯƠNG TRÌNH GIẢM GIÁ — admin đã duyệt, tự trừ vào gói đúng đối tượng khi tính tiền. */}
            {ctKhac.map((p) => (
              <div key={p.id} className={`flex items-center justify-between gap-3 rounded-2xl border border-cvr-line px-4 py-3.5 ${hopCtKhac(p) ? "bg-white" : "bg-cvr-surface opacity-60"}`}>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-cvr-ink">{p.name}</span>
                  <span className="mt-0.5 block text-[13px] text-cvr-muted">
                    {p.tiers.length ? p.tiers.map((t) => getTier(t).name).join(" · ") : "Mọi gói tin"}
                    {p.to ? ` · đến ${ngayVn(p.to)}` : ""}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-red-300 px-2 py-0.5 text-[13px] font-semibold text-red-700">−{p.percent}%</span>
              </div>
            ))}
            </div>
            ) : (
            <>
            {/* CHỌN GIÁ — bảng giá như trang Báo giá (ma trận cả điện thoại lẫn máy tính), bấm ô nào chọn gói đó. Giá từ admin.
                Không khung viền xanh bật/tắt theo lúc chưa chọn / đã chọn (chủ dự án 23/10/2026: dòng VAT nằm trong khung, khung lúc
                có lúc không) — dòng "Giá đã gồm VAT" nằm ngay dưới bảng như trang Báo giá. */}
            <BangGiaGoiTin
              plans={plansChon}
              chon={{ tier: chonKm ? "" : planTier, days: planDays }}
              onChon={(t, d) => { setChonKm(false); setPlanTier(t); setPlanDays(d); }}
              onBoChon={() => { setChonKm(false); setPlanTier(""); setPlanDays(0); }}
              kieuBaoGia
              canhVat={
                <button type="button" aria-haspopup="dialog" onClick={() => setXemTinMau(true)} className="inline-flex shrink-0 items-center gap-0.5 text-[13.5px] font-semibold text-cvr-blue-ink hover:underline">
                  Mẫu tin hiển thị
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              }
            />
            {/* TIN HIỂN THỊ (chủ dự án 23/10/2026: "phần dưới báo giá chỉ đưa mục Tin hiển thị vào thôi"; "làm cái bảng xem — bấm vào xem,
                bấm X tắt"; "để nút này ở đâu cho hợp lý"): chữ bấm cùng hàng dòng VAT, ngay dưới bảng giá (canhVat), bấm mở BẢNG NỔI thẻ tin mẫu (tới đúng gói đang chọn). Đóng: X · chạm ra ngoài · nút
                Quay lại điện thoại (useKhoaCuon ở trên). */}
            {xemTinMau && (
              // BẢNG RIÊNG, KHÔNG GIỐNG MỘT TRANG (chủ dự án 23/10/2026): khung gọn giữa màn hình, nền tối bao quanh bốn phía, bo góc,
              // đổ bóng — điện thoại vừa một thẻ (thấy mép thẻ sau), máy tính hai thẻ rưỡi.
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4" onClick={() => setXemTinMau(false)}>
                <div
                  role="dialog"
                  aria-label="Mẫu tin hiển thị"
                  className="max-h-[85dvh] w-full max-w-[21.5rem] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10 sm:max-w-2xl sm:p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[16px] font-semibold text-cvr-ink">Mẫu tin hiển thị</p>
                    <button type="button" aria-label="Đóng" onClick={() => setXemTinMau(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-cvr-ink transition hover:bg-cvr-surface">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <TinHienThiMau chon={planTier} gon />
                </div>
              </div>
            )}
            </>
            )}

            {/* THANH TOÁN — đủ từng khoản như Batdongsan; các dòng cộng lại đúng bằng tổng */}
            {planTier && (
              <>
              {/* BẮT ĐẦU HIỂN THỊ (chủ dự án 23/10/2026: "có 2 lựa chọn — Ngay khi được duyệt và Chọn ngày; chọn ngày thì lên cái lịch và
                  chọn ngày"): nút đôi cùng kiểu Địa chỉ mới / cũ; Chọn ngày → ô lịch của máy (mặc định ngày mai, tối đa 30 ngày tới, giờ
                  VN). Duyệt xong tin "Chờ hiển thị", 0h ngày đó mới lên; ngày đăng + hạn tính từ ngày đó (api/tin-dang/duyet). */}
              <div id="b-thanhtoan" className="mt-5 scroll-mt-[70px]">
                <p className="text-[15px] font-semibold text-cvr-ink">Bắt đầu hiển thị</p>
                <div className="mt-2 grid w-full grid-cols-2 gap-1 rounded-lg border border-cvr-line bg-white p-1 sm:max-w-md">
                  {([["", "Ngay khi được duyệt"], ["chon", "Chọn ngày"]] as const).map(([id, ten]) => {
                    const dang = id === "chon" ? !!batDau : !batDau;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={dang}
                        onClick={() => setBatDau(id === "chon" ? batDau || ngayVnSau(1) : "")}
                        // Hai nút cao bằng nhau, chữ xuống dòng được — màn hẹp không bị cắt chữ (chủ dự án 26/10/2026)
                        className={`flex min-h-11 items-center justify-center rounded-md px-2 py-2 text-center text-[14px] font-medium leading-tight transition ${dang ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"}`}
                      >
                        {ten}
                      </button>
                    );
                  })}
                </div>
                {batDau && (
                  <div className="relative mt-2 sm:max-w-xs">
                  {/* ĐIỆN THOẠI: lịch của máy (to, quen tay). Luôn hiện ngày kiểu Việt (24/10/2026) — ô lịch nằm phủ trong suốt bên trên,
                      chạm là mở lịch (trình duyệt tiếng Anh tự hiện kiểu Mỹ 10/24/2026 nếu để lộ ô gốc). */}
                  <label className={`${inputCls} relative flex cursor-pointer items-center justify-between sm:hidden`}>
                    <span className="tabular-nums">{batDau.split("-").reverse().join("/")}</span>
                    <svg className="h-5 w-5 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" /></svg>
                    <input
                      type="date"
                      value={batDau}
                      min={ngayVnSau(1)}
                      max={ngayVnSau(30)}
                      onChange={(e) => setBatDau(e.target.value)}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch { /* máy không có showPicker: chạm vẫn mở lịch */ } }}
                      aria-label="Ngày bắt đầu hiển thị"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  {/* MÁY TÍNH: bảng lịch riêng, to, rõ (chủ dự án 23/10/2026: "bấm lịch lên nhìn nhỏ xíu") — LichChonNgay */}
                  <button type="button" aria-haspopup="dialog" onClick={() => setMoLich(true)} className={`${inputCls} hidden items-center justify-between text-left sm:flex`}>
                    <span className="tabular-nums">{batDau.split("-").reverse().join("/")}</span>
                    <svg className="h-5 w-5 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" /></svg>
                  </button>
                  {moLich && <LichChonNgay value={batDau} min={ngayVnSau(1)} max={ngayVnSau(30)} onChon={setBatDau} onDong={() => setMoLich(false)} />}
                  </div>
                )}
              </div>
              <div className="mt-5 rounded-2xl border border-cvr-line bg-cvr-surface px-4 py-3.5 text-sm text-cvr-body">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-cvr-ink">Tổng tiền</span>
                    <span className="mt-0.5 block text-[12.5px] text-cvr-muted">
                      {getTier(planTier as TierId).name} · {soNgayThat} ngày · {batDau ? batDau.split("-").reverse().join("/") : "Ngay khi được duyệt"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xl font-bold tabular-nums tracking-tight text-cvr-ink">{thanhTien > 0 ? vnd(tienThue.tongTra) : "0 ₫"}</span>
                    <button type="button" onClick={() => setXemChiTietTien(!xemChiTietTien)} aria-expanded={xemChiTietTien} className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-cvr-blue-ink">
                      Chi tiết
                      <svg className={`h-3.5 w-3.5 transition ${xemChiTietTien ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </span>
                </div>
                {xemChiTietTien && (
                <div className="mt-3 border-t border-cvr-line pt-2">
                {!duocMienPhi && <Dong nhan="Đơn giá / ngày" giaTri={vnd(planDays > 0 ? Math.round(baoGia.base / planDays) : 0)} />}
                {duocMienPhi ? (
                  <Dong nhan={chuongTrinhTvMoi(billing).ten || "Ưu đãi thành viên mới"} giaTri="Miễn phí" nhan2 />
                ) : (
                  <>
                    <Dong nhan="Phí đăng tin" giaTri={vnd(baoGia.base)} />
                    {baoGia.promo && baoGia.promoOff > 0 && (
                      <Dong nhan={`Khuyến mãi: ${baoGia.promo.name} (−${baoGia.promo.percent}%)`} giaTri={`− ${vnd(baoGia.promoOff)}`} nhan2 />
                    )}
                    {baoGia.levelOff > 0 && <Dong nhan="Ưu đãi hạng thành viên" giaTri={`− ${vnd(baoGia.levelOff)}`} nhan2 />}
                    {giamVoucher > 0 && <Dong nhan="Voucher hội viên" giaTri={`− ${vnd(giamVoucher)}`} nhan2 />}
                    {thanhTien > 0 && (
                      <>
                        {/* Tạm tính chỉ hiện khi CÓ giảm (khuyến mãi / ưu đãi / voucher) — không giảm thì nó lặp y số Phí đăng tin (chủ dự án
                            23/10/2026: "xem lại cách tính tiền"). Phép cộng luôn đúng: Phí − giảm = Tạm tính; Tạm tính + VAT = Tổng tiền. */}
                        {tienThue.tienHang !== baoGia.base && <Dong nhan="Tạm tính" giaTri={vnd(tienThue.tienHang)} />}
                        <Dong nhan={`VAT ${(THUE_SUAT_GTGT * 100).toFixed(0)}%`} giaTri={vnd(tienThue.tienThue)} />
                      </>
                    )}
                  </>
                )}
                </div>
                )}
                {/* Số dư ví ngay tại chỗ — biết thiếu TRƯỚC khi bấm đăng, nạp được ngay. */}
                {thanhTien > 0 && hoSoVi && (
                  <div className="mt-3 rounded-xl bg-white px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-cvr-muted">
                        {tamGiu > 0 ? "Số dư khả dụng" : "Số dư ví"}
                        {tamGiu > 0 && <span className="block text-xs text-cvr-faint">Đang tạm giữ {vnd(tamGiu)} cho tin chờ duyệt</span>}
                      </span>
                      {/* Ví phải đủ SỐ TẠM GIỮ lúc gửi (giá gói trước voucher — 0056), như phần kiểm khi bấm Đăng */}
                      <span className={hoSoVi.balance < truocVoucher.tongTra ? "font-semibold tabular-nums text-red-600" : "font-semibold tabular-nums text-cvr-ink"}>{vnd(hoSoVi.balance)}</span>
                    </div>
                    {/* ĐÚNG TRÌNH TỰ CHUẨN (chủ dự án 26/10/2026): nút này đi như bấm Đăng tin — kiểm đủ thông tin → tự lưu nháp
                        KÈM GÓI → màn "Nạp thêm … để đăng tin" → nạp đủ là tin tự gửi duyệt. Trước đây là link đi tắt: chưa lưu gì, mất gói.
                        Nút kêu gọi to, cả bề ngang (chủ dự án 26/10/2026: "nút CTA nạp thêm"). */}
                    {hoSoVi.balance < truocVoucher.tongTra && (
                      <button type="button" onClick={() => save(false, false, true)} disabled={!!saving} className="mt-2.5 h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
                        Nạp thêm {vnd(truocVoucher.tongTra - hoSoVi.balance)}
                      </button>
                    )}
                  </div>
                )}
              </div>
              </>
            )}

          </>
        )}
        {/* Quyền lợi CVR Diamond: chèn 1 link bất kỳ dưới tin đăng */}
        {(goiDangDung?.tier ?? planTier) === "diamond" && (
          <div className="mt-4">
            <Label>Link chèn dưới tin (CVR Diamond)</Label>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={linkChen}
              onChange={(e) => setLinkChen(e.target.value)}
              placeholder="https://… (video, trang dự án, tài liệu…)"
              className={inputCls}
            />
            {linkChen.trim() && !linkHopLe(linkChen) && (
              <p className="mt-1 text-xs text-red-600">Link phải bắt đầu bằng http:// hoặc https://</p>
            )}
          </div>
        )}
      </Card>

      {/* Hình ảnh — SAU khi chọn gói (chủ dự án 10/10/2026, nhắc lại 22/10/2026: "không đưa gói tin lên trước thì
          không thể biết giới hạn ảnh"): số ảnh / video tối đa theo gói đã chọn, số từ admin.
          Tải từ máy / dán link, ảnh đầu là ảnh đại diện. */}
      <Card id="b-anh" step={buoc()} title="Hình ảnh & video *">
        <ImagePicker
          value={images}
          onChange={setImages}
          // CHƯA CHỌN GÓI (chủ dự án chốt 22/10/2026): tối đa ANH_CHUA_CHON_GOI ảnh, chưa nhận video; nhắc chọn gói để
          // up tiếp theo quy định của gói (số từ admin). Trước đây lấy gói đầu bảng giá (Diamond) làm mặc định — sai.
          maxImages={!planTier ? ANH_CHUA_CHON_GOI : duocMienPhi && billing.free.soAnh ? billing.free.soAnh : soAnhToiDa(billing, planTier as TierId)}
          maxVideos={!planTier ? 0 : duocMienPhi && billing.free.soVideo !== undefined ? billing.free.soVideo : soVideoToiDa(billing, planTier as TierId)}
          tierName={planTier ? getTier(planTier as TierId).name : undefined}
          chuaChonGoi={!planTier}
        />
      </Card>

      {/* 7. Liên hệ */}
      <Card id="b-lienhe" step={buoc()} title="Thông tin liên hệ">
        {/* ẢNH ĐẠI DIỆN — ô chọn tệp nằm TRONG <label> và ẩn bằng sr-only.
            KHÔNG dùng display:none rồi gọi .click(): điện thoại đời cũ bỏ qua,
            khách bấm mãi không mở được thư viện ảnh. */}
        <div className="mb-4 flex items-center gap-4">
          {contactAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contactAvatar} alt="Ảnh đại diện" className="h-16 w-16 rounded-full object-cover ring-1 ring-cvr-line" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cvr-surface text-xs text-cvr-faint ring-1 ring-cvr-line">
              Chưa có
            </span>
          )}
          <div className="min-w-0">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setDangTaiAvatar(true);
                  const { url, error } = await uploadImageFile(f);
                  setDangTaiAvatar(false);
                  if (url) setContactAvatar(url);
                  else if (error) alert(error);
                  e.target.value = "";
                }}
              />
              {dangTaiAvatar ? "Đang tải ảnh…" : contactAvatar ? "Đổi ảnh đại diện" : "Thêm ảnh đại diện"}
            </label>
            {contactAvatar && (
              <button
                type="button"
                onClick={() => setContactAvatar("")}
                className="ml-2 text-sm font-medium text-cvr-muted transition hover:text-red-600"
              >
                Bỏ ảnh
              </button>
            )}
            <p className="mt-1.5 text-xs text-cvr-faint">Ảnh chân dung của bạn — hiện trên tin và trong danh bạ chuyên gia.</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Họ tên KHÔNG bắt buộc (chủ dự án 26/10/2026): tự điền tên tài khoản; để trống thì tin lấy tên tài khoản */}
          <div id="o-ten"><Label>Họ và tên</Label><input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} /></div>
          {/* Kiểm ĐỊNH DẠNG ngay dưới ô (chuẩn chung src/lib/kiemNhap.ts) — báo khi khách rời ô. */}
          <div id="o-sdt">
            <Label>Số điện thoại *</Label>
            <input type="text" inputMode="tel" autoComplete="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} onBlur={() => setDaRoiO((o) => ({ ...o, sdt: true }))} placeholder="09xx xxx xxx" className={inputCls} />
            {daRoiO.sdt && loiSdt(contactPhone) && <p className="mt-1 text-xs text-red-600">{loiSdt(contactPhone)}</p>}
          </div>
          <div id="o-email">
            <Label>Email</Label>
            <input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} onBlur={() => setDaRoiO((o) => ({ ...o, email: true }))} placeholder="email@example.com" className={inputCls} />
            {daRoiO.email && loiEmail(contactEmail) && <p className="mt-1 text-xs text-red-600">{loiEmail(contactEmail)}</p>}
          </div>
        </div>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}

      {/* 2 nút TÁCH BIỆT RÕ (pill Apple): ĐĂNG TIN = đen đặc nổi bật (gửi duyệt) ·
          LƯU NHÁP = xám nhạt kín đáo (cất tạm, làm tiếp sau) */}
      {/* Máy tính: nút cỡ vừa, nằm GIỮA (chủ dự án 23/10/2026: "vừa to, vừa lệch phải") — điện thoại: mỗi nút một hàng, rộng hết */}
      <div className="flex flex-col gap-3 border-t border-cvr-line pt-5 sm:flex-row sm:items-center sm:justify-center">
        <button
          type="submit"
          disabled={!!saving}
          className="btn-dangtin flex h-12 w-full items-center justify-center gap-2 rounded-full px-8 text-base font-bold text-white disabled:opacity-50 sm:h-10 sm:w-auto sm:px-6 sm:text-[14px]"
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
          </svg>
          {saving === "publish" ? "Đang gửi duyệt…" : editId && editStatus !== "draft" ? "Cập nhật & gửi duyệt" : "Đăng tin ngay"}
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={!!saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cvr-surface px-7 text-base font-semibold text-cvr-body ring-1 ring-inset ring-cvr-line transition hover:bg-cvr-line/40 hover:text-cvr-ink active:scale-[0.98] disabled:opacity-50 sm:h-10 sm:w-auto sm:px-5 sm:text-[14px]"
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          </svg>
          {saving === "draft" ? "Đang lưu nháp…" : "Lưu nháp"}
        </button>
        <button
          type="button"
          onClick={() => setXemTruoc(true)}
          disabled={!!saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-cvr-body ring-1 ring-inset ring-cvr-line transition hover:bg-cvr-surface hover:text-cvr-ink active:scale-[0.98] disabled:opacity-50 sm:order-first sm:h-10 sm:w-auto sm:px-5 sm:text-[14px]"
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Xem trước
        </button>
      </div>
      {/* 22/10/2026 bỏ dòng giải thích dưới nút (chủ dự án: bớt chú thích, cấu trúc tự nói). */}
      </div>
      </MucMoCtx.Provider>
    </form>
  );
}

// Ô NHẬP PHẢI THẤY RÕ (chủ dự án 22/10/2026: "rất khó nhìn, nhất là con trỏ chỗ đang soạn — kể cả cái nền"): nền trắng,
// viền rõ; ô đang gõ / đang chọn viền xanh đậm, con trỏ xanh — đơn giản, không màu mè. Một chỗ — mọi ô của form đăng tin dùng chung.
// Số ảnh được up khi khách CHƯA chọn gói (chủ dự án chốt 22/10/2026). Chọn gói rồi thì theo số của gói trong admin.
const ANH_CHUA_CHON_GOI = 3;

const inputCls = "h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint caret-cvr-blue outline-none transition focus:border-cvr-blue focus:ring-1 focus:ring-cvr-blue";

// ════════════════════════════════════════════════════════════════════════════
// THANH BƯỚC — dính trên đầu, bấm là tới thẳng phần đó.
// Form đăng tin là MỘT TRANG (môi giới đăng nhiều tin thì một trang nhanh hơn
// chia bước, và sửa lại mục đã qua không phải lùi từng bước). Đổi lại, trang dài
// thì dễ lạc → thanh này thay cho việc cuộn mò: luôn thấy đang ở phần nào và
// nhảy thẳng tới phần cần sửa (chủ dự án chốt 11/9/2026).
// ════════════════════════════════════════════════════════════════════════════
// Tên trên thanh = ĐÚNG tên tiêu đề mục bên dưới (chủ dự án 22/10/2026: menu các bước phải tương ứng nội dung).
const MOC_BUOC = [
  { id: "b-loai", ten: "Loại hình & địa chỉ" },
  { id: "b-thongtin", ten: "Thông tin chính" },
  { id: "b-dacdiem", ten: "Đặc điểm & tiện ích" },
  { id: "b-mota", ten: "Tiêu đề & mô tả" },
  { id: "b-goi", ten: "Gói tin — thanh toán" },
  { id: "b-anh", ten: "Hình ảnh & video" },
  { id: "b-lienhe", ten: "Thông tin liên hệ" },
];

// `an`: bước chưa có trên trang (vd Đặc điểm & tiện ích khi chưa chọn loại hình) → không hiện, số bước dồn lên đúng như số
// trên tiêu đề từng mục.
// Ngày theo giờ Việt Nam, sau hôm nay `n` ngày — "YYYY-MM-DD" (ô lịch Bắt đầu hiển thị).
function ngayVnSau(n: number): string {
  return new Date(Date.now() + 7 * 3_600_000 + n * 86_400_000).toISOString().slice(0, 10);
}

function ThanhBuoc() {
  const ctxBuoc = useContext(MucMoCtx);
  const [dangO, setDangO] = useState(MOC_BUOC[0].id);
  const bocRef = useRef<HTMLDivElement>(null);

  // Phần nào đang nằm trong tầm nhìn thì mốc đó sáng lên.
  useEffect(() => {
    const els = MOC_BUOC.map((m) => document.getElementById(m.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    // TÍNH LẠI TỪ ĐẦU MỖI LẦN CUỘN, KHÔNG DỰA VÀO MỤC VỪA ĐỔI.
    //
    // Bản cũ chỉ xét những mục VỪA thay đổi trạng thái, rồi lấy mục trên cùng
    // trong số đó. Cuộn từ "Mô tả" xuống "Hình ảnh" mà mục Mô tả rời dải quan
    // sát trước khi mục Hình ảnh lọt vào thì không có mục nào để chọn → thanh
    // đứng nguyên ở chữ cũ. Chủ dự án gặp thật 12/09/2026: đang ở phần "Hình
    // ảnh" mà thanh vẫn sáng "Mô tả".
    //
    // Nay mỗi lần có thay đổi thì quét LẠI TOÀN BỘ và lấy mục CUỐI CÙNG đã đi
    // qua vạch 200px kể từ đỉnh màn hình — luôn có đáp án, không bao giờ kẹt.
    const chon = () => {
      let id = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= 200) id = el.id;
      setDangO(id);
    };
    const io = new IntersectionObserver(chon, { rootMargin: "-180px 0px -55% 0px", threshold: [0, 0.01, 1] });
    els.forEach((el) => io.observe(el));

    // Nghe cả lúc cuộn: một mục dài (như phần Hình ảnh) có thể chiếm hết màn
    // hình, cuộn chậm bên trong nó thì bộ quan sát không phát tín hiệu nào cả.
    // Gom vào một khung hình để cuộn nhanh cỡ nào cũng không làm giật máy yếu.
    let cho = false;
    const khiCuon = () => {
      if (cho) return;
      cho = true;
      requestAnimationFrame(() => {
        cho = false;
        chon();
      });
    };
    window.addEventListener("scroll", khiCuon, { passive: true });
    chon();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", khiCuon);
    };
  }, []);

  // Điện thoại không đủ chỗ cho 7 mốc → thanh cuộn ngang, mốc đang xem tự kéo
  // vào giữa tầm nhìn để lúc nào cũng thấy mình đang ở đâu.
  useEffect(() => {
    const boc = bocRef.current;
    const nut = boc?.querySelector<HTMLElement>(`[data-moc="${dangO}"]`);
    if (!boc || !nut) return;
    boc.scrollTo({ left: nut.offsetLeft - boc.clientWidth / 2 + nut.offsetWidth / 2, behavior: "smooth" });
  }, [dangO]);

  const toi = (id: string) => {
    const buoc = document.getElementById(id)?.dataset.buoc;
    if (buoc && ctxBuoc) ctxBuoc.moMuc(buoc);
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
    {/* MÁY TÍNH: cột menu dọc bên trái, cùng kiểu cột menu trang Báo giá (khối bo, vạch vàng mục đang xem). */}
    <aside className="hidden lg:sticky lg:top-[76px] lg:block lg:self-start">
      <nav aria-label="Các mục đăng tin" className="rounded-2xl border border-cvr-line bg-white p-2.5 shadow-lux">
        {MOC_BUOC.map((m, i) => {
          const o = dangO === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toi(m.id)}
              className={`relative flex w-full items-center gap-2.5 rounded-xl py-2 pl-3.5 pr-3 text-left text-[13.5px] leading-snug transition-colors ${
                o ? "bg-cvr-surface font-semibold text-cvr-ink" : "font-medium text-cvr-body hover:bg-cvr-surface hover:text-cvr-ink"
              }`}
            >
              <span className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-cvr-gold transition-opacity ${o ? "opacity-100" : "opacity-0"}`} />
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${o ? "bg-cvr-ink text-white" : "bg-cvr-surface text-cvr-ink"}`}>
                {i + 1}
              </span>
              {m.ten}
            </button>
          );
        })}
      </nav>
    </aside>
    {/* ĐIỆN THOẠI / MÁY TÍNH BẢNG: thanh mục dính trên đầu, vuốt ngang */}
    <div className="sticky top-[calc(113px+var(--at))] z-20 -mx-4 border-b border-cvr-line bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      {/* MÁY TÍNH HIỆN ĐỦ MỌI MỤC (chủ dự án 23/10/2026: "trên PC phải làm cho logic như bản mobile — vào đăng tin bấm mục 6 thì
          như thế nào"): điện thoại vuốt ngang được, máy tính dùng chuột thì không → trước đây mục 5–7 khuất ngoài khung, không
          bấm tới được. Máy tính chia đều bề ngang cho các mục, tên dài xuống hai dòng; điện thoại giữ thanh vuốt như cũ. */}
      <div ref={bocRef} className="flex gap-1.5 overflow-x-auto py-2.5 [scrollbar-width:none] sm:grid sm:auto-cols-fr sm:grid-flow-col sm:gap-1 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {MOC_BUOC.map((m, i) => {
          const o = dangO === m.id;
          return (
            <button
              key={m.id}
              type="button"
              data-moc={m.id}
              onClick={() => toi(m.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[14px] font-semibold transition sm:min-w-0 sm:gap-1.5 sm:rounded-xl sm:px-2 sm:text-left sm:text-[12.5px] sm:leading-tight ${
                o ? "bg-cvr-ink text-white" : "bg-cvr-surface text-cvr-body active:bg-cvr-line sm:hover:bg-cvr-line"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                  o ? "bg-white/20 text-white" : "bg-white text-cvr-ink"
                }`}
              >
                {i + 1}
              </span>
              <span className="sm:text-balance">{m.ten}</span>
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}

// BA CẤP RÕ RÀNG (chủ dự án 22/10/2026: "7 mục, mỗi mục có mục con, trong mục con có chỗ chọn, điền — cân đối cách thể
// hiện để khách dễ nhìn, dễ biết"): MỤC = 19px đậm + số thứ tự (Card) · MỤC CON = 16px đậm + kẻ trên (TieuDeCon, MucAnHien)
// · NHÃN Ô chọn/ghi = 13px xám (Label). Không thêm màu — chỉ cỡ chữ, độ đậm, khoảng cách.
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-medium text-cvr-muted">{children}</label>;
}

function TieuDeCon({ children }: { children: React.ReactNode }) {
  return <h3 className="border-t border-cvr-line pt-5 text-base font-semibold tracking-tight text-cvr-ink">{children}</h3>;
}

function Card({ id, step, title, children, khoa, chiTieuDe }: { id?: string; step: string; title: string; children: React.ReactNode; khoa?: boolean; chiTieuDe?: boolean }) {
  // Mọi mục LUÔN MỞ (chủ dự án 15/10/2026 bỏ kiểu thu gọn + nút "Tiếp tục": "rất rối").
  const ctx = useContext(MucMoCtx);
  return (
    // scroll-mt: CHỈ chừa thanh các bước (61px) + 9px — header + thanh quay lại đã do <html> scroll-padding-top lo
    // (globals.css). Trước đây chừa cả header lần nữa (168px) → bấm mốc xong tiêu đề nằm cách thanh ~120px, đầu màn
    // hình trống (chủ dự án 22/10/2026: "bấm chọn không hiện nội dung ngay đầu trang").
    <section id={id} data-buoc={step} className={`scroll-mt-[70px] rounded-none border border-cvr-line bg-white p-5 shadow-lux sm:p-6 ${chiTieuDe ? "opacity-50" : ""}`}>
      {/* chiTieuDe: mục chưa tới lượt (VD Đặc điểm khi chưa chọn loại hình) — chỉ tiêu đề, mờ, giữ đúng số thứ tự mục */}
      <h2 className={`${chiTieuDe ? "" : "mb-5"} flex items-center gap-2.5 text-[19px] font-semibold tracking-tight text-cvr-ink`}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cvr-ink text-sm text-white">{step}</span>
        {title}
      </h2>
      {/* Ô bắt buộc còn thiếu ở bước này → báo NGAY ĐẦU BƯỚC, sát ô cần nhập. */}
      {ctx?.loi?.buoc === step && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{ctx.loi.msg}</p>
      )}
      {khoa ? (
        // TIN ĐANG HIỂN THỊ (chuẩn Batdongsan): không đổi loại tin, địa chỉ, dự án — đổi là
        // thành bất động sản khác, phải đăng tin mới.
        <fieldset disabled className="space-y-4 opacity-60">{children}</fieldset>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </section>
  );
}

function Pick({ label, value, onChange, options, placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={inputCls + " disabled:cursor-not-allowed disabled:opacity-45"}>
        {placeholder && <option value="">{placeholder}</option>}
        {/* Giá trị máy tự điền từ bản đồ có thể không nằm trong danh mục của web
            (tên mới sau sáp nhập, tỉnh chưa nhập đủ danh mục). Không thêm vào thì
            thẻ select hiện TRỐNG TRƠN dù dữ liệu đã có — người đăng tưởng hỏng. */}
        {value && !options.includes(value) && <option value={value}>{value}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// Ô chọn có ô tìm (Tỉnh · Quận · Phường) — dùng chung với trang admin.
function PickTim({ label, ...p }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; timPlaceholder: string; disabled?: boolean; bietDanh?: Record<string, BietDanh[]> }) {
  return (
    <div>
      <Label>{label}</Label>
      {/* Ô địa chỉ: tên dài (Phường Ngũ Hành Sơn…) xuống tối đa 2 dòng thay vì cắt "…" — ô tự cao theo chữ (23/10/2026) */}
      <ChonCoTim {...p} haiDong className={inputCls.replace("h-11", "min-h-11")} />
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

// Một dòng trong bảng thanh toán gói tin: nhãn trái, giá trị phải (nhan2 = dòng ưu đãi, màu xanh).
function Dong({ nhan, giaTri, nhan2 }: { nhan: string; giaTri: string; nhan2?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1 ${nhan2 ? "text-cvr-blue-ink" : ""}`}>
      <span>{nhan}</span>
      <span className={`text-right font-semibold tabular-nums ${nhan2 ? "" : "text-cvr-ink"}`}>{giaTri}</span>
    </div>
  );
}
