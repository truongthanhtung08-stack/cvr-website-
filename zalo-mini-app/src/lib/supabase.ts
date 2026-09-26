import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// Cùng kho Supabase với web — đăng nhập bằng SĐT (mã gửi qua Zalo, như trang /dang-nhap/so-dien-thoai của web).
// Phiên đăng nhập giữ trên máy khách nên lần sau mở Mini App là vào thẳng.
// SAU NÀY (có máy chủ VN + Mini App đã xác thực): thay bước nhập mã bằng getPhoneNumber của Zalo (một chạm).
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "cl-phien" },
});

// 0905… → +84905… (Supabase cần định dạng quốc tế)
export const e164 = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("84")) return `+${d}`;
  if (d.startsWith("0")) return `+84${d.slice(1)}`;
  return `+84${d}`;
};

// +84905… → 0905…
export const soVN = (p?: string | null) => (p ? p.replace(/^\+?84/, "0") : "");

export function usePhien() {
  const [phien, setPhien] = useState<Session | null>(null);
  const [san, setSan] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setPhien(data.session);
      setSan(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setPhien(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { phien, san, nguoiDung: phien?.user ?? null };
}
