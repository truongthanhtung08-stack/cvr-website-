"use client";

import { useEffect } from "react";

// ============================================================================
// HAI THẺ CHỌN GÓI TRÊN TRANG BÁO GIÁ: "Gói đăng tin" | "Gói đẩy tin" (chủ dự án 22/10/2026 tối: "gói đăng tin và gói đẩy tin
// nằm liền nhau — gói đẩy tin để sang một menu cạnh gói đăng tin, bấm vào đó ra gói đẩy tin").
// Trang dựng sẵn CẢ HAI gói ở máy chủ; thẻ chỉ đổi `data-goi` trên khung #vung-bang-gia, hiện gói nào là do lớp
// `group-data-[goi=…]/goi` quyết định (cùng cách nút gạt Tin bán | Tin cho thuê) → trang vẫn cache như trang tĩnh.
// Bấm link tới một mục của gói kia (menu đầu web, cột menu trái, trang Quy định…) → tự chuyển thẻ rồi cuộn tới mục đó.
// Mở trang có sẵn #neo: đoạn mã nhỏ ngay đầu khung (DAT_THE_TRUOC) chọn đúng thẻ TRƯỚC khi vẽ, không chớp thẻ sai.
// ============================================================================

export type Goi = "tin" | "day";
export const NEO_GOI: Record<string, Goi> = {
  "bang-gia-tin": "tin", "gia-goi-tin": "tin", "minh-hoa": "tin", "dac-diem": "tin",
  "goi-day-tin": "day", "gia-day-tin": "day",
};
export const DAT_THE_TRUOC = `(function(){try{var m=${JSON.stringify(NEO_GOI)};var g=m[decodeURIComponent(location.hash.slice(1))];if(g)document.currentScript.parentElement.setAttribute('data-goi',g);}catch(e){}})();`;

const vung = () => document.getElementById("vung-bang-gia");
const chon = (g: Goi) => vung()?.setAttribute("data-goi", g);

export default function TheGoiBaoGia() {
  useEffect(() => {
    // Bấm link #neo của một gói (kể cả bấm lại đúng neo đang có — trình duyệt không báo hashchange) → chuyển thẻ + cuộn tới
    const toi = (neo: string) => {
      const g = NEO_GOI[neo];
      if (!g) return false;
      chon(g);
      requestAnimationFrame(() => document.getElementById(neo)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return true;
    };
    const bam = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || a.pathname !== location.pathname) return;
      let neo = "";
      try { neo = decodeURIComponent(a.hash.slice(1)); } catch { return; }
      if (!NEO_GOI[neo]) return;
      // Pha bắt (trước React/Next Link và trước khi trình duyệt cuộn): đổi thẻ NGAY để mục đích hiện ra, rồi để link chạy như
      // thường (menu điện thoại vẫn tự đóng, lịch sử một mục); cuộn bù một nhịp sau cho chắc.
      toi(neo);
    };
    const doiNeo = () => { try { toi(decodeURIComponent(location.hash.slice(1))); } catch { /* bỏ qua */ } };
    // MỞ TỪ TRANG KHÁC trong web (menu trang chủ → Gói đẩy tin › Bảng giá, trang Quy định → Gói đẩy tin): Next dựng trang
    // bằng React nên đoạn mã DAT_THE_TRUOC không chạy → chọn thẻ theo #neo ngay khi trang vừa dựng (rồi ScrollTopOnRoute /
    // toi cuộn tới mục). Trước đây thiếu bước này → mục nằm trong thẻ đang ẩn, trang rơi về đầu (đo 23/10/2026).
    doiNeo();
    document.addEventListener("click", bam, true);
    addEventListener("hashchange", doiNeo);
    addEventListener("popstate", doiNeo);
    return () => {
      document.removeEventListener("click", bam, true);
      removeEventListener("hashchange", doiNeo);
      removeEventListener("popstate", doiNeo);
    };
  }, []);

  // KIỂU THẺ CÓ GẠCH CHÂN — phân biệt rõ để bấm qua lại (chủ dự án 22/10/2026 tối), khác hẳn nút gạt Tin bán | Tin cho thuê
  // (viên thuốc) bên dưới: thẻ đang mở chữ đậm đen + gạch vàng dày, thẻ kia chữ xám.
  const nut = "relative -mb-px flex h-12 items-center justify-center px-3 text-[16px] transition after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t after:bg-transparent hover:text-cvr-ink";
  return (
    <div className="grid grid-cols-2 border-b border-cvr-line" role="tablist" aria-label="Chọn gói">
      <button
        type="button"
        role="tab"
        onClick={() => { chon("tin"); history.replaceState(history.state, "", "#bang-gia-tin"); }}
        className={`${nut} font-semibold text-cvr-muted group-data-[goi=tin]/goi:font-bold group-data-[goi=tin]/goi:text-cvr-ink group-data-[goi=tin]/goi:after:bg-cvr-gold`}
      >
        Gói đăng tin
      </button>
      <button
        type="button"
        role="tab"
        onClick={() => { chon("day"); history.replaceState(history.state, "", "#goi-day-tin"); }}
        className={`${nut} font-semibold text-cvr-muted group-data-[goi=day]/goi:font-bold group-data-[goi=day]/goi:text-cvr-ink group-data-[goi=day]/goi:after:bg-cvr-gold`}
      >
        Gói đẩy tin
      </button>
    </div>
  );
}
