"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import { vnd } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import { emailThat } from "@/lib/useAuth";
import { createClient } from "@/lib/supabase/client";
import MaQrThanhToan, { type DonQr, veHuy } from "@/components/MaQrThanhToan";

// ============================================================================
// NẠP TIỀN VÀO TÀI KHOẢN — cổng thanh toán PayOS.
// Khách chọn mệnh giá (hoặc nhập số tiền) → hệ thống tạo đơn → chuyển sang
// trang thanh toán của PayOS (quét QR / thẻ / chuyển khoản).
// Chưa cắm khoá PayOS: hiện thông báo rõ ràng, không làm hỏng trang.
// ============================================================================
export default function TopUpPage() {
  // useSearchParams cần Suspense khi Next dựng sẵn trang.
  return (
    <Suspense fallback={<p className="text-sm text-cvr-muted">Đang tải…</p>}>
      <TopUpForm />
    </Suspense>
  );
}

function TopUpForm() {
  const { profile } = useProfile();
  const [viGiu, setViGiu] = useState<{ tam_giu: number; kha_dung: number } | null>(null);
  useEffect(() => {
    createClient()
      .rpc("so_du_kha_dung")
      .then(({ data }) => {
        const v = (data as { tam_giu: number; kha_dung: number }[] | null)?.[0];
        if (v) setViGiu({ tam_giu: Number(v.tam_giu), kha_dung: Number(v.kha_dung) });
      });
  }, []);
  const params = useSearchParams();
  const ketQua = params.get("ket-qua");
  // NẠP TỪ GÓI TIN (?ve= form đăng tin / Tin của tôi — chủ dự án 26/10/2026, trình tự chuẩn):
  // huỷ trên PayOS → về lại đúng chỗ đến (tin còn nguyên nội dung + gói); nộp xong → Tin của tôi (tin tự gửi duyệt).
  const veRaw = params.get("ve");
  const ve = veRaw && /^\/(dang-tin|tai-khoan)(\/|\?|$)/.test(veRaw) ? veRaw : null;
  const router = useRouter();
  useEffect(() => {
    if (!ve) return;
    if (ketQua === "huy") router.replace(ve);
    else if (ketQua === "thanh-cong") router.replace("/tai-khoan/tin-dang?nap=thanh-cong");
  }, [ketQua, ve, router]);

  // Mệnh giá nạp & tỷ lệ tích điểm lấy từ bản admin đã lưu
  const { billing } = useBilling();
  const amounts = billing.topupAmounts;
  const [amount, setAmount] = useState<number>(0);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [don, setDon] = useState<DonQr | null>(null); // đơn vừa tạo → hiện mã QR tại trang
  // GIỮ ĐƠN khi khách sang app ngân hàng (27/10/2026): điện thoại có thể tải lại trang lúc khách quay về → mở lại đúng
  // đơn đó (trang hỏi trạng thái, đã nộp thì tự về đúng chỗ). Huỷ hoặc nộp xong thì xoá.
  const KHOA_DON = "donNap";
  // Đến từ tin đang đăng: ghi cờ để quay về (Back, ‹, Huỷ) thì form đứng ngay khối Gói tin (PostListingForm đọc cờ)
  useEffect(() => {
    // "moi" = tin mới chưa lưu được nháp (chưa có Tỉnh/Thành + Tiêu đề) — bản soạn nằm trong máy
    const ma = ve?.match(/^\/dang-tin\?id=([\w-]+)/)?.[1] ?? (ve === "/dang-tin" ? "moi" : undefined);
    try { if (ma) sessionStorage.setItem("veGoiTin", ma); } catch {}
  }, [ve]);
  const boDon = () => { try { sessionStorage.removeItem(KHOA_DON); } catch {} };
  useEffect(() => {
    try {
      const luu = JSON.parse(sessionStorage.getItem(KHOA_DON) || "null") as { don: DonQr; ve: string | null; luc: number } | null;
      // Chỉ đơn trong 15 phút (bằng thời gian trang hỏi trạng thái)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- khôi phục một lần lúc mở trang
      // Chỉ khi chính mốc mã QR được tải lại (history.state còn cvrQr) — vào trang nạp lần mới thì không mở lại đơn cũ
      if (luu?.don && luu.ve === ve && Date.now() - luu.luc < 15 * 60_000 && window.history.state?.cvrQr) setDon(luu.don);
    } catch {}
  }, [ve]);
  // NÚT QUAY LẠI khi đang mở mã QR = Huỷ (chủ dự án 26/10/2026): mở mã thì thêm một mốc lịch sử; quay lại (nút điện thoại,
  // nút ‹ trên trang, nút Huỷ) gỡ mốc đó → đóng mã, về đúng chỗ: từ tin đang đăng → về tin; nạp thường → ô chọn số tiền.
  useEffect(() => {
    if (!don) return;
    // Giữ nguyên state của Next (bản sao mốc hiện tại) — state lạ thì Next tải lại cả trang khi quay lại
    // cvrQr đánh dấu mốc mã QR (trang tải lại thì mở lại đúng đơn)
    // Trang tải lại khi khách từ app ngân hàng quay về: mốc mã QR đã có sẵn → không chồng thêm
    if (!window.history.state?.cvrQr) window.history.pushState({ ...window.history.state, cvrQr: 1 }, "");
    // Back / Huỷ ở mã QR = về tin đang làm, khối Chọn gói (chủ dự án 29/10/2026). Vừa từ đúng trang tin sang đây → lùi thêm một
    // mốc về chính trang đó (không sinh mốc trùng); vào trang nạp bằng đường khác → mở tin. Nạp ví thường → ô chọn số tiền.
    const dong = () => {
      setDon(null); boDon();
      if (!ve) return;
      let truoc = "";
      try { truoc = sessionStorage.getItem("cl_trang_truoc") || ""; } catch {}
      if (truoc === ve.split("?")[0]) window.history.back();
      else router.replace(veHuy(ve));
    };
    window.addEventListener("popstate", dong);
    return () => window.removeEventListener("popstate", dong);
  }, [don, ve, router]);

  // SỐ CÒN THIẾU từ trang đăng tin (?can=…). Khách bấm Đăng mà ví không đủ thì
  // web đưa sang đây kèm đúng số còn thiếu (số nằm sẵn trong ô tự nhập; bỏ câu báo đầu trang 26/10/2026).
  const canNap = Number(params.get("can") || 0);

  // KHÔNG CHỌN SẴN NÚT MỆNH GIÁ NÀO (chủ dự án 26/10/2026: chọn sẵn 500.000đ khi cần 846.720đ là nạp hụt).
  // Đến từ gói tin (?can=): số cần nộp nằm sẵn trong ô tự nhập, con trỏ trong ô, chữ được bôi sẵn — khách gõ số khác
  // là thay ngay, muốn nạp bao nhiêu tuỳ khách; các nút mệnh giá vẫn để chọn.
  const oNhapRef = useRef<HTMLInputElement>(null);
  const nutTtRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (canNap <= 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- điền sẵn một lần theo địa chỉ trang
    setCustom(canNap.toLocaleString("vi-VN"));
    // ĐIỆN THOẠI KHÔNG TỰ BẬT BÀN PHÍM (chủ dự án 26/10/2026: "giật lag, che bàn phím khi nạp tiền là cái tệ hại"):
    // số đã nằm sẵn trong ô, khách bấm Thanh toán luôn; muốn sửa số thì chạm vào ô. Máy tính vẫn đặt sẵn con trỏ.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    requestAnimationFrame(() => { oNhapRef.current?.focus(); oNhapRef.current?.select(); });
  }, [canNap]);

  // Khách sang PayOS rồi bấm Back của trình duyệt quay về: trình duyệt khôi phục trang cũ đúng lúc "Đang tạo đơn…"
  // → nút kẹt, không bấm lại được (26/10/2026). Trang hiện lại thì trả nút về như thường.
  useEffect(() => {
    const moLai = (e: PageTransitionEvent) => { if (e.persisted) setLoading(false); };
    window.addEventListener("pageshow", moLai);
    return () => window.removeEventListener("pageshow", moLai);
  }, []);

  const finalAmount = custom.trim() ? Number(custom.replace(/\D/g, "")) || 0 : amount;
  // Hệ cấp theo tổng nạp + điểm thưởng đã BỎ 25/09/2026, thay bằng Gói hội viên (0040).
  const points = false
    ? Math.floor(finalAmount / billing.points.earnPerVnd)
    : 0;

  async function pay() {
    setErr("");
    if (finalAmount < 10_000) {
      setErr("Số tiền tối thiểu là 10.000 ₫.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/thanh-toan/tao-don", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          description: `Nap tien ${finalAmount / 1000}k`,
          buyerName: profile?.full_name ?? undefined,
          buyerEmail: emailThat(profile?.email) || undefined,
          buyerPhone: profile?.phone ?? undefined,
          ve: ve ?? undefined,
        }),
      });
      const json = await res.json();
      // MÃ QR NGAY TẠI TRANG, logo Coastal Land — khách không sang trang PayOS nào (chủ dự án 26/10/2026: "không có PayOS gì hết")
      if (json.ok && json.qrCode) {
        setDon(json as DonQr);
        try { sessionStorage.setItem(KHOA_DON, JSON.stringify({ don: json, ve, luc: Date.now() })); } catch {}
        setLoading(false);
        return;
      }
      setErr(json.code === "CHUA_CAU_HINH" ? "Cổng thanh toán chưa được kết nối. Vui lòng liên hệ quản trị viên." : "Không tạo được mã thanh toán. Vui lòng thử lại.");
    } catch {
      setErr("Không kết nối được máy chủ thanh toán.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Nạp tiền vào tài khoản</h1>
      </div>

      {/* TẠM GIỮ (0056): tiền của tin đang chờ duyệt đã khoá trong ví, duyệt mới trừ. */}
      {viGiu && viGiu.tam_giu > 0 && (
        <div className="rounded-xl border border-cvr-line bg-white px-4 py-3 text-sm">
          <div className="flex justify-between"><span className="text-cvr-muted">Đang tạm giữ cho tin chờ duyệt</span><span className="font-semibold text-cvr-ink">{vnd(viGiu.tam_giu)}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-cvr-muted">Số dư khả dụng</span><span className="font-semibold text-cvr-ink">{vnd(viGiu.kha_dung)}</span></div>
        </div>
      )}

      {ketQua === "thanh-cong" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Thanh toán thành công.
        </p>
      )}
      {ketQua === "huy" && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Đã huỷ giao dịch.
        </p>
      )}

      {don ? (
        <MaQrThanhToan
          don={don}
          // Huỷ = quay lại một bước (gỡ mốc mã QR) → đóng mã, về đúng chỗ (xem phần NÚT QUAY LẠI ở trên)
          onHuy={() => window.history.back()}
          // Tiền về (webhook đã cộng ví): đến từ tin → Tin của tôi (tin tự gửi duyệt); nạp thường → báo thành công tại đây
          onXong={() => {
            boDon();
            try { sessionStorage.removeItem("veGoiTin"); } catch {} // đã trả xong: không còn quay về tin nháp
            if (ve) router.replace("/tai-khoan/tin-dang?nap=thanh-cong");
            else { setDon(null); router.replace("/tai-khoan/nap-tien?ket-qua=thanh-cong"); }
          }}
        />
      ) : (
      <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Chọn số tiền</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustom(""); }}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                !custom.trim() && amount === a
                  ? "border-cvr-ink bg-cvr-ink text-white"
                  : "border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
              }`}
            >
              {vnd(a)}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Hoặc nhập số tiền khác (₫)</span>
          <input
            ref={oNhapRef}
            inputMode="numeric"
            enterKeyHint="go"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            // Phím "Đi" trên bàn phím điện thoại = bấm Thanh toán
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pay(); } }}
            // BÀN PHÍM KHÔNG CHE NÚT THANH TOÁN (chủ dự án 26/10/2026): gõ số trên điện thoại → cuộn để ô nhập + nút
            // Thanh toán cùng nằm trên bàn phím. Chạy sau bộ chống che chung (BanPhimAo đưa ô vào giữa lúc ~350 ms).
            onFocus={() => setTimeout(() => {
              const vv = window.visualViewport;
              const nut = nutTtRef.current;
              if (!vv || !nut) return;
              const duoi = nut.getBoundingClientRect().bottom - (vv.offsetTop + vv.height) + 12;
              if (duoi > 0) window.scrollBy({ top: duoi, behavior: "smooth" });
            }, 500)}
            placeholder="Ví dụ: 3.000.000"
            className="h-11 w-full rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cvr-surface px-4 py-3">
          <div>
            <p className="text-xs text-cvr-muted">Số tiền thanh toán</p>
            <p className="text-lg font-bold text-cvr-ink">{vnd(finalAmount)}</p>
          </div>
          {points > 0 && (
            <p className="text-sm text-cvr-body">
              Được cộng <span className="font-semibold text-cvr-ink">{points} điểm</span> thưởng
            </p>
          )}
        </div>

        {err && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{err}</p>}

        <button
          ref={nutTtRef}
          type="button"
          onClick={pay}
          disabled={loading}
          className="mt-4 h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {loading ? "Đang tạo mã…" : "Thanh toán"}
        </button>
      </section>
      )}
    </div>
  );
}
