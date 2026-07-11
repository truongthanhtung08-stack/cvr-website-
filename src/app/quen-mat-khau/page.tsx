import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu | Coastal Land",
  description: "Đặt lại mật khẩu tài khoản Coastal Land.",
};

export default function QuenMatKhauPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center bg-white px-4 py-16 sm:px-6">
        <ForgotPasswordForm />
      </main>
      <Footer />
    </>
  );
}
