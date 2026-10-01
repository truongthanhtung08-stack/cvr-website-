import React, { useState } from "react";
import { Box, Button, Page, Spinner, Text } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import ChonMucDich from "../components/ChonMucDich";
import { layBangGia } from "../lib/tin";
import { tien } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import { nhanCoastalLand } from "../lib/zalo";
import BangGiaMaTran, { NhanHang, QuyDinh, gomVat } from "../components/BangGiaMaTran";

// ============================================================================
// BẢNG GIÁ — Y HỆT WEB (src/components/BangGiaGoiTin.tsx + BangGiaDayTin.tsx, 01/10/2026)
// Giá lấy ĐÚNG bản admin đã công bố — không ghi cứng giá nào trong Mini App.
// Ma trận số ngày × hạng (CVR Basic → Diamond), giá ĐÃ GỒM VAT 8%, nhãn % giảm,
// quy định ngắn đi kèm mỗi bảng. Tên hạng / voucher thống nhất CVR.
// ============================================================================
const HANG = ["basic", "silver", "gold", "diamond"] as const;
// Cột của bảng Đẩy tin do admin lưu theo thứ tự Diamond · Gold · Silver · Basic (COT_UP trên web).
const COT_UP = ["diamond", "gold", "silver", "basic"];
const TEN_VOUCHER: Record<string, string> = {
  "tin-thuong": "đăng tin CVR Basic",
  "tin-vip": "đăng tin CVR Silver / Gold / Diamond",
  "day-thuong": "đẩy tin CVR Basic",
};
const QD_DAY = [
  "Chỉ áp dụng cho tin đang hiển thị; ngày đăng và thời hạn giữ nguyên.",
  "Lượt đầu đẩy ngay khi mua, sau đó mỗi ngày 1 lượt lúc 8h sáng.",
  "Số lượt tối đa bằng số ngày tin còn hiển thị; tin hết hạn thì lượt còn lại hết theo.",
  "Mỗi tin dùng một gói một lúc.",
];
const soLuot = (nhan: string) => Number((nhan.match(/(\d+)\s*(lượt|lần)/i) ?? [])[1]) || 1;

export default function BangGia() {
  const [md, setMd] = useState<"ban" | "thue">("ban");
  const { data, dangTai } = useTai(() => layBangGia(), [], null);
  if (dangTai) return <Page><TieuDe title="Bảng giá" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!data) return <Page><TieuDe title="Bảng giá" /><Box p={4}><Text className="chu-phu">Chưa có bảng giá.</Text></Box></Page>;
  const bang = data[md];

  return (
    <Page style={{ paddingBottom: 88 }}>
      <TieuDe title="Bảng giá dịch vụ" />
      <Box p={3} style={{ background: "#fff" }}><ChonMucDich giaTri={md} doi={setMd} /></Box>

      {/* 01 · GÓI TIN ĐĂNG CVR */}
      <section className="khoi">
        <div className="khoi-dau"><Text.Title size="small">Gói tin đăng CVR</Text.Title></div>
        <BangGiaMaTran plans={bang.plans} />
      </section>

      {/* 02 · GÓI ĐẨY TIN */}
      {bang.up.length > 0 && (
        <section className="khoi">
          <div className="khoi-dau"><Text.Title size="small">Gói đẩy tin</Text.Title></div>
          <div className="cuon-bang">
            <table className="bang-mt">
              <thead><tr><th className="ghim">Gói đẩy</th>{HANG.map((id) => <th key={id}><NhanHang id={id} /></th>)}</tr></thead>
              <tbody>
                {bang.up.map((d) => {
                  const n = soLuot(d.label);
                  return (
                    <tr key={d.label}>
                      <td className="ghim">{n} lượt</td>
                      {HANG.map((id) => {
                        const v = d.values[COT_UP.indexOf(id)];
                        if (!v || v.gia <= 0) return <td key={id} className="trong">–</td>;
                        const giam = v.giaGoc && v.giaGoc > v.gia ? Math.round((1 - v.gia / v.giaGoc) * 100) : 0;
                        return (
                          <td key={id}>
                            <b>{tien(gomVat(v.gia))}</b>
                            {giam > 0 && <span className="giam">−{giam}%</span>}
                            {n > 1 && <span className="moi-luot">{tien(Math.round(gomVat(v.gia) / n))}/lượt</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Text size="xSmall" className="chu-phu" style={{ padding: "6px 16px 0" }}>Giá đã gồm 8% VAT.</Text>
          <QuyDinh dong={QD_DAY} />
        </section>
      )}

      {/* 03 · GÓI HỘI VIÊN */}
      {data.hoiVien.length > 0 && (
        <section className="khoi">
          <div className="khoi-dau"><Text.Title size="small">Gói hội viên</Text.Title></div>
          {data.hoiVien.map((g) => (
            <Box key={g.id} mx={3} mb={3} p={3} style={{ border: "1px solid var(--cl-line)", borderRadius: 12 }}>
              <Text size="small" style={{ fontWeight: 600 }}>{g.ten}</Text>
              <table className="bang"><tbody>
                {g.thoiHan.map((t) => <tr key={t.thang}><td>{t.thang} tháng</td><td>{tien(gomVat(t.price))}</td></tr>)}
              </tbody></table>
              <Text size="xSmall" className="chu-phu" style={{ marginTop: 6 }}>
                Mỗi 30 ngày: {g.voucher.map((v) => `${v.soLuong} voucher ${TEN_VOUCHER[v.loai] ?? v.loai} (giảm ${v.giam.toLocaleString("vi-VN")} đ)`).join(" · ")}
              </Text>
            </Box>
          ))}
          <Text size="xSmall" className="chu-phu" style={{ padding: "0 16px" }}>Giá đã gồm 8% VAT. Mỗi tài khoản dùng một gói một lúc.</Text>
        </section>
      )}

      <div className="nut-chinh">
        <Button fullWidth onClick={() => nhanCoastalLand("Tôi cần tư vấn gói đăng tin")}>Nhận tư vấn gói phù hợp</Button>
      </div>
    </Page>
  );
}
