import React, { useState } from "react";
import { Box, Button, Header, Page, Spinner, Text } from "zmp-ui";
import ChonMucDich from "../components/ChonMucDich";
import { layBangGia } from "../lib/tin";
import { tien } from "../lib/dinhDang";
import { useTai } from "../lib/useTai";
import { nhanCoastalLand } from "../lib/zalo";

const TEN_VOUCHER: Record<string, string> = { "tin-thuong": "đăng tin thường", "tin-vip": "đăng tin VIP", "day-thuong": "đẩy tin thường" };
const HANG = ["diamond", "gold", "silver", "basic"];

// Bảng giá lấy ĐÚNG bản admin đã công bố — không ghi cứng giá nào trong Mini App.
export default function BangGia() {
  const [md, setMd] = useState<"ban" | "thue">("ban");
  const { data, dangTai } = useTai(() => layBangGia(), [], null);
  if (dangTai) return <Page><Header title="Bảng giá" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  if (!data) return <Page><Header title="Bảng giá" /><Box p={4}><Text className="chu-phu">Chưa có bảng giá.</Text></Box></Page>;
  const bang = data[md];
  const plans = [...bang.plans].sort((a, b) => HANG.indexOf(a.tierId) - HANG.indexOf(b.tierId));

  return (
    <Page style={{ paddingBottom: 88 }}>
      <Header title="Bảng giá dịch vụ" />
      <Box p={3} style={{ background: "#fff" }}><ChonMucDich giaTri={md} doi={setMd} /></Box>

      <section className="khoi">
        <div className="khoi-dau"><Text.Title size="small">Gói tin đăng</Text.Title></div>
        {plans.map((p) => (
          <Box key={p.tierId} px={4} pb={3}>
            <Text size="small" style={{ fontWeight: 600 }}>{p.name}</Text>
            <table className="bang"><tbody>
              {p.terms.map((t) => (
                <tr key={t.days}><td>{t.days} ngày</td><td>{tien(t.price)}</td></tr>
              ))}
            </tbody></table>
          </Box>
        ))}
      </section>

      {bang.up.length > 0 && (
        <section className="khoi">
          <div className="khoi-dau"><Text.Title size="small">Đẩy tin</Text.Title></div>
          <Box px={3} style={{ overflowX: "auto" }}>
            <table className="bang">
              <thead><tr><th></th>{plans.map((p) => <th key={p.tierId}>{p.name.replace("CVR ", "")}</th>)}</tr></thead>
              <tbody>
                {bang.up.map((d) => (
                  <tr key={d.label}>
                    <td>{d.label}</td>
                    {d.values.map((v, i) => (
                      <td key={i}>{v.giaGoc ? <span className="gach">{v.giaGoc.toLocaleString("vi-VN")}</span> : null}{v.gia.toLocaleString("vi-VN")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </section>
      )}

      {data.hoiVien.length > 0 && (
        <section className="khoi">
          <div className="khoi-dau"><Text.Title size="small">Gói hội viên</Text.Title></div>
          {data.hoiVien.map((g) => (
            <Box key={g.id} mx={3} mb={3} p={3} style={{ border: "1px solid var(--cl-line)", borderRadius: 12 }}>
              <Text size="small" style={{ fontWeight: 600 }}>{g.ten}</Text>
              <table className="bang"><tbody>
                {g.thoiHan.map((t) => <tr key={t.thang}><td>{t.thang} tháng</td><td>{tien(t.price)}</td></tr>)}
              </tbody></table>
              <Text size="xSmall" className="chu-phu" style={{ marginTop: 6 }}>
                Mỗi 30 ngày: {g.voucher.map((v) => `${v.soLuong} voucher ${TEN_VOUCHER[v.loai] ?? v.loai} (giảm ${v.giam.toLocaleString("vi-VN")} đ)`).join(" · ")}
              </Text>
            </Box>
          ))}
        </section>
      )}
      <Box p={4}><Text size="xSmall" className="chu-phu">Giá chưa gồm VAT.</Text></Box>

      <div className="nut-chinh">
        <Button fullWidth onClick={() => nhanCoastalLand("Tôi cần tư vấn gói đăng tin")}>Nhận tư vấn gói phù hợp</Button>
      </div>
    </Page>
  );
}
