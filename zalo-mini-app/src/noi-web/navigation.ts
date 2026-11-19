// NỐI WEB → MINI APP: next/navigation cho form đăng tin web.
import { useLocation, useNavigate } from "zmp-ui";
import { duongMiniApp } from "./duong";

export function useRouter() {
  const dieuHuong = useNavigate();
  const di = (h: string, replace = false) => { const d = duongMiniApp(h); if (d) dieuHuong(d, { replace }); };
  return { push: (h: string) => di(h), replace: (h: string) => di(h, true), back: () => dieuHuong(-1), refresh: () => {}, prefetch: () => {} };
}
export function useSearchParams() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}
export function usePathname() {
  return useLocation().pathname;
}
