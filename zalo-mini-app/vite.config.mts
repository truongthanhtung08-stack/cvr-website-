import { defineConfig } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";

// index.html ở gốc thư mục (zmp-cli build/deploy tìm ở đây); bản build ra www/.
export default () =>
  defineConfig({
    base: "",
    build: { outDir: "www", emptyOutDir: true },
    // Cho mở bản chạy thử qua link cloudflared (*.trycloudflare.com) để chủ dự án xem trên điện thoại.
    server: { allowedHosts: [".trycloudflare.com"] },
    plugins: [zaloMiniApp(), react()],
  });
