import React from "react";

// Bộ biểu tượng nét mảnh — cùng bộ với web (src/components/MobileTabBar.tsx + Header.tsx)
// để Mini App và web nhìn là một thương hiệu. 24×24, nét 1.6, bo tròn.
const NET: Record<string, React.ReactNode> = {
  home: <path d="M4.5 10.4 12 4.3l7.5 6.1V19a1.6 1.6 0 0 1-1.6 1.6h-3.3v-5.9H9.4v5.9H6.1A1.6 1.6 0 0 1 4.5 19Z" />,
  muaBan: (
    <>
      <path d="M13.1 3.6h5.8a1.5 1.5 0 0 1 1.5 1.5v5.8a1.5 1.5 0 0 1-.44 1.06l-7.7 7.7a1.5 1.5 0 0 1-2.12 0l-5.8-5.8a1.5 1.5 0 0 1 0-2.12l7.7-7.7a1.5 1.5 0 0 1 1.06-.44Z" />
      <path strokeWidth={2.6} d="M16.4 7.6h.01" />
    </>
  ),
  choThue: (
    <>
      <path d="M4.4 20.5V6a1.6 1.6 0 0 1 1.6-1.6h5a1.6 1.6 0 0 1 1.6 1.6v14.5M12.6 20.5V10.6h5.4A1.6 1.6 0 0 1 19.6 12.2v8.3M3 20.5h18" />
      <path d="M7.2 8.3h2.2M7.2 12h2.2M7.2 15.7h2.2M15.2 14.3h1.7M15.2 17.4h1.7" />
    </>
  ),
  duAn: (
    <>
      <rect x="3.5" y="8.5" width="7" height="11.5" rx="1" />
      <rect x="12" y="4" width="8" height="16" rx="1" />
      <path d="M2.5 20.5h19M6 11.6h2M6 14.6h2M15 7.2h2M15 10.6h2M15 14h2" />
    </>
  ),
  dangTin: <path d="M12 8v8m-4-4h8M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z" />,
  tinTuc: <path d="M4 5a1 1 0 011-1h10a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM16 8h3a1 1 0 011 1v9a2 2 0 01-2 2M7 8h6M7 12h6M7 16h4" />,
  bangGia: <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-2.75-1.6-2.75 1.6-2.75-1.6-2.75 1.6-2.25-1.3V4.5a1 1 0 0 1 1-1ZM9 8h6M9 11.5h6M9 15h3.5" />,
  tinhVay: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8 7.5h8M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 17.5h.01M12 17.5h3.5" strokeWidth={1.9} />
    </>
  ),
  tuVan: <path d="M20 11.5c0 4.14-3.58 7.5-8 7.5-1.2 0-2.34-.25-3.36-.7L4 19.5l1.2-3.6A7.1 7.1 0 0 1 4 11.5C4 7.36 7.58 4 12 4s8 3.36 8 7.5ZM8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />,
  timKiem: <path d="M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6ZM15.7 15.7l4.3 4.3" />,
  taiKhoan: (
    <>
      <path d="M15.9 8.2a3.9 3.9 0 1 1-7.8 0 3.9 3.9 0 0 1 7.8 0Z" />
      <path d="M4.9 20.6a7.1 7.1 0 0 1 14.2 0" />
    </>
  ),
};

export type TenIcon = keyof typeof NET;

export default function IconCL({ ten, co = 24, net = 1.6 }: { ten: TenIcon; co?: number; net?: number }) {
  return (
    <svg width={co} height={co} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={net} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {NET[ten]}
    </svg>
  );
}
