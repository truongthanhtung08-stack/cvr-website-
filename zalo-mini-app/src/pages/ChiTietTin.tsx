import React, { useEffect, useRef, useState } from "react";
import { Box, Icon, ImageViewer, Page, Sheet, Spinner, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { useParams } from "react-router-dom";
import TheTin from "../components/TheTin";
import TruotNgang from "../components/TruotNgang";
import XemSo from "../components/XemSo";
import { anh, hangHieuLuc, layTinChiTiet, layTinTuongTu, type TinChiTiet } from "../lib/tin";
import { gia, dienTich, diaChi, ngay } from "../lib/dinhDang";
import { NHAN_THONG_SO } from "../lib/nhanThongSo";
import { daLuu, doiLuu } from "../lib/daLuu";
import { ghiDaXem } from "../lib/daXem";
import { chiaSeTin } from "../lib/zalo";
import { dangSoSanh, doiSoSanh } from "../lib/soSanh";
import { useTai } from "../lib/useTai";
import { supabase } from "../lib/supabase";
import { nhungVideo, tachAnh, tachVideo } from "../lib/media";

// CHI TIẾT TIN — kiểu Mini App Zalo: ảnh · các khối trắng trên nền xám (giá + tiêu đề ·
// đặc điểm dạng dòng · mô tả thu gọn · tiện ích · dự án · người đăng · tin tương tự) · nút gọi cố định.

const NHAN_HANG: Record<string, { ten: string; mau: string }> = {
  diamond: { ten: "CVR Diamond", mau: "#c1121f" },
  gold: { ten: "CVR Gold", mau: "#b8860b" },
  silver: { ten: "CVR Silver", mau: "#2f5d84" },
  basic: { ten: "CVR Basic", mau: "#9aa0a6" }, // = web packages.ts accent
};

const laDat = (t: TinChiTiet) => /đất/i.test(t.type);
// Ngày ngắn như web "04/11/26" (giờ Việt Nam).
const ngayNgan = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "2-digit" });

// Giá / m² — như web: đất, căn hộ tự tính; NHÀ chỉ hiện khi người bán tự ghi.
function giaM2(t: TinChiTiet): string | null {
  const tr = (v: number) => `${(v / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr/m²${laDat(t) ? " đất" : ""}`;
  if (t.don_gia_ban) return tr(t.don_gia_ban);
  if (t.purpose !== "ban" || !t.price_vnd || !t.area_m2 || !/đất|căn hộ|chung cư/i.test(t.type)) return null;
  return tr(t.price_vnd / t.area_m2);
}

