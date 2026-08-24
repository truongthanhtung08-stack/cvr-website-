import { createAdminClient } from "@/lib/supabase/admin";

// ════════════════════════════════════════════════════════════════════════════
// ZALO OA — TỰ LÀM MỚI ACCESS TOKEN
//
// VÌ SAO PHẢI CÓ: access token của Zalo OA chỉ sống **1 giờ**. Cắm cứng một
// chuỗi vào biến môi trường thì đúng một tiếng sau là mọi tin ZNS (mã OTP đăng
// nhập, báo nạp tiền, báo duyệt tin) đều hỏng — mà hỏng im lặng, không ai biết.
//
// ⚠️ ZALO XOAY CẢ REFRESH TOKEN: mỗi lần làm mới, Zalo trả về refresh_token MỚI
// và vô hiệu cái cũ. Nên BẮT BUỘC phải lưu lại ngay. Mất refresh token hiện
// hành = phải vào Zalo cấp quyền lại bằng tay.
//
// LƯU Ở ĐÂU: bảng `site_content`, khoá `zalo_oa_token` — bảng này đã có sẵn cho
// nội dung web, không phải tạo bảng mới, không phải chạy migration.
//
// BIẾN MÔI TRƯỜNG (Vercel):
//   ZALO_OA_APP_ID         — App ID của ứng dụng đã liên kết OA
//   ZALO_OA_APP_SECRET     — App Secret
//   ZALO_OA_REFRESH_TOKEN  — refresh token lấy lần đầu ở developers.zalo.me
//                            (chỉ dùng để MỒI lần đầu; sau đó hệ thống tự giữ
//                             bản mới nhất trong CSDL, không đọc biến này nữa)
// ════════════════════════════════════════════════════════════════════════════

const URL_TOKEN = "https://oauth.zaloapp.com/v4/oa/access_token";
const KHOA = "zalo_oa_token";
/** Làm mới sớm 5 phút để không rơi vào lúc token vừa hết hạn giữa chừng. */
const DEM_TRUOC_MS = 5 * 60 * 1000;

type BanGhiToken = {
  access_token: string;
  refresh_token: string;
  het_han_luc: number; // mốc thời gian (ms)
};

export function zaloOaConfig() {
  const appId = process.env.ZALO_OA_APP_ID;
  const secret = process.env.ZALO_OA_APP_SECRET;
  const thieu = [!appId && "ZALO_OA_APP_ID", !secret && "ZALO_OA_APP_SECRET"].filter(Boolean) as string[];
  return { appId, secret, thieu, daCauHinh: thieu.length === 0 };
}

/**
 * Trả về access token còn hiệu lực. Tự làm mới khi cần.
 * Chưa cấu hình hoặc làm mới hỏng → trả null kèm log, nơi gọi tự báo lỗi.
 */
export async function layAccessToken(): Promise<string | null> {
  const { appId, secret, daCauHinh } = zaloOaConfig();
  if (!daCauHinh || !appId || !secret) {
    console.warn("[zalo-oa] chưa cắm ZALO_OA_APP_ID / ZALO_OA_APP_SECRET");
    return null;
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("[zalo-oa] thiếu SUPABASE_SERVICE_ROLE_KEY — không đọc/ghi được token");
    return null;
  }

  // ── Token đang lưu còn dùng được không ────────────────────────────────────
  const { data } = await admin.from("site_content").select("data").eq("key", KHOA).limit(1);
  const luu = data?.[0]?.data as BanGhiToken | undefined;

  if (luu?.access_token && luu.het_han_luc - DEM_TRUOC_MS > Date.now()) {
    return luu.access_token;
  }

  // ── Phải làm mới. Ưu tiên refresh token đã lưu, chưa có thì lấy bản mồi. ──
  const refreshToken = luu?.refresh_token || process.env.ZALO_OA_REFRESH_TOKEN;
  if (!refreshToken) {
    console.error("[zalo-oa] chưa có refresh token — cắm ZALO_OA_REFRESH_TOKEN để mồi lần đầu");
    return null;
  }

  try {
    const res = await fetch(URL_TOKEN, {
      method: "POST",
      headers: { secret_key: secret, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        app_id: appId,
        grant_type: "refresh_token",
      }),
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
      console.error("[zalo-oa] làm mới token thất bại:", JSON.stringify(kq).slice(0, 300));
      return null;
    }

    // Zalo trả expires_in theo GIÂY, có khi là chuỗi. Không đọc được thì coi 1 giờ.
    const song = Number(kq.expires_in) || 3600;
    const moi: BanGhiToken = {
      access_token: kq.access_token,
      refresh_token: kq.refresh_token, // ⚠️ BẢN MỚI — phải lưu, cái cũ đã chết
      het_han_luc: Date.now() + song * 1000,
    };

    const { error } = await admin.from("site_content").upsert({ key: KHOA, data: moi }, { onConflict: "key" });
    if (error) {
      // Lưu hỏng thì lần sau không làm mới được nữa (refresh token cũ đã bị Zalo
      // vô hiệu) → phải hét lên trong log để còn biết đường cấp quyền lại.
      console.error("[zalo-oa] LƯU TOKEN MỚI THẤT BẠI, refresh token cũ đã mất hiệu lực:", error.message);
    }

    return moi.access_token;
  } catch (e) {
    console.error("[zalo-oa] lỗi gọi làm mới token:", e);
    return null;
  }
}
