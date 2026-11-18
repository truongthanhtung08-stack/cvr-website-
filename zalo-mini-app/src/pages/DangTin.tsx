import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Input, Page, Sheet, Spinner, Text, useNavigate } from "zmp-ui";
import TheTinDoc from "../components/TheTinDoc";
import type { Tin } from "../lib/tin";
import TieuDe from "../components/TieuDe";
import { useSearchParams } from "react-router-dom";
import { provincesNew } from "../lib/provincesNew";
import { layBangGia } from "../lib/tin";
import { soVN, supabase, usePhien } from "../lib/supabase";
import { chonAnh, taiAnhLen } from "../lib/taiAnh";
import { chonVideo, taiVideoLen } from "../lib/taiVideo";
import { docSo } from "../lib/docSo";
import { laVideo, tachAnh } from "../lib/media";
import { useTai } from "../lib/useTai";
import { layNguoiZalo } from "../lib/zalo";
import { getAccessToken, getLocation } from "zmp-sdk";
import XacMinhSo from "../components/XacMinhSo";
import BangGiaMaTran, { TEN_HANG } from "../components/BangGiaMaTran";
import BieuTuongWeb from "../components/BieuTuongWeb";
import ChonCoTim from "../components/ChonCoTim";
import { DS_LOAI, O_LOAI_CON } from "../lib/loaiHinh";
import { coDienTichXayDung, coNoiThat, coPhongNgu, coPhongTam, fieldsSplit, nhanDienTich, noiThatCho, phapLyCho, thieuMucBatBuoc, tienIchCho, type Field } from "../lib/listingSpec";


// ĐĂNG TIN — ghi thẳng vào bảng listings như form web (src/components/PostListingForm.tsx):
// status "pending" chờ admin duyệt, details.plan = gói + số tiền đã báo (giaBao, chưa VAT).
// Phí gói trừ vào ví lúc duyệt (như web). Mini App KHÔNG có nạp tiền — Zalo từ chối bản 78 (16/11/2026: "nền tảng chưa hỗ trợ
// Mini App có chức năng Nạp tiền; chỉ được hiển thị số dư, lịch sử"). Ví thiếu → lưu nháp, báo số dư; không nút / chữ nạp tiền.

const KHAC = "__khac"; // dòng "Khác — tự ghi" của ô chọn (như web ChonHoacGhi)
// Danh sách CHÉP ĐÚNG web (src/lib/listingSpec.ts legalOptions · directions · furnishLevels) — 14/11/2026 "web một nẻo, đây một nẻo"
const HUONG = ["Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"];
const NOI_THAT = ["Không nội thất", "Bàn giao thô", "Nội thất cơ bản", "Nội thất đầy đủ", "Nội thất cao cấp"];
// Ô "Thuộc dự án" như web: danh sách = /api/du-an/ten (dự án có hồ sơ + dự án khách đã ghi), lọc theo tỉnh; "Khác — tự ghi" → slug từ tên (web slugify)
const boDau = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
const gonTinh = (x: string) => boDau(x.replace(/^(Thành phố|Tỉnh)\s+/i, "")).trim();
const slugTen = (x: string) => boDau(x).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const ANH_CHUA_CHON_GOI = 3; // như web: chưa chọn gói thì tối đa 3 ảnh; chọn gói → số ảnh của gói (Admin)
// ĐƠN VỊ GIÁ = web (PostListingForm donViGia): "Thoả thuận" khoá ô số, "Khác — tự ghi" ghi chữ vào details.giaTuGhi.
const KHAC_GIA = "Khác — tự ghi";
const DON_VI_GIA = { ban: ["tỷ", "triệu", "triệu/m²", "Thoả thuận", KHAC_GIA], thue: ["triệu/tháng", "nghìn/m²/tháng", "triệu/6 tháng", "triệu/năm", "Thoả thuận", KHAC_GIA] };
// Gợi ý ô giá / diện tích theo đơn vị · loại hình — chép src/lib/goiYNhapTin.ts
const goiYGia = (dv: string) => ({ "tỷ": "VD: 4,2", "triệu": "VD: 850", "triệu/m²": "VD: 45", "triệu/tháng": "VD: 12", "nghìn/m²/tháng": "VD: 35", "triệu/6 tháng": "VD: 60", "triệu/năm": "VD: 120" } as Record<string, string>)[dv] ?? "VD: 12";
const goiYDienTich = (t: string) =>
  /nhà xưởng|kho bãi|kho \/|đất công nghiệp|thuê đất/i.test(t) ? "VD: 1200" : /đất nông nghiệp/i.test(t) ? "VD: 2000" : /trọ/i.test(t) ? "VD: 25"
  : /văn phòng|mặt bằng|cửa hàng/i.test(t) ? "VD: 120" : /căn hộ dịch vụ|condotel/i.test(t) ? "VD: 45" : /căn hộ|chung cư/i.test(t) ? "VD: 68"
  : /biệt thự|villa/i.test(t) ? "VD: 300" : "VD: 100";
const VAT = 0.08; // src/lib/thue.ts — giá niêm yết chưa gồm GTGT

const ngayVnSau = (n: number) => new Date(Date.now() + 7 * 3_600_000 + n * 86_400_000).toISOString().slice(0, 10);
// Đọc số như web (PostListingForm): ô đã ghi rõ đơn vị (tỷ / triệu / m²) → "7,9" = "7.9" = 7,9 (docSo nghin3: false).
// Trước đây bỏ hết dấu chấm → khách gõ "7.9" tỷ thành 79 tỷ.
const so = (s: string) => (s.trim() ? docSo(s, { nghin3: false }) : NaN);
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;

