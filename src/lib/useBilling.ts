"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BILLING_DEFAULT, type BillingData } from "@/lib/billing";

// ============================================================================
// ĐỌC GIÁ & KHUYẾN MÃI ĐANG ÁP DỤNG (bản admin đã lưu) — dùng cho TRANG KHÁCH.
// Trang khách (/tai-khoan, /dang-tin) là client component nên không gọi được
// getBilling() phía máy chủ; trước đây chúng lấy thẳng BILLING_DEFAULT trong code
// → sửa giá/khuyến mãi ở /admin/gia-khuyen-mai KHÔNG hiện ra ngoài.
// Hook này đọc site_content key "billing" (đúng chỗ admin lưu) và gộp với giá
// chuẩn trong code — y hệt getBilling() phía máy chủ. Chưa lưu/không kết nối
// được → dùng giá chuẩn, trang không bao giờ trống.
// ============================================================================
export function useBilling(): { billing: BillingData; loading: boolean } {
  const [billing, setBilling] = useState<BillingData>(BILLING_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const supabase = createClient();
        const { data: rows } = await supabase
          .from("site_content")
          .select("data")
          .eq("key", "billing")
          .limit(1);
        const saved = rows?.[0]?.data as Partial<BillingData> | undefined;
        if (saved) setBilling(mergeBilling(saved));
      } catch {
        /* chưa cấu hình Supabase → giữ giá chuẩn trong code */
      }
      setLoading(false);
    })();
  }, []);

  return { billing, loading };
}

// Gộp giống getBilling(): khối nào admin bỏ trống thì giữ mặc định.
// Riêng promos lấy đúng những gì admin lưu (xoá hết khuyến mãi = không còn km).
function mergeBilling(saved: Partial<BillingData>): BillingData {
  return {
    ...BILLING_DEFAULT,
    ...saved,
    plans: saved.plans?.length ? saved.plans : BILLING_DEFAULT.plans,
    projectPlans: saved.projectPlans?.length ? saved.projectPlans : BILLING_DEFAULT.projectPlans,
    promos: saved.promos ?? [],
    free: { ...BILLING_DEFAULT.free, ...saved.free },
    points: { ...BILLING_DEFAULT.points, ...saved.points },
    levels: saved.levels?.length ? saved.levels : BILLING_DEFAULT.levels,
    topupAmounts: saved.topupAmounts?.length ? saved.topupAmounts : BILLING_DEFAULT.topupAmounts,
  };
}
