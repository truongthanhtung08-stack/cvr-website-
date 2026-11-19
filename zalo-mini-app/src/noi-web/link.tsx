// NỐI WEB → MINI APP: next/link của form đăng tin web (PostListingForm dùng nguyên) — đường nội bộ đi bằng điều hướng Mini App,
// đường ngoài mở bằng Zalo (Zalo chặn trang ngoài trong app).
import React from "react";
import { useNavigate } from "zmp-ui";
import { duongMiniApp } from "./duong";

type P = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | { pathname?: string }; replace?: boolean; prefetch?: boolean; scroll?: boolean };
const Link = React.forwardRef<HTMLAnchorElement, P>(function Link({ href, replace, prefetch: _p, scroll: _s, onClick, ...p }, ref) {
  void _p; void _s;
  const dieuHuong = useNavigate();
  const h = typeof href === "string" ? href : href.pathname ?? "/";
  return (
    <a
      ref={ref}
      href={h}
      {...p}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        const d = duongMiniApp(h);
        if (d) dieuHuong(d, { replace });
      }}
    />
  );
});
export default Link;
