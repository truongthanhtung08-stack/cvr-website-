import React from "react";
import { Box, Button, Header, Icon, List, Page, Text, useNavigate } from "zmp-ui";
import { goiHotline, nhanCoastalLand, quanTamOA } from "../lib/zalo";
import { soVN, supabase, usePhien } from "../lib/supabase";

export default function TaiKhoan() {
  const dieuHuong = useNavigate();
  const { nguoiDung } = usePhien();
  const muc = (icon: string, title: string, bam: () => void) => (
    <List.Item prefix={<Icon icon={icon as never} />} title={title} suffix={<Icon icon="zi-chevron-right" />} onClick={bam} />
  );
  return (
    <Page style={{ paddingBottom: 72 }}>
      <Header title="Tài khoản" showBackIcon={false} />
      <Box p={4} style={{ background: "#fff" }}>
        {nguoiDung ? (
          <Box flex alignItems="center" style={{ gap: 12 }}>
            <span className="o-tron"><Icon icon="zi-user" /></span>
            <div>
              <Text style={{ fontWeight: 600 }}>{soVN(nguoiDung.phone) || nguoiDung.email}</Text>
              <Text size="xSmall" className="chu-phu">Dùng chung tài khoản với coastalland.vn</Text>
            </div>
          </Box>
        ) : (
          <Button fullWidth onClick={() => dieuHuong("/dang-nhap")}>Đăng nhập / Đăng ký</Button>
        )}
      </Box>
      <section className="khoi">
        <List>
          {muc("zi-plus-circle", "Đăng tin", () => dieuHuong("/dang-tin"))}
          {muc("zi-list-1", "Tin của tôi", () => dieuHuong("/tin-cua-toi"))}
          {muc("zi-heart", "Tin đã lưu", () => dieuHuong("/da-luu"))}
          {muc("zi-reminder", "Tin đã xem", () => dieuHuong("/da-xem"))}
        </List>
      </section>
      <section className="khoi">
        <List>
          {muc("zi-more-diamond-solid", "Bảng giá dịch vụ", () => dieuHuong("/bang-gia"))}
          {muc("zi-star", "Dịch vụ & gói tin", () => dieuHuong("/dich-vu"))}
          {muc("zi-post", "Tin tức", () => dieuHuong("/tin-tuc"))}
          {muc("zi-poll", "Tính khoản vay", () => dieuHuong("/tinh-vay"))}
        </List>
      </section>
      <section className="khoi">
        <List>
          {muc("zi-add-user", "Quan tâm Coastal Land", () => quanTamOA())}
          {muc("zi-chat", "Nhắn tin tư vấn", () => nhanCoastalLand())}
          {muc("zi-call", "Gọi hotline 0377 985 036", () => goiHotline())}
          {nguoiDung && muc("zi-leave", "Đăng xuất", () => supabase.auth.signOut())}
        </List>
      </section>
    </Page>
  );
}
