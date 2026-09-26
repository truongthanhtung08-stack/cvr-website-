import React from "react";
import { Box, Button, Header, Icon, List, Page, Text, useNavigate } from "zmp-ui";
import { nhanCoastalLand } from "../lib/zalo";

// Tab "Đăng tin": dịch vụ chính (tin mua bán · cho thuê) + các gói của công ty.
// Đăng tin trực tiếp trong Mini App cần lấy SĐT qua Zalo → chờ máy chủ VN; hiện nhân viên đăng cùng khách qua OA.
const GOI = [
  { ten: "Gói tin VIP", mo: "Diamond · Gold · Silver — tin đứng đầu, nổi bật", icon: "zi-star", toi: "/bang-gia" },
  { ten: "Đẩy tin", mo: "Đưa tin lên đầu danh sách", icon: "zi-upload", toi: "/bang-gia" },
  { ten: "Gói hội viên", mo: "Voucher đăng tin, đẩy tin mỗi tháng", icon: "zi-user-check", toi: "/bang-gia" },
  { ten: "Gói dự án", mo: "Trang dự án riêng cho chủ đầu tư, đại lý", icon: "zi-grid-solid", hoi: "Tôi cần tư vấn Gói dự án" },
  { ten: "Bài PR", mo: "Bài truyền thông trên chuyên mục Tin tức", icon: "zi-post", hoi: "Tôi cần tư vấn Gói bài PR" },
  { ten: "Banner quảng cáo", mo: "Vị trí nổi bật trên trang chủ và danh sách", icon: "zi-photo", hoi: "Tôi cần tư vấn Gói banner" },
];

export default function DichVu() {
  const dieuHuong = useNavigate();
  return (
    <Page>
      <Header title="Đăng tin" />
      <Box p={4} style={{ background: "var(--cl-ink)" }}>
        <Text size="small" style={{ color: "#d2d2d7" }}>Mua bán, cho thuê nhà đất trên Coastal Land</Text>
        <Box mt={4} flex style={{ gap: 8 }}>
          <Button fullWidth onClick={() => dieuHuong("/dang-tin?md=ban")}>Đăng tin bán</Button>
          <Button fullWidth variant="secondary" onClick={() => dieuHuong("/dang-tin?md=thue")}>Đăng tin cho thuê</Button>
        </Box>
      </Box>
      <section className="khoi">
        <div className="khoi-dau"><Text.Title size="small">Dịch vụ</Text.Title></div>
        <List>
          {GOI.map((g) => (
            <List.Item
              key={g.ten}
              prefix={<Icon icon={g.icon as never} />}
              title={g.ten}
              subTitle={g.mo}
              suffix={<Icon icon="zi-chevron-right" />}
              onClick={() => (g.toi ? dieuHuong(g.toi) : nhanCoastalLand(g.hoi))}
            />
          ))}
        </List>
      </section>
    </Page>
  );
}
