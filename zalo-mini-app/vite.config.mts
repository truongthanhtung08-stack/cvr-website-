import { defineConfig } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";

// index.html ở gốc thư mục (zmp-cli build/deploy tìm ở đây); bản build ra www/.
export default () =>
  defineConfig({
    base: "",
    // es2020: thư viện bản đồ MapLibre (như web) có số BigInt — es2015 của gói mẫu không đóng được (12/11/2026). WebView Zalo hiện hành chạy es2020.
    build: { outDir: "www", emptyOutDir: true, target: "es2020" },
    // Cho mở bản chạy thử qua link cloudflared (*.trycloudflare.com) để chủ dự án xem trên điện thoại.
    server: { allowedHosts: [".trycloudflare.com"] },
    plugins: [zaloMiniApp(), react()],
  });
