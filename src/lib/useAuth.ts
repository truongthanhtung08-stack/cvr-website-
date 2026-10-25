"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { napSupabase, coPhienDangNhap } from "@/lib/supabase/nap";

// Hook đọc trạng thái đăng nhập thật từ Supabase Auth (thay demo localStorage "cvr-member").
// Có guard: thiếu env Supabase (vd chạy dev chưa có .env.local) → coi như chưa đăng nhập,
// không ném lỗi làm sập trang.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ─── CHẾ ĐỘ "XEM THỬ ĐÃ ĐĂNG NHẬP" — CHỈ trên link preview (cloudflared tunnel) ───
    // Đăng nhập Google thật bị Supabase đá về coastalland.vn nên không xem được UI đã
    // đăng nhập trên link tạm. Mở "…/?preview_login=1" để giả đăng nhập, "?preview_login=0"
    // để thoát. Gác theo hostname → KHÔNG BAO GIỜ chạy trên coastalland.vn / localhost thật.
    if (typeof window !== "undefined" && /\.trycloudflare\.com$/.test(window.location.hostname)) {
      const p = new URLSearchParams(window.location.search);
      if (p.get("preview_login") === "1") localStorage.setItem("cl-preview-login", "1");
      if (p.get("preview_login") === "0") localStorage.removeItem("cl-preview-login");
      if (localStorage.getItem("cl-preview-login") === "1") {
        setUser({
          id: "preview-user", aud: "authenticated", role: "authenticated",
          email: "xemthu@coastalland.vn", created_at: new Date(0).toISOString(),
          app_metadata: {}, user_metadata: { full_name: "Xem thử (preview)" },
        } as unknown as User);
        setLoading(false);
        return;
      }
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }

    // CHƯA ĐĂNG NHẬP THÌ KHÔNG TẢI THƯ VIỆN (tốc độ điện thoại, đo 21/10/2026): phiên đăng nhập nằm trong cookie
    // "sb-…-auth-token" (@supabase/ssr). Không có cookie đó = chưa đăng nhập → trả ngay, khỏi tải ~58 KB ở mọi trang.
    // Đăng nhập xong khách được chuyển trang → thanh trên dựng lại, thấy cookie, tải thư viện như cũ.
    if (!coPhienDangNhap()) {
      setLoading(false);
      return;
    }

    let huy = false;
    let boTheoDoi = () => {};
    void napSupabase().then((supabase) => {
      if (huy) return;
      supabase.auth.getUser().then(({ data }) => {
        if (huy) return;
        setUser(data.user ?? null);
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      boTheoDoi = () => sub.subscription.unsubscribe();
    });
    return () => { huy = true; boTheoDoi(); };
  }, []);

  return { user, loading };
}

// Ảnh đại diện thật do Google / Zalo cấp lúc đăng nhập ("" nếu không có).
export function anhDaiDien(user: User | null): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  return (meta.avatar_url as string) || (meta.picture as string) || "";
}

// Tên hiển thị: ưu tiên full_name (đặt lúc đăng ký) → email → SĐT.
export function displayName(user: User | null): string {
  if (!user) return "";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return (
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email ||
    user.phone ||
    "Thành viên"
  );
}

// Đăng xuất + về trang chủ (đảm bảo Header/middleware nhận trạng thái mới).
export async function signOut() {
  try {
    await (await napSupabase()).auth.signOut();
  } finally {
    // THAY trang: đăng xuất rồi bấm back không quay lại khu quản lý nữa.
    window.location.replace("/");
  }
}

// Email THẬT của khách — bỏ email kỹ thuật web tự tạo cho tài khoản Zalo / số điện thoại
// (zalo_…@users.coastalland.vn, sdt_…@users.coastalland.vn): mã nội bộ, không hiện cho khách (26/10/2026).
export function emailThat(e?: string | null): string {
  return e && !/@users\.coastalland\.vn$/i.test(e) ? e : "";
}