// ẢNH + VIDEO TIN — chép đúng khung ảnh web điện thoại (src/components/Gallery.tsx, khối sm:hidden):
// khung 16:9 vuốt ngang từng tấm (KHÔNG tự chạy), VIDEO ĐỨNG ĐẦU DÃY và phát ngay tại khung ·
// huy hiệu số video + số ảnh góc trên trái · nút ‹ › hai bên (ẩn ở tấm đầu/cuối) ·
// dải mờ đáy "Tất cả ảnh" + "n/N" (ẩn khi đang ở video để không đè nút của trình phát) ·
// chạm ảnh → xem lớn toàn màn hình (ImageViewer của Zalo, vuốt + phóng to được).
export function AnhTin({ anhs, videos, tieuDe }: { anhs: string[]; videos: string[]; tieuDe: string }) {
  const khung = useRef<HTMLDivElement>(null);
  const [dang, setDang] = useState(0);
  const [xemLon, setXemLon] = useState<number | null>(null);
  const [tatCa, setTatCa] = useState(false);
  const dsAnh = anhs.length ? anhs : [undefined];
  const tong = videos.length + dsAnh.length;
  const laVideoDang = dang < videos.length;
  const toi = (i: number) => khung.current?.scrollTo({ left: i * khung.current.clientWidth, behavior: "smooth" });
  const anhLon = dsAnh.map((u) => ({ src: anh(u), alt: tieuDe }));

  return (
    <div className="anh-tin">
      <div ref={khung} className="anh-tin-khung" onScroll={(e) => setDang(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {videos.map((v, i) => {
          const nhung = nhungVideo(v);
          return nhung ? (
            <iframe key={`v${i}`} className="anh-tin-video" src={nhung} title={`Video ${i + 1}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <video key={`v${i}`} className="anh-tin-video" src={anh(v)} controls playsInline preload="metadata" />
          );
        })}
        {dsAnh.map((u, i) => (
          <img key={i} src={anh(u)} alt={`${tieuDe} ${i + 1}`} onClick={() => setTatCa(true)} />
        ))}
      </div>
      {/* NHƯ WEB (Gallery bản điện thoại, 06/11/2026 "cách mở hình xem ảnh · mở video cách sắp xếp"):
          huy hiệu đếm góc trên trái = số video · số ảnh (video trước vì video đứng đầu dãy) ·
          tin CÓ video: nút "Xem ảnh & video" góc trên phải (không có "Tất cả ảnh" ở đáy) ·
          bấm ảnh → danh sách ảnh & video xếp dọc → bấm một ảnh mới xem lớn toàn màn hình. */}
      <span className="anh-tin-dem">
        {videos.length > 0 && <><Icon icon="zi-video" size={14} /> {videos.length}<i className="ngan" /></>}
        <Icon icon="zi-photo" size={14} /> {anhs.length}
      </span>
      {videos.length > 0 && (
        <button className="anh-tin-xem-het" onClick={() => setTatCa(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><rect x="14" y="14" width="7" height="7" rx="1.2" /></svg>
          Xem ảnh &amp; video
        </button>
      )}
      {tong > 1 && dang > 0 && (
        <button className="anh-tin-nut trai" aria-label="Tấm trước" onClick={() => toi(dang - 1)}><Icon icon="zi-chevron-left" size={20} /></button>
      )}
      {tong > 1 && dang < tong - 1 && (
        <button className="anh-tin-nut phai" aria-label="Tấm sau" onClick={() => toi(dang + 1)}><Icon icon="zi-chevron-right" size={20} /></button>
      )}
      {!laVideoDang && (
        <div className="anh-tin-day">
          {videos.length === 0 ? <button onClick={() => setTatCa(true)}><Icon icon="zi-gallery" size={16} /> Tất cả ảnh</button> : <i />}
          <span>{dang - videos.length + 1}/{dsAnh.length}</span>
        </div>
      )}
      {/* DANH SÁCH ẢNH & VIDEO xếp dọc full bề ngang (như PhotoList của web): video trước, rồi ảnh; bấm ảnh → xem lớn. */}
      <Sheet visible={tatCa} onClose={() => setTatCa(false)} mask handler swipeToClose title={videos.length ? `${videos.length} video · ${anhs.length} ảnh` : `${anhs.length} ảnh`}>
        <div className="anh-doc">
          {tatCa && videos.map((v, i) => {
            const nhung = nhungVideo(v);
            return nhung ? (
              <iframe key={`v${i}`} src={nhung} title={`Video ${i + 1}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            ) : (
              <video key={`v${i}`} src={anh(v)} controls playsInline preload="metadata" />
            );
          })}
          {anhs.map((u, i) => (
            <img key={i} src={anh(u)} alt={`${tieuDe} ${i + 1}`} loading="lazy" onClick={() => setXemLon(i)} />
          ))}
        </div>
      </Sheet>
      <ImageViewer images={anhLon} activeIndex={xemLon ?? 0} visible={xemLon !== null} onClose={() => setXemLon(null)} maskStyle={{ background: "#000" }} />
    </div>
  );
}

export default function ChiTietTin() {
  const { id = "" } = useParams();
  const dieuHuong = useNavigate();
  const { data: tin, dangTai, loi } = useTai(() => layTinChiTiet(id), [id], null);
  const tuongTu = useTai(() => (tin ? layTinTuongTu(tin) : Promise.resolve([])), [tin?.id], []);
  const [luu, setLuu] = useState(() => daLuu(id));
  const [soSanh, setSoSanh] = useState(() => dangSoSanh(id));
  useEffect(() => {
    if (!tin) return;
    ghiDaXem(tin.id);
    // ĐẾM LƯỢT XEM THẬT — cùng hàm với web (RecordView.tsx), cùng mốc 30 phút chống F5 thổi số.
    // Nguồn = "zalo": người đăng thấy lượt xem đến từ Zalo trong thống kê tin của họ.
    // Khách đã đăng nhập → ghi_nguoi_xem: người đăng biết ai đang quan tâm (hàm tự bỏ qua chủ tin).
    try {
      const khoa = `cl_da_xem_${tin.id}`;
      if (Date.now() - Number(sessionStorage.getItem(khoa) || 0) > 30 * 60_000) {
        sessionStorage.setItem(khoa, String(Date.now()));
        supabase.rpc("increment_listing_view", { p_listing_id: tin.id, p_thiet_bi: "dien_thoai", p_nguon: "zalo" }).then(() => {}, () => {});
        supabase.rpc("ghi_nguoi_xem", { p_listing_id: tin.id }).then(() => {}, () => {});
      }
    } catch {
      /* không có sessionStorage → bỏ qua đếm */
    }
  }, [tin]);

  if (dangTai) return <Page><TieuDe title="Chi tiết tin" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (loi || !tin)
    return (
      <Page>
        <TieuDe title="Chi tiết tin" />
        <Box p={4}><Text className="chu-phu">{loi ?? "Tin này không còn hiển thị."}</Text></Box>
      </Page>
    );

  const hang = NHAN_HANG[hangHieuLuc(tin)];
  const cu = tin.dia_chi_cu;
  const diaChiCu = cu ? [cu.phuong, cu.quan, cu.tinh].filter(Boolean).join(", ") : "";
  const dg = giaM2(tin);

  // KHUNG THÔNG SỐ 2 CỘT = khung đầu tin trên web: Mức giá · Diện tích · Giá/m² · PN · WC · các ô đặc điểm · Hướng · Nội thất.
  const chinh: [string, string][] = [
    ["Mức giá", gia(tin)],
    ...(dienTich(tin) ? [[laDat(tin) ? "Diện tích đất" : "Diện tích", dienTich(tin)!] as [string, string]] : []),
    ...(dg ? [["Giá / m²", dg] as [string, string]] : []),
    ...(tin.beds ? [["Phòng ngủ", `${tin.beds} PN`] as [string, string]] : []),
    ...(tin.baths ? [["Phòng tắm", `${tin.baths} WC`] as [string, string]] : []),
    ...Object.entries(tin.dac_diem ?? {})
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v]) => {
        const [nhan, donVi] = NHAN_THONG_SO[k] ?? [k];
        return [donVi ? `${nhan} (${donVi})` : nhan, String(v)] as [string, string];
      }),
    ...(tin.huong ? [["Hướng", tin.huong] as [string, string]] : []),
    ...(tin.noi_that ? [["Nội thất", tin.noi_that] as [string, string]] : []),
  ];
  // ĐẶC ĐIỂM BẤT ĐỘNG SẢN (sau Mô tả, như web): Loại hình · Pháp lý · Diện tích xây dựng.
  const phu: [string, string][] = [
    ["Loại hình", tin.type],
    ...(tin.phap_ly ? [["Tình trạng pháp lý", tin.phap_ly] as [string, string]] : []),
    ...(tin.built_area_m2 ? [["Diện tích xây dựng", `${tin.built_area_m2.toLocaleString("vi-VN")} m²`] as [string, string]] : []),
  ];
  const tienIch = [...(tin.tien_ich ?? []), ...(tin.noi_that_ds ?? [])];

  return (
    <Page style={{ paddingBottom: 96 }}>
      <TieuDe title="Chi tiết tin" />
      <AnhTin anhs={tachAnh(tin.images)} videos={tachVideo(tin.images)} tieuDe={tin.title} />

      {/* ĐẦU TIN — ĐÚNG THỨ TỰ TRANG TIN WEB ĐIỆN THOẠI (06/11/2026 "nội dung chuẩn"): nhãn hạng · Mã tin · nút →
          Hiệu lực · Hết hạn → tiêu đề → địa chỉ (+ địa chỉ cũ) → khung thông số 2 cột (Mức giá, Diện tích, Giá/m², PN, WC…). */}
      <section className="khoi-ct">
        <div className="meta-ct">
          <span className="nhan-loai" style={{ color: hang.mau, borderColor: hang.mau }}>{hang.ten}</span>
          <span>Mã tin: {tin.id.slice(0, 8).toUpperCase()}</span>
          <div className="nut-ct">
            <button onClick={() => setLuu(doiLuu(tin.id))} aria-label="Lưu tin">
              <Icon icon={luu ? "zi-heart-solid" : "zi-heart"} size={20} style={luu ? { color: "#e11d48" } : undefined} />
            </button>
            <button onClick={() => { const co = doiSoSanh(tin.id); setSoSanh(co); if (co) dieuHuong("/so-sanh"); }} aria-label="So sánh" className={soSanh ? "dang-so-sanh" : ""}>
              <Icon icon="zi-more-grid" size={20} />
            </button>
            <button onClick={() => chiaSeTin(tin.title, `${gia(tin)} · ${diaChi(tin)}`, anh(tachAnh(tin.images)[0]), `/tin/${tin.id}`)} aria-label="Chia sẻ">
              <Icon icon="zi-share-external-1" size={20} />
            </button>
          </div>
        </div>
        {(tin.published_at || tin.tier_expires_at) && (
          <p className="hieu-luc">
            {tin.published_at && <>Hiệu lực: {ngayNgan(tin.published_at)}</>}
            {tin.published_at && tin.tier_expires_at && " · "}
            {tin.tier_expires_at && <>Hết hạn: {ngayNgan(tin.tier_expires_at)}</>}
          </p>
        )}
        <h1 className="tieu-de-tin">{tin.title}</h1>
        <p className="dong-dc">
          <Icon icon="zi-location" size={16} />
          <span>
            {[tin.dia_chi_ct?.trim(), diaChi(tin)].filter(Boolean).join(", ")}
            {diaChiCu && <small>Địa chỉ cũ: {diaChiCu}</small>}
          </span>
        </p>
        <dl className="luoi-tt">
          {chinh.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd className={k === "Mức giá" ? "gia-o" : undefined}>{v}</dd></div>
          ))}
        </dl>
      </section>

      {tin.description && <MoTa noiDung={tin.description} />}

      {phu.length > 0 && (
        <section className="khoi-ct">
          <h2 className="muc-tin">Đặc điểm bất động sản</h2>
          <div className="dong-ds">{phu.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
        </section>
      )}

      {tienIch.length > 0 && (
        <section className="khoi-ct">
          <h2 className="muc-tin">Tiện ích</h2>
          <Box flex style={{ flexWrap: "wrap", gap: 8 }}>{tienIch.map((x) => <span key={x} className="chip">{x}</span>)}</Box>
        </section>
      )}

      {/* VỊ TRÍ TRÊN BẢN ĐỒ — như web (src/lib/googleMaps.ts nhungGoogleMaps): bản nhúng Google,
          không khoá, không tính tiền. Ghim toạ độ nếu có, không thì số nhà + tên đường + phường/tỉnh. */}
      <section className="khoi-ct">
        <h2 className="muc-tin">Vị trí trên bản đồ</h2>
        <iframe
          className="ban-do"
          title="Vị trí trên bản đồ"
          loading="lazy"
          src={`https://www.google.com/maps?q=${encodeURIComponent(tin.ghim?.trim() || [tin.dia_chi_ct?.trim(), tin.ward, tin.district, tin.province].filter(Boolean).join(", "))}&z=${tin.ghim?.trim() || tin.dia_chi_ct?.trim() ? 17 : 15}&hl=vi&output=embed`}
        />
      </section>

      {(tin.du_an || tin.nguoi_dang) && (
        <section className="khoi-ct dong-ds dong-bam">
          {tin.du_an && (
            <div onClick={() => tin.du_an_slug && dieuHuong(`/du-an/${tin.du_an_slug}`)}>
              <span>Dự án</span>
              <strong>{tin.du_an}{tin.du_an_slug && <Icon icon="zi-chevron-right" size={18} />}</strong>
            </div>
          )}
          {tin.nguoi_dang && (
            <div>
              <span>Người đăng</span>
              <strong>{tin.nguoi_dang}</strong>
            </div>
          )}
        </section>
      )}


      {tuongTu.data.length > 0 && (
        <section className="khoi-ct" style={{ padding: "14px 0 16px" }}>
          <h2 className="muc-tin" style={{ padding: "0 16px" }}>Tin tương tự</h2>
          <TruotNgang hep>{tuongTu.data.slice(0, 8).map((t) => <TheTin key={t.id} tin={t} />)}</TruotNgang>
        </section>
      )}

      <div className="nut-chinh">
        <XemSo id={tin.id} sdt={tin.sdt} soAn={tin.sdt_an} />
      </div>
    </Page>
  );
}

