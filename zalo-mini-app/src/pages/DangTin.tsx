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
// Mini App chỉ mở GÓI TIN THƯỜNG (Basic); gói VIP / thanh toán cần Checkout SDK của Zalo (chưa bật).

const KHAC = "__khac"; // dòng "Khác — tự ghi" của ô chọn (như web ChonHoacGhi)
// Danh sách CHÉP ĐÚNG web (src/lib/listingSpec.ts legalOptions · directions · furnishLevels) — 14/11/2026 "web một nẻo, đây một nẻo"
const HUONG = ["Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"];
const NOI_THAT = ["Không nội thất", "Bàn giao thô", "Nội thất cơ bản", "Nội thất đầy đủ", "Nội thất cao cấp"];
// Ô "Thuộc dự án" như web: danh sách = /api/du-an/ten (dự án có hồ sơ + dự án khách đã ghi), lọc theo tỉnh; "Khác — tự ghi" → slug từ tên (web slugify)
const boDau = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
const gonTinh = (x: string) => boDau(x.replace(/^(Thành phố|Tỉnh)s+/i, "")).trim();
const slugTen = (x: string) => boDau(x).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const TOI_DA_ANH = 15; // web: mọi tin 15 ảnh (mức chung hiện hành)
const VAT = 0.08; // src/lib/thue.ts — giá niêm yết chưa gồm GTGT

const ngayVnSau = (n: number) => new Date(Date.now() + 7 * 3_600_000 + n * 86_400_000).toISOString().slice(0, 10);
const so = (s: string) => (s.trim() ? Number(s.replace(/\./g, "").replace(",", ".")) : NaN);
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;

