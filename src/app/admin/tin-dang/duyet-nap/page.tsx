"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { lamMoiWeb } from "@/lib/lamMoiWeb";
import type { ListingRow } from "@/lib/listingAdmin";
import BangKiemTinSeo from "@/components/admin/BangKiemTinSeo";
import { directions } from "@/lib/listingSpec";
import { loiTinSeo } from "@/lib/kiemTinSeo";
import { HOP_BAO } from "@/lib/chuThongBao";

// ============================================================================
// ADMIN — DUYỆT TIN NẠP (luồng chủ dự án chốt 16/10/2026)
//   Cowork nạp tin bằng file → tin ẩn + cờ details.choChuDuyet (chưa lên web)
//   → lịch "Soạn sẵn tin nạp" ghi details.deXuat: tiêu đề + mô tả chuẩn SEO (chỉ dùng
//     thông tin có trong tin, không bịa) + thứ tự ảnh, cờ ảnh kém
//   → chủ dự án xem bản gốc ↔ đề xuất, sửa tại chỗ, bấm DUYỆT → lên web.
// Duyệt ở đây KHÔNG đi qua /api/tin-dang/duyet (luồng thu tiền khách): tin nạp đã tính
// gói/hạng lúc nạp, giống như trước đây nạp xong lên web ngay — chỉ là chờ chủ dự án xem.
// ============================================================================

type DeXuat = {
  tieuDe?: string;
  moTa?: string;
  anh?: { thuTu?: string[]; co?: Record<string, string> };
  // Trường còn trống mà khách đã nói rõ trong mô tả (máy đã kiểm có trong chữ gốc): beds, baths,
  // direction, legal, furnish, addressDetail, specs.<khoá chuẩn>
  truong?: Record<string, string | number>;
};
// Nhãn tiếng Việt cho các trường hay gặp; khoá khác hiện nguyên tên khoá
const TEN_TRUONG: Record<string, string> = {
  beds: "Phòng ngủ", baths: "Phòng tắm", direction: "Hướng", legal: "Pháp lý", furnish: "Nội thất", addressDetail: "Địa chỉ",
  "specs.floors": "Số tầng", "specs.frontage": "Mặt tiền", "specs.roadWidth": "Đường vào", "specs.depth": "Chiều dài", "specs.builtYear": "Năm xây",
};
type Tin = ListingRow & { details: (ListingRow["details"] & { choChuDuyet?: boolean; deXuat?: DeXuat }) | null };

export default function DuyetNapPage() {
  const [ds, setDs] = useState<Tin[] | null>(null);
  const [loi, setLoi] = useState("");
  // Duyệt xong phải có dấu hiệu, ở lại đúng trang đang làm (chủ dự án 25/10/2026): duyệt ngay tại đây,
  // hoặc bấm lỗi → Sửa tin → lưu xong quay về đây kèm ?daLuu=<id>&kieu=len|nhap
  const [daLuu, setDaLuu] = useState<{ id: string; kieu: string; title: string } | null>(null);
  const baoDaLuu = (x: { id: string; kieu: string; title: string }) => { setDaLuu(x); window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("daLuu");
    if (!id) return;
    const kieu = p.get("kieu") ?? "len";
    createClient().from("listings").select("title").eq("id", id).single()
      .then(({ data }) => setDaLuu({ id, kieu, title: (data?.title as string | undefined) ?? "tin vừa lưu" }));
  }, []);

  useEffect(() => {
    let huy = false;
    createClient()
      .from("listings")
      .select("*")
      .eq("details->>choChuDuyet", "true")
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (huy) return;
        if (error) setLoi(error.message);
        setDs((data as Tin[]) ?? []);
      });
    return () => { huy = true; };
  }, []);

  return (
    <div className="max-w-5xl">
      <Link href="/admin/tin-dang" className="text-sm text-cvr-muted hover:text-cvr-ink">← Tin đăng</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-cvr-ink">Tin chờ duyệt</h1>
      <p className="mt-1 text-sm text-cvr-muted">
        {ds === null ? "Đang tải…" : `${ds.length} tin chờ duyệt — chưa hiện trên web cho tới khi bấm Duyệt.`}
      </p>
      {loi && <p className="mt-3 text-sm text-red-600">{loi}</p>}
      {daLuu && (daLuu.kieu === "len" ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <strong>Đã lên web:</strong> {daLuu.title} —{" "}
          <a href={`/bat-dong-san/${daLuu.id}`} target="_blank" rel="noopener" className="font-semibold underline">Xem tin</a>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-cvr-line bg-cvr-surface px-4 py-3 text-sm text-cvr-body">
          <strong>Đã lưu nháp, chưa lên web:</strong> {daLuu.title}
        </div>
      ))}
      <div className="mt-5 space-y-6">
        {ds?.map((t) => (
          <TheDuyet key={t.id} tin={t} xong={(title) => { setDs((cu) => cu?.filter((x) => x.id !== t.id) ?? null); baoDaLuu({ id: t.id, kieu: "len", title }); }} />
        ))}
      </div>
    </div>
  );
}

