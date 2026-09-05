"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isVideoUrl } from "@/lib/media";

// ════════════════════════════════════════════════════════════════════════════
// DỌN KHO ẢNH — xoá những tệp KHÔNG CÒN TIN NÀO DÙNG.
//
// Vì sao cần: mỗi lần đăng lại một đợt tin (xoá tin cũ rồi nhập lại file) là ảnh
// của đợt cũ nằm lại trong kho mà không tin nào trỏ tới. Kho free chỉ có 1GB,
// vài đợt là tràn — tràn thì tin mới tải ảnh lên hỏng giữa chừng.
//
// An toàn: chỉ xoá tệp KHÔNG xuất hiện trong bất kỳ tin / dự án / bài viết /
// nội dung web nào. Quét đủ 4 nguồn rồi mới đối chiếu; thiếu một nguồn là xoá
// nhầm ảnh đang dùng nên KHÔNG được bỏ bớt.
// ════════════════════════════════════════════════════════════════════════════

type Tep = { ten: string; co: number; ngay: string };

const BUCKET = "listings";
const MB = (b: number) => (b / 1048576).toFixed(1) + " MB";

export default function KhoAnhPage() {
  const [dangQuet, setDangQuet] = useState(true);
  const [loi, setLoi] = useState("");
  const [tatCa, setTatCa] = useState<Tep[]>([]);
  const [dungRoi, setDungRoi] = useState<Set<string>>(new Set());
  const [dangXoa, setDangXoa] = useState(false);
  const [ketQua, setKetQua] = useState("");

  // lanDau = true: gọi ngay khi mở trang, state đã là "đang quét" nên không đặt lại
  // (đặt state ngay trong thân effect làm React vẽ lại dây chuyền).
  async function quet(lanDau = false) {
    if (!lanDau) {
      setDangQuet(true);
      setLoi("");
    }
    const supabase = createClient();
    try {
      // 1) Toàn bộ tệp trong kho (phân trang 1000 tệp/lần)
      const tep: Tep[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 1000, offset });
        if (error) throw error;
        const lo = (data ?? []).filter((x) => x.metadata);
        tep.push(
          ...lo.map((x) => ({
            ten: x.name,
            co: (x.metadata as { size?: number } | null)?.size ?? 0,
            ngay: (x.created_at ?? "").slice(0, 10),
          })),
        );
        if (lo.length < 1000) break;
      }

      // 2) Mọi nơi có thể đang dùng ảnh
      const dung = new Set<string>();
      const nhat = (v: unknown) => {
        // Gom mọi chuỗi trong dữ liệu rồi lấy TÊN TỆP cuối đường dẫn
        const s = JSON.stringify(v ?? "");
        for (const m of s.matchAll(/[\w.%-]+\.(?:jpe?g|png|webp|gif|avif|mp4|webm|mov|m4v)/gi))
          dung.add(decodeURIComponent(m[0]));
      };
      const [tin, duAn, baiViet, noiDung] = await Promise.all([
        supabase.from("listings").select("images,details"),
        supabase.from("projects").select("*"),
        supabase.from("articles").select("*"),
        supabase.from("site_content").select("*"),
      ]);
      for (const bang of [tin, duAn, baiViet, noiDung]) nhat(bang.data);

      setTatCa(tep);
      setDungRoi(dung);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    }
    setDangQuet(false);
  }

  useEffect(() => {
    // Quét kho ngay khi mở trang. Mọi setState bên trong đều nằm SAU await nên
    // không có chuyện vẽ lại dây chuyền — bộ kiểm tra không nhìn qua await được.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void quet(true);
  }, []);

  const rac = tatCa.filter((t) => !dungRoi.has(t.ten));
  const racVideo = rac.filter((t) => isVideoUrl(t.ten));
  const tongCo = tatCa.reduce((s, t) => s + t.co, 0);
  const racCo = rac.reduce((s, t) => s + t.co, 0);

  async function xoaRac() {
    if (!rac.length) return;
    if (!window.confirm(`XOÁ HẲN ${rac.length} tệp không tin nào dùng (${MB(racCo)})? Không lấy lại được.`)) return;
    setDangXoa(true);
    setKetQua("");
    const supabase = createClient();
    let xong = 0;
    for (let i = 0; i < rac.length; i += 100) {
      const lo = rac.slice(i, i + 100).map((t) => t.ten);
      const { error } = await supabase.storage.from(BUCKET).remove(lo);
      if (error) {
        setKetQua(`Đã xoá ${xong} tệp thì gặp lỗi: ${error.message}`);
        setDangXoa(false);
        return;
      }
      xong += lo.length;
    }
    setKetQua(`Đã xoá ${xong} tệp, giải phóng ${MB(racCo)}.`);
    setDangXoa(false);
    void quet();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Dọn kho ảnh</h1>
      <p className="mt-2 text-sm leading-relaxed text-cvr-body">
        Xoá những tệp <strong>không còn tin, dự án, bài viết hay nội dung web nào dùng</strong> — thường là
        ảnh của các đợt tin đã đăng lại. Kho gói miễn phí chỉ có 1 GB.
      </p>

      {dangQuet ? (
        <p className="mt-6 text-sm text-cvr-muted">Đang quét kho…</p>
      ) : loi ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Lỗi: {loi}</p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Ô nhan="Tổng trong kho" chinh={`${tatCa.length} tệp`} phu={MB(tongCo)} />
            <Ô nhan="Đang được dùng" chinh={`${tatCa.length - rac.length} tệp`} phu={MB(tongCo - racCo)} />
            <Ô nhan="Không ai dùng" chinh={`${rac.length} tệp`} phu={MB(racCo)} do />
          </div>

          {racVideo.length > 0 && (
            <p className="mt-3 text-sm text-cvr-body">
              Trong đó có <strong>{racVideo.length} video</strong> nặng{" "}
              <strong>{MB(racVideo.reduce((s, t) => s + t.co, 0))}</strong> — video là thứ ăn dung lượng nhất.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={xoaRac}
              disabled={dangXoa || rac.length === 0}
              className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
            >
              {dangXoa ? "Đang xoá…" : `Xoá ${rac.length} tệp không dùng`}
            </button>
            <button type="button" onClick={() => void quet()} className="text-sm font-medium text-cvr-body hover:text-cvr-ink">
              Quét lại
            </button>
          </div>

          {ketQua && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{ketQua}</p>}

          {rac.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-cvr-line bg-white">
              <p className="border-b border-cvr-line bg-cvr-surface px-4 py-2.5 text-xs uppercase tracking-wider text-cvr-faint">
                20 tệp nặng nhất sẽ bị xoá
              </p>
              <ul className="divide-y divide-cvr-line/70 text-sm">
                {[...rac].sort((a, b) => b.co - a.co).slice(0, 20).map((t) => (
                  <li key={t.ten} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span className="truncate text-cvr-body">{t.ten}</span>
                    <span className="shrink-0 text-xs text-cvr-muted">{MB(t.co)} · {t.ngay}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Ô({ nhan, chinh, phu, do: doMau }: { nhan: string; chinh: string; phu: string; do?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${doMau ? "border-red-200 bg-red-50" : "border-cvr-line bg-white"}`}>
      <p className="text-xs uppercase tracking-wider text-cvr-faint">{nhan}</p>
      <p className={`mt-1 text-lg font-semibold ${doMau ? "text-red-800" : "text-cvr-ink"}`}>{chinh}</p>
      <p className="text-xs text-cvr-muted">{phu}</p>
    </div>
  );
}
