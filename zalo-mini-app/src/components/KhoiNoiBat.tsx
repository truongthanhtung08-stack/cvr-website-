import React, { useState } from "react";
import { Spinner, useNavigate } from "zmp-ui";
import TheTinDoc from "./TheTinDoc";
import { layTinNoiBat, type Tin } from "../lib/tin";
import { useTai } from "../lib/useTai";

// BẤT ĐỘNG SẢN NỔI BẬT — ĐÚNG web điện thoại (src/components/FeaturedListings.tsx 12/11/2026, chuẩn 09/10/2026 như Batdongsan):
// thẻ to XẾP DỌC theo cấp Diamond → Gold → Silver → Basic, cả Mua bán lẫn Cho thuê · ban đầu 10 tin · "Xem thêm" lần 1 thêm 10,
// lần 2 mở danh sách Mua bán.
const MOI_LAN = 10;

export default function KhoiNoiBat() {
  const dieuHuong = useNavigate();
  const ds = useTai(() => layTinNoiBat(), [], [] as Tin[]);
  const [lan, setLan] = useState(0);
  const hien = ds.data.slice(0, (lan + 1) * MOI_LAN);

  return (
    <section className="khoi khoi-noi-bat">
      <div className="khoi-dau">
        <h2 className="tieu-de-khoi">Bất động sản nổi bật</h2>
      </div>
      {ds.dangTai ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Spinner /></div>
      ) : (
        <div className="ds-the-to">{hien.map((t) => <TheTinDoc key={t.id} tin={t} />)}</div>
      )}
      <div className="hang-xem-them">
        <button className="btn-xemthem" onClick={() => (lan === 0 && ds.data.length > MOI_LAN ? setLan(1) : dieuHuong("/ds/ban"))}>
          Xem thêm<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </section>
  );
}