// GIAO DIỆN = FORM WEB ĐIỆN THOẠI (PostListingForm, đo cạnh nhau khổ 375 ngày 14/11/2026 — anh: "như một bãi rác"):
// mỗi mục một thẻ viền mảnh, đầu thẻ số tròn đen + tên mục; nhãn ô chữ nhỏ xám; ô nhập bo 10px cao 44px.
// 7 BƯỚC = FORM WEB 18/11/2026 (anh: "áp dụng form này cho Zalo Mini App"): mỗi mục một trang, Tiếp / Quay lại; 5 Chọn gói; 7 Thanh toán – Đăng tin
// (gồm liên hệ). Sửa tin đã lên web: không có Chọn gói, bước cuối là Thông tin liên hệ.
const BUOC = ["Loại hình & địa chỉ", "Thông tin chính", "Đặc điểm & tiện ích", "Tiêu đề & mô tả", "Chọn gói", "Hình ảnh & video", "Thanh toán – Đăng tin"];
function Nhom({ so, hien, an, tieuDe, children }: { so: number; hien?: number; an?: boolean; tieuDe: string; children: React.ReactNode }) {
  return (
    <section id={`b${so}`} className="the-muc" hidden={an}>
      <h2 className="the-muc-dau"><span className="so">{hien ?? so}</span>{tieuDe}</h2>
      {children}
    </section>
  );
}
type ONhapProps = { nhan?: string; vung?: boolean; dem?: boolean } & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>;
function ONhap({ nhan, vung, dem, ...p }: ONhapProps) {
  return (
    <label className="o-nhap">
      {nhan && <span>{nhan}</span>}
      {vung ? <textarea {...(p as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} /> : <input {...(p as React.InputHTMLAttributes<HTMLInputElement>)} />}
      {dem && <small>{String(p.value ?? "").length} ký tự</small>}
    </label>
  );
}

export default function DangTin() {
  const dieuHuong = useNavigate();
  const [thamSo] = useSearchParams();
  const { phien, san, nguoiDung } = usePhien();

  // NHU CẦU như web (demandTypes): Cần bán · Cần mua · Cho thuê · Cần thuê → purpose ban · mua · thue · can-thue.
  // Thị trường (loại hình, bảng giá, đơn vị giá) chỉ có hai: mua bán (ban · mua) và cho thuê (thue · can-thue) — như web laTinThue.
  type NhuCau = "ban" | "mua" | "thue" | "can-thue";
  const [nhuCau, setNhuCau] = useState<NhuCau>(thamSo.get("md") === "thue" ? "thue" : "ban");
  const md: "ban" | "thue" = nhuCau === "thue" || nhuCau === "can-thue" ? "thue" : "ban";
  const laTinTim = nhuCau === "mua" || nhuCau === "can-thue"; // tin người mua / người thuê: không bắt ảnh (web 05/11/2026)
  const doiNhuCau = (n: NhuCau) => {
    const thiTruong = n === "thue" || n === "can-thue" ? "thue" : "ban";
    setNhuCau(n);
    if (thiTruong !== md) { setLoai(""); setLoaiCon(""); setConTuGhi(false); }
  };
  const [loai, setLoai] = useState("");
  const [loaiCon, setLoaiCon] = useState(""); // loại con tuỳ chọn (Loại căn hộ, Loại đất…) — lưu details.specs[ô loại con] như web 12/11/2026
  const [conTuGhi, setConTuGhi] = useState(false); // đang ở dòng "Khác — tự ghi"
  // HAI HỆ ĐỊA CHỈ như form web (nút "Địa chỉ mới / Địa chỉ cũ"): mới = Tỉnh → Phường/Xã (34 tỉnh) · cũ = Tỉnh → Quận/Huyện → Phường/Xã
  // (63 tỉnh trước sáp nhập, bảng provincesOld chép từ web, nạp khi khách gạt sang cũ). Lưu đúng như web: tên theo hệ khách chọn.
  const [he, setHe] = useState<"moi" | "cu">("moi");
  const [dsCu, setDsCu] = useState<import("../lib/provincesOld").ProvinceOld[]>([]);
  const [quan, setQuan] = useState("");
  const [tinh, setTinh] = useState("");
  const [phuong, setPhuong] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [tieuDe, setTieuDe] = useState("");
  const [moTa, setMoTa] = useState("");
  const [gia, setGia] = useState("");
  const [donViChon, setDonVi] = useState("tỷ");
  const [giaTuGhi, setGiaTuGhi] = useState("");
  const donVi = DON_VI_GIA[md].includes(donViChon) ? donViChon : DON_VI_GIA[md][0]; // đổi Mua bán ↔ Cho thuê → về đơn vị đầu (như web)
  const [dienTich, setDienTich] = useState("");
  const [ngu, setNgu] = useState("");
  const [tam, setTam] = useState("");
  // Ô THEO LOẠI HÌNH = web (src/lib/listingSpec.ts chép nguyên, fieldsSplit): ô chính → mục 2, đặc điểm → mục 3; lưu details.specs[key]
  const [oLoai, setOLoai] = useState<Record<string, string>>({});
  const [dtXay, setDtXay] = useState(""); // built_area_m2
  const [tienIch, setTienIch] = useState<string[]>([]); // details.amenities
  const [noiThatDs, setNoiThatDs] = useState<string[]>([]); // details.interior
  const [phapLy, setPhapLy] = useState("");
  const [huong, setHuong] = useState("");
  const [noiThat, setNoiThat] = useState(""); // details.furnish như web
  const [duAnSlug, setDuAnSlug] = useState(""); // details.project
  const [duAnTen, setDuAnTen] = useState(""); // details.projectName
  const [duAnTuGhi, setDuAnTuGhi] = useState(false);
  const [anh, setAnh] = useState<string[]>([]);
  const [dangTaiAnh, setDangTaiAnh] = useState(false);
  const [video, setVideo] = useState(""); // tệp MP4 đã tải lên kho (như web) hoặc link YouTube
  const [tienDoVideo, setTienDoVideo] = useState<number | null>(null); // null = không đang tải video
  const [ten, setTen] = useState("");
  const [sdt, setSdt] = useState("");
  // XÁC MINH SỐ KHI ĐĂNG TIN (luật tài khoản 06/11/2026): liên hệ trong tin = tài khoản (tên · số), không gõ tay; tài khoản chưa có
  // số đã xác minh → nhập số, mã gửi về Zalo của CHÍNH số đó, nhập mã — cùng đường web /api/xac-thuc/xac-minh-sdt (gộp tài khoản
  // theo luật web, máy chủ tự làm). Đăng nhập bằng Zalo không đòi số; chỉ đăng tin mới cần.
  const [daXmXong, setDaXmXong] = useState(false);
  const [hang, setHang] = useState("basic"); // hạng tin: diamond · gold · silver · basic (như web)
  const [soNgay, setSoNgay] = useState<number>();
  const [batDau, setBatDau] = useState(""); // details.plan.batDau như web: trống = Ngay khi được duyệt
  const [buoc, setBuoc] = useState(1); // bước đang mở (mỗi mục một trang, như web)
  const moBuoc = (n: number) => { setBuoc(n); requestAnimationFrame(() => document.querySelector(".tieu-de-form")?.scrollIntoView({ block: "start" })); };
  useEffect(() => { document.querySelector(".thanh-buoc .bat")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }, [buoc]); // bước đang xem luôn nằm trong thanh
  const [xemTruoc, setXemTruoc] = useState(false); // nút Xem trước như web: thẻ tin đúng như sẽ hiện
  const [luuNhap, setLuuNhap] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string>();
  const [xong, setXong] = useState<"pending" | "draft" | "sua" | null>(null);

  // SỬA TIN (?id=…) — như web (PostListingForm): nạp tin của chính khách, điền sẵn form. Tin đã lên web (đang hiện · hết hạn ·
  // khách tự hạ) = "daDang": sửa nội dung lên ngay, GIỮ gói / ngày đăng / hạn, ẩn Nhu cầu + Gói tin. Nháp / chờ duyệt: chọn lại gói được.
  const maSua = thamSo.get("id");
  const [tinSua, setTinSua] = useState<{ status: string; details: Record<string, any> } | null>(null);
  const [loiNap, setLoiNap] = useState(false);
  const daDang = !!tinSua && (tinSua.status === "approved" || tinSua.status === "expired" || (tinSua.status === "hidden" && tinSua.details?.ha_boi === "khach"));
  useEffect(() => {
    if (!maSua || !nguoiDung) return;
    supabase.from("listings").select("*").eq("id", maSua).eq("owner_id", nguoiDung.id).maybeSingle().then(({ data: r }) => {
      if (!r) return setLoiNap(true);
      const d = (r.details ?? {}) as Record<string, any>;
      const sp = (d.specs ?? {}) as Record<string, any>;
      setTinSua({ status: r.status, details: d });
      setNhuCau((["ban", "mua", "thue", "can-thue"].includes(r.purpose) ? r.purpose : "ban") as NhuCau);
      const maLoai = sp.landType === "Đất nền dự án" ? `${r.type}::Đất nền dự án` : r.type ?? "";
      setLoai(maLoai);
      const oConCu = DS_LOAI[r.purpose === "thue" || r.purpose === "can-thue" ? "thue" : "ban"].find((l) => l.ma === maLoai)?.con;
      const vCon = oConCu ? String(sp[oConCu.key] ?? "") : "";
      setLoaiCon(vCon);
      setConTuGhi(!!vCon && !oConCu!.options.includes(vCon));
      setTinh(r.province ?? "");
      setPhuong(r.ward ?? "");
      if (r.district || (r.province && !provincesNew.some((p) => p.name === r.province))) { setHe("cu"); setQuan(r.district ?? ""); }
      setDiaChi(d.addressDetail ?? "");
      setTieuDe(r.title ?? "");
      setMoTa(r.description ?? "");
      // Giá VNĐ → ô nhập + đơn vị (như web: không giá + giaTuGhi = Khác — tự ghi; không giá = Thoả thuận)
      const g = Number(r.price_vnd);
      const thue = r.purpose === "thue" || r.purpose === "can-thue";
      if (r.price_vnd == null && d.giaTuGhi) { setDonVi(KHAC_GIA); setGiaTuGhi(d.giaTuGhi); }
      else if (r.price_vnd == null) setDonVi("Thoả thuận");
      else {
        const dv = thue ? "triệu/tháng" : g >= 1e9 ? "tỷ" : "triệu";
        setDonVi(dv);
        setGia(String(+(g / (dv === "tỷ" ? 1e9 : 1e6)).toFixed(3)).replace(".", ","));
      }
      setDienTich(r.area_m2 != null ? String(r.area_m2).replace(".", ",") : "");
      setNgu(r.beds != null ? String(r.beds) : "");
      setTam(r.baths != null ? String(r.baths) : "");
      setOLoai(Object.fromEntries(Object.entries(sp).filter(([k, v]) => !O_LOAI_CON.includes(k) && v != null && String(v).trim()).map(([k, v]) => [k, String(v)])));
      setDtXay(r.built_area_m2 != null ? String(r.built_area_m2).replace(".", ",") : "");
      setTienIch(Array.isArray(d.amenities) ? d.amenities : []);
      setNoiThatDs(Array.isArray(d.interior) ? d.interior : []);
      setPhapLy(d.legal ?? "");
      setHuong(d.direction ?? "");
      setNoiThat(d.furnish ?? "");
      setDuAnSlug(d.project ?? "");
      setDuAnTen(d.projectName ?? "");
      const ds = (r.images ?? []) as string[];
      setAnh(tachAnh(ds));
      setVideo(ds.find(laVideo) ?? "");
      if (d.contact?.name) setTen(d.contact.name);
      if (d.contact?.phone) setSdt(soVN(d.contact.phone));
      if (d.plan?.tier) setHang(d.plan.tier);
      if (d.plan?.days) setSoNgay(d.plan.days);
      if (d.plan?.batDau && d.plan.batDau >= ngayVnSau(1)) setBatDau(d.plan.batDau);
    });
  }, [maSua, nguoiDung?.id]);

  const bangGia = useTai(() => layBangGia(), [], null);
  const hoSo = useTai(
    async () => (nguoiDung ? (await supabase.from("profiles").select("*").eq("id", nguoiDung.id).maybeSingle()).data : null),
    [nguoiDung?.id],
    null as Record<string, any> | null,
  );

  const daXacMinh = daXmXong || !!(hoSo.data?.phone_verified || hoSo.data?.sdt_lien_he_xac_minh || hoSo.data?.role === "admin");
  useEffect(() => {
    if (hoSo.data?.phone && !sdt) setSdt(soVN(hoSo.data.phone));
    else if (nguoiDung?.phone && !sdt) setSdt(soVN(nguoiDung.phone));
    if (hoSo.data?.full_name && !ten) setTen(hoSo.data.full_name);
  }, [nguoiDung?.phone, hoSo.data]);
  // Chưa có tên trong hồ sơ → lấy tên Zalo của khách điền sẵn.
  useEffect(() => {
    if (phien && !ten) layNguoiZalo().then((z) => z && setTen((cu) => cu || z.name));
  }, [phien]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gói theo HẠNG đã chọn + mục đích (cùng bảng giá admin với web). Ưu đãi thành viên mới chỉ áp gói thường.
  const dsGoi = bangGia.data?.[md].plans ?? [];
  const goi = dsGoi.find((p) => p.tierId === hang) ?? dsGoi.find((p) => p.tierId === "basic");
  useEffect(() => {
    if (goi?.terms.length && !goi.terms.some((t) => t.days === soNgay)) setSoNgay(goi.terms[0].days);
  }, [goi, md]); // eslint-disable-line react-hooks/exhaustive-deps

  const tien = useMemo(() => {
    const giaGoi = goi?.terms.find((t) => t.days === soNgay)?.price ?? 0;
    const f = bangGia.data?.free;
    const gioVn = (t: number) => new Date(t + 7 * 3_600_000).toISOString().slice(0, 10);
    const trongKy = (ngay: string) => !!f && (!f.from || ngay >= f.from) && (!f.to || ngay <= f.to);
    // CÙNG MỘT điều kiện khuyến mãi với web (huongKhuyenMai + thanhVienMoi, src/lib/billing.ts — 12/11/2026):
    // thành viên mới = ngày thành viên (profiles.ngay_thanh_vien, lần đăng nhập đầu) trong from–to + tin gửi trong f.days ngày
    // kể từ ngày đó, KỂ CẢ khi chương trình đã qua ngày kết thúc; đối tượng khác: chương trình đang chạy hôm nay.
    const ngayTv = hoSo.data?.ngay_thanh_vien ?? hoSo.data?.created_at;
    const soNgayMoTk = ngayTv ? (Date.now() - new Date(ngayTv).getTime()) / 86_400_000 : -1;
    const conLuot = f?.quota === 0 || (hoSo.data?.free_quota ?? 0) > 0;
    const huong = f?.audience === "new"
      ? !!f.active && !!ngayTv && trongKy(gioVn(new Date(ngayTv).getTime())) && soNgayMoTk >= 0 && soNgayMoTk <= f.days && conLuot
      : !!f?.active && trongKy(gioVn(Date.now())) && (f.audience === "all" || f.audience === (hoSo.data?.role ?? "buyer")) && conLuot;
    const mienPhi = !!hoSo.data && !!goi && goi.tierId === f?.tierId && huong;
    const thanhTien = mienPhi ? 0 : giaGoi;
    // Số ngày tin THẬT SỰ hiển thị: hưởng khuyến mãi → đúng số ngày của chương trình (như web).
    const soNgayThat = mienPhi ? (f?.days ?? soNgay ?? 0) : (soNgay ?? 0);
    return { mienPhi, thanhTien, soNgayThat, tongTra: thanhTien + Math.round(thanhTien * VAT), viCo: Number(hoSo.data?.balance ?? 0) };
  }, [goi, soNgay, bangGia.data, hoSo.data]);

  // Số ảnh tối đa = web: theo gói đang chọn (Admin), hưởng chương trình miễn phí có số ảnh riêng thì theo chương trình; tin đã lên web giữ số ảnh đang có.
  const anhGoi = (bangGia.data?.soAnh(daDang ? String(tinSua?.details?.plan?.tier ?? "basic") : goi?.tierId ?? "basic") || 0);
  const toiDaAnh = daDang
    ? Math.max(anh.length, anhGoi || ANH_CHUA_CHON_GOI)
    : (tien.mienPhi && bangGia.data?.free?.soAnh ? bangGia.data.free.soAnh : anhGoi) || ANH_CHUA_CHON_GOI;

  useEffect(() => { if (he === "cu" && !dsCu.length) import("../lib/provincesOld").then((m) => setDsCu(m.provincesOld)); }, [he]); // eslint-disable-line react-hooks/exhaustive-deps
  const tinhCu = dsCu.find((p) => p.name === tinh);
  const dsQuan = he === "cu" ? tinhCu?.districts.map((d) => d.name) ?? [] : [];
  const dsPhuong = he === "moi"
    ? provincesNew.find((p) => p.name === tinh)?.wards ?? []
    : tinhCu?.districts.find((d) => d.name === quan)?.wards ?? [];
  const tinhMoi = he === "cu" ? tinhCu?.newName ?? tinh : tinh; // dự án lọc theo tỉnh hiện hành
  const doiHe = (h: "moi" | "cu") => { if (h === he) return; setHe(h); setTinh(""); setQuan(""); setPhuong(""); };
  const dsDuAn = useTai(async () => {
    const r = await fetch("https://coastalland.vn/api/du-an/ten").catch(() => null);
    return ((await r?.json().catch(() => null)) ?? []) as { ten: string; slug: string; tinh: string }[];
  }, [], [] as { ten: string; slug: string; tinh: string }[]);
  const duAnTrongTinh = dsDuAn.data.filter((d) => !tinhMoi || gonTinh(d.tinh ?? "") === gonTinh(tinhMoi)).sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
  // Tin sửa có dự án không nằm trong danh sách tỉnh → coi như tự ghi
  useEffect(() => { if (duAnTen && !duAnSlug) setDuAnTuGhi(true); }, [duAnTen, duAnSlug]);
  const duAnLuu = () => {
    const ten = duAnTen.trim();
    if (!ten) return {};
    const co = dsDuAn.data.find((d) => d.slug === duAnSlug) ?? dsDuAn.data.find((d) => boDau(d.ten) === boDau(ten));
    return { project: co?.slug ?? slugTen(ten), projectName: co?.ten ?? ten };
  };

  const themAnh = async () => {
    setLoi(undefined);
    const conCho = toiDaAnh - anh.length;
    if (conCho <= 0) return;
    const ds = await chonAnh(conCho);
    if (!ds.length) return;
    setDangTaiAnh(true);
    // Một ảnh hỏng không chặn các ảnh còn lại — tải hết, xong mới báo lỗi (như web: mỗi ảnh một lượt).
    let loiCuoi: string | undefined;
    for (const b of ds) {
      try {
        const url = await taiAnhLen(b);
        setAnh((cu) => [...cu, url]);
      } catch (e) {
        loiCuoi = (e as Error).message;
      }
    }
    if (loiCuoi) setLoi(loiCuoi);
    setDangTaiAnh(false);
  };

  // THÊM VIDEO như web (ImagePicker → uploadVideoFile): chọn tệp → chuyển MP4 H.264 trên máy → tải lên kho. Mỗi tin 1 video.
  const themVideo = async () => {
    setLoi(undefined);
    const tep = await chonVideo();
    if (!tep) return;
    setTienDoVideo(0);
    const kq = await taiVideoLen(tep, (p) => setTienDoVideo(p));
    setTienDoVideo(null);
    if (kq.loi) return setLoi(kq.loi);
    if (kq.url) setVideo(kq.url);
  };

  // = web priceToVnd: giá theo kỳ dài / theo m² quy về tổng tiền (thuê: mỗi tháng) để lọc, xếp giá cùng thước đo.
  const giaVnd = () => {
    if (donVi === "Thoả thuận" || donVi === KHAC_GIA) return null;
    const g = so(gia);
    if (Number.isNaN(g)) return null;
    const a = so(dienTich);
    if (donVi === "tỷ") return Math.round(g * 1e9);
    if (donVi === "triệu" || donVi === "triệu/tháng") return Math.round(g * 1e6);
    if (donVi === "triệu/m²") return Number.isNaN(a) ? null : Math.round(g * a * 1e6);
    if (donVi === "nghìn/m²/tháng") return Number.isNaN(a) ? null : Math.round(g * 1e3 * a);
    if (donVi === "triệu/6 tháng") return Math.round((g * 1e6) / 6);
    if (donVi === "triệu/năm") return Math.round((g * 1e6) / 12);
    return null;
  };
  // Ghi kèm details như web: chữ giá tự ghi · đơn giá thuê khách tự ghi (nghìn/m²/tháng)
  const giaDetails = () => ({
    giaTuGhi: donVi === KHAC_GIA ? giaTuGhi.trim() || undefined : undefined,
    ...(donVi === "nghìn/m²/tháng" && so(gia) > 0 ? { donGiaThue: so(gia), donGiaThueNhap: true } : { donGiaThue: undefined, donGiaThueNhap: undefined }),
  });

  // VỊ TRÍ HIỆN TẠI (Zalo getLocation): Zalo hỏi khách cho chia sẻ vị trí → máy chủ web đổi ra tỉnh · phường · đường (/api/vi-tri-zalo),
  // điền sẵn ô Vị trí; khách vẫn sửa được. Từ chối thì thôi, không báo lỗi (Chính sách kiểm duyệt Zalo 6.3).
  const [dangViTri, setDangViTri] = useState(false);
  const boDauVT = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/^(thanh pho|tinh)\s+/, "").trim();
  const dungViTri = async () => {
    setLoi(undefined);
    setDangViTri(true);
    try {
      const tokenViTri = (await getLocation()).token;
      const zaloAccessToken = await getAccessToken();
      const { data } = await supabase.auth.getSession();
      const r = await fetch("https://coastalland.vn/api/vi-tri-zalo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ tokenViTri, zaloAccessToken }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; loi?: string; tinh?: string; phuong?: string; duong?: string };
      if (!j.ok) return setLoi(j.loi || "Chưa lấy được vị trí.");
      const t = provincesNew.find((x) => boDauVT(x.name) === boDauVT(j.tinh ?? ""));
      if (!t) return setLoi("Chưa nhận ra tỉnh/thành từ vị trí này.");
      setHe("moi"); setQuan(""); // vị trí Zalo trả địa chỉ hệ mới
      setTinh(t.name);
      setPhuong(t.wards.find((w) => boDauVT(w) === boDauVT(j.phuong ?? "")) ?? "");
      if (j.duong && !diaChi.trim()) setDiaChi(j.duong);
    } catch {
      /* khách từ chối chia sẻ vị trí */
    } finally {
      setDangViTri(false);
    }
  };

  // Ô loại con của loại hình đang chọn (như web oLoaiCon). Đất nền dự án: landType = "Đất nền dự án" + ô Loại đất riêng (loaiDatDuAn).
  const oCon = DS_LOAI[md].find((l) => l.ma === loai)?.con;
  const specLoai = () => {
    const sp: Record<string, string> = {};
    const ld = loai.split("::")[1];
    if (ld) sp.landType = ld;
    if (oCon && loaiCon.trim()) sp[oCon.key] = loaiCon.trim();
    return sp;
  };

  const loaiGoc = loai.split("::")[0];
  const truong = loaiGoc ? fieldsSplit(loaiGoc, nhuCau) : { chinh: [] as Field[], dacDiem: [] as Field[] };
  const boLoaiCon = (fd: Field) => !O_LOAI_CON.includes(fd.key); // ô loại con đã có ô riêng ngay dưới Loại hình
  const oLoaiLuu = () => Object.fromEntries([...truong.chinh, ...truong.dacDiem].filter(boLoaiCon).map((fd) => [fd.key, (oLoai[fd.key] ?? "").trim()]).filter(([, v]) => v));
  const bat = (ds: string[], v: string) => (ds.includes(v) ? ds.filter((x) => x !== v) : [...ds, v]);
  const oTruong = (fd: Field) => {
    const nhan = `${fd.label}${fd.unit ? ` (${fd.unit})` : ""}${fd.batBuoc ? " *" : ""}`;
    const v = oLoai[fd.key] ?? "";
    const dat = (x: string) => setOLoai((o) => ({ ...o, [fd.key]: x }));
    return fd.type === "select"
      ? <ChonCoTim key={fd.key} nhan={nhan} giuCho={`Chọn ${fd.label.toLowerCase()}`} giaTri={v} ds={(fd.options ?? []).map((o) => ({ gt: o, nhan: o }))} onChon={dat} />
      : <ONhap key={fd.key} nhan={nhan} placeholder={fd.placeholder ?? ""} inputMode={fd.type === "number" ? "decimal" : undefined} value={v} onChange={(e) => dat(e.target.value)} />;
  };

  // LƯU NHÁP như web: CSDL chỉ bắt Tỉnh/Thành + Tiêu đề, còn lại ghi tới đâu lưu tới đó; không trừ tiền, không gửi duyệt.
  const luuBanNhap = async () => {
    if (!nguoiDung) return;
    setDangGui(true);
    const { error } = await supabase.from("listings").insert({
      purpose: nhuCau, type: loaiGoc || "Bất động sản khác", title: tieuDe.trim(), description: moTa.trim() || null,
      price_vnd: giaVnd(), area_m2: Number.isNaN(so(dienTich)) ? null : so(dienTich),
      beds: ngu.trim() ? parseInt(ngu, 10) : null, baths: tam.trim() ? parseInt(tam, 10) : null,
      built_area_m2: dtXay.trim() && !Number.isNaN(so(dtXay)) ? so(dtXay) : null,
      ward: phuong || null, district: he === "cu" ? quan || null : null, province: tinh,
      images: laVideo(video.trim()) ? [video.trim(), ...anh] : anh,
      details: {
        ...giaDetails(), specs: { ...specLoai(), ...oLoaiLuu() }, legal: phapLy || undefined, direction: huong || undefined, furnish: noiThat || undefined,
        amenities: tienIch, interior: loaiGoc && coNoiThat(loaiGoc) ? noiThatDs : [], ...duAnLuu(), addressDetail: diaChi.trim() || undefined,
        plan: { tier: goi?.tierId ?? "basic", days: soNgay, giaBao: tien.thanhTien, ...(batDau ? { batDau } : {}) },
        contact: { name: ten.trim(), phone: sdt.replace(/[^0-9]/g, "") }, nguonDang: "zalo-mini-app",
      },
      status: "draft", owner_id: nguoiDung.id, tier: goi?.tierId ?? "basic", published_at: null,
    });
    setDangGui(false);
    if (error) return setLoi(`Lưu nháp thất bại: ${error.message}`);
    setXong("draft");
  };

  // Các bước đang có (sửa tin đã lên web: bỏ Chọn gói) — số hiện trên thanh / tiêu đề theo thứ tự trong danh sách này
  const dsBuoc = daDang ? [1, 2, 3, 4, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
  const soHien = (n: number) => dsBuoc.indexOf(n) + 1;
  const viTriBuoc = dsBuoc.indexOf(buoc);
  // NÚT TIẾP (như web): bước đang mở còn ô bắt buộc thiếu → báo đúng ô, chưa cho sang bước sau
  const loiBuoc = (n: number): string | undefined => {
    if (n === 1) { if (!loai) return "Chưa chọn loại hình bất động sản."; if (!tinh) return "Chưa chọn Tỉnh/Thành."; }
    if (n === 2) {
      if (donVi === KHAC_GIA ? !giaTuGhi.trim() : donVi !== "Thoả thuận" && !gia.trim()) return "Chưa nhập giá.";
      if (Number.isNaN(so(dienTich))) return "Chưa nhập diện tích.";
      const thieu = loaiGoc ? thieuMucBatBuoc(loaiGoc, nhuCau, oLoai).filter((t) => !(oCon && t === oCon.label)) : [];
      if (thieu.length) return `Chưa nhập: ${thieu.join(", ")}.`;
    }
    if (n === 4 && !tieuDe.trim()) return "Chưa nhập tiêu đề tin.";
    if (n === 5 && !daDang && !soNgay) return "Chưa chọn gói tin.";
    if (n === 6) {
      if (!anh.length && !laTinTim) return "Chưa thêm ảnh — tin cần ít nhất 1 ảnh.";
      if (anh.length > toiDaAnh) return `Tin ${TEN_HANG[goi?.tierId ?? "basic"] ?? ""} chỉ đăng tối đa ${toiDaAnh} ảnh — xoá bớt ảnh hoặc chọn gói khác.`;
    }
    return undefined;
  };
  const tiepBuoc = () => { const l = loiBuoc(buoc); if (l) return setLoi(l); setLoi(undefined); moBuoc(dsBuoc[Math.min(dsBuoc.length - 1, viTriBuoc + 1)]); };

  const gui = async (nhap = false) => {
    setLoi(undefined);
    setLuuNhap(nhap);
    if (!nguoiDung) return dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(maSua ? `/dang-tin?id=${maSua}` : "/dang-tin")}`);
    if (!loai) { moBuoc(1); return setLoi("Chưa chọn loại hình bất động sản."); }
    if (!tinh) { moBuoc(1); return setLoi("Chưa chọn Tỉnh/Thành."); }
    if (!tieuDe.trim()) { moBuoc(4); return setLoi("Chưa nhập tiêu đề tin."); }
    if (nhap && !maSua) return luuBanNhap();
    for (const n of dsBuoc) { const l = loiBuoc(n); if (l && !nhap) { moBuoc(n); return setLoi(l); } }
    if (donVi === KHAC_GIA ? !giaTuGhi.trim() : donVi !== "Thoả thuận" && !gia.trim()) return setLoi("Chưa nhập giá.");
    if (Number.isNaN(so(dienTich))) return setLoi("Chưa nhập diện tích.");
    if (anh.length > toiDaAnh) return setLoi(`Tin ${TEN_HANG[goi?.tierId ?? "basic"] ?? ""} chỉ đăng tối đa ${toiDaAnh} ảnh — xoá bớt ảnh hoặc chọn gói khác.`);
    const thieu = loaiGoc ? thieuMucBatBuoc(loaiGoc, nhuCau, oLoai).filter((t) => !(oCon && t === oCon.label)) : [];
    if (thieu.length) return setLoi(`Chưa nhập: ${thieu.join(", ")}.`);
    if (!anh.length && !laTinTim) return setLoi("Chưa thêm ảnh — tin cần ít nhất 1 ảnh."); // như web: đăng tin bắt ít nhất 1 ảnh
    if (!tinSua && (!daXacMinh || !sdt.trim())) return setLoi("Xác minh số điện thoại trước khi đăng tin.");
    if (!ten.trim()) return setLoi("Tài khoản chưa có họ tên — vào Cá nhân để đặt tên.");
    if (!daDang && !soNgay) return setLoi("Chưa chọn thời hạn đăng tin.");
    if (maSua && !tinSua) return;

    const specsSua = (goc: Record<string, any>) => {
      const s: Record<string, any> = { ...goc };
      for (const k of O_LOAI_CON) delete s[k]; // đổi loại hình → bỏ loại con cũ, ghi lại theo ô đang chọn
      for (const fd of [...truong.chinh, ...truong.dacDiem]) delete s[fd.key]; // ô của loại hình đang chọn: ghi lại theo form
      Object.assign(s, specLoai(), oLoaiLuu());
      return s;
    };
    const noiDung = {
      type: loai.split("::")[0],
      title: tieuDe.trim(),
      description: moTa.trim() || null,
      price_vnd: giaVnd(),
      area_m2: so(dienTich),
      beds: ngu.trim() ? parseInt(ngu, 10) : null,
      baths: tam.trim() ? parseInt(tam, 10) : null,
      built_area_m2: dtXay.trim() && !Number.isNaN(so(dtXay)) ? so(dtXay) : null,
      ward: phuong || null,
      district: he === "cu" ? quan || null : null,
      province: tinh,
      images: laVideo(video.trim()) ? [video.trim(), ...anh] : anh,
    };

    // TIN ĐÃ LÊN WEB: lưu nội dung, giữ trạng thái + gói + mốc (đọc lại details MỚI NHẤT ngay trước khi ghi, như web 05/11).
    // Tin nháp chưa đủ tiền / tin chờ duyệt: lưu nội dung + gói mới chọn (tạm giữ tiền CSDL tự tính lại theo details.plan).
    if (tinSua && (daDang || tinSua.status === "pending" || tinSua.status === "draft")) {
      const { data: viSua } = await supabase.rpc("so_du_kha_dung");
      const giaCu = tinSua.status === "pending" ? Number(tinSua.details?.plan?.giaBao ?? 0) : 0;
      const khaDungSua = Number((viSua as { kha_dung: number }[] | null)?.[0]?.kha_dung ?? tien.viCo) + giaCu + Math.round(giaCu * VAT);
      const nhapThieu = !daDang && tien.tongTra > 0 && khaDungSua < tien.tongTra;
      // Nháp đủ tiền → gửi duyệt bằng đường tạo tin mới bên dưới (như web: tạo tin chờ duyệt + xoá nháp).
      if (!(tinSua.status === "draft" && !nhapThieu)) {
        if (tinSua.status === "pending" && nhapThieu) return setLoi(`Ví chưa đủ ${vnd(tien.tongTra)} cho gói đã chọn.`);
        setDangGui(true);
        const goc = ((await supabase.from("listings").select("details").eq("id", maSua).single()).data?.details as Record<string, any> | null) ?? tinSua.details;
        const details = {
          ...goc,
          ...giaDetails(),
          specs: specsSua(goc.specs ?? {}),
          legal: phapLy || undefined,
          direction: huong || undefined,
          furnish: noiThat || undefined,
          amenities: tienIch,
          interior: coNoiThat(loaiGoc) ? noiThatDs : [],
          project: undefined,
          projectName: undefined,
          ...duAnLuu(),
          addressDetail: diaChi.trim() || undefined,
          contact: { ...(goc.contact ?? {}), name: ten.trim() },
          plan: daDang ? goc.plan : { tier: goi?.tierId ?? "basic", days: soNgay, giaBao: tien.thanhTien, ...(batDau ? { batDau } : {}) },
        };
        const capNhat: Record<string, unknown> = daDang
          ? { ...noiDung, details }
          : { ...noiDung, purpose: nhuCau, details, tier: goi?.tierId ?? "basic" };
        const { error } = await supabase.from("listings").update(capNhat).eq("id", maSua);
        setDangGui(false);
        if (error && /VI_KHONG_DU/.test(error.message)) return setLoi("Ví không đủ tiền cho gói đã chọn.");
        if (error) return setLoi(/BDS_KHAC/.test(error.message) ? error.message.replace(/^.*BDS_KHAC:\s*/, "") : `Lưu thất bại: ${error.message}`);
        return setXong(daDang ? "sua" : tinSua.status === "pending" ? "pending" : "draft");
      }
    }

    // Ví không đủ → lưu nháp nguyên vẹn (như web), báo số dư; đủ tiền thì đăng tiếp từ Tin của tôi.
    // So với KHẢ DỤNG = số dư − tiền tạm giữ cho tin chờ duyệt khác (0056, y như web + CSDL).
    const { data: vi } = await supabase.rpc("so_du_kha_dung");
    const khaDung = Number((vi as { kha_dung: number }[] | null)?.[0]?.kha_dung ?? tien.viCo);
    const viThieu = tien.tongTra > 0 && khaDung < tien.tongTra;
    if (maSua && viThieu) return setLoi(`Ví chưa đủ ${vnd(tien.tongTra)} cho gói đã chọn.`);
    setDangGui(true);
    const specs: Record<string, string> = {};
    const loaiLuu = loai.split("::")[0];
    Object.assign(specs, specLoai(), oLoaiLuu());
    const { data: tinMoi, error } = await supabase.from("listings").insert({
      purpose: nhuCau,
      type: loaiLuu,
      title: tieuDe.trim(),
      description: moTa.trim() || null,
      price_vnd: giaVnd(),
      area_m2: so(dienTich),
      beds: ngu.trim() ? parseInt(ngu, 10) : null,
      baths: tam.trim() ? parseInt(tam, 10) : null,
      built_area_m2: dtXay.trim() && !Number.isNaN(so(dtXay)) ? so(dtXay) : null,
      ward: phuong || null,
      district: he === "cu" ? quan || null : null,
      province: tinh,
      // Video (link YouTube) ĐỨNG ĐẦU mảng images — đúng cách web lưu và hiện video đầu dãy.
      images: laVideo(video.trim()) ? [video.trim(), ...anh] : anh,
      details: {
        ...giaDetails(),
        specs,
        legal: phapLy || undefined,
        direction: huong || undefined,
        furnish: noiThat || undefined,
        amenities: tienIch,
        interior: coNoiThat(loaiGoc) ? noiThatDs : [],
        ...duAnLuu(),
        addressDetail: diaChi.trim() || undefined,
        plan: { tier: goi?.tierId ?? "basic", days: soNgay, giaBao: tien.thanhTien, ...(batDau ? { batDau } : {}) },
        contact: { name: ten.trim(), phone: sdt.replace(/\D/g, "") },
        nguonDang: "zalo-mini-app",
      },
      status: viThieu ? "draft" : "pending",
      owner_id: nguoiDung.id,
      tier: goi?.tierId ?? "basic", // như web: hạng khách chọn; tiền chỉ trừ khi admin duyệt
      published_at: null,
    }).select("id").single();
    setDangGui(false);
    if (error && /VI_KHONG_DU/.test(error.message)) {
      const m = error.message.match(/(\d+)\s*đ/);
      return setLoi(m ? `Số dư ví còn thiếu ${Number(m[1]).toLocaleString("vi-VN")} đ cho gói đã chọn.` : "Số dư ví không đủ cho gói đã chọn.");
    }
    if (error) return setLoi(/BDS_KHAC/.test(error.message) ? error.message.replace(/^.*BDS_KHAC:\s*/, "") : `Gửi tin thất bại: ${error.message}`);
    // Gửi duyệt từ tin nháp: tin chờ duyệt đã tạo → xoá nháp cũ (như web, không để tin trùng).
    if (maSua && (tinSua?.status === "draft" || tinSua?.status === "rejected") && !viThieu) await supabase.from("listings").delete().eq("id", maSua);
    // THIẾU TIỀN (18/11/2026, như web): tin lưu nháp kèm gói, KHÔNG tự gửi duyệt khi ví đủ — khách vào Tin của tôi mở tin, bấm Đăng tin.
    void tinMoi;
    setXong(viThieu ? "draft" : "pending");
    // Tin vào hàng chờ duyệt → nhờ máy chủ web báo khách "đã nhận tin" (máy chủ tự kiểm, không báo trùng).
    if (!viThieu) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) fetch("https://coastalland.vn/api/tin-dang/da-nhan", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  };

  if (!san) return <Page><TieuDe title="Đăng tin" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;

  // Khung giả lập trên máy (vite dev, ?xem-thu=1): xem form khi chưa vào tài khoản để soát giao diện cạnh form web. Bản đưa lên Zalo không có.
  const xemThu = import.meta.env.DEV && thamSo.get("xem-thu") === "1";
  if (!phien && !xemThu)
    return (
      <Page style={{ background: "#fff" }}>
        <TieuDe title={maSua ? "Sửa tin" : "Đăng tin"} ve="/" />
        <Box p={4} style={{ display: "grid", gap: 12, textAlign: "center", marginTop: 24 }}>
          <Button fullWidth onClick={() => dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(maSua ? `/dang-tin?id=${maSua}` : "/dang-tin")}`)}>Thử lại</Button>
        </Box>
      </Page>
    );

  if (xong)
    return (
      <Page style={{ background: "#fff" }}>
        <TieuDe title="Đăng tin" />
        <Box p={4} style={{ display: "grid", gap: 12, textAlign: "center", marginTop: 24 }}>
          <BieuTuongWeb ten="xong" co={56} dac style={{ color: "var(--cl-blue)", margin: "0 auto" }} />
          <Text.Title size="large">{xong === "sua" ? "Đã cập nhật tin" : xong === "pending" ? "Đã gửi tin, đang chờ duyệt" : "Đã lưu nháp tin"}</Text.Title>
          {xong !== "sua" && <Text className="chu-phu">
            {xong === "pending"
              ? "Coastal Land sẽ báo kết quả duyệt qua Zalo."
              : luuNhap ? "" : `Số dư ví chưa đủ ${vnd(tien.tongTra)} cho gói đã chọn.`}
          </Text>}
          <Button fullWidth variant={xong === "draft" ? "secondary" : "primary"} onClick={() => dieuHuong("/tin-cua-toi", { replace: true })}>Xem tin của tôi</Button>
          <Button fullWidth variant="secondary" onClick={() => dieuHuong("/", { replace: true })}>Về trang chủ</Button>
        </Box>
      </Page>
    );

  return (
    <Page className="form-tin" style={{ paddingBottom: 24 }}>
      <TieuDe title={maSua ? "Sửa tin" : "Đăng tin"} />
      <h1 className="tieu-de-form">{maSua ? "Sửa tin đăng" : "Tạo tin đăng"}</h1>
      <nav className="thanh-buoc">
        {dsBuoc.map((n, i) => (
          <button key={n} className={buoc === n ? "bat" : ""} onClick={() => { setLoi(undefined); moBuoc(n); }}>
            <span>{i + 1}</span>{daDang && n === 7 ? "Thông tin liên hệ" : BUOC[n - 1]}
          </button>
        ))}
      </nav>

      {maSua && loiNap && <Box p={4}><Text size="small" style={{ color: "#d70018" }}>Không tìm thấy tin.</Text></Box>}

      {/* THỨ TỰ 7 MỤC = FORM WEB (PostListingForm, 14/11/2026 "web một nẻo, đây một nẻo"): 1 Loại hình & địa chỉ · 2 Thông tin chính ·
          3 Đặc điểm & tiện ích · 4 Tiêu đề & mô tả · 5 Gói tin — thanh toán · 6 Hình ảnh & video · 7 Thông tin liên hệ. Nhãn chép theo web. */}
      <Nhom so={1} an={buoc !== 1} tieuDe="Loại hình & địa chỉ">
        {!daDang && <ChonCoTim nhan="Nhu cầu *" giuCho="Chọn nhu cầu" giaTri={nhuCau} ds={[["ban", "Cần bán"], ["mua", "Cần mua"], ["thue", "Cho thuê"], ["can-thue", "Cần thuê"]].map(([gt, nhan]) => ({ gt, nhan }))} onChon={(v) => doiNhuCau(v as NhuCau)} />}
        <ChonCoTim nhan="Loại hình bất động sản *" giuCho="Chọn loại hình" giaTri={loai} ds={DS_LOAI[md].map((l) => ({ gt: l.ma, nhan: l.ten }))} onChon={(v) => { if (v === loai) return; setLoai(v); setLoaiCon(""); setConTuGhi(false); }} />
        {oCon && (
          <ChonCoTim nhan={oCon.label} giuCho={`Chọn ${oCon.label.toLowerCase()}`} giaTri={conTuGhi ? KHAC : loaiCon}
            ds={[...oCon.options.map((o) => ({ gt: o, nhan: o })), { gt: KHAC, nhan: "Khác — tự ghi" }]}
            onChon={(v) => { const k = v === KHAC; setConTuGhi(k); setLoaiCon(k ? "" : v); }} />
        )}
        {oCon && conTuGhi && <ONhap placeholder={oCon.label} value={loaiCon} onChange={(e) => setLoaiCon(e.target.value)} maxLength={60} />}
        <div className="chia" />
        <div className="muc-phu">Địa chỉ bất động sản</div>
        <div className="chon-he">
          <button className={he === "moi" ? "bat" : ""} onClick={() => doiHe("moi")}>Địa chỉ mới</button>
          <button className={he === "cu" ? "bat" : ""} onClick={() => doiHe("cu")}>Địa chỉ cũ</button>
        </div>
        <div className={he === "moi" ? "hai-cot" : ""} style={he === "cu" ? { display: "grid", gap: 14 } : undefined}>
        <ChonCoTim nhan="Tỉnh / Thành *" giuCho="Chọn tỉnh/thành" giaTri={tinh}
          ds={(he === "moi" ? provincesNew.map((p) => p.name) : dsCu.map((p) => p.name)).map((n) => ({ gt: n, nhan: n }))}
          onChon={(v) => { if (v !== tinh) { setTinh(v); setQuan(""); setPhuong(""); } }} />
        {he === "cu" && <ChonCoTim nhan="Quận / Huyện" giuCho={tinh ? "Chọn quận/huyện" : "Chọn tỉnh/thành trước"} giaTri={quan} tat={!tinh} ds={dsQuan.map((q) => ({ gt: q, nhan: q }))} onChon={(v) => { if (v !== quan) { setQuan(v); setPhuong(""); } }} />}
        <ChonCoTim nhan="Phường / Xã" giuCho={he === "cu" ? (quan ? "Chọn phường/xã" : "Chọn quận/huyện trước") : tinh ? "Chọn phường/xã" : "Chọn tỉnh/thành trước"} giaTri={phuong} tat={he === "cu" ? !quan : !tinh} ds={dsPhuong.map((w) => ({ gt: w, nhan: w }))} onChon={setPhuong} />
        </div>
        {/* Thứ tự = web: Tỉnh · Phường → Thuộc dự án → Địa chỉ cụ thể → vị trí (web: bản đồ; Mini App: vị trí Zalo) */}
        <ChonCoTim nhan="Thuộc dự án" giuCho="Chọn dự án" giaTri={duAnTuGhi ? KHAC : duAnSlug}
          ds={[{ gt: "__khong", nhan: "Không thuộc dự án" }, ...duAnTrongTinh.map((d) => ({ gt: d.slug, nhan: d.ten })), { gt: KHAC, nhan: "Khác — tự ghi" }]}
          onChon={(v) => { const k = v === KHAC; setDuAnTuGhi(k); if (k || v === "__khong") { setDuAnSlug(""); setDuAnTen(""); } else { const d = dsDuAn.data.find((x) => x.slug === v); setDuAnSlug(d?.slug ?? ""); setDuAnTen(d?.ten ?? ""); } }} />
        {duAnTuGhi && <ONhap placeholder="Tên dự án" value={duAnTen} onChange={(e) => setDuAnTen(e.target.value)} maxLength={80} />}
        <ONhap nhan="Địa chỉ cụ thể (số nhà, tên đường, số lô, block…)" placeholder="VD: 123 Võ Nguyên Giáp · Lô A12 khu B · Block 3 · hoặc chỉ tên đường" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
        <button type="button" className="nut-vi-tri" disabled={dangViTri} onClick={dungViTri}>{dangViTri ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}</button>
      </Nhom>

      <Nhom so={2} an={buoc !== 2} tieuDe="Thông tin chính">
        {/* GIÁ = web điện thoại: ô số trọn hàng, ô đơn vị hàng dưới; Thoả thuận khoá ô số; Khác — tự ghi = ô chữ */}
        <div style={{ display: "grid", gap: 8 }}>
          {donVi === KHAC_GIA
            ? <ONhap nhan={md === "thue" ? "Giá thuê *" : "Giá bán *"} value={giaTuGhi} onChange={(e) => setGiaTuGhi(e.target.value)} maxLength={60} />
            : <ONhap nhan={md === "thue" ? "Giá thuê *" : "Giá bán *"} placeholder={donVi === "Thoả thuận" ? "" : goiYGia(donVi)} inputMode="decimal" disabled={donVi === "Thoả thuận"}
                value={donVi === "Thoả thuận" ? "" : gia} onChange={(e) => setGia(e.target.value.replace(/[^\d.,]/g, ""))} />}
          <ChonCoTim nhan="" giuCho="Đơn vị" giaTri={donVi} ds={DON_VI_GIA[md].map((d) => ({ gt: d, nhan: d }))} onChon={setDonVi} />
        </div>
        <ONhap nhan={`${nhanDienTich(loaiGoc)} *`} placeholder={goiYDienTich(loaiGoc)} inputMode="decimal" value={dienTich} onChange={(e) => setDienTich(e.target.value)} />
        {loaiGoc && coDienTichXayDung(loaiGoc) && <ONhap nhan="Diện tích sử dụng (m²)" inputMode="decimal" placeholder="VD: 95" value={dtXay} onChange={(e) => setDtXay(e.target.value)} />}
        {truong.chinh.filter(boLoaiCon).map(oTruong)}
      </Nhom>

      <Nhom so={3} an={buoc !== 3} tieuDe="Đặc điểm & tiện ích">
        {loaiGoc && (coPhongNgu(loaiGoc) || coPhongTam(loaiGoc)) && (
          <div className="hai-cot">
            {coPhongNgu(loaiGoc) && <div><ONhap nhan="Số phòng ngủ" inputMode="numeric" value={ngu} onChange={(e) => setNgu(e.target.value.replace(/[^0-9]/g, ""))} /></div>}
            {coPhongTam(loaiGoc) && <div><ONhap nhan="Số phòng tắm" inputMode="numeric" value={tam} onChange={(e) => setTam(e.target.value.replace(/[^0-9]/g, ""))} /></div>}
          </div>
        )}
        {truong.dacDiem.filter(boLoaiCon).map(oTruong)}
        {/* Như web: chưa chọn loại hình thì mục 3 trống — ô đặc điểm theo loại hình */}
        {loaiGoc && <ChonCoTim nhan="Hướng nhà / đất" giuCho="Chọn hướng" giaTri={huong} ds={HUONG.map((h) => ({ gt: h, nhan: h }))} onChon={setHuong} />}
        {loaiGoc && <ChonCoTim nhan="Tình trạng pháp lý" giuCho="Chọn pháp lý" giaTri={phapLy} ds={phapLyCho(loaiGoc).map((p) => ({ gt: p, nhan: p }))} onChon={setPhapLy} />}
        {loaiGoc && coNoiThat(loaiGoc) && (
          <ChonCoTim nhan="Tình trạng nội thất" giuCho="Chọn nội thất" giaTri={noiThat} ds={NOI_THAT.map((p) => ({ gt: p, nhan: p }))} onChon={setNoiThat} />
        )}
        {/* Danh sách nội thất như web: có nội thất (không phải "Không nội thất" / "Bàn giao thô") mới bày */}
        {loaiGoc && coNoiThat(loaiGoc) && !!noiThat && !/^(Không nội thất|Bàn giao thô)$/.test(noiThat) && (
          <div className="chon-nhieu">
            {noiThatCho(loaiGoc).map((it) => <button key={it} className={noiThatDs.includes(it) ? "bat" : ""} onClick={() => setNoiThatDs((d) => bat(d, it))}>{it}</button>)}
          </div>
        )}
        {loaiGoc && tienIchCho(loaiGoc).map((g) => (
          <div key={g.group} style={{ display: "grid", gap: 6 }}>
            <Text size="small" bold>{g.group}</Text>
            <div className="chon-nhieu">
              {g.items.map((it) => <button key={it} className={tienIch.includes(it) ? "bat" : ""} onClick={() => setTienIch((d) => bat(d, it))}>{it}</button>)}
            </div>
          </div>
        ))}
      </Nhom>

      <Nhom so={4} an={buoc !== 4} tieuDe="Tiêu đề & mô tả">
        {/* Chữ gợi ý = web (anh 16/11/2026: bỏ câu hướng dẫn dài) */}
        {/* Ô Tiêu đề = web điện thoại 17/11/2026 (7390e208): khung CỐ ĐỊNH 3 dòng (88px), dài hơn cuộn trong khung — ô không đổi cỡ nên trang không dịch */}
        <ONhap vung className="o-tieu-de" rows={3} nhan="Tiêu đề tin đăng *" placeholder="Nhập tiêu đề bất động sản" value={tieuDe} onChange={(e) => setTieuDe(e.target.value.replace(/\n/g, " "))} maxLength={120} dem />
        <ONhap vung nhan="Mô tả chi tiết" placeholder="Nhập nội dung mô tả bất động sản" value={moTa} onChange={(e) => setMoTa(e.target.value)} />
      </Nhom>

      {!daDang && <Nhom so={5} an={buoc !== 5} tieuDe="Chọn gói *">
        {/* BẢNG GIÁ MA TRẬN như web — bấm ô = chọn hạng + số ngày. Giá từ admin, đã gồm VAT. */}
        {dsGoi.length ? (
          <BangGiaMaTran
            plans={dsGoi}
            chon={{ tier: goi?.tierId ?? "", days: soNgay ?? 0 }}
            onChon={(t, d) => { setHang(t); setSoNgay(d); }}
            quyDinh={false}
          />
        ) : (
          <Spinner />
        )}

      </Nhom>}


      <Nhom so={6} hien={soHien(6)} an={buoc !== 6} tieuDe={`Hình ảnh & video${laTinTim ? "" : " *"}`}>
        <small className="goi-y-o">Ảnh: {anh.length}/{toiDaAnh}</small>
        <div className="luoi-anh">
          {anh.map((u, i) => (
            <div key={u} className="o-anh">
              <img src={u} alt="" />
              <button onClick={() => setAnh((cu) => cu.filter((_, j) => j !== i))} aria-label="Bỏ ảnh">×</button>
            </div>
          ))}
          {anh.length < toiDaAnh && (
            <button className="o-anh them" onClick={themAnh} disabled={dangTaiAnh}>
              {dangTaiAnh ? <Spinner /> : <><BieuTuongWeb ten="anh" co={24} /><span>Thêm ảnh</span></>}
            </button>
          )}
        </div>
        {laVideo(video) && !/youtube\.com|youtu\.be|vimeo\.com/i.test(video) ? (
          <div className="o-video">
            <video src={video} controls playsInline preload="metadata" />
            <button onClick={() => setVideo("")} aria-label="Bỏ video">×</button>
          </div>
        ) : (
          <>
            <Button size="small" variant="secondary" disabled={tienDoVideo !== null || dangTaiAnh} onClick={themVideo}>
              {tienDoVideo !== null ? `Đang tải video…${tienDoVideo ? ` ${tienDoVideo}%` : ""}` : "Thêm video"}
            </Button>
            <ONhap nhan="Thêm video (link YouTube)" placeholder="https://youtu.be/…" value={video} onChange={(e) => setVideo(e.target.value)} />
            {video.trim() && !laVideo(video.trim()) && <Text size="xSmall" style={{ color: "#d70018" }}>Link chưa đúng — dán link YouTube của video.</Text>}
          </>
        )}
      </Nhom>

      <Nhom so={7} hien={soHien(7)} an={buoc !== 7} tieuDe={daDang ? "Thông tin liên hệ" : "Thanh toán – Đăng tin"}>
        {/* THANH TOÁN (như web bước 7): Bắt đầu hiển thị → gói, phí, VAT, tổng tiền, số dư ví → liên hệ → Đăng tin */}
        {!daDang && <>
        <Text size="small" bold>Bắt đầu hiển thị</Text>
        <div className="tab-md">
          <button className={!batDau ? "bat" : ""} onClick={() => setBatDau("")}>Ngay khi được duyệt</button>
          <button className={batDau ? "bat" : ""} onClick={() => setBatDau(batDau || ngayVnSau(1))}>Chọn ngày</button>
        </div>
        {batDau && (
          <label className="o-ngay">
            <span>{batDau.split("-").reverse().join("/")}</span>
            <input type="date" value={batDau} min={ngayVnSau(1)} max={ngayVnSau(30)} onChange={(e) => setBatDau(e.target.value)} aria-label="Ngày bắt đầu hiển thị" />
          </label>
        )}
        {goi ? (
          <div className="tom-tat-goi">
            <div><span>Gói tin</span><b>{TEN_HANG[goi.tierId] ?? goi.name}</b></div>
            <div><span>Thời gian hiển thị</span><b>{tien.soNgayThat} ngày</b></div>
            {!tien.mienPhi && <div><span>Phí đăng tin</span><b>{vnd(tien.thanhTien)}</b></div>}
            {!tien.mienPhi && tien.tongTra > tien.thanhTien && <div><span>VAT 8%</span><b>{vnd(tien.tongTra - tien.thanhTien)}</b></div>}
            <div><span>Tổng tiền</span><b>{tien.mienPhi ? "Miễn phí" : vnd(tien.tongTra)}</b></div>
            {tien.thanhTien > 0 && <div><span>Số dư ví</span><b style={tien.viCo < tien.tongTra ? { color: "#d70018" } : undefined}>{vnd(tien.viCo)}</b></div>}
          </div>
        ) : (
          <Button size="small" variant="secondary" onClick={() => moBuoc(5)}>Chọn gói tin</Button>
        )}
        <div className="chia" />
        <div className="muc-phu">Thông tin liên hệ</div>
        </>}
        {daXacMinh || tinSua ? (
          <Text size="small">{ten || "—"} · {sdt}</Text>
        ) : (
          <XacMinhSo
            dangTin
            nutZalo="Dùng số điện thoại Zalo để đăng tin"
            chuaDangNhap={() => dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(maSua ? `/dang-tin?id=${maSua}` : "/dang-tin")}`)}
            xong={(so) => { setSdt(so); setDaXmXong(true); }}
          />
        )}
      </Nhom>

      {loi && <Box p={4} style={{ display: "grid", gap: 8 }}>
        <Text size="small" style={{ color: "#d70018" }}>{loi}</Text>
      </Box>}

      <Sheet visible={xemTruoc} onClose={() => setXemTruoc(false)} autoHeight mask handler swipeToClose>
        <Box p={4} style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <div style={{ pointerEvents: "none" }}>
            <TheTinDoc tin={{
              id: "xem-truoc", purpose: nhuCau, type: loaiGoc, title: tieuDe.trim() || "Tiêu đề tin đăng", description: moTa.trim() || null,
              price_vnd: giaVnd(), area_m2: Number.isNaN(so(dienTich)) ? null : so(dienTich), beds: ngu ? parseInt(ngu, 10) : null, baths: tam ? parseInt(tam, 10) : null,
              ward: phuong || null, district: he === "cu" ? quan || null : null, province: tinh, images: laVideo(video.trim()) ? [video.trim(), ...anh] : anh,
              tier: (goi?.tierId ?? "basic") as Tin["tier"], tier_expires_at: new Date(Date.now() + 86_400_000 * (tien.soNgayThat || 7)).toISOString(),
              published_at: new Date().toISOString(), bumped_at: null, nguoi_dang: ten || null, sdt: sdt.replace(/[^0-9]/g, "") || null,
            }} />
          </div>
        </Box>
      </Sheet>

      {/* HÀNG NÚT NGAY DƯỚI NỘI DUNG MỖI BƯỚC (như web 18/11/2026): không dính đáy → không bao giờ đè ô đang gõ, bàn phím bật / tắt không mất nút.
          Trái: Xem trước · Lưu nháp. Phải: ‹ Quay lại · Tiếp; bước cuối: Đăng tin (rộng hết, nổi bật). */}
      <div className="hang-buoc">
        {viTriBuoc === dsBuoc.length - 1 && (
          <Button fullWidth loading={dangGui && !luuNhap} disabled={dangGui || dangTaiAnh || tienDoVideo !== null} onClick={() => gui(false)}>{daDang || tinSua?.status === "pending" ? "Cập nhật" : "Đăng tin"}</Button>
        )}
        <div className="hang-buoc-duoi">
          <div className="hang-buoc-nhom">
            <button type="button" className="nut-vien" onClick={() => setXemTruoc(true)}>Xem trước</button>
            {!daDang && tinSua?.status !== "pending" && (
              <button type="button" className="nut-vien" disabled={dangGui || dangTaiAnh || tienDoVideo !== null} onClick={() => gui(true)}>{dangGui && luuNhap ? "Đang lưu…" : "Lưu nháp"}</button>
            )}
          </div>
          <div className="hang-buoc-nhom">
            {viTriBuoc > 0 && <button type="button" className="nut-vien nut-tron" aria-label="Quay lại" onClick={() => { setLoi(undefined); moBuoc(dsBuoc[viTriBuoc - 1]); }}>‹</button>}
            {viTriBuoc < dsBuoc.length - 1 && <button type="button" className="nut-tiep" onClick={tiepBuoc}>Tiếp ›</button>}
          </div>
        </div>
      </div>
    </Page>
  );
}
