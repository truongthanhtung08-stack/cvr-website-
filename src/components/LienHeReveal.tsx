"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { napSupabase, coPhienDangNhap } from "@/lib/supabase/nap";
import { tachNhieuSdt } from "@/lib/phone";
import HopXacThucSo, { veDaLuu } from "@/components/HopXacThucSo";
import { useKhoaCuon } from "@/lib/khoaCuon";

// ============================================================================
// CỔNG SỐ ĐIỆN THOẠI — full SĐT người đăng chỉ hiện sau khi khách tự định danh.
//   · Chưa đăng nhập  → mở hộp XÁC THỰC SỐ ngay tại chỗ: nhập số của mình, nhận
//                        mã, nhập mã là xem được. KHÔNG bắt đặt mật khẩu hay điền
//                        hồ sơ — rào cản thấp hơn hẳn đăng ký nên nhiều người qua
//                        được hơn, mà sàn vẫn có số THẬT ĐÃ XÁC THỰC và người bán
//                        vẫn nhận được lead gọi lại được ngay.
//   · Đã đăng nhập    → gọi RPC reveal_contact: trả full số + GHI LEAD (người bán
//                        biết ai quan tâm). Số thật KHÔNG nằm sẵn trong HTML → không
//                        thể xem lén qua "view source", nên lead luôn được ghi nhận.
// Khối bên phải (ContactActions) và thanh dính mobile (ContactBarMobile) dùng chung
// một hook: hiện số ở chỗ này thì chỗ kia cũng hiện, không phải bấm lại.
// ============================================================================

const EVENT = "cl-reveal-phone";
const telOf = (p: string) => p.replace(/\s/g, "");
const digitsOf = (p: string) => p.replace(/\D/g, "");

function useReveal(listingId: string) {
  // Người đăng có thể ghi 2 số → giữ ĐỦ danh sách, mỗi số một nút gọi riêng.
  const [phones, setPhones] = useState<string[] | null>(null);
  const phone = phones?.[0] ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoiSo, setHoiSo] = useState(false);
  // Đã đăng nhập → bấm là hiện số, không cần dòng nhắc "xác thực số".
  const [daDangNhap, setDaDangNhap] = useState(false);
  useEffect(() => {
    if (!coPhienDangNhap()) return; // chưa đăng nhập → khỏi tải thư viện
    napSupabase().then((sb) => sb.auth.getSession()).then(({ data }) => setDaDangNhap(!!data.session), () => {});
  }, []);

  // Đồng bộ giữa các nút cùng tin trên một trang (bên phải ↔ thanh mobile).
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as { id: string; phones: string[] };
      if (d?.id === listingId) setPhones(d.phones);
    };
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, [listingId]);

  const reveal = useCallback(async () => {
    if (phone || loading) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = await napSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      // ĐÃ ĐĂNG NHẬP (Zalo/Google/Email/Số) → hiện số NGAY, không bắt nhập mã (chủ dự án chốt
      // 01/10/2026). Thành viên chưa có số trong hồ sơ thì khách quan tâm ghi theo tên tài khoản.
      // Chỉ khách CHƯA ĐĂNG NHẬP mới đi đường xác thực số.
      if (!user) {
        // ĐÃ XÁC THỰC SỐ Ở TIN TRƯỚC → dùng lại vé, xem số ngay, khỏi nhập mã
        // lại. Khách đang so mấy tin cùng lúc mà tin nào cũng bắt chờ mã thì
        // không ai chịu nổi.
        const ve = veDaLuu();
        if (ve) {
          const r = await fetch("/api/xem-so", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId, ve }),
          });
          const j = await r.json();
          if (j.ok && j.sdt) {
            const ds = tachNhieuSdt(j.sdt as string);
            if (ds.length) {
              setPhones(ds);
              window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: listingId, phones: ds } }));
              return;
            }
          }
          // Vé hết hạn hoặc hỏng → hỏi lại từ đầu như khách mới.
        }
        // Chưa đăng nhập → XÁC THỰC SỐ NGAY TẠI CHỖ, không đá sang trang đăng
        // nhập nữa. Bắt đặt mật khẩu và điền hồ sơ là phần lớn khách bỏ cuộc
        // ngay đó; hỏi số rồi gửi mã thì rào cản thấp hơn hẳn, mà sàn vẫn thu
        // được số thật đã xác thực của người quan tâm và người bán vẫn có lead.
        setHoiSo(true);
        return;
      }
      const { data, error: rpcErr } = await supabase.rpc("reveal_contact", {
        p_listing_id: listingId,
      });
      if (rpcErr) throw rpcErr;
      // Hiện ĐÚNG chuẩn 0 + 10 số — khớp với file gốc và với ô nhập trong admin,
      // kể cả tin cũ đã lưu lẫn dấu chấm / khoảng trắng / +84.
      const ds = tachNhieuSdt((data as string | null) ?? "");
      if (!ds.length) {
        setError("Tin này chưa có số điện thoại.");
        return;
      }
      setPhones(ds);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: listingId, phones: ds } }));
    } catch {
      setError("Không mở được số, thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [listingId, phone, loading]);

  // Xác thực xong → hiện số người bán ở MỌI nút cùng tin trên trang.
  const nhanSo = useCallback(
    (so: string) => {
      const ds = tachNhieuSdt(so);
      if (!ds.length) return;
      setPhones(ds);
      setHoiSo(false);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: listingId, phones: ds } }));
    },
    [listingId],
  );

  return { phone, phones, loading, error, reveal, hoiSo, setHoiSo, nhanSo, daDangNhap };
}

