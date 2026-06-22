import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | Coastal Land",
  description: "Đăng nhập tài khoản Coastal Land để đăng tin, quản lý tin và lưu bất động sản yêu thích.",
};

export default function DangNhapPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-28 sm:px-6">
        <LoginForm />
      </main>
      <Footer />
    </>
  );
}

