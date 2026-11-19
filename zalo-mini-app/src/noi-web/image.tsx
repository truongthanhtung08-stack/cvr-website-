// NỐI WEB → MINI APP: next/image → <img>.
import React from "react";
type P = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string | { src: string }; fill?: boolean; priority?: boolean; quality?: number; unoptimized?: boolean; placeholder?: string; blurDataURL?: string; sizes?: string };
export default function Image({ src, fill, priority, quality: _q, unoptimized: _u, placeholder: _pl, blurDataURL: _b, style, ...p }: P) {
  void _q; void _u; void _pl; void _b;
  return <img {...p} src={typeof src === "string" ? src : src.src} loading={priority ? "eager" : "lazy"} style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style} />;
}
