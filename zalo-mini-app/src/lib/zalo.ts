import { followOA, getUserInfo, openChat, openPhone, openShareSheet } from "zmp-sdk";

// OA Coastal Land — cùng số với web (src/lib/lienHe.ts ZALO_OA_ID).
export const OA_ID = "1928684637254080247";

export function nhanCoastalLand(noiDung?: string) {
  return openChat({ type: "oa", id: OA_ID, message: noiDung }).catch(() => {});
}

export function quanTamOA() {
  return followOA({ id: OA_ID }).catch(() => {});
}

// Chia sẻ đúng trang đang xem (path) — người nhận bấm là mở thẳng vào tin/dự án trong Mini App.
export function chiaSeTin(tieuDe: string, moTa: string, anhDaiDien: string, duong?: string) {
  return openShareSheet({
    type: "zmp_deep_link",
    data: { title: tieuDe, description: moTa, thumbnail: anhDaiDien, path: duong },
  }).catch(() => {});
}

export function goiHotline() {
  return openPhone({ phoneNumber: "0377985036" }).catch(() => {});
}

// Tên + ảnh đại diện Zalo của khách — lấy ngay trên máy (không cần máy chủ VN).
// Chỉ gọi khi khách vào trang cần tới (không xin quyền lúc mở app — luật Mini App).
export type NguoiZalo = { id: string; name: string; avatar: string };
export async function layNguoiZalo(): Promise<NguoiZalo | null> {
  try {
    const { userInfo } = await getUserInfo({ autoRequestPermission: true, avatarType: "normal" });
    return userInfo?.name ? { id: userInfo.id, name: userInfo.name, avatar: userInfo.avatar } : null;
  } catch {
    return null;
  }
}
