import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập tài khoản Coastal Land để đăng tin, quản lý tin và lưu bất động sản yêu thích.",
};

export default function DangNhapPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center bg-white px-4 py-16 sm:px-6">
        {/* Suspense: LoginForm đọc useSearchParams (?next, ?error) */}
        <Suspense fallback={<div className="text-sm text-cvr-muted">Đang tải…</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

