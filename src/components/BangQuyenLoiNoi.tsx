"use client";

import { useState } from "react";
import { getTier } from "@/lib/packages";
import { useQuyDinhGia } from "@/lib/useQuyDinhGia";
import { useKhoaCuon } from "@/lib/khoaCuon";

// BẢNG "SO SÁNH ĐẶC ĐIỂM HIỂN THỊ" mở NGAY TRÊN TRANG ĐĂNG TIN (chủ dự án 14/10/2026).
// Trước đây mở tab mới /bao-gia-dang-tin#dac-diem → trên điện thoại quay lại thì trang đăng
// tin bị tải lại, mất phần đang soạn. Cùng dữ liệu admin (Giá chuẩn → Quy định) như trang báo giá.
const CAP = ["basic", "silver", "gold", "diamond"] as const;
const DONG_CHINH = 6; // thứ hạng · hệ số tiếp cận · vị trí · nhận diện thẻ · số ảnh · thông số trên thẻ

export default function BangQuyenLoiNoi({ onDong }: { onDong: () => void }) {
  const qd = useQuyDinhGia();
  useKhoaCuon(true, onDong);
  // Quyền lợi rất nhiều dòng (chủ dự án 22/10/2026): hiện các dòng CHÍNH trước (thứ tự admin), bấm "Xem thêm" mới hiện tiếp.
  const [xemHet, setXemHet] = useState(false);
  const dong = xemHet ? qd.bangQuyenLoi : qd.bangQuyenLoi.slice(0, DONG_CHINH);
  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/40 sm:items-center" onClick={onDong}>
      <div className="flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] sm:max-w-3xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-cvr-line px-5 py-3.5">
          <p className="text-[16px] font-semibold tracking-tight text-cvr-ink">So sánh đặc điểm hiển thị</p>
          <button type="button" aria-label="Đóng" onClick={onDong} className="flex h-8 w-8 items-center justify-center rounded-full text-cvr-ink">✕</button>
        </div>
        <div className="flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-cvr-line text-left">
                {/* Cột tên đặc điểm đủ rộng trên máy tính — trước đây chia đều 5 cột, tên bị ép còn 126px, xuống 4–5 dòng (bộ dò lỗi giao diện 22/10/2026) */}
                <th className="px-4 py-3 font-semibold text-cvr-ink sm:w-[38%] sm:min-w-[180px]">Đặc điểm</th>
                {CAP.map((id) => {
                  const t = getTier(id);
                  return <th key={id} className="px-3 py-3 text-center font-semibold tracking-tight" style={{ color: t.accent }}>{t.name}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {dong.map((r) => (
                <tr key={r.ten} className="border-b border-cvr-line/60 last:border-0">
                  <td className="px-4 py-3 text-cvr-body">{r.ten}</td>
                  {CAP.map((id) => r.giaTri[id]).map((v, i) => (
                    <td key={i} className={`px-3 py-3 text-center ${v === "✓" ? "font-semibold text-cvr-ink" : "text-cvr-muted"}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!xemHet && qd.bangQuyenLoi.length > DONG_CHINH && (
            <button type="button" onClick={() => setXemHet(true)} className="mx-4 my-3 inline-flex h-10 items-center rounded-lg border border-cvr-line bg-white px-4 text-sm font-semibold text-cvr-ink transition hover:border-cvr-ink">
              Xem thêm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
