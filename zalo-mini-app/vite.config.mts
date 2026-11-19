import { defineConfig, loadEnv } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { taoCssWeb } from "./scripts/css-web.mjs";

// index.html ở gốc thư mục (zmp-cli build/deploy tìm ở đây); bản build ra www/.
// FORM ĐĂNG TIN = MÃ WEB (anh 19/11/2026: "bê nguyên cái form web qua"): "@/…" trỏ thẳng ../src của web; các thư viện chỉ có trên
// Next.js (next/link, next/navigation, next/dynamic, next/image) và phiên Supabase / khung đăng nhập dùng tệp nối src/noi-web.
const WEB = path.resolve(__dirname, "../src");
const NOI = path.resolve(__dirname, "src/noi-web");
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  taoCssWeb();
  return defineConfig({
    base: "",
    // es2020: thư viện bản đồ MapLibre (như web) có số BigInt — es2015 của gói mẫu không đóng được (12/11/2026). WebView Zalo hiện hành chạy es2020.
    build: { outDir: "www", emptyOutDir: true, target: "es2020" },
    // Cho mở bản chạy thử qua link cloudflared (*.trycloudflare.com) để chủ dự án xem trên điện thoại.
    server: { allowedHosts: [".trycloudflare.com"], fs: { allow: [path.resolve(__dirname, "..")] } },
    define: {
      "process.env": JSON.stringify({
        NODE_ENV: mode === "production" ? "production" : "development",
        NEXT_PUBLIC_SUPABASE_URL: env.VITE_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
        // asset() của web ghép tiền tố này vào đường ảnh /anh/…, /images/… → trong Mini App ảnh lấy thẳng từ coastalland.vn
        // (Zalo thật 19/11/2026: ảnh vừa tải lên báo "Link ảnh không hiện được" vì đường tương đối trỏ về tên miền Zalo)
        NEXT_PUBLIC_BASE_PATH: "https://coastalland.vn",
      }),
    },
    resolve: {
      // MỘT bản React (của Mini App) cho cả mã web — hai bản React là hook hỏng
      dedupe: ["react", "react-dom", "@supabase/supabase-js"],
      alias: [
        { find: /^next\/link$/, replacement: `${NOI}/link.tsx` },
        { find: /^next\/navigation$/, replacement: `${NOI}/navigation.ts` },
        { find: /^next\/dynamic$/, replacement: `${NOI}/dynamic.tsx` },
        { find: /^next\/image$/, replacement: `${NOI}/image.tsx` },
        { find: /^heic-to\/next$/, replacement: `${NOI}/heicTo.ts` },
        { find: /^@\/lib\/supabase\/client$/, replacement: `${NOI}/supabaseClient.ts` },
        { find: /^@\/components\/LoginForm$/, replacement: `${NOI}/LoginForm.tsx` },
        { find: /^@\//, replacement: `${WEB}/` },
      ],
    },
    plugins: [zaloMiniApp(), tailwindcss(), react()],
  });
};