// Biểu tượng CON MẮT sau số che (chủ dự án 22/10/2026): bỏ chữ "Hiện số" cho gọn nhưng khách vẫn phải BIẾT bấm vào
// để xem đủ số (đăng nhập / xác thực số) — con mắt là dấu hiệu "bấm để xem" quen thuộc. Có số rồi thì không còn mắt.
const MatIcon = () => (
  <svg className="h-4 w-4 shrink-0 opacity-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" />
  </svg>
);

// ── Khối liên hệ bên phải (desktop + mobile trong luồng trang) ──────────────
// Bố cục chủ dự án chốt 21/10/2026: ảnh đại diện · tên · gạch ngăn · "<số che>" · "Zalo" (viền) — nút Zalo mở thẳng trang Zalo cá nhân, khách tự nhắn hoặc gọi qua Zalo nên chỉ ghi "Zalo" (22/10/2026).
// NÚT SỐ CHỈ GHI SỐ CHE 3 SỐ CUỐI "0905 318 ***" ở MỌI chỗ (chủ dự án 22/10/2026: bỏ chữ "Hiện số" cho gọn — thấy *** là biết bấm).
// Nút xem số mang data-hien-so để chỗ khác (số trong mô tả tin) bấm hộ đúng nút.
// MÀU NÚT ĐỒNG BỘ TOÀN WEB (22/10/2026): nút số điện thoại luôn nền XANH (cvr-blue) như thẻ tin, nút Zalo luôn nền trắng viền.
// Bấm Zalo khi chưa xem số → đi đúng bước xác thực số như Hiện số, có số là mở Zalo luôn (giống thanh đáy điện thoại).
// Logo Zalo là ẢNH (public/logo/zalo.svg), không phải chữ: trình duyệt trong Zalo/Facebook phóng chữ theo cỡ chữ điện thoại
// làm chữ "Zalo" tràn khỏi nút — ảnh thì giữ đúng cỡ (21/10/2026).
// eslint-disable-next-line @next/next/no-img-element
const ZaloMark = ({ className = "h-5 w-5" }: { className?: string }) => <img src="/logo/zalo.svg" alt="" aria-hidden className={`${className} shrink-0`} />;

