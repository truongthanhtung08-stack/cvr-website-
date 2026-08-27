import { NextResponse } from "next/server";

// ============================================================================
// LẤY TỶ GIÁ TRUNG TÂM USD/VND DO NGÂN HÀNG NHÀ NƯỚC CÔNG BỐ
// ----------------------------------------------------------------------------
// Dùng ở /admin/hoa-don-thue → mục "Hóa đơn nước ngoài & thuế nhà thầu", để khỏi
// phải mở sbv.gov.vn tra tay rồi gõ lại (gõ tay là chỗ dễ sai nhất).
//
// ⚠️ PHẢI gọi từ MÁY CHỦ, không gọi thẳng từ trình duyệt:
//   · sbv.gov.vn không mở CORS → trình duyệt bị chặn.
//   · sbv.gov.vn có tường lửa F5 chặn bot. Nó soi CẢ bộ header, không chỉ
//     User-Agent: thiếu nhóm sec-ch-ua / Sec-Fetch-* / Upgrade-Insecure-Requests
//     là trả HTTP 200 kèm trang "Request Rejected". Bộ header dưới đây đã thử
//     chạy được (28/08/2026) — ĐỪNG RÚT GỌN, bỏ dòng nào cũng có thể hỏng.
//
// Trang SBV nhúng sẵn số trong HTML (không phải JS dựng), và có cả bản máy đọc:
//     <td title="1 Đô la Mỹ ="…</td> <td title="25611">25.611 VND</td>
// nên đọc theo thuộc tính title trước, hỏng mới đọc tới chuỗi hiển thị.
//
// Đây chỉ là TIỆN ÍCH ĐIỀN SẴN. Số cuối cùng vẫn do người nhập chốt và được lưu
// cứng vào từng dòng hóa đơn — SBV đổi trang thì cùng lắm mất tiện ích, không
// làm sai sổ sách.
// ============================================================================
export const dynamic = "force-dynamic";

const NGUON = "https://sbv.gov.vn/vi/t%E1%BB%B7-gi%C3%A1";

export async function GET() {
  let html: string;
  try {
    const res = await fetch(NGUON, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, message: `sbv.gov.vn trả về ${res.status}` }, { status: 502 });
    }
    html = await res.text();
    // Tường lửa F5 trả HTTP 200 kèm trang chặn — phải bắt riêng, không thì báo
    // nhầm là "SBV đổi bố cục" và mất cả buổi đi sửa regex.
    if (/Request Rejected/i.test(html)) {
      return NextResponse.json(
        { ok: false, message: "sbv.gov.vn chặn truy cập từ máy chủ — nhập tay tỷ giá giúp." },
        { status: 502 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: "Không nối được sbv.gov.vn: " + String(err) },
      { status: 502 },
    );
  }

  const phang = html.replace(/\s+/g, " ");

  // Bảng "Tỷ giá trung tâm": ô "1 Đô la Mỹ =" rồi tới ô có title là số thuần.
  let tyGia = 0;
  const machine = phang.match(/1 Đô la Mỹ =[\s\S]{0,200}?<td title="(\d{4,6})"/);
  if (machine) {
    tyGia = Number(machine[1]);
  } else {
    // Dự phòng: đọc chuỗi hiển thị dạng "25.611 VND".
    const hienThi = phang.match(/1 Đô la Mỹ =[\s\S]{0,300}?([\d.]{5,9}) VND/);
    if (hienThi) tyGia = Number(hienThi[1].replace(/\./g, ""));
  }

  if (!(tyGia > 0)) {
    return NextResponse.json(
      { ok: false, message: "Đọc được trang nhưng không tìm thấy tỷ giá — SBV có thể đã đổi bố cục, nhập tay giúp." },
      { status: 502 },
    );
  }

  const ngay = phang.match(/áp dụng cho ngày (\d{2}\/\d{2}\/\d{4})/)?.[1] ?? null;

  return NextResponse.json({ ok: true, tyGia, ngay, nguon: NGUON });
}
