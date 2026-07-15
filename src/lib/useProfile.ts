"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Role = "buyer" | "agent" | "company" | "admin";
export type Status = "active" | "pending" | "suspended";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  phone_verified: boolean;
  email: string | null;
  role: Role;
  status: Status;
  company_name: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  free_quota: number;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
};

// Đọc hồ sơ (profiles) của người dùng đang đăng nhập. Trả role để gác admin.
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile((data as Profile) ?? null);
      setLoading(false);
    })();
  }, []);

  return { profile, loading };
}
