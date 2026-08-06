"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import { BILLING_DEFAULT, vnd } from "@/lib/billing";

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
  const params = useSearchParams();
  const ketQua = params.get("ket-qua");

  const amounts = BILLING_DEFAULT.topupAmounts;
  const [amount, setAmount] = useState<number>(amounts[1]);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const finalAmount = custom.trim() ? Number(custom.replace(/\D/g, "")) || 0 : amount;
  const points = BILLING_DEFAULT.points.active
    ? Math.floor(finalAmount / BILLING_DEFAULT.points.earnPerVnd)
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
          buyerEmail: profile?.email ?? undefined,
          buyerPhone: profile?.phone ?? undefined,
        }),
      });
      const json = await res.json();
      if (json.ok && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      setErr(
        json.code === "CHUA_CAU_HINH"
          ? "Cổng thanh toán chưa được kết nối. Vui lòng liên hệ quản trị viên."
          : json.message || "Không tạo được đơn thanh toán.",
      );
    } catch {
      setErr("Không kết nối được máy chủ thanh toán.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Nạp tiền vào tài khoản</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Số dư dùng để thanh toán phí đăng tin, đẩy tin và quảng cáo trên Coastal Land.
        </p>
      </div>

      {ketQua === "thanh-cong" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Thanh toán thành công. Số dư sẽ được cộng vào tài khoản sau khi hệ thống đối soát.
        </p>
      )}
      {ketQua === "huy" && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Bạn đã huỷ giao dịch. Có thể chọn lại mệnh giá bên dưới.
        </p>
      )}

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
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
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
          type="button"
          onClick={pay}
          disabled={loading}
          className="mt-4 h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {loading ? "Đang tạo đơn…" : "Thanh toán qua PayOS"}
        </button>
        <p className="mt-2 text-center text-[11px] text-cvr-faint">
          Hỗ trợ quét mã QR ngân hàng, thẻ nội địa và thẻ quốc tế.
        </p>
      </section>
    </div>
  );
}
