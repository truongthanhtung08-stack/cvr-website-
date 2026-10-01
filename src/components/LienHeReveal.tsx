"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { tachNhieuSdt } from "@/lib/phone";
import HopXacThucSo, { veDaLuu } from "@/components/HopXacThucSo";

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
    createClient().auth.getSession().then(({ data }) => setDaDangNhap(!!data.session), () => {});
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
      const supabase = createClient();
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

const PhoneIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" />
  </svg>
);

// ── Khối liên hệ bên phải (desktop + mobile trong luồng trang) ──────────────
export function ContactActions({ listingId, phoneMask }: { listingId: string; phoneMask: string }) {
  const { phone, phones, loading, error, reveal, hoiSo, setHoiSo, nhanSo, daDangNhap } = useReveal(listingId);

  return (
    <div className="mt-4 space-y-2.5">
      {phone && phones ? (
        // Mỗi số một cặp nút Gọi + Zalo riêng. Một số thì y như cũ; hai số thì nút Zalo ghi rõ số nào.
        phones.map((p) => (
          <Fragment key={p}>
            <a href={`tel:${telOf(p)}`} className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-body">
              <PhoneIcon />
              {p}
            </a>
            <a href={`https://zalo.me/${digitsOf(p)}`} className="flex items-center justify-center gap-2 rounded-lg border border-cvr-line px-4 py-3 text-sm font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
              {phones.length > 1 ? `Nhắn Zalo ${p}` : "Nhắn Zalo"}
            </a>
          </Fragment>
        ))
      ) : (
        <>
          <button type="button" onClick={reveal} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-body disabled:opacity-60">
            <PhoneIcon />
            {loading ? "Đang mở…" : (
              <span>{phoneMask} <span className="font-medium opacity-80">· Bấm để hiện số</span></span>
            )}
          </button>
          {!daDangNhap && <p className="text-center text-[12px] text-cvr-muted">Xác thực số của bạn để xem số người đăng</p>}
          {error && <p className="text-center text-[12px] text-red-600">{error}</p>}
        </>
      )}
      {hoiSo && <HopXacThucSo listingId={listingId} onXong={nhanSo} onDong={() => setHoiSo(false)} />}
    </div>
  );
}

// ── Thanh liên hệ DÍNH đáy màn hình (mobile) ────────────────────────────────
// Trả về các NÚT bên trong (khung fixed do trang chi tiết giữ nguyên bọc ngoài).
export function ContactBarMobile({ listingId, phoneMask }: { listingId: string; phoneMask: string }) {
  const { phone, phones, loading, reveal, hoiSo, setHoiSo, nhanSo } = useReveal(listingId);
  const [chon, setChon] = useState<"goi" | "zalo" | null>(null);

  // Người đăng có 2 số → thanh đáy giữ nguyên 2 nút; bấm vào thì mở bảng chọn số nào.
  if (phone && phones && phones.length > 1) {
    const nut = "flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition active:scale-95";
    return (
      <>
        <button type="button" onClick={() => setChon("goi")} className={`${nut} bg-cvr-ink text-white`}>
          <PhoneIcon />
          Gọi ngay
        </button>
        <button type="button" onClick={() => setChon("zalo")} className={`${nut} border border-cvr-line bg-white font-semibold text-cvr-body`}>
          Nhắn Zalo
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
                  className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink py-3 text-sm font-bold text-white"
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
        <a href={`tel:${telOf(phone)}`} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cvr-ink py-3 text-sm font-bold text-white transition active:scale-95">
          <PhoneIcon />
          Gọi ngay
        </a>
        <a href={`https://zalo.me/${digitsOf(phone)}`} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-cvr-line bg-white py-3 text-sm font-semibold text-cvr-body transition active:scale-95">
          Nhắn Zalo
        </a>
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={reveal} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cvr-ink py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60">
        <PhoneIcon />
        {loading ? "Đang mở…" : `${phoneMask} · Hiện số để gọi`}
      </button>
      {hoiSo && <HopXacThucSo listingId={listingId} onXong={nhanSo} onDong={() => setHoiSo(false)} />}
    </>
  );
}
