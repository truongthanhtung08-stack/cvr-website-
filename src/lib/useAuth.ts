"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

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

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
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
    await createClient().auth.signOut();
  } finally {
    window.location.href = "/";
  }
}