function TheDuyet({ tin, xong }: { tin: Tin; xong: (title: string) => void }) {
  const dx = tin.details?.deXuat ?? {};
  const [tieuDe, setTieuDe] = useState(dx.tieuDe || tin.title);
  const [moTa, setMoTa] = useState(dx.moTa || tin.description || "");
  const thuTuGoc = dx.anh?.thuTu?.length ? dx.anh.thuTu.filter((u) => tin.images.includes(u)) : tin.images;
  const [anh, setAnh] = useState<string[]>([...thuTuGoc, ...tin.images.filter((u) => !thuTuGoc.includes(u))]);
  const [bo, setBo] = useState<Set<string>>(new Set(Object.keys(dx.anh?.co ?? {}).filter((u) => /mờ|nhỏ|trùng/.test(dx.anh?.co?.[u] ?? ""))));
  const truong = dx.truong ?? {};
  const [chonTruong, setChonTruong] = useState<Set<string>>(new Set(Object.keys(truong)));
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState("");
  // Ô sửa ngay cho dòng bảng kiểm báo ✗ (chủ dự án 24/10/2026: "đưa ra luật mà không biết chỗ sửa thì đưa ra làm gì")
  const [diaChi, setDiaChi] = useState(tin.details?.addressDetail ?? "");
  const [huong, setHuong] = useState(tin.details?.direction ?? "");

  const anhGiu = anh.filter((u) => !bo.has(u));
  const tinXem = { ...tin, title: tieuDe, description: moTa, images: anhGiu, details: { ...(tin.details ?? {}), addressDetail: diaChi, direction: huong } } as ListingRow;

  async function luu(duyet: boolean) {
    // CHUẨN SEO (chủ dự án 25/10/2026, tối): tin đang mở trước mặt chủ dự án — sửa hay không là quyền chủ dự án,
    // bấm DUYỆT là lên web. Lỗi còn lại ghi vào details.seoChapNhan để không báo lại.
    const loiSeo = duyet ? loiTinSeo(tinXem) : [];
    setDang(true);
    setBao("");
    // Duyệt xong: bỏ cờ chờ duyệt + bản đề xuất khỏi details
    const conLai: Record<string, unknown> = { ...(tin.details ?? {}) };
    delete conLai.choChuDuyet;
    delete conLai.deXuat;
    conLai.addressDetail = diaChi.trim();
    conLai.direction = huong;
    if (loiSeo.length) conLai.seoChapNhan = [...new Set([...((conLai.seoChapNhan as string[] | undefined) ?? []), ...loiSeo.map((x) => x.ma)])];
    // Điền các trường đã chọn (lấy từ mô tả) vào đúng ô của tin
    const cot: Record<string, unknown> = {};
    const specs: Record<string, unknown> = { ...((conLai.specs as Record<string, unknown>) ?? {}) };
    for (const k of chonTruong) {
      const v = truong[k];
      if (k === "beds" || k === "baths") cot[k] = Number(v);
      else if (k.startsWith("specs.")) specs[k.slice(6)] = String(v);
      else conLai[k] = String(v);
    }
    if (Object.keys(specs).length) conLai.specs = specs;
    const now = new Date().toISOString();
    const { data, error } = await createClient()
      .from("listings")
      .update({
        title: tieuDe.trim(),
        description: moTa.trim(),
        images: anhGiu,
        ...(duyet
          ? { status: "approved", published_at: now, bumped_at: now, details: conLai, ...cot }
          : { details: { ...(tin.details ?? {}), addressDetail: diaChi.trim(), direction: huong, deXuat: dx } }),
      })
      .eq("id", tin.id)
      .select("id");
    setDang(false);
    if (error) return setBao(HOP_BAO.chuaLuu(error.message));
    // Hết phiên đăng nhập / không phải admin → CSDL bỏ qua lệnh mà không báo lỗi (0 dòng). Phải báo, không được coi là đã duyệt (24/10/2026).
    if (!data?.length) return setBao(HOP_BAO.hetPhien);
    if (duyet) {
      await lamMoiWeb("listings");
      xong(tieuDe.trim());
    } else setBao("Đã lưu.");
  }

  const o = "w-full rounded-lg border border-cvr-line bg-white px-3 py-2 text-sm text-cvr-ink outline-none focus:border-cvr-ink";
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-cvr-muted">{[tin.type, tin.ward, tin.province].filter(Boolean).join(" · ")}</p>
        <Link href={`/admin/tin-dang/${tin.id}`} className="text-xs font-medium text-cvr-blue-ink hover:underline">Sửa đầy đủ ↗</Link>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-cvr-body">Tiêu đề {dx.tieuDe ? "(đề xuất chuẩn SEO)" : ""}</span>
        <input className={o} value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} />
        {dx.tieuDe && dx.tieuDe !== tin.title && (
          <button type="button" onClick={() => setTieuDe(tieuDe === tin.title ? dx.tieuDe! : tin.title)} className="mt-1 text-xs text-cvr-muted hover:text-cvr-ink">
            {tieuDe === tin.title ? "Dùng đề xuất" : `Dùng bản gốc: ${tin.title.slice(0, 80)}`}
          </button>
        )}
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-cvr-body">Mô tả {dx.moTa ? "(đề xuất chuẩn SEO)" : ""}</span>
        <textarea className={`${o} min-h-[180px]`} value={moTa} onChange={(e) => setMoTa(e.target.value)} />
        {dx.moTa && dx.moTa !== tin.description && (
          <button type="button" onClick={() => setMoTa(moTa === (tin.description ?? "") ? dx.moTa! : tin.description ?? "")} className="mt-1 text-xs text-cvr-muted hover:text-cvr-ink">
            {moTa === (tin.description ?? "") ? "Dùng đề xuất" : "Dùng bản gốc"}
          </button>
        )}
      </label>

      {Object.keys(truong).length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-cvr-body">Trường lấy từ mô tả — tích để điền vào tin khi duyệt</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(truong).map(([k, v]) => (
              <label key={k} className="inline-flex items-center gap-1.5 rounded-full border border-cvr-line bg-cvr-surface px-3 py-1 text-xs text-cvr-ink">
                <input type="checkbox" checked={chonTruong.has(k)} onChange={() => setChonTruong((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })} />
                {TEN_TRUONG[k] ?? k}: {String(v)}
              </label>
            ))}
          </div>
        </div>
      )}

      <p className="mb-1 mt-3 text-xs font-medium text-cvr-body">Ảnh — ảnh đầu là ảnh bìa · bấm ảnh để bỏ / giữ</p>
      <div className="flex flex-wrap gap-2">
        {anh.map((u, i) => {
          const daBo = bo.has(u);
          const co = dx.anh?.co?.[u];
          return (
            <button key={u} type="button" onClick={() => setBo((s) => { const n = new Set(s); if (n.has(u)) n.delete(u); else n.add(u); return n; })}
              className={`relative h-20 w-28 overflow-hidden rounded-lg border ${daBo ? "border-red-400 opacity-40" : "border-cvr-line"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              {co && <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 text-[10px] text-white">{co}</span>}
              {i === 0 && !daBo && <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px] font-semibold">Bìa</span>}
            </button>
          );
        })}
      </div>
      {anh.length > 1 && (
        <div className="mt-1 flex gap-2 text-xs">
          <button type="button" className="text-cvr-muted hover:text-cvr-ink" onClick={() => setAnh((a) => [...a.slice(1), a[0]])}>Đổi ảnh bìa ›</button>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-cvr-muted">Địa chỉ — số nhà + chữ &quot;đường&quot; + tên đường</span>
          <input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} placeholder="88 đường Võ Nguyên Giáp" className={`mt-1 ${o}`} />
        </label>
        <label className="block text-sm">
          <span className="text-cvr-muted">Hướng nhà — tin gốc không ghi thì để trống</span>
          <select value={huong} onChange={(e) => setHuong(e.target.value)} className={`mt-1 ${o}`}>
            <option value="">— Không ghi —</option>
            {directions.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4"><BangKiemTinSeo row={tinXem} /></div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={dang} onClick={() => luu(true)}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-body disabled:opacity-50">
          {dang ? "Đang lưu…" : "Duyệt"}
        </button>
        <button type="button" disabled={dang} onClick={() => luu(false)}
          className="rounded-lg border border-cvr-line px-4 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink disabled:opacity-50">
          Lưu, duyệt sau
        </button>
        {bao && <span className="text-sm text-cvr-muted">{bao}</span>}
      </div>
    </div>
  );
}