// Mô tả dài thu gọn 6 dòng, bấm "Xem thêm" mới mở hết (kiểu Zalo).
// Mô tả sạch ký hiệu (06/11/2026): bỏ ký tự thoát Markdown (\* \-), dấu đầu dòng trang trí (▪︎ * •) thành "• " thống nhất.
const sachMoTa = (s: string) =>
  s.replace(/\\([*_#.\-])/g, "$1").replace(/^[ \t​]*[*▪•●]︎?[ \t​]*/gm, "• ");

// NHƯ WEB: mô tả thu gọn, nút "Xem thêm" / "Thu gọn" NGAY DƯỚI mô tả (06/11/2026 "nút thu gọn đặt sai chỗ" — trước nằm cuối trang).
function MoTa({ noiDung }: { noiDung: string }) {
  const chu = useRef<HTMLParagraphElement>(null);
  const [mo, setMo] = useState(false);
  const [dai, setDai] = useState(false);
  useEffect(() => {
    const el = chu.current;
    if (el) setDai(el.scrollHeight > el.clientHeight + 4);
  }, [noiDung]);
  return (
    <section className="khoi-ct">
      <h2 className="muc-tin">Mô tả</h2>
      <p ref={chu} className={`mo-ta-ct${mo ? "" : " gon"}`}>{sachMoTa(noiDung)}</p>
      {(dai || mo) && (
        <button className="nut-mo-ta" onClick={() => { if (mo) chu.current?.closest("section")?.scrollIntoView({ block: "start" }); setMo(!mo); }}>
          {mo ? "Thu gọn" : "Xem thêm"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: mo ? "rotate(180deg)" : undefined }}><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
    </section>
  );
}

