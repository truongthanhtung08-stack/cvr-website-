// NỐI WEB → MINI APP: next/dynamic → React.lazy (giữ đúng khung "loading" như web).
import React, { Suspense } from "react";
type Mod<P> = { default: React.ComponentType<P> } | React.ComponentType<P>;
export default function dynamic<P extends object>(nap: () => Promise<Mod<P>>, opts?: { loading?: () => React.ReactNode; ssr?: boolean }) {
  const Luoi = React.lazy(async () => { const m = await nap(); return "default" in (m as object) ? (m as { default: React.ComponentType<P> }) : { default: m as React.ComponentType<P> }; });
  return function Dong(p: P) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Suspense fallback={opts?.loading ? opts.loading() : null}><Luoi {...(p as any)} /></Suspense>;
  };
}
