import React, { useEffect, useRef, useState } from "react";

// TIN DÀI → THU GỌN CẢ TIN (chủ dự án 06/11/2026: "1 tin dài! đến đủ chân có Xem thêm, nút Thu gọn là cuối tin"; cùng cơ chế trang dự
// án web ThuGonTrang): hiện trọn các mục tới ~1,5 màn hình, cắt ở ĐÁY một mục ("may dừng giữa chừng là sao" — không cắt giữa mục) + "Xem thêm";
// mở ra thì "Thu gọn" nằm CUỐI TRANG (sau Tin tương tự), bấm thì cuộn về đầu phần đã thu. Ngắn thì hiện trọn. Dùng chung trang tin + trang dự án (mục chữ chính đánh dấu data-thu-gon="mo-ta").
export default function ThuGonTin({ children }: { children: React.ReactNode }) {
  const khoi = useRef<HTMLDivElement>(null);
  const [mo, setMo] = useState(false);
  const [cat, setCat] = useState<number>(); // px — cắt ở ĐÁY MỘT MỤC (không dừng giữa mục), undefined = hiện trọn
  const dai = cat !== undefined;
  useEffect(() => {
    const el = khoi.current;
    if (!el) return;
    const tinh = () => {
      // CẮT TRONG PHẦN CHỮ MÔ TẢ (đẹp nhất — chữ mờ dần tự nhiên, không cắt ngang lưới, bản đồ, ảnh): hiện ảnh · giá · Đặc điểm ·
      // ~5 dòng đầu Mô tả. Không có mô tả → cắt ở đáy Đặc điểm. Phần còn lại ít (< 240px) thì hiện hết, không nút.
      const moTa = el.querySelector<HTMLElement>("[data-thu-gon=mo-ta]");
      const dacDiem = el.firstElementChild as HTMLElement | null;
      const day = moTa ? moTa.offsetTop + 150 : dacDiem ? dacDiem.offsetTop + dacDiem.offsetHeight : undefined;
      setCat(day !== undefined && el.scrollHeight - day > 240 ? day : undefined);
    };
    tinh();
    const ro = new ResizeObserver(tinh);
    [...el.children].forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, []);
  const nut = (
    <div className="hang-xem-them">
      <button className="btn-xemthem" onClick={() => { if (mo) khoi.current?.scrollIntoView({ block: "start" }); setMo(!mo); }}>
        {mo ? "Thu gọn" : "Xem thêm"}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: mo ? "rotate(180deg)" : undefined }}><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
  return (
    <>
      <div ref={khoi} className="thu-gon-tin" style={dai && !mo ? { maxHeight: cat } : undefined}>
        {children}
        {dai && !mo && <div className="mo-ta-mo" aria-hidden />}
      </div>
      {dai && nut}
    </>
  );
}
