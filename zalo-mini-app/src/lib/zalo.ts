import { followOA, openChat, openPhone, openShareSheet } from "zmp-sdk";

// OA Coastal Land — cùng số với web (src/lib/lienHe.ts ZALO_OA_ID).
export const OA_ID = "1928684637254080247";

export function nhanCoastalLand(noiDung?: string) {
  return openChat({ type: "oa", id: OA_ID, message: noiDung }).catch(() => {});
}

export function quanTamOA() {
  return followOA({ id: OA_ID }).catch(() => {});
}

// Chia sẻ đúng trang tin đang xem — người nhận bấm là mở thẳng vào tin trong Mini App.
export function chiaSeTin(tieuDe: string, moTa: string, anhDaiDien: string) {
  return openShareSheet({
    type: "zmp_deep_link",
    data: { title: tieuDe, description: moTa, thumbnail: anhDaiDien },
  }).catch(() => {});
}

export function goiHotline() {
  return openPhone({ phoneNumber: "0377985036" }).catch(() => {});
}
