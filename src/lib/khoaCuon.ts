import { useCallback, useEffect, useRef } from "react";

// ============================================================================
// KHOÁ CUỘN TRANG NỀN — dùng chung cho mọi lớp phủ toàn màn hình
// ----------------------------------------------------------------------------
// Dùng position:fixed (KHÔNG dùng overflow:hidden — cách đó làm hỏng
// position:sticky của header, đã từng gây lỗi menu bị ẩn).
//
// ĐẾM SỐ LỚP ĐANG MỞ: danh sách ảnh mở trước, bấm 1 ảnh mở tiếp bộ xem ảnh →
// hai lớp cùng khoá. Nếu mỗi lớp tự mở khoá thì đóng bộ xem ảnh sẽ nhả trang
// nền trong khi danh sách ảnh còn mở → trang nền nhảy về đầu. Vì vậy chỉ lớp
// CUỐI CÙNG đóng mới trả trang về đúng chỗ cũ.
// ============================================================================

let dangMo = 0;
let viTri = 0;

export function khoaCuon(): () => void {
  if (dangMo === 0) {
    viTri = window.scrollY;
    const b = document.body.style;
    b.position = "fixed";
    b.top = `-${viTri}px`;
    b.left = "0";
    b.right = "0";
  }
  dangMo += 1;

  let daNha = false;
  return () => {
    if (daNha) return;
    daNha = true;
    dangMo -= 1;
    if (dangMo > 0) return;
    const b = document.body.style;
    b.position = ""; b.top = ""; b.left = ""; b.right = "";
    // TỨC THÌ, không trượt (html đang scroll-behavior: smooth): trượt thì trang chạy lướt về chỗ cũ, và nếu ngay sau đó
    // mở bảng khác (Đặc điểm → Bảng quyền lợi) bảng mới ghi nhầm vị trí giữa chừng → đóng xong trang bay đi (22/10/2026).
    window.scrollTo({ top: viTri, left: 0, behavior: "instant" });
  };
}

// BẢNG NỔI CÓ NỀN MỜ (bảng chọn, bảng quyền lợi, đặc điểm gói, xác thực số…) — đang mở thì trang phía sau đứng yên
// (chủ dự án 22/10/2026: "hiện bảng nhưng vuốt thì phần khác của trang cứ chạy"). Một dòng: useKhoaCuon(dangMo, dong):
// khoá cuộn + nút Quay lại của điện thoại đóng đúng bảng này (truyền dong).
export function useKhoaCuon(mo: boolean, dong?: () => void) {
  useEffect(() => (mo ? khoaCuon() : undefined), [mo]);
  useNutQuayLai(mo, dong);
}

// ============================================================================
// NÚT QUAY LẠI CỦA ĐIỆN THOẠI = ĐÓNG BẢNG ĐANG MỞ, KHÔNG RỜI TRANG
// ----------------------------------------------------------------------------
// Chủ dự án 22/10/2026: "mở ra thì phải tính cách thoát lại" — "làm luôn nút Quay lại cho mọi bảng chọn / bảng nổi".
// Mở bảng → thêm MỘT bước lịch sử có DẤU RIÊNG của bảng đó (giữ nguyên trạng thái cũ, cùng địa chỉ). Bấm Quay lại →
// bước đó mất → bảng nào không còn thấy dấu của mình thì đóng. Bảng lồng nhau (bảng ngoài + bảng trong) đều có dấu,
// lùi một lần chỉ mất dấu bảng trong → chỉ bảng trong đóng. Cùng kiểu với bộ lọc (FilterDropdown, dấu cvrLoc) và ô tìm
// trang chủ (TimTrangChu, dấu cvrTim) nên dùng chung không đá nhau.
// Đóng bằng nút (✕ / Xong / chọn xong) → tự lùi bỏ bước đã thêm; bấm link trong bảng sang trang khác thì KHÔNG lùi.
// Bảng đóng ĐỂ CHUYỂN TRANG (ô tìm: chọn gợi ý → router.push) gọi hàm trả về (boQuaLui) TRƯỚC khi chuyển — tự lùi đúng
// lúc trang mới đang đẩy vào lịch sử có thể đá khách về trang cũ.
let demDau = 0;
export function useNutQuayLai(mo: boolean, dong?: () => void): () => void {
  const boQua = useRef(false);
  const dongRef = useRef(dong);
  useEffect(() => { dongRef.current = dong; });
  const coDong = !!dong;
  // Gỡ rồi gắn lại ngay (React chạy hiệu ứng hai lần ở chế độ phát triển; bảng mở sẵn lúc vừa hiện) → KHÔNG lùi rồi
  // thêm bước mới (lùi bất đồng bộ sẽ đóng nhầm bảng vừa gắn, lùi thêm là rời trang — đo 22/10/2026): việc lùi hoãn một
  // nhịp, gắn lại kịp thì huỷ lùi và dùng lại bước cũ.
  const dauRef = useRef("");
  const choLui = useRef<number | null>(null);
  useEffect(() => {
    if (!mo || !coDong) return;
    let dau = dauRef.current;
    if (choLui.current !== null && dau) {
      clearTimeout(choLui.current);
      choLui.current = null;
    } else {
      dau = `cvrBang${++demDau}`;
      try { history.pushState({ ...history.state, [dau]: 1 }, ""); } catch { return; }
    }
    dauRef.current = dau;
    const url = location.href;
    let daLui = false;
    boQua.current = false;
    const onPop = () => {
      if ((history.state as Record<string, unknown> | null)?.[dau]) return;
      daLui = true;
      dongRef.current?.();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (daLui || boQua.current) { dauRef.current = ""; return; }
      choLui.current = window.setTimeout(() => {
        choLui.current = null;
        dauRef.current = "";
        if (location.href === url && (history.state as Record<string, unknown> | null)?.[dau]) history.back();
      }, 0);
    };
  }, [mo, coDong]);
  return useCallback(() => { boQua.current = true; }, []);
}
