import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký | Coastal Land",
  description: "Tạo tài khoản Coastal Land để đăng tin, quản lý tin và lưu bất động sản yêu thích.",
};

export default function DangKyPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center bg-white px-4 py-16 sm:px-6">
        <RegisterForm />
      </main>
      <Footer />
    </>
  );
}
