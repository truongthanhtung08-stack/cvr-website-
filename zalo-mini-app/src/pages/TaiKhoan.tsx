import React from "react";
import { Button, Icon, Page, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import { goiHotline, nhanCoastalLand, quanTamOA } from "../lib/zalo";
import { useTai } from "../lib/useTai";
import { soVN, supabase, usePhien } from "../lib/supabase";

// ============================================================================
// CÁ NHÂN — GỌN NHƯNG ĐỦ (chủ dự án 06/11/2026). Mục = ĐÚNG menu Tài khoản của web (src/app/tai-khoan/layout.tsx MUC_CHINH +
// src/lib/menuTaiKhoan.ts MUC_TAI_KHOAN), đổi ở web thì đổi ở đây. Đầu trang: ảnh · tên · số · số dư ví (hồ sơ tài khoản — ảnh, tên
// Zalo đã ghi vào hồ sơ khi đăng nhập Zalo). Mọi mục mở trong app (06/11/2026: Gói hội viên · Dự án của tôi · Tìm kiếm đã lưu chỉ ở web).
// Không câu giải thích (CLAUDE.md "CẤM chú thích vớ vẩn").
// ============================================================================
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

type Muc = { ten: string; icon: string; app?: string; bam?: () => void; phu?: string };

export default function TaiKhoan() {
  const dieuHuong = useNavigate();
  const { nguoiDung } = usePhien();
  const hoSo = useTai(
    async () => (nguoiDung ? ((await supabase.from("profiles").select("full_name,avatar_url,phone,email,balance").eq("id", nguoiDung.id).maybeSingle()).data as { full_name?: string; avatar_url?: string; phone?: string; email?: string; balance?: number } | null) : null),
    [nguoiDung?.id],
    null as { full_name?: string; avatar_url?: string; phone?: string; email?: string; balance?: number } | null,
  );
  const h = hoSo.data;

  const NHOM: { ten: string; muc: Muc[] }[] = [
    { ten: "Quản lý", muc: [
      { ten: "Tin đăng", icon: "zi-list-1", app: "/tin-cua-toi" },
      { ten: "Khách hàng", icon: "zi-group", app: "/khach-hang" },
      { ten: "Đăng tin", icon: "zi-plus-circle", app: "/dang-tin" },
      { ten: "Dự án của tôi", icon: "zi-home", app: "/du-an-cua-toi" },
    ] },
    { ten: "Tài khoản", muc: [
      { ten: "Ví & nạp tiền", icon: "zi-poll", app: "/nap-tien", phu: nguoiDung ? vnd(Number(h?.balance ?? 0)) : undefined },
      { ten: "Hóa đơn", icon: "zi-note", app: "/hoa-don" },
      { ten: "Gói hội viên", icon: "zi-star", app: "/hoi-vien" },
      { ten: "Bảng giá dịch vụ", icon: "zi-more-diamond-solid", app: "/bang-gia" },
      { ten: "Tin đã lưu", icon: "zi-heart", app: "/da-luu" },
      { ten: "Tìm kiếm đã lưu", icon: "zi-notif", app: "/tim-kiem-luu" },
      { ten: "Cài đặt", icon: "zi-setting", app: "/cai-dat" },
    ] },
    { ten: "Khám phá", muc: [
      { ten: "Danh bạ chuyên gia", icon: "zi-group", app: "/chuyen-gia" },
      { ten: "So sánh bất động sản", icon: "zi-more-grid", app: "/so-sanh" },
      { ten: "Tin tức", icon: "zi-note", app: "/tin-tuc" },
    ] },
    { ten: "Hỗ trợ", muc: [
      { ten: "Nhắn Zalo Coastal Land", icon: "zi-chat", bam: () => nhanCoastalLand() },
      { ten: "Gọi 0377 985 036", icon: "zi-call", bam: () => goiHotline() },
      { ten: "Quan tâm Zalo OA", icon: "zi-add-user", bam: () => quanTamOA() },
    ] },
  ];
  const mo = (m: Muc) => {
    if (m.bam) return m.bam();
    if (!nguoiDung && !["Bảng giá dịch vụ", "Tin đã lưu", "Danh bạ chuyên gia", "So sánh bất động sản", "Tin tức"].includes(m.ten)) return dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(m.app ?? "/tai-khoan")}`);
    if (m.app) return dieuHuong(m.app);
  };

  return (
    <Page style={{ paddingBottom: 72 }}>
      <TieuDe title="Tài khoản" showBackIcon={false} />
      <div className="tk-dau">
        {nguoiDung ? (
          <>
            {h?.avatar_url ? <img className="tk-anh" src={h.avatar_url} alt="" /> : <span className="tk-anh"><Icon icon="zi-user" /></span>}
            <div className="tk-ten">
              <strong>{h?.full_name || "Tài khoản"}</strong>
              <span>{soVN(h?.phone ?? nguoiDung.phone) || h?.email || nguoiDung.email}</span>
            </div>
          </>
        ) : (
          <Button fullWidth onClick={() => dieuHuong("/dang-nhap")}>Liên kết tài khoản</Button>
        )}
      </div>
      {NHOM.map((n) => (
        <section key={n.ten} className="tk-nhom">
          <h3>{n.ten}</h3>
          {n.muc.map((m) => (
            <button key={m.ten} className="tk-muc" onClick={() => mo(m)}>
              <Icon icon={m.icon as never} />
              <span className="tk-muc-ten">{m.ten}</span>
              {m.phu && <span className="tk-muc-phu">{m.phu}</span>}
              <Icon icon="zi-chevron-right" />
            </button>
          ))}
        </section>
      ))}
      {nguoiDung && (
        <section className="tk-nhom">
          <button className="tk-muc" onClick={() => supabase.auth.signOut()}>
            <Icon icon="zi-leave" />
            <span className="tk-muc-ten">Hủy liên kết tài khoản</span>
          </button>
        </section>
      )}
    </Page>
  );
}
