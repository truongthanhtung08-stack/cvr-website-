"use client";

import { createClient } from "@/lib/supabase/client";

// ════════════════════════════════════════════════════════════════════════════
// ĐẾM LƯỢT HIỂN THỊ TIN
// ----------------------------------------------------------------------------
// Đếm theo ĐÚNG CÁCH CÁC NỀN TẢNG QUẢNG CÁO VẪN ĐẾM (chuẩn IAB): một lượt hiển
// thị = thẻ tin lọt vào màn hình quá nửa và nằm lại đủ lâu để mắt người kịp thấy.
// Khách cuộn xuống rồi cuộn lên gặp lại tin đó là MỘT LƯỢT MỚI — vì tin đã được
// bày ra trước mắt họ thêm một lần nữa thật.
//
// Nhờ đếm ở mọi nơi tin xuất hiện (trang chủ, danh sách, tìm kiếm, tin liên
// quan, khu vực, dự án) con số này lớn hơn lượt bấm mở tin vài chục lần — mà
// vẫn là số đo được, không phải số bịa. Chỉ có số thật mới bán được gói VIP:
// khách trả tiền rồi đối chiếu với số cuộc gọi họ nhận, lệch là họ biết ngay.
//
// CHẶN ĐẾM LOẠN: cùng một tin phải cách nhau ít nhất 30 giây mới tính lượt tiếp
// theo — khách rê tay lên xuống liên tục không thổi được số.
//
// Gom rồi gửi một lần, KHÔNG bắn từng tin: cuộn hết một trang danh sách là hơn
// chục tin cùng hiện, bắn lẻ thì vừa nặng máy chủ vừa đốt hạn mức Supabase.
// Hàng đợi đẩy đi khi: đủ 25 tin · hoặc 6 giây · hoặc khách rời trang.
// ════════════════════════════════════════════════════════════════════════════

const TOI_DA_GOM = 25;            // đủ bấy nhiêu thì gửi ngay
const CHO_TOI_DA = 6_000;         // hoặc chờ tối đa bấy nhiêu mili giây
const CACH_NHAU = 30_000;         // cùng một tin phải cách nhau bấy nhiêu mới tính tiếp
const NHIN_THAY = 400;            // nằm lại trên màn hình bấy nhiêu mới coi là đã thấy

const hangDoi: string[] = [];
let hen: ReturnType<typeof setTimeout> | null = null;
let daGanSuKien = false;

// Lần cuối mỗi tin được tính — giữ trong bộ nhớ, không đụng tới ổ đĩa máy khách.
const lanCuoi = new Map<string, number>();

async function day() {
  if (hen) {
    clearTimeout(hen);
    hen = null;
  }
  if (!hangDoi.length) return;
  const ids = hangDoi.splice(0, hangDoi.length);
  try {
    await createClient().rpc("ghi_hien_thi", { p_ids: ids });
  } catch {
    /* Chưa chạy migration 0030, mất mạng, tiện ích chặn quảng cáo… → bỏ qua.
       Đếm hiển thị hỏng TUYỆT ĐỐI không được làm hỏng việc xem tin của khách. */
  }
}

function ganSuKienRoiTrang() {
  if (daGanSuKien || typeof document === "undefined") return;
  daGanSuKien = true;
  // Khách chuyển tab hoặc thoát → gửi nốt phần còn trong hàng đợi.
  // visibilitychange là sự kiện DUY NHẤT đáng tin trên điện thoại: iOS gần như
  // không bao giờ bắn beforeunload khi khách vuốt thoát trình duyệt.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void day();
  });
}

/**
 * Ghi nhận một tin vừa hiện trên màn hình.
 * Cùng một tin gọi dồn dập chỉ tính một lần trong mỗi 30 giây.
 */
export function danhDauHienThi(id: string) {
  if (!id) return;
  const gio = Date.now();
  const truoc = lanCuoi.get(id) ?? 0;
  if (gio - truoc < CACH_NHAU) return;
  lanCuoi.set(id, gio);

  hangDoi.push(id);
  ganSuKienRoiTrang();

  if (hangDoi.length >= TOI_DA_GOM) void day();
  else if (!hen) hen = setTimeout(() => void day(), CHO_TOI_DA);
}

/**
 * Theo dõi một thẻ tin: lọt vào màn hình quá nửa và nằm lại đủ lâu thì tính một
 * lượt. Ra khỏi màn hình rồi vào lại là một lượt mới (cách nhau tối thiểu 30s).
 * Trả về hàm dọn dẹp để gọi khi thẻ bị gỡ khỏi trang.
 */
export function theoDoiThe(el: Element, id: string): () => void {
  // Máy quá cũ không có IntersectionObserver → bỏ qua, thà thiếu còn hơn đếm bừa.
  if (typeof IntersectionObserver === "undefined") return () => {};

  let dungHen: ReturnType<typeof setTimeout> | null = null;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (!dungHen) {
            dungHen = setTimeout(() => {
              danhDauHienThi(id);
              dungHen = null;
            }, NHIN_THAY);
          }
        } else if (dungHen) {
          // Lướt vụt qua chưa kịp đủ thời gian → không tính.
          clearTimeout(dungHen);
          dungHen = null;
        }
      }
    },
    // Phải thấy được quá nửa thẻ mới coi là đã bày ra trước mắt khách.
    { threshold: 0.5 },
  );
  io.observe(el);

  return () => {
    if (dungHen) clearTimeout(dungHen);
    io.disconnect();
  };
}
