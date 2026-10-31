import type { SupabaseClient } from "@supabase/supabase-js";
import { baoLoi } from "@/lib/baoLoi";

// ════════════════════════════════════════════════════════════════════════════
// SỔ VIỆC ĐỊNH KỲ — MÁY TỰ LÀM, KHÔNG CẦN AI NHỚ
//
// VÌ SAO CÓ FILE NÀY. Trước đây các việc định kỳ bị nhét thẳng vào route nhắc
// hoá đơn, mỗi việc một kiểu, và sinh ra ba chỗ hỏng thật:
//   ① `chupGiaKhuVuc().catch(() => null)` — hỏng là IM LẶNG. Bảng giá khu vực
//      ngừng cập nhật cả tháng cũng không ai biết.
//   ② `quetTinHetHan` không có lưới đỡ — nó ném lỗi là cả route chết theo, tức
//      hôm đó KHÔNG AI ĐƯỢC NHẮC XUẤT HOÁ ĐƠN. Một việc phụ làm chết việc chính.
//   ③ Không có nhật ký. Cron ngừng chạy (dự án bị Vercel tạm dừng, đổi khoá
//      CRON_SECRET, deploy hỏng) thì mọi thứ im ru đúng như lúc chạy tốt.
//
// LUẬT CỦA SỔ NÀY:
//   · Mỗi việc chạy trong lồng riêng. Một việc hỏng KHÔNG kéo theo việc khác.
//   · Việc hỏng thì gào lên qua sổ sự cố (hiện đỏ ở /admin + email).
//   · Mọi lần chạy đều ghi nhật ký → mở /admin là biết máy còn tự làm hay đã chết.
//   · Thêm việc mới = thêm MỘT DÒNG trong danhSach.ts, KHÔNG tốn suất cron.
//     (Vercel gói Hobby chỉ cho 2 suất, đã dùng hết cho nhắc hoá đơn.)
// ════════════════════════════════════════════════════════════════════════════

export type KetQuaViec = {
  /** Một câu tiếng Việt cho vào nhật ký: "Đã hạ 3 tin hết hạn, nhắc 5 tin." */
  tomTat: string;
  /** Số liệu thô để tra cứu về sau, không bắt buộc. */
  soLieu?: Record<string, unknown>;
};

export type Viec = {
  /** Mã ngắn không dấu, dùng làm khoá nhật ký: "canh-dns". */
  ma: string;
  /** Tên tiếng Việt hiện ở /admin. */
  ten: string;
  /** Không sửa thì mất gì — đưa vào sự cố khi việc này hỏng. */
  hauQua: string;
  chay: (admin: SupabaseClient) => Promise<KetQuaViec>;
};

export type DongNhatKy = {
  ma: string;
  ten: string;
  ok: boolean;
  tomTat: string;
  miliGiay: number;
};

/**
 * Chạy lần lượt mọi việc trong sổ. KHÔNG BAO GIỜ ném lỗi ra ngoài — nơi gọi là
 * route nhắc hoá đơn, việc chính ở đó quan trọng hơn mọi việc trong sổ này.
 */
export async function chayCacViec(
  admin: SupabaseClient,
  danhSach: Viec[],
): Promise<DongNhatKy[]> {
  const nhatKy: DongNhatKy[] = [];

  for (const viec of danhSach) {
    const batDau = Date.now();
    try {
      const kq = await viec.chay(admin);
      nhatKy.push({
        ma: viec.ma,
        ten: viec.ten,
        ok: true,
        tomTat: kq.tomTat,
        miliGiay: Date.now() - batDau,
      });
    } catch (e) {
      const loi = e instanceof Error ? e.message : String(e);
      nhatKy.push({
        ma: viec.ma,
        ten: viec.ten,
        ok: false,
        tomTat: `Hỏng: ${loi}`,
        miliGiay: Date.now() - batDau,
      });
      await baoLoi({
        noi: `tu-dong:${viec.ma}`,
        mucDo: "nang",
        tomTat: `Việc tự động "${viec.ten}" chạy hỏng`,
        chiTiet: loi.slice(0, 500),
        hauQua: viec.hauQua,
        canLam: `Mở /api/hoa-don/nhac-xuat bằng tay để chạy lại, hoặc xem nhật ký ở /admin.`,
      });
    }
  }

  await ghiNhatKy(admin, nhatKy);
  return nhatKy;
}

/**
 * Ghi nhật ký vào bảng `nhat_ky_tu_dong`.
 * Bảng chưa tạo (chưa chạy migration 0033) → bỏ qua im lặng, y như sổ sự cố.
 * Mã vẫn lên web chạy được ngay, chạy migration lúc nào cũng được.
 */
async function ghiNhatKy(admin: SupabaseClient, nhatKy: DongNhatKy[]): Promise<void> {
  if (nhatKy.length === 0) return;
  try {
    await admin.from("nhat_ky_tu_dong").insert(
      nhatKy.map((d) => ({
        ma: d.ma,
        ten: d.ten,
        ok: d.ok,
        tom_tat: d.tomTat,
        mili_giay: d.miliGiay,
      })),
    );
  } catch {
    // Nhật ký hỏng thì thôi — không được làm hỏng việc đang chạy.
  }
}
