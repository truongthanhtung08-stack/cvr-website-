import React from "react";
import { Box, Button, Icon, List, Page, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { goiHotline, layNguoiZalo, nhanCoastalLand, quanTamOA } from "../lib/zalo";
import { useTai } from "../lib/useTai";
import { soVN, supabase, usePhien } from "../lib/supabase";

export default function TaiKhoan() {
  const dieuHuong = useNavigate();
  const { nguoiDung } = usePhien();
  const zalo = useTai(() => (nguoiDung ? layNguoiZalo() : Promise.resolve(null)), [nguoiDung?.id], null);
  const muc = (icon: string, title: string, bam: () => void) => (
    <List.Item prefix={<Icon icon={icon as never} />} title={title} suffix={<Icon icon="zi-chevron-right" />} onClick={bam} />
  );
  return (
    <Page style={{ paddingBottom: 72 }}>
      <TieuDe title="Cá nhân" showBackIcon={false} />
      <Box p={4} style={{ background: "#fff" }}>
        {nguoiDung ? (
          <Box flex alignItems="center" style={{ gap: 12 }}>
            {zalo.data?.avatar ? <img className="o-tron" src={zalo.data.avatar} alt="" /> : <span className="o-tron"><Icon icon="zi-user" /></span>}
            <div>
              {zalo.data?.name && <Text style={{ fontWeight: 600 }}>{zalo.data.name}</Text>}
              <Text style={{ fontWeight: zalo.data?.name ? 400 : 600 }}>{soVN(nguoiDung.phone) || nguoiDung.email}</Text>
              <Text size="xSmall" className="chu-phu">Dùng chung tài khoản với coastalland.vn</Text>
            </div>
          </Box>
        ) : (
          <Button fullWidth onClick={() => dieuHuong("/dang-nhap")}>Đăng nhập / Đăng ký</Button>
        )}
      </Box>
      <section className="khoi">
        <List>
          {muc("zi-list-1", "Tin của tôi", () => dieuHuong("/tin-cua-toi"))}
          {muc("zi-reminder", "Tin đã xem", () => dieuHuong("/da-xem"))}
          {muc("zi-star", "Gói tin & dịch vụ", () => dieuHuong("/dich-vu"))}
          {muc("zi-more-diamond-solid", "Bảng giá đăng tin", () => dieuHuong("/bang-gia"))}
        </List>
      </section>
      <section className="khoi">
        <List>
          {muc("zi-add-user", "Quan tâm Coastal Land", () => quanTamOA())}
          {muc("zi-chat", "Nhắn tin tư vấn", () => nhanCoastalLand())}
          {muc("zi-call", "Gọi hotline 0377 985 036", () => goiHotline())}
        </List>
      </section>
      {nguoiDung && (
        <section className="khoi">
          <List>{muc("zi-leave", "Đăng xuất", () => supabase.auth.signOut())}</List>
        </section>
      )}
    </Page>
  );
}
