import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// NHẬN UỶ QUYỀN CỦA OFFICIAL ACCOUNT — rồi TỰ LƯU TOKEN
// ----------------------------------------------------------------------------
// Đây là bước một lần duy nhất để web được phép gửi ZNS thay mặt OA Coastal Land.
//
// LUỒNG:
//   1. developers.zalo.me → app → Official Account → Thiết lập chung:
//      đặt "Official Account Callback Url" = https://coastalland.vn/api/auth/zalo-oa/callback
//      rồi tick quyền "Gửi tin qua số điện thoại" + "Quản lý Message Template",
//      bấm Cập nhật để Zalo sinh ra ĐƯỜNG DẪN YÊU CẦU CẤP QUYỀN.
//   2. Admin của OA mở đường dẫn đó, bấm Đồng ý.
//   3. Zalo gọi ngược về ĐÚNG route này kèm ?code=…
//   4. Route đổi code lấy access_token + refresh_token, LƯU THẲNG vào bảng
//      bi_mat (khoá `zalo_oa_token`) — bảng chỉ máy chủ đọc được, xem migration 0021.
//
// VÌ SAO LÀM VẬY: refresh token là chuỗi bí mật, và Zalo XOAY nó sau mỗi lần làm
// mới. Bắt người ta copy dán vào biến môi trường thì vừa lộ, vừa chỉ đúng được một
// lần rồi hỏng. Để máy chủ tự nhận và tự giữ là cách duy nhất chạy lâu dài.
//
// Từ lúc này lib/zaloOa.ts tự làm mới token mỗi giờ, không cần đụng tay nữa.
//
// KHOÁ CẦN CÓ (đã có sẵn trên Vercel, dùng chung app 114204740698790237):
//   ZALO_OA_APP_ID / ZALO_OA_APP_SECRET  — nếu chưa đặt thì tự lấy
//   ZALO_APP_ID / ZALO_APP_SECRET        — vì cùng một ứng dụng Zalo
// ============================================================================
export const dynamic = "force-dynamic";

const URL_TOKEN = "https://oauth.zaloapp.com/v4/oa/access_token";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const loiZalo = searchParams.get("error_description") || searchParams.get("error");

  if (loiZalo) return ve(origin, `Zalo từ chối: ${loiZalo}`);
  if (!code) return ve(origin, "Zalo không gửi kèm mã uỷ quyền.");

  const appId = process.env.ZALO_OA_APP_ID || process.env.ZALO_APP_ID;
  const secret = process.env.ZALO_OA_APP_SECRET || process.env.ZALO_APP_SECRET;
  if (!appId || !secret) return ve(origin, "Máy chủ chưa có ZALO_APP_ID / ZALO_APP_SECRET.");

  const admin = createAdminClient();
  if (!admin) return ve(origin, "Máy chủ thiếu SUPABASE_SERVICE_ROLE_KEY nên không lưu được token.");

  try {
    const res = await fetch(URL_TOKEN, {
      method: "POST",
      headers: { secret_key: secret, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, app_id: appId, grant_type: "authorization_code" }),
      cache: "no-store",
    });
    const kq = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: string | number;
      error?: number;
      message?: string;
    };

    if (!kq.access_token || !kq.refresh_token) {
      return ve(origin, `Zalo không trả token: ${JSON.stringify(kq).slice(0, 200)}`);
    }

    // Trừ hao 5 phút giống lib/zaloOa.ts để không dùng token sát giờ hết hạn.
    const song = Number(kq.expires_in) || 3600;
    const { error } = await admin.from("bi_mat").upsert(
      {
        key: "zalo_oa_token",
        data: {
          access_token: kq.access_token,
          refresh_token: kq.refresh_token,
          het_han_luc: Date.now() + song * 1000,
        },
      },
      { onConflict: "key" },
    );
    if (error) return ve(origin, `Lấy được token nhưng lưu hỏng: ${error.message}`);

    return NextResponse.redirect(`${origin}/admin?zalo_oa=ok`);
  } catch (e) {
    return ve(origin, `Không gọi được Zalo: ${String(e)}`);
  }
}

function ve(origin: string, lyDo: string) {
  return NextResponse.redirect(`${origin}/admin?zalo_oa=loi&ly_do=${encodeURIComponent(lyDo)}`);
}
