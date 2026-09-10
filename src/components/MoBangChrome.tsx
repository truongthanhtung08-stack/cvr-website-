"use client";

import { useSyncExternalStore } from "react";
import { trinhDuyetTrongApp, laIOS, duongDanMoChrome, type LoaiTrongApp } from "@/lib/trinhDuyetTrongApp";

// ============================================================================
// "MỞ BẰNG CHROME" — đặt ngay cạnh nút chọn ảnh.
//
// Khách bấm link từ Zalo/Facebook thì trang chạy trong trình duyệt thu nhỏ của
// app đó, và nút chọn ảnh KHÔNG mở được Bộ sưu tập (chỉ ra Máy ảnh + trình quản
// lý tệp). Khối này chỉ hiện đúng lúc đó, kèm MỘT NÚT bấm là sang Chrome đúng
// trang đang làm dở — không phải một đoạn hướng dẫn dài để khách tự mò.
//
// Mở trong Chrome/Safari bình thường thì khối này KHÔNG hiện.
// ============================================================================

const TEN: Record<Exclude<LoaiTrongApp, null>, string> = {
  zalo: "Zalo",
  facebook: "Facebook",
  khac: "ứng dụng",
};

export default function MoBangChrome() {
  // Chỉ máy khách mới biết đang mở bằng gì. Đọc bằng useSyncExternalStore để bản
  // dựng ở máy chủ trả về "không phải trong app" (nên không hiện gì), còn trên
  // máy khách đọc đúng — không cần useEffect + setState, không render thừa nhịp.
  const loai = useSyncExternalStore<LoaiTrongApp>(
    () => () => {},
    () => trinhDuyetTrongApp(),
    () => null,
  );
  const ios = useSyncExternalStore(
    () => () => {},
    () => laIOS(),
    () => false,
  );

  if (!loai) return null;

  return (
    <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-sm leading-relaxed text-amber-900">
        Đang mở trong <strong className="font-semibold">{TEN[loai]}</strong> nên không chọn được ảnh từ Bộ sưu tập.
      </p>

      {ios ? (
        // iPhone không cho web tự mở app khác — chỉ đúng một thao tác, không dài dòng.
        <p className="mt-1.5 text-sm font-semibold text-amber-900">
          Bấm dấu ••• ở góc màn hình → <span className="underline">Mở trong Safari</span>
        </p>
      ) : (
        <a
          href={duongDanMoChrome()}
          className="mt-2.5 inline-flex h-10 items-center rounded-lg bg-amber-600 px-5 text-sm font-semibold text-white transition active:bg-amber-700"
        >
          Mở bằng Chrome để chọn ảnh
        </a>
      )}
    </div>
  );
}
