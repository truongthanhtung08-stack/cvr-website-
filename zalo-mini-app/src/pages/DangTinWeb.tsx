// ĐĂNG TIN = NGUYÊN FORM WEB (anh 19/11/2026: "bê nguyên cái form web qua"). Mini App không viết form riêng nữa: gọi thẳng
// PostListingForm của web (../src/components) — web sửa gì Mini App có theo. Tệp nối ở src/noi-web (đường, phiên, gọi máy chủ).
import "../form-web.css";
import React, { useEffect } from "react";
import { Page } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import PostListingForm from "@/components/PostListingForm";
import { ganAnhWeb, ganFetchWeb } from "../noi-web/fetchWeb";

ganFetchWeb();
ganAnhWeb();
(window as unknown as { __CL_MINI_APP__?: boolean }).__CL_MINI_APP__ = true;
// Bản đồ ghim vị trí của form web: worker MapLibre lấy tệp trong gói Mini App (như BanDoTin), không phải gốc tên miền Zalo.
const tepWorker = "maplibre/" + "maplibre-gl-worker.js";
(window as unknown as { __CL_WORKER_BAN_DO__?: string }).__CL_WORKER_BAN_DO__ =
  import.meta.env.DEV ? "/" + tepWorker : new URL("../" + tepWorker, import.meta.url).href;

export default function DangTinWeb() {
  useEffect(() => { document.documentElement.classList.add("trong-mini-app"); return () => document.documentElement.classList.remove("trong-mini-app"); }, []);
  return (
    <Page className="form-web" style={{ background: "#fff", paddingBottom: 24 }}>
      <TieuDe title="Đăng tin" />
      <div className="px-4 pt-2"><PostListingForm /></div>
    </Page>
  );
}
