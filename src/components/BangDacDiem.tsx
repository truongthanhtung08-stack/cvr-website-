import type { TierId } from "@/lib/packages";
import NhanGoi from "@/components/NhanGoi";

// ============================================================================
// BẢNG "ĐẶC ĐIỂM HIỂN THỊ" CỦA CÁC GÓI TIN — MỘT bảng dùng chung: trang Báo giá và hộp so sánh ở bước chọn gói khi đăng
// tin. Dòng = bảng quyền lợi admin (Giá chuẩn → Quy định), đúng thứ tự admin; admin thêm / sửa dòng là bảng tự đổi theo.
// Cột tên đặc điểm DÍNH bên trái, cột gói vuốt ngang; cột gói đủ rộng để chữ dài (nhận diện thẻ tin…) không bị ép
// thành cột hẹp (bộ dò lỗi giao diện 22/10/2026).
// ============================================================================

const CAP: TierId[] = ["basic", "silver", "gold", "diamond"];

export default function BangDacDiem({ dong }: { dong: { ten: string; giaTri: Partial<Record<TierId, string>> }[] }) {
  // Chữ đủ to, đủ đậm để đọc (chủ dự án 22/10/2026 tối: "nội dung chữ có vẻ nhỏ, khó nhìn")
  return (
    <table className="w-full min-w-[776px] border-collapse text-[14px] leading-snug sm:min-w-[640px] sm:text-[15px]">
      <thead>
        <tr className="bg-cvr-surface">
          <th className="sticky left-0 z-10 w-[136px] border-b border-cvr-line bg-cvr-surface px-3 py-3.5 text-left font-semibold text-cvr-ink sm:w-[24%] sm:px-4">Đặc điểm</th>
          {CAP.map((id) => (
            <th key={id} className="min-w-[160px] border-b border-l border-cvr-line px-2 py-3.5 text-center sm:w-[19%] sm:min-w-0 sm:px-3">
              <NhanGoi id={id} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dong.map((r) => (
          <tr key={r.ten} className="border-b border-cvr-line/70 last:border-0">
            <td className="sticky left-0 z-10 bg-white px-3 py-3 font-semibold text-cvr-ink sm:px-4">{r.ten}</td>
            {CAP.map((id) => {
              const v = r.giaTri[id] ?? "";
              return (
                <td key={id} className={`border-l border-cvr-line/70 px-2 py-3 text-center leading-snug sm:px-3 ${v === "✓" ? "text-[16px] font-bold text-cvr-ink" : "text-cvr-body"}`}>{v}</td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