export function ContactActions({ listingId, phoneMask }: { listingId: string; phoneMask: string }) {
  const { phone, phones, loading, error, reveal, hoiSo, setHoiSo, nhanSo, daDangNhap } = useReveal(listingId);
  const [muonZalo, setMuonZalo] = useState(false);
  useEffect(() => {
    if (!muonZalo || !phones?.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuonZalo(false);
    // Hai số → để khách tự chọn nút Zalo của số nào ngay bên dưới.
    if (phones.length === 1) window.location.href = `https://zalo.me/${digitsOf(phones[0])}`;
  }, [muonZalo, phones]);
  const nutZalo = "flex w-full items-center justify-center gap-2 rounded-lg border border-cvr-line bg-white px-4 py-3 text-[14px] font-semibold text-cvr-ink transition hover:border-cvr-ink disabled:opacity-60";
  const nutSo = "flex w-full items-center justify-center gap-2 rounded-lg bg-cvr-blue px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-60";

  return (
    <div className="mt-4 space-y-2.5 border-t border-cvr-line pt-4">
      {phone && phones ? (
        // Mỗi số một cặp nút Gọi + Zalo riêng. Hai số thì nút Zalo ghi rõ số nào.
        phones.map((p) => (
          <Fragment key={p}>
            <a href={`tel:${telOf(p)}`} className={nutSo}>
              <PhoneIcon />
              {p}
            </a>
            <a href={`https://zalo.me/${digitsOf(p)}`} target="_blank" rel="noopener" className={nutZalo}>
              <ZaloMark />
              {phones.length > 1 ? `Zalo ${p}` : "Zalo"}
            </a>
          </Fragment>
        ))
      ) : (
        <>
          <button type="button" data-hien-so onClick={reveal} disabled={loading} className={nutSo}>
            <PhoneIcon />
            {loading ? "Đang mở…" : (
              <>
                <span>{phoneMask}</span>
                <MatIcon />
              </>
            )}
          </button>
          <button type="button" onClick={() => { setMuonZalo(true); reveal(); }} disabled={loading} className={nutZalo}>
            <ZaloMark />
            Zalo
          </button>
          {error && <p className="text-center text-[12px] text-red-600">{error}</p>}
        </>
      )}
      {hoiSo && <HopXacThucSo listingId={listingId} onXong={nhanSo} onDong={() => setHoiSo(false)} />}
    </div>
  );
}

// ── Thanh liên hệ DÍNH đáy màn hình (mobile) ────────────────────────────────
// Trả về các NÚT bên trong (khung fixed do trang chi tiết giữ nguyên bọc ngoài).
// Bố cục như Batdongsan (chủ dự án 09/10/2026): ẢNH ĐẠI DIỆN người đăng · nút ZALO riêng · HIỆN SỐ / GỌI.
// Gọi = gọi điện thoại thường; Zalo = mở Zalo để nhắn tin hoặc gọi qua Zalo. Bấm Zalo khi chưa xem số →
// đi đúng bước xác thực số như Hiện số, xong là mở Zalo luôn.
function AnhNguoiDang({ avatar, ten }: { avatar?: string | null; ten?: string | null }) {
  // Không có ảnh → 2 chữ viết tắt (chữ đầu + chữ cuối của tên), chủ dự án 09/10/2026
  const w = (ten || "Coastal Land").trim().split(/\s+/).filter(Boolean);
  const chu = ((w[0]?.[0] ?? "C") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
  return avatar
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={avatar} alt={ten ?? ""} className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-cvr-line" />
    : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-sm font-semibold text-cvr-body ring-1 ring-cvr-line">{chu}</span>;
}

export function ContactBarMobile({ listingId, phoneMask, avatar, ten }: { listingId: string; phoneMask: string; avatar?: string | null; ten?: string | null }) {
  const { phone, phones, loading, reveal, hoiSo, setHoiSo, nhanSo } = useReveal(listingId);
  const [chon, setChon] = useState<"goi" | "zalo" | null>(null);
  useKhoaCuon(!!chon);
  // Bấm Nhắn tin khi chưa có số → nhớ ý định, có số là mở Zalo ngay (1 số) hoặc bảng chọn số (2 số).
  const [muonZalo, setMuonZalo] = useState(false);
  useEffect(() => {
    if (!muonZalo || !phones?.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuonZalo(false);
    if (phones.length > 1) setChon("zalo");
    else window.location.href = `https://zalo.me/${digitsOf(phones[0])}`;
  }, [muonZalo, phones]);
  const nutNhan = "flex min-w-0 flex-[2] items-center justify-center gap-1.5 rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-sm font-semibold text-cvr-body transition active:scale-95";
  // CHỮ PHÓNG TO (Zalo / Facebook tự phóng chữ theo cỡ chữ điện thoại — chủ dự án 21/10/2026): nút số mà xuống 2 dòng
  // thì thanh đáy cao gấp đôi, che nửa màn hình. Số che *** + mắt KHÔNG xuống dòng (22/10) nên đo cả chữ TRÀN NGANG khỏi nút
  // (đo kiểu chữ 160% 22/10: tràn 190>168) → bậc 1 bỏ biểu tượng điện thoại trong nút, bậc 2 ẩn thêm ảnh đại diện.
  // Chỉ thu gọn một chiều, không nở lại → không nhấp nháy. Cỡ chữ bình thường không đổi gì.
  const chuSo = useRef<HTMLSpanElement>(null);
  const [gon, setGon] = useState(0);
  useEffect(() => {
    const el = chuSo.current;
    if (!el) return;
    const kiem = () => {
      const dong = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.25;
      const nut = el.parentElement;
      const tran = !!nut && nut.scrollWidth > nut.clientWidth + 1;
      if (tran || el.getBoundingClientRect().height > dong * 1.4) setGon((g) => Math.min(2, g + 1));
    };
    kiem();
    const ro = new ResizeObserver(kiem);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gon]);

  // Người đăng có 2 số → thanh đáy giữ nguyên 2 nút; bấm vào thì mở bảng chọn số nào.
  if (phone && phones && phones.length > 1) {
    const nut = "flex min-w-0 flex-[3] items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition active:scale-95";
    return (
      <>
        <AnhNguoiDang avatar={avatar} ten={ten} />
        <button type="button" onClick={() => setChon("zalo")} className={nutNhan}>
          <ZaloMark className="h-7 w-7" />
        </button>
        <button type="button" onClick={() => setChon("goi")} className={`${nut} bg-cvr-blue text-white`}>
          <PhoneIcon />
          Gọi ngay
        </button>
        {chon && (
          <div className="fixed inset-0 z-[80] flex items-end bg-black/40" onClick={() => setChon(null)}>
            <div className="w-full space-y-2.5 rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
              <p className="text-center text-sm font-semibold text-cvr-ink">{chon === "goi" ? "Gọi số nào?" : "Nhắn Zalo số nào?"}</p>
              {phones.map((p) => (
                <a
                  key={p}
                  href={chon === "goi" ? `tel:${telOf(p)}` : `https://zalo.me/${digitsOf(p)}`}
                  onClick={() => setChon(null)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-cvr-blue py-2.5 text-sm font-bold text-white"
                >
                  {chon === "goi" && <PhoneIcon />}
                  {p}
                </a>
              ))}
              <button type="button" onClick={() => setChon(null)} className="w-full py-2 text-sm text-cvr-muted">Đóng</button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (phone) {
    return (
      <>
        <AnhNguoiDang avatar={avatar} ten={ten} />
        <a href={`https://zalo.me/${digitsOf(phone)}`} className={nutNhan}>
          <ZaloMark className="h-7 w-7" />
        </a>
        <a href={`tel:${telOf(phone)}`} className="flex min-w-0 flex-[3] items-center justify-center gap-2 rounded-lg bg-cvr-blue py-2.5 text-sm font-bold text-white transition active:scale-95">
          <PhoneIcon />
          Gọi ngay
        </a>
      </>
    );
  }

  return (
    <>
      {gon < 2 && <AnhNguoiDang avatar={avatar} ten={ten} />}
      <button type="button" onClick={() => { setMuonZalo(true); reveal(); }} disabled={loading} className={`${nutNhan} disabled:opacity-60`}>
        <ZaloMark className="h-7 w-7" />
      </button>
      <button type="button" data-hien-so onClick={reveal} disabled={loading} className="flex min-w-0 flex-[3] items-center justify-center gap-2 rounded-lg bg-cvr-blue py-2.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60">
        {gon < 1 && <PhoneIcon />}
        <span ref={chuSo} className="min-w-0 text-center leading-tight">{loading ? "Đang mở…" : <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{phoneMask}<MatIcon /></span>}</span>
      </button>
      {hoiSo && <HopXacThucSo listingId={listingId} onXong={nhanSo} onDong={() => setHoiSo(false)} />}
    </>
  );
}

// ── NÚT LIÊN HỆ TRÊN THẺ TIN (thanh tương tác, điện thoại) — chuẩn thẻ tin theo cấp 09/10/2026 ──
// "Hiện số" (chỉ Diamond · Gold) và "Nhắn tin" (mọi cấp) đi ĐÚNG luồng xem số của trang chi tiết:
// đã đăng nhập / đã xác thực số → có số ngay; chưa → hộp xác thực số. Có số rồi: Hiện số thành
// "Gọi 09…", Nhắn tin mở Zalo người đăng.
// nhan: chữ trên nút trước khi bấm (thẻ tin: "Hiện số 090 ***" như Batdongsan) · zaloTruoc: nút Zalo đứng trước nút số
// chuZalo: chữ cạnh logo trên nút Zalo — thẻ tin điện thoại dùng 2 nút BẰNG NHAU "Nhắn Zalo" · "Hiện số …" (22/10/2026)
export function NutLienHeThe({ listingId, hienSo, nhanTin = true, soCls, oCls, nhan, zaloTruoc, chuZalo }: { listingId: string; hienSo: boolean; nhanTin?: boolean; soCls: string; oCls: string; nhan?: string; zaloTruoc?: boolean; chuZalo?: string }) {
  const { phone, phones, loading, reveal, hoiSo, setHoiSo, nhanSo } = useReveal(listingId);
  const [muonZalo, setMuonZalo] = useState(false);
  useEffect(() => {
    if (!muonZalo || !phones?.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuonZalo(false);
    window.location.href = `https://zalo.me/${digitsOf(phones[0])}`;
  }, [muonZalo, phones]);
  const chan = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
  // TỰ THU GỌN KHI CHỮ PHÓNG TO (trình duyệt trong Zalo/Facebook — chủ dự án 22/10/2026): nút số mà chữ tràn khỏi nút thì
  // bậc 1 bỏ biểu tượng điện thoại · bậc 2 nút Zalo thu về chỉ còn logo, nhường chỗ cho số. Chữ thường: không đổi gì.
  const nutSo = useRef<HTMLElement | null>(null);
  const [gon, setGon] = useState(0);
  useEffect(() => {
    const el = nutSo.current;
    if (!el) return;
    const kiem = () => { if (el.scrollWidth > el.clientWidth + 1) setGon((g) => Math.min(2, g + 1)); };
    kiem();
    const ro = new ResizeObserver(kiem);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gon, phone]);
  const zaloGon = gon >= 2 ? { flex: "0 0 2.75rem" } : undefined;
  const chuZ = gon >= 2 ? undefined : chuZalo;
  const nutZalo = phone ? (
    <a href={`https://zalo.me/${digitsOf(phone)}`} onClick={(e) => e.stopPropagation()} aria-label="Zalo" className={oCls} style={zaloGon}>
      <ZaloMark className="h-5 w-5" />{chuZ && <span className="truncate text-[13px] font-semibold text-cvr-ink">{chuZ}</span>}
    </a>
  ) : (
    <button type="button" disabled={loading} aria-label="Zalo" onClick={(e) => { chan(e); setMuonZalo(true); reveal(); }} className={`${oCls} disabled:opacity-60`} style={zaloGon}>
      <ZaloMark className="h-5 w-5" />{chuZ && <span className="truncate text-[13px] font-semibold text-cvr-ink">{chuZ}</span>}
    </button>
  );
  return (
    <>
      {nhanTin && zaloTruoc && nutZalo}
      {hienSo && (phone ? (
        <a ref={(e) => { nutSo.current = e; }} href={`tel:${telOf(phone)}`} onClick={(e) => e.stopPropagation()} className={soCls}>
          {gon < 1 && <PhoneIcon />}
          <span className="truncate">{phone}</span>
        </a>
      ) : (
        <button ref={(e) => { nutSo.current = e; }} type="button" disabled={loading} onClick={(e) => { chan(e); reveal(); }} className={`${soCls} disabled:opacity-60`}>
          {gon < 1 && <PhoneIcon />}
          {loading ? "Đang mở…" : nhan ?? "Hiện số"}
          {!loading && nhan && <MatIcon />}
        </button>
      ))}
      {!nhanTin || zaloTruoc ? null : phone ? (
        <a href={`https://zalo.me/${digitsOf(phone)}`} onClick={(e) => e.stopPropagation()} aria-label="Zalo" className={oCls} style={zaloGon}>
          <ZaloMark className="h-5 w-5" />{chuZ && <span className="truncate text-[13px] font-semibold text-cvr-ink">{chuZ}</span>}
        </a>
      ) : (
        <button type="button" disabled={loading} aria-label="Zalo" onClick={(e) => { chan(e); setMuonZalo(true); reveal(); }} className={`${oCls} disabled:opacity-60`} style={zaloGon}>
          <ZaloMark className="h-5 w-5" />{chuZ && <span className="truncate text-[13px] font-semibold text-cvr-ink">{chuZ}</span>}
        </button>
      )}
      {hoiSo && <HopXacThucSo listingId={listingId} onXong={nhanSo} onDong={() => setHoiSo(false)} />}
    </>
  );
}
