import { NextResponse } from "next/server";
import { phatMa, guiMaQuaEmail, guiMaQuaZalo, type Viec } from "@/lib/maXacThuc";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// POST /api/xac-thuc/gui-ma — GỬI MÃ 6 SỐ
//
// Body: { email?, sdt?, viec }
//   · viec = "dang-ky" | "quen-mat-khau" | "xac-minh-sdt"
//   · Có email  → gửi mã qua email (đường CHÍNH, chủ dự án chốt).
//   · Chỉ có SĐT → hiện chưa gửi được: OTP Zalo ZNS đang kẹt vì số dư ZBS = 0đ.
//     Trả lời rõ ràng cho khách thay vì im lặng hoặc báo "lỗi hệ thống".
//
// KHÔNG BAO GIỜ trả mã về trình duyệt — mã chỉ đi qua email/Zalo. Trả mã trong
// phản hồi thì ai mở tab mạng của trình duyệt cũng lấy được tài khoản người khác.
// ============================================================================

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; sdt?: string; viec?: string; kenh?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, loi: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const viec = (body.viec ?? "dang-ky") as Viec;
  if (!["dang-ky", "quen-mat-khau", "xac-minh-sdt"].includes(viec)) {
    return NextResponse.json({ ok: false, loi: "Việc xác thực không hợp lệ." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const sdt = chuanHoaSdt(body.sdt ?? "");

  // KÊNH DO KHÁCH CHỌN. Có cả hai thì mặc định EMAIL (nhanh, không tốn phí, không
  // phụ thuộc số dư ZNS) nhưng khách bấm chọn Zalo thì tôn trọng lựa chọn đó —
  // nhiều người quen nhận mã trong Zalo hơn là mở hộp thư.
  const kenhChon = body.kenh === "zalo" || body.kenh === "email" ? body.kenh : undefined;
  const dungZalo = kenhChon === "zalo" || (!kenhChon && !email);

  if (dungZalo && sdt) {
    if (!laSdtVN(sdt)) {
      return NextResponse.json({ ok: false, loi: "Số điện thoại chưa đúng." }, { status: 400 });
    }
    const phat = await phatMa(sdt, "zalo", viec);
    if (!phat.ok) return NextResponse.json({ ok: false, loi: phat.loi }, { status: 429 });

    const gui = await guiMaQuaZalo(sdt, phat.ma);
    if (!gui.ok) {
      // Nói THẬT lý do và chỉ đường đi tiếp. `khongGuiDuoc` để giao diện biết mà
      // chuyển sang cách khác thay vì bắt khách ngồi đợi mã không bao giờ tới.
      return NextResponse.json(
        {
          ok: false,
          khongGuiDuoc: true,
          loi: email
            ? "Chưa gửi được mã qua Zalo. Bạn chọn nhận mã qua email nhé."
            : "Chưa gửi được mã qua Zalo. Bạn nhập thêm email để nhận mã, hoặc bấm Tiếp tục để tạo tài khoản trước.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, kenh: "zalo", toi: sdt });
  }

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, loi: "Email chưa đúng định dạng." }, { status: 400 });
    }
    const phat = await phatMa(email, "email", viec);
    if (!phat.ok) return NextResponse.json({ ok: false, loi: phat.loi }, { status: 429 });

    const gui = await guiMaQuaEmail(email, phat.ma, viec);
    if (!gui.ok) return NextResponse.json({ ok: false, loi: gui.loi }, { status: 502 });

    return NextResponse.json({ ok: true, kenh: "email", toi: email });
  }

  return NextResponse.json({ ok: false, loi: "Chưa có email hoặc số điện thoại." }, { status: 400 });
}
