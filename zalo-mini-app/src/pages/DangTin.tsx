import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Icon, Input, Page, Select, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { useSearchParams } from "react-router-dom";
import { provincesNew } from "../lib/provincesNew";
import { layBangGia } from "../lib/tin";
import { soVN, supabase, usePhien } from "../lib/supabase";
import { chonAnh, taiAnhLen } from "../lib/taiAnh";
import { laVideo, tachAnh } from "../lib/media";
import { useTai } from "../lib/useTai";
import { layNguoiZalo } from "../lib/zalo";
import { getAccessToken, getLocation, getPhoneNumber } from "zmp-sdk";
import BangGiaMaTran, { TEN_HANG } from "../components/BangGiaMaTran";

const { Option } = Select;

// ĐĂNG TIN — ghi thẳng vào bảng listings như form web (src/components/PostListingForm.tsx):
// status "pending" chờ admin duyệt, details.plan = gói + số tiền đã báo (giaBao, chưa VAT).
// Mini App chỉ mở GÓI TIN THƯỜNG (Basic); gói VIP / thanh toán cần Checkout SDK của Zalo (chưa bật).

// Loại hình — ĐÚNG ô Loại hình của form web (06/11/2026, sinh từ src/lib/categories.ts nhomChonLoaiHinh + tenLoaiHinhMenu).
// ma = giá trị lưu ("<loại hình>::<loại đất>" khi là Đất nền dự án) · ten = chữ khách thấy. Web đổi cây thì sinh lại hai dòng này.
const LOAI_BAN = [{"ma":"Căn hộ","ten":"Căn hộ"},{"ma":"Chung cư","ten":"Chung cư"},{"ma":"Căn hộ dịch vụ","ten":"Căn hộ dịch vụ"},{"ma":"Nhà riêng","ten":"Nhà riêng"},{"ma":"Nhà mặt phố","ten":"Nhà mặt phố"},{"ma":"Nhà biệt thự / Liền kề","ten":"Nhà biệt thự, liền kề"},{"ma":"Shophouse / Nhà phố thương mại","ten":"Shophouse, nhà phố thương mại"},{"ma":"Đất khác","ten":"Đất"},{"ma":"Đất nền / Đất nền dự án","ten":"Đất nền"},{"ma":"Đất nền / Đất nền dự án::Đất nền dự án","ten":"Đất nền dự án"},{"ma":"Villa / Biệt thự biển","ten":"Villa, biệt thự biển"},{"ma":"Condotel","ten":"Condotel"},{"ma":"Homestay / Farmstay","ten":"Homestay, Farmstay"},{"ma":"Khu nghỉ dưỡng","ten":"Khu nghỉ dưỡng"},{"ma":"Đất công nghiệp","ten":"Đất công nghiệp"},{"ma":"Kho / Nhà xưởng","ten":"Kho, nhà xưởng"},{"ma":"Bất động sản khác","ten":"Bất động sản khác"}];
const LOAI_THUE = [{"ma":"Căn hộ","ten":"Căn hộ"},{"ma":"Chung cư","ten":"Chung cư"},{"ma":"Căn hộ dịch vụ","ten":"Căn hộ dịch vụ"},{"ma":"Nhà riêng","ten":"Nhà riêng"},{"ma":"Nhà mặt phố","ten":"Nhà mặt phố"},{"ma":"Nhà phố thương mại","ten":"Shophouse, nhà phố thương mại"},{"ma":"Biệt thự / Liền kề","ten":"Nhà biệt thự, liền kề"},{"ma":"Nhà trọ / Phòng trọ","ten":"Nhà trọ, phòng trọ"},{"ma":"Văn phòng","ten":"Văn phòng"},{"ma":"Mặt bằng / Cửa hàng bán lẻ","ten":"Cửa hàng, ki ốt"},{"ma":"Homestay / Farmstay","ten":"Homestay, Farmstay"},{"ma":"Thuê đất / Nhà xưởng / Kho bãi","ten":"Kho, nhà xưởng, đất"},{"ma":"Bất động sản khác","ten":"Bất động sản khác"}];
const PHAP_LY = ["Sổ đỏ / Sổ hồng", "Hợp đồng mua bán", "Đang chờ sổ"];
const HUONG = ["Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc", "Bắc", "Đông Bắc"];
const TOI_DA_ANH = 15; // web: mọi tin 15 ảnh (mức chung hiện hành)
const VAT = 0.08; // src/lib/thue.ts — giá niêm yết chưa gồm GTGT

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

  const [md, setMd] = useState<"ban" | "thue">(thamSo.get("md") === "thue" ? "thue" : "ban");
  const [loai, setLoai] = useState("");
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
  const [matTien, setMatTien] = useState("");
  const [soTang, setSoTang] = useState("");
  const [phapLy, setPhapLy] = useState("");
  const [huong, setHuong] = useState("");
  const [anh, setAnh] = useState<string[]>([]);
  const [dangTaiAnh, setDangTaiAnh] = useState(false);
  const [video, setVideo] = useState(""); // link YouTube — như web, video không lưu kho, chỉ gắn link
  const [ten, setTen] = useState("");
  const [sdt, setSdt] = useState("");
  // XÁC MINH SỐ KHI ĐĂNG TIN (luật tài khoản 06/11/2026): liên hệ trong tin = tài khoản (tên · số), không gõ tay; tài khoản chưa có
  // số đã xác minh → nhập số, mã gửi về Zalo của CHÍNH số đó, nhập mã — cùng đường web /api/xac-thuc/xac-minh-sdt (gộp tài khoản
  // theo luật web, máy chủ tự làm). Đăng nhập bằng Zalo không đòi số; chỉ đăng tin mới cần.
  const [buocXm, setBuocXm] = useState<"so" | "ma">("so");
  const [maXm, setMaXm] = useState("");
  const [dangXm, setDangXm] = useState(false);
  const [daXmXong, setDaXmXong] = useState(false);
  const [hang, setHang] = useState("basic"); // hạng tin: diamond · gold · silver · basic (như web)
  const [soNgay, setSoNgay] = useState<number>();
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
      setMd(r.purpose === "thue" ? "thue" : "ban");
      setLoai(sp.landType === "Đất nền dự án" ? `${r.type}::Đất nền dự án` : r.type ?? "");
      setTinh(r.province ?? "");
      setPhuong(r.ward ?? "");
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
      setMatTien(sp.frontage ? String(sp.frontage) : "");
      setSoTang(sp.floors ? String(sp.floors) : "");
      setPhapLy(d.legal ?? "");
      setHuong(d.direction ?? "");
      const ds = (r.images ?? []) as string[];
      setAnh(tachAnh(ds));
      setVideo(ds.find(laVideo) ?? "");
      if (d.contact?.name) setTen(d.contact.name);
      if (d.contact?.phone) setSdt(soVN(d.contact.phone));
      if (d.plan?.tier) setHang(d.plan.tier);
      if (d.plan?.days) setSoNgay(d.plan.days);
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
    const homNay = new Date().toISOString().slice(0, 10);
    const dangChay = !!f?.active && (!f.from || homNay >= f.from) && (!f.to || homNay <= f.to);
    const laMoi = !!hoSo.data?.created_at && (Date.now() - new Date(hoSo.data.created_at).getTime()) / 86_400_000 <= (f?.days ?? 0);
    // CÙNG MỘT điều kiện khuyến mãi với web (huongKhuyenMai, src/lib/billing.ts): chương trình
    // đang chạy · đúng hạng của chương trình · đúng đối tượng · còn lượt — lấy từ admin.
    const hopDoiTuong = f?.audience === "all" || (f?.audience === "new" && laMoi) || f?.audience === (hoSo.data?.role ?? "buyer");
    const conLuot = f?.quota === 0 || (hoSo.data?.free_quota ?? 0) > 0;
    const mienPhi = !!hoSo.data && dangChay && !!goi && goi.tierId === f?.tierId && hopDoiTuong && conLuot;
    const thanhTien = mienPhi ? 0 : giaGoi;
    // Số ngày tin THẬT SỰ hiển thị: hưởng khuyến mãi → đúng số ngày của chương trình (như web).
    const soNgayThat = mienPhi ? (f?.days ?? soNgay ?? 0) : (soNgay ?? 0);
    return { mienPhi, thanhTien, soNgayThat, tongTra: thanhTien + Math.round(thanhTien * VAT), viCo: Number(hoSo.data?.balance ?? 0) };
  }, [goi, soNgay, bangGia.data, hoSo.data]);

  const dsPhuong = provincesNew.find((p) => p.name === tinh)?.wards ?? [];

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
      setTinh(t.name);
      setPhuong(t.wards.find((w) => boDauVT(w) === boDauVT(j.phuong ?? "")) ?? "");
      if (j.duong && !diaChi.trim()) setDiaChi(j.duong);
    } catch {
      /* khách từ chối chia sẻ vị trí */
    } finally {
      setDangViTri(false);
    }
  };

  // SỐ ZALO MỘT CHẠM (Zalo getPhoneNumber): Zalo hỏi khách cho chia sẻ số → máy chủ đổi token ra số, coi như đã xác minh.
  const xacMinhSo = async (buoc: "gui-ma" | "xac-nhan" | "so-zalo") => {
    setLoi(undefined);
    setDangXm(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(maSua ? `/dang-tin?id=${maSua}` : "/dang-tin")}`);
      const r = await fetch("https://coastalland.vn/api/xac-thuc/xac-minh-sdt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          buoc === "so-zalo"
            ? { buoc, dangTin: true, tokenSo: (await getPhoneNumber()).token, zaloAccessToken: await getAccessToken() }
            : { buoc, sdt, ma: maXm, dangTin: true },
        ),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; loi?: string; sdt?: string; doiTaiKhoan?: { access_token: string; refresh_token: string } };
      if (!j.ok) return setLoi(j.loi || "Chưa xác minh được số. Vui lòng thử lại.");
      if (buoc === "gui-ma") return setBuocXm("ma");
      // Số đã thuộc tài khoản khác → máy chủ gộp về tài khoản đó và trả phiên mới (như web)
      if (j.doiTaiKhoan) await supabase.auth.setSession({ access_token: j.doiTaiKhoan.access_token, refresh_token: j.doiTaiKhoan.refresh_token });
      if (j.sdt) setSdt(soVN(j.sdt));
      setDaXmXong(true);
    } catch (e) {
      // Khách bấm Từ chối ở hộp hỏi số của Zalo → không báo lỗi, vẫn nhập số khác được (Chính sách kiểm duyệt Zalo 6.3).
      if (buoc !== "so-zalo") setLoi("Không kết nối được. Vui lòng thử lại.");
      void e;
    } finally {
      setDangXm(false);
    }
  };

  const gui = async () => {
    setLoi(undefined);
    if (!nguoiDung) return dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(maSua ? `/dang-tin?id=${maSua}` : "/dang-tin")}`);
    if (!loai) return setLoi("Chưa chọn loại hình bất động sản.");
    if (!tinh) return setLoi("Chưa chọn Tỉnh/Thành.");
    if (!tieuDe.trim()) return setLoi("Chưa nhập tiêu đề tin.");
    if (Number.isNaN(so(dienTich))) return setLoi("Chưa nhập diện tích.");
    if (!tinSua && (!daXacMinh || !sdt.trim())) return setLoi("Xác minh số điện thoại trước khi đăng tin.");
    if (!ten.trim()) return setLoi("Tài khoản chưa có họ tên — vào Cá nhân để đặt tên.");
    if (!daDang && !soNgay) return setLoi("Chưa chọn thời hạn đăng tin.");
    if (maSua && !tinSua) return;

    const specsSua = (goc: Record<string, any>) => {
      const s: Record<string, any> = { ...goc };
      const [, ld] = loai.split("::");
      if (ld) s.landType = ld; else if (s.landType === "Đất nền dự án") delete s.landType;
      if (matTien.trim()) s.frontage = matTien.trim(); else delete s.frontage;
      if (soTang.trim()) s.floors = soTang.trim(); else delete s.floors;
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
      ward: phuong || null,
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
          addressDetail: diaChi.trim() || undefined,
          contact: { ...(goc.contact ?? {}), name: ten.trim() },
          plan: daDang ? goc.plan : { tier: goi?.tierId ?? "basic", days: soNgay, giaBao: tien.thanhTien },
        };
        const capNhat: Record<string, unknown> = daDang
          ? { ...noiDung, details }
          : { ...noiDung, purpose: md, details, tier: goi?.tierId ?? "basic" };
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
    const [loaiLuu, loaiDat] = loai.split("::"); // Đất nền dự án = loại hình Đất nền / Đất nền dự án + loại đất (như web)
    if (loaiDat) specs.landType = loaiDat;
    if (matTien.trim()) specs.frontage = matTien.trim();
    if (soTang.trim()) specs.floors = soTang.trim();
    const { error } = await supabase.from("listings").insert({
      purpose: md,
      type: loaiLuu,
      title: tieuDe.trim(),
      description: moTa.trim() || null,
      price_vnd: giaVnd(),
      area_m2: so(dienTich),
      beds: ngu.trim() ? parseInt(ngu, 10) : null,
      baths: tam.trim() ? parseInt(tam, 10) : null,
      ward: phuong || null,
      district: null,
      province: tinh,
      // Video (link YouTube) ĐỨNG ĐẦU mảng images — đúng cách web lưu và hiện video đầu dãy.
      images: laVideo(video.trim()) ? [video.trim(), ...anh] : anh,
      details: {
        specs,
        legal: phapLy || undefined,
        direction: huong || undefined,
        addressDetail: diaChi.trim() || undefined,
        plan: { tier: goi?.tierId ?? "basic", days: soNgay, giaBao: tien.thanhTien },
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
          <Text.Title size="large">Đăng nhập để đăng tin</Text.Title>
          <Button fullWidth onClick={() => dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(maSua ? `/dang-tin?id=${maSua}` : "/dang-tin")}`)}>Đăng nhập bằng Zalo</Button>
        </Box>
      </Page>
    );

  if (xong)
    return (
      <Page style={{ background: "#fff" }}>
        <TieuDe title="Đăng tin" />
        <Box p={4} style={{ display: "grid", gap: 12, textAlign: "center", marginTop: 24 }}>
          <Icon icon="zi-check-circle-solid" size={56} style={{ color: "var(--cl-blue)", margin: "0 auto" }} />
          <Text.Title size="large">{xong === "sua" ? "Đã cập nhật tin" : xong === "pending" ? "Đã gửi tin, đang chờ duyệt" : "Đã lưu nháp tin"}</Text.Title>
          {xong !== "sua" && <Text className="chu-phu">
            {xong === "pending"
              ? "Coastal Land sẽ báo kết quả duyệt qua Zalo."
              : `Ví chưa đủ ${vnd(tien.tongTra)} cho gói đã chọn. Tin đã lưu nháp nguyên vẹn — nạp tiền xong là đăng tiếp.`}
          </Text>}
          {xong === "draft" && <Button fullWidth onClick={() => dieuHuong("/nap-tien")}>Nạp tiền để đăng tin</Button>}
          <Button fullWidth variant={xong === "draft" ? "secondary" : "primary"} onClick={() => dieuHuong("/tin-cua-toi", { replace: true })}>Xem tin của tôi</Button>
          <Button fullWidth variant="secondary" onClick={() => dieuHuong("/", { replace: true })}>Về trang chủ</Button>
        </Box>
      </Page>
    );

  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title={maSua ? "Sửa tin" : "Đăng tin"} />

      {maSua && loiNap && <Box p={4}><Text size="small" style={{ color: "#d70018" }}>Không tìm thấy tin.</Text></Box>}

      <Nhom tieuDe={daDang ? "Loại hình" : "Nhu cầu & loại hình"}>
        {!daDang && <div className="tab-md">
          <button className={md === "ban" ? "bat" : ""} onClick={() => { setMd("ban"); setLoai(""); }}>Cần bán</button>
          <button className={md === "thue" ? "bat" : ""} onClick={() => { setMd("thue"); setLoai(""); }}>Cho thuê</button>
        </div>}
        <Select label="Loại hình" placeholder="Chọn loại hình" value={loai} onChange={(v) => setLoai(String(v))} closeOnSelect>
          {(md === "thue" ? LOAI_THUE : LOAI_BAN).map((l) => <Option key={l.ma} value={l.ma} title={l.ten} />)}
        </Select>
      </Nhom>

      <Nhom tieuDe="Vị trí">
        <Button size="small" variant="secondary" loading={dangViTri} onClick={dungViTri}>Dùng vị trí hiện tại</Button>
        <Select label="Tỉnh/Thành" placeholder="Chọn tỉnh/thành" value={tinh} onChange={(v) => { setTinh(String(v)); setPhuong(""); }} closeOnSelect>
          {provincesNew.map((p) => <Option key={p.name} value={p.name} title={p.name} />)}
        </Select>
        <Select label="Phường/Xã" placeholder={tinh ? "Chọn phường/xã" : "Chọn tỉnh/thành trước"} value={phuong} disabled={!tinh} onChange={(v) => setPhuong(String(v))} closeOnSelect>
          {dsPhuong.map((w) => <Option key={w} value={w} title={w} />)}
        </Select>
        <Input label="Số nhà, tên đường" placeholder="VD: 220 Nguyễn Mậu Tài" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
      </Nhom>

      <Nhom tieuDe="Thông tin chính">
        <Input label="Tiêu đề" placeholder="VD: Bán nhà 3 tầng mặt tiền Hòa Xuân, Đà Nẵng" value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} maxLength={120} showCount />
        <Input.TextArea label="Mô tả" placeholder="Vị trí, pháp lý, tiện ích, hướng nhà…" value={moTa} onChange={(e) => setMoTa(e.target.value)} />
        <Box flex style={{ gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input label={md === "thue" ? "Giá (triệu/tháng)" : "Giá"} placeholder="Trống = Thỏa thuận" inputMode="decimal" value={gia} onChange={(e) => setGia(e.target.value)} />
          </div>
          {md === "ban" && (
            <div className="tab-md" style={{ width: 130 }}>
              <button className={donVi === "ty" ? "bat" : ""} onClick={() => setDonVi("ty")}>Tỷ</button>
              <button className={donVi === "trieu" ? "bat" : ""} onClick={() => setDonVi("trieu")}>Triệu</button>
            </div>
          )}
        </Box>
        <Input label="Diện tích (m²)" inputMode="decimal" value={dienTich} onChange={(e) => setDienTich(e.target.value)} />
        <Box flex style={{ gap: 8 }}>
          <div style={{ flex: 1 }}><Input label="Phòng ngủ" inputMode="numeric" value={ngu} onChange={(e) => setNgu(e.target.value.replace(/\D/g, ""))} /></div>
          <div style={{ flex: 1 }}><Input label="Phòng tắm" inputMode="numeric" value={tam} onChange={(e) => setTam(e.target.value.replace(/\D/g, ""))} /></div>
        </Box>
        <Box flex style={{ gap: 8 }}>
          <div style={{ flex: 1 }}><Input label="Mặt tiền (m)" inputMode="decimal" value={matTien} onChange={(e) => setMatTien(e.target.value)} /></div>
          <div style={{ flex: 1 }}><Input label="Số tầng" inputMode="decimal" value={soTang} onChange={(e) => setSoTang(e.target.value)} /></div>
        </Box>
        <Select label="Pháp lý" placeholder="Chọn pháp lý" value={phapLy} onChange={(v) => setPhapLy(String(v))} closeOnSelect>
          {PHAP_LY.map((p) => <Option key={p} value={p} title={p} />)}
        </Select>
        <Select label="Hướng nhà" placeholder="Chọn hướng" value={huong} onChange={(v) => setHuong(String(v))} closeOnSelect>
          {HUONG.map((h) => <Option key={h} value={h} title={h} />)}
        </Select>
      </Nhom>

      <Nhom tieuDe={`Hình ảnh (${anh.length}/${TOI_DA_ANH})`}>
        <div className="luoi-anh">
          {anh.map((u, i) => (
            <div key={u} className="o-anh">
              <img src={u} alt="" />
              <button onClick={() => setAnh((cu) => cu.filter((_, j) => j !== i))} aria-label="Bỏ ảnh">×</button>
            </div>
          ))}
          {anh.length < TOI_DA_ANH && (
            <button className="o-anh them" onClick={themAnh} disabled={dangTaiAnh}>
              {dangTaiAnh ? <Spinner /> : <><Icon icon="zi-add-photo" /><span>Thêm ảnh</span></>}
            </button>
          )}
        </div>
        <Input label="Video YouTube (nếu có)" placeholder="https://youtu.be/…" value={video} onChange={(e) => setVideo(e.target.value)} />
        {video.trim() && !laVideo(video.trim()) && <Text size="xSmall" style={{ color: "#d70018" }}>Link chưa đúng — dán link YouTube của video.</Text>}
      </Nhom>

      <Nhom tieuDe="Liên hệ">
        {daXacMinh || tinSua ? (
          <Text size="small">{ten || "—"} · {sdt}</Text>
        ) : buocXm === "so" ? (
          <>
            <Button loading={dangXm} onClick={() => xacMinhSo("so-zalo")}>Dùng số điện thoại Zalo để đăng tin</Button>
            <Input label="Hoặc nhập số khác" inputMode="tel" value={sdt} onChange={(e) => setSdt(e.target.value)} />
            <Button size="small" loading={dangXm} disabled={sdt.replace(/\D/g, "").length < 10} onClick={() => xacMinhSo("gui-ma")}>Nhận mã qua Zalo</Button>
          </>
        ) : (
          <>
            <Input label={`Mã đã gửi về Zalo của số ${sdt}`} inputMode="numeric" value={maXm} onChange={(e) => setMaXm(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            <Button size="small" loading={dangXm} disabled={maXm.length < 6} onClick={() => xacMinhSo("xac-nhan")}>Xác minh số</Button>
            <Button size="small" variant="tertiary" onClick={() => { setBuocXm("so"); setMaXm(""); }}>Đổi số khác</Button>
          </>
        )}
      </Nhom>

      {!daDang && <Nhom tieuDe="Gói tin">
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
            <div><span>Bắt đầu hiển thị</span><b>Khi tin được duyệt</b></div>
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

      </Nhom>}

      {loi && <Box p={4}><Text size="small" style={{ color: "#d70018" }}>{loi}</Text></Box>}

      <div className="nut-chinh">
        <Button fullWidth loading={dangGui} disabled={dangTaiAnh} onClick={gui}>{daDang || tinSua?.status === "pending" ? "Cập nhật" : "Gửi tin chờ duyệt"}</Button>
      </div>
    </Page>
  );
}