function Nhom({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <Box mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 12 }}>
      <Text.Title size="small">{tieuDe}</Text.Title>
      {children}
    </Box>
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
  const [donVi, setDonVi] = useState<"ty" | "trieu">("ty");
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
  const [xemTruoc, setXemTruoc] = useState(false); // nút Xem trước như web: thẻ tin đúng như sẽ hiện
  const [luuNhap, setLuuNhap] = useState(false); // bấm Lưu nháp (như web: ghi được tới đâu lưu tới đó, không gửi duyệt)
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
      const g = Number(r.price_vnd);
      if (g > 0) {
        const tyDv = r.purpose !== "thue" && g >= 1e9;
        setDonVi(tyDv ? "ty" : "trieu");
        setGia(String(+(g / (tyDv ? 1e9 : 1e6)).toFixed(3)).replace(".", ","));
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
    const conCho = TOI_DA_ANH - anh.length;
    if (conCho <= 0) return;
    const ds = await chonAnh(conCho);
    if (!ds.length) return;
    setDangTaiAnh(true);
    try {
      for (const b of ds) {
        const url = await taiAnhLen(b);
        setAnh((cu) => [...cu, url]);
      }
    } catch (e) {
      setLoi((e as Error).message);
    }
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

  const giaVnd = () => {
    const g = so(gia);
    if (Number.isNaN(g)) return null;
    return Math.round(md === "thue" ? g * 1e6 : g * (donVi === "ty" ? 1e9 : 1e6));
  };

  // VỊ TRÍ HIỆN TẠI (Zalo getLocation): Zalo hỏi khách cho chia sẻ vị trí → máy chủ web đổi ra tỉnh · phường · đường (/api/vi-tri-zalo),
  // điền sẵn ô Vị trí; khách vẫn sửa được. Từ chối thì thôi, không báo lỗi (Chính sách kiểm duyệt Zalo 6.3).
  const [dangViTri, setDangViTri] = useState(false);
  const boDauVT = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/^(thanh pho|tinh)s+/, "").trim();
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
      : <Input key={fd.key} label={nhan} placeholder={fd.placeholder ?? ""} inputMode={fd.type === "number" ? "decimal" : undefined} value={v} onChange={(e) => dat(e.target.value)} />;
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
        specs: { ...specLoai(), ...oLoaiLuu() }, legal: phapLy || undefined, direction: huong || undefined, furnish: noiThat || undefined,
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

  const gui = async (nhap = false) => {
    setLoi(undefined);
    setLuuNhap(nhap);
    if (!nguoiDung) return dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(maSua ? `/dang-tin?id=${maSua}` : "/dang-tin")}`);
    if (!loai) return setLoi("Chưa chọn loại hình bất động sản.");
    if (!tinh) return setLoi("Chưa chọn Tỉnh/Thành.");
    if (!tieuDe.trim()) return setLoi("Chưa nhập tiêu đề tin.");
    if (nhap && !maSua) return luuBanNhap();
    if (Number.isNaN(so(dienTich))) return setLoi("Chưa nhập diện tích.");
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

    // Ví không đủ → lưu nháp nguyên vẹn (như web), khách nạp tiền rồi đăng tiếp.
    // So với KHẢ DỤNG = số dư − tiền tạm giữ cho tin chờ duyệt khác (0056, y như web + CSDL).
    const { data: vi } = await supabase.rpc("so_du_kha_dung");
    const khaDung = Number((vi as { kha_dung: number }[] | null)?.[0]?.kha_dung ?? tien.viCo);
    const viThieu = tien.tongTra > 0 && khaDung < tien.tongTra;
    if (maSua && viThieu) return setLoi(`Ví chưa đủ ${vnd(tien.tongTra)} cho gói đã chọn.`);
    setDangGui(true);
    const specs: Record<string, string> = {};
    const loaiLuu = loai.split("::")[0];
    Object.assign(specs, specLoai(), oLoaiLuu());
    const { error } = await supabase.from("listings").insert({
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
    });
    setDangGui(false);
    if (error && /VI_KHONG_DU/.test(error.message)) {
      const m = error.message.match(/(\d+)\s*đ/);
      return setLoi(m ? `Nạp thêm ${Number(m[1]).toLocaleString("vi-VN")} đ để đăng tin.` : "Ví không đủ tiền để đăng tin.");
    }
    if (error) return setLoi(/BDS_KHAC/.test(error.message) ? error.message.replace(/^.*BDS_KHAC:\s*/, "") : `Gửi tin thất bại: ${error.message}`);
    // Gửi duyệt từ tin nháp: tin chờ duyệt đã tạo → xoá nháp cũ (như web, không để tin trùng).
    if (maSua && (tinSua?.status === "draft" || tinSua?.status === "rejected") && !viThieu) await supabase.from("listings").delete().eq("id", maSua);
    setXong(viThieu ? "draft" : "pending");
    // Tin vào hàng chờ duyệt → nhờ máy chủ web báo khách "đã nhận tin" (máy chủ tự kiểm, không báo trùng).
    if (!viThieu) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) fetch("https://coastalland.vn/api/tin-dang/da-nhan", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  };

  if (!san) return <Page><TieuDe title="Đăng tin" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;

  if (!phien)
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
              : luuNhap ? "" : `Ví chưa đủ ${vnd(tien.tongTra)} cho gói đã chọn. Tin đã lưu nháp nguyên vẹn — nạp tiền xong là đăng tiếp.`}
          </Text>}
          {xong === "draft" && !luuNhap && <Button fullWidth onClick={() => dieuHuong("/nap-tien")}>Nạp tiền để đăng tin</Button>}
          <Button fullWidth variant={xong === "draft" ? "secondary" : "primary"} onClick={() => dieuHuong("/tin-cua-toi", { replace: true })}>Xem tin của tôi</Button>
          <Button fullWidth variant="secondary" onClick={() => dieuHuong("/", { replace: true })}>Về trang chủ</Button>
        </Box>
      </Page>
    );

  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title={maSua ? "Sửa tin" : "Đăng tin"} />

      {maSua && loiNap && <Box p={4}><Text size="small" style={{ color: "#d70018" }}>Không tìm thấy tin.</Text></Box>}

      {/* THỨ TỰ 7 MỤC = FORM WEB (PostListingForm, 14/11/2026 "web một nẻo, đây một nẻo"): 1 Loại hình & địa chỉ · 2 Thông tin chính ·
          3 Đặc điểm & tiện ích · 4 Tiêu đề & mô tả · 5 Gói tin — thanh toán · 6 Hình ảnh & video · 7 Thông tin liên hệ. Nhãn chép theo web. */}
      <Nhom tieuDe="1. Loại hình & địa chỉ">
        {!daDang && <div className="tab-md bon">
          {([["ban", "Cần bán"], ["mua", "Cần mua"], ["thue", "Cho thuê"], ["can-thue", "Cần thuê"]] as [NhuCau, string][]).map(([k, t]) => (
            <button key={k} className={nhuCau === k ? "bat" : ""} onClick={() => doiNhuCau(k)}>{t}</button>
          ))}
        </div>}
        <ChonCoTim nhan="Loại hình *" giuCho="Chọn loại hình" giaTri={loai} ds={DS_LOAI[md].map((l) => ({ gt: l.ma, nhan: l.ten }))} onChon={(v) => { if (v === loai) return; setLoai(v); setLoaiCon(""); setConTuGhi(false); }} />
        {oCon && (
          <ChonCoTim nhan={oCon.label} giuCho={`Chọn ${oCon.label.toLowerCase()}`} giaTri={conTuGhi ? KHAC : loaiCon}
            ds={[...oCon.options.map((o) => ({ gt: o, nhan: o })), { gt: KHAC, nhan: "Khác — tự ghi" }]}
            onChon={(v) => { const k = v === KHAC; setConTuGhi(k); setLoaiCon(k ? "" : v); }} />
        )}
        {oCon && conTuGhi && <Input placeholder={oCon.label} value={loaiCon} onChange={(e) => setLoaiCon(e.target.value)} maxLength={60} />}
        <Button size="small" variant="secondary" loading={dangViTri} onClick={dungViTri}>Dùng vị trí hiện tại</Button>
        <div className="tab-md">
          <button className={he === "moi" ? "bat" : ""} onClick={() => doiHe("moi")}>Địa chỉ mới</button>
          <button className={he === "cu" ? "bat" : ""} onClick={() => doiHe("cu")}>Địa chỉ cũ</button>
        </div>
        <ChonCoTim nhan="Tỉnh / Thành *" giuCho="Chọn tỉnh/thành" giaTri={tinh}
          ds={(he === "moi" ? provincesNew.map((p) => p.name) : dsCu.map((p) => p.name)).map((n) => ({ gt: n, nhan: n }))}
          onChon={(v) => { if (v !== tinh) { setTinh(v); setQuan(""); setPhuong(""); } }} />
        {he === "cu" && <ChonCoTim nhan="Quận / Huyện" giuCho={tinh ? "Chọn quận/huyện" : "Chọn tỉnh/thành trước"} giaTri={quan} tat={!tinh} ds={dsQuan.map((q) => ({ gt: q, nhan: q }))} onChon={(v) => { if (v !== quan) { setQuan(v); setPhuong(""); } }} />}
        <ChonCoTim nhan="Phường / Xã" giuCho={he === "cu" ? (quan ? "Chọn phường/xã" : "Chọn quận/huyện trước") : tinh ? "Chọn phường/xã" : "Chọn tỉnh/thành trước"} giaTri={phuong} tat={he === "cu" ? !quan : !tinh} ds={dsPhuong.map((w) => ({ gt: w, nhan: w }))} onChon={setPhuong} />
        <Input label="Số nhà, tên đường" placeholder="VD: 123 Võ Nguyên Giáp · Lô A12…" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
        <ChonCoTim nhan="Thuộc dự án" giuCho="Chọn dự án" giaTri={duAnTuGhi ? KHAC : duAnSlug}
          ds={[{ gt: "__khong", nhan: "Không thuộc dự án" }, ...duAnTrongTinh.map((d) => ({ gt: d.slug, nhan: d.ten })), { gt: KHAC, nhan: "Khác — tự ghi" }]}
          onChon={(v) => { const k = v === KHAC; setDuAnTuGhi(k); if (k || v === "__khong") { setDuAnSlug(""); setDuAnTen(""); } else { const d = dsDuAn.data.find((x) => x.slug === v); setDuAnSlug(d?.slug ?? ""); setDuAnTen(d?.ten ?? ""); } }} />
        {duAnTuGhi && <Input placeholder="Tên dự án" value={duAnTen} onChange={(e) => setDuAnTen(e.target.value)} maxLength={80} />}
      </Nhom>

      <Nhom tieuDe="2. Thông tin chính">
        <Input label={`${loaiGoc ? nhanDienTich(loaiGoc) : "Diện tích (m²)"} *`} inputMode="decimal" value={dienTich} onChange={(e) => setDienTich(e.target.value)} />
        <Box flex style={{ gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input label={md === "thue" ? "Giá (triệu/tháng)" : "Mức giá"} placeholder="Trống = Thỏa thuận" inputMode="decimal" value={gia} onChange={(e) => setGia(e.target.value)} />
          </div>
          {md === "ban" && (
            <div className="tab-md" style={{ width: 130 }}>
              <button className={donVi === "ty" ? "bat" : ""} onClick={() => setDonVi("ty")}>Tỷ</button>
              <button className={donVi === "trieu" ? "bat" : ""} onClick={() => setDonVi("trieu")}>Triệu</button>
            </div>
          )}
        </Box>
        {loaiGoc && coDienTichXayDung(loaiGoc) && <Input label="Diện tích sử dụng (m²)" inputMode="decimal" placeholder="VD: 95" value={dtXay} onChange={(e) => setDtXay(e.target.value)} />}
        {truong.chinh.filter(boLoaiCon).map(oTruong)}
      </Nhom>

      <Nhom tieuDe="3. Đặc điểm & tiện ích">
        {loaiGoc && (coPhongNgu(loaiGoc) || coPhongTam(loaiGoc)) && (
          <Box flex style={{ gap: 8 }}>
            {coPhongNgu(loaiGoc) && <div style={{ flex: 1 }}><Input label="Số phòng ngủ" inputMode="numeric" value={ngu} onChange={(e) => setNgu(e.target.value.replace(/[^0-9]/g, ""))} /></div>}
            {coPhongTam(loaiGoc) && <div style={{ flex: 1 }}><Input label="Số phòng tắm" inputMode="numeric" value={tam} onChange={(e) => setTam(e.target.value.replace(/[^0-9]/g, ""))} /></div>}
          </Box>
        )}
        {truong.dacDiem.filter(boLoaiCon).map(oTruong)}
        <ChonCoTim nhan="Hướng nhà / đất" giuCho="Chọn hướng" giaTri={huong} ds={HUONG.map((h) => ({ gt: h, nhan: h }))} onChon={setHuong} />
        <ChonCoTim nhan="Tình trạng pháp lý" giuCho="Chọn pháp lý" giaTri={phapLy} ds={phapLyCho(loaiGoc || undefined).map((p) => ({ gt: p, nhan: p }))} onChon={setPhapLy} />
        {(!loaiGoc || coNoiThat(loaiGoc)) && (
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

      <Nhom tieuDe="4. Tiêu đề & mô tả">
        <Input label="Tiêu đề tin đăng *" placeholder="VD: Bán nhà 3 tầng mặt tiền Hòa Xuân, Đà Nẵng" value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} maxLength={120} showCount />
        <Input.TextArea label="Mô tả chi tiết" placeholder="Vị trí, pháp lý, tiện ích, hướng nhà…" value={moTa} onChange={(e) => setMoTa(e.target.value)} />
      </Nhom>

      {!daDang && <Nhom tieuDe="5. Gói tin — thanh toán *">
        {/* BẢNG GIÁ MA TRẬN như web — bấm ô = chọn hạng + số ngày. Giá từ admin, đã gồm VAT. */}
        {dsGoi.length ? (
          <BangGiaMaTran
            plans={dsGoi}
            chon={{ tier: goi?.tierId ?? "", days: soNgay ?? 0 }}
            onChon={(t, d) => { setHang(t); setSoNgay(d); }}
          />
        ) : (
          <Spinner />
        )}
        {goi && (
          <div className="tom-tat-goi">
            <div><span>Loại tin</span><b>{TEN_HANG[goi.tierId] ?? goi.name}</b></div>
            <div><span>Thời gian đăng</span><b>{tien.soNgayThat} ngày</b></div>
            <div><span>Bắt đầu hiển thị</span><b>{batDau ? batDau.split("-").reverse().join("/") : "Khi tin được duyệt"}</b></div>
            {tien.mienPhi ? (
              <div><span>Ưu đãi thành viên mới</span><b>Miễn phí</b></div>
            ) : (
              <>
                <div><span>Phí + VAT 8%</span><b>{vnd(tien.tongTra)}</b></div>
                {tien.thanhTien > 0 && <div><span>Ví hiện có</span><b>{vnd(tien.viCo)}</b></div>}
              </>
            )}
          </div>
        )}

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
      </Nhom>}


      <Nhom tieuDe={`6. Hình ảnh & video${laTinTim ? "" : " *"} (${anh.length}/${TOI_DA_ANH})`}>
        <div className="luoi-anh">
          {anh.map((u, i) => (
            <div key={u} className="o-anh">
              <img src={u} alt="" />
              <button onClick={() => setAnh((cu) => cu.filter((_, j) => j !== i))} aria-label="Bỏ ảnh">×</button>
            </div>
          ))}
          {anh.length < TOI_DA_ANH && (
            <button className="o-anh them" onClick={themAnh} disabled={dangTaiAnh}>
              {dangTaiAnh ? <Spinner /> : <><BieuTuongWeb ten="anh" co={24} /><span>Thêm ảnh</span></>}
            </button>
          )}
        </div>
        {laVideo(video) && !/youtube.com|youtu.be|vimeo.com/i.test(video) ? (
          <div className="o-video">
            <video src={video} controls playsInline preload="metadata" />
            <button onClick={() => setVideo("")} aria-label="Bỏ video">×</button>
          </div>
        ) : (
          <>
            <Button size="small" variant="secondary" disabled={tienDoVideo !== null || dangTaiAnh} onClick={themVideo}>
              {tienDoVideo !== null ? `Đang tải video…${tienDoVideo ? ` ${tienDoVideo}%` : ""}` : "Thêm video"}
            </Button>
            <Input label="Hoặc link YouTube" placeholder="https://youtu.be/…" value={video} onChange={(e) => setVideo(e.target.value)} />
            {video.trim() && !laVideo(video.trim()) && <Text size="xSmall" style={{ color: "#d70018" }}>Link chưa đúng — dán link YouTube của video.</Text>}
          </>
        )}
      </Nhom>

      <Nhom tieuDe="7. Thông tin liên hệ">
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

      {loi && <Box p={4}><Text size="small" style={{ color: "#d70018" }}>{loi}</Text></Box>}

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

      <div className="nut-chinh">
        <div className="hang-nut">
          <Button variant="tertiary" onClick={() => setXemTruoc(true)}>Xem trước</Button>
          {!daDang && tinSua?.status !== "pending" && (
            <Button variant="secondary" loading={dangGui && luuNhap} disabled={dangGui || dangTaiAnh || tienDoVideo !== null} onClick={() => gui(true)}>Lưu nháp</Button>
          )}
          <Button loading={dangGui && !luuNhap} disabled={dangGui || dangTaiAnh || tienDoVideo !== null} onClick={() => gui(false)}>{daDang || tinSua?.status === "pending" ? "Cập nhật" : "Đăng tin"}</Button>
        </div>
      </div>
    </Page>
  );
}
