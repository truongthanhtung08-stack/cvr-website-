"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { BILLING_DEFAULT, vnd } from "@/lib/billing";

// Đổi điểm thưởng thành số dư dùng để đăng tin.
// Tỷ lệ quy đổi và mức tối thiểu do chủ dự án đặt ở /admin/gia-khuyen-mai.
export default function RedeemPointsPage() {
  const { profile, loading } = useProfile();
  const cfg = BILLING_DEFAULT.points;
  const [amount, setAmount] = useState<number>(cfg.minRedeem);
  const [done, setDone] = useState(false);

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  const p = profile as unknown as { points?: number } | null;
  const points = p?.points ?? 0;
  const value = amount * cfg.redeemRate;
  const canRedeem = cfg.active && points >= cfg.minRedeem && amount <= points && amount >= cfg.minRedeem;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Đổi điểm thưởng</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          1 điểm = {vnd(cfg.redeemRate)} · đổi tối thiểu {cfg.minRedeem} điểm.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <p className="text-sm text-cvr-muted">Điểm hiện có</p>
          <p className="mt-1.5 text-2xl font-bold text-cvr-ink">{points} điểm</p>
          <p className="mt-0.5 text-xs text-cvr-muted">Tương đương {vnd(points * cfg.redeemRate)}</p>
        </div>
        <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <p className="text-sm text-cvr-muted">Cách tích điểm</p>
          <p className="mt-1.5 text-sm text-cvr-body">
            Mỗi {vnd(cfg.earnPerVnd)} nạp vào tài khoản được cộng 1 điểm.
          </p>
          <Link href="/tai-khoan/nap-tien" className="mt-3 inline-block rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white">
            Nạp tiền
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Đổi điểm sang số dư</h2>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Số điểm muốn đổi</span>
          <input
            type="number"
            min={cfg.minRedeem}
            max={points}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="h-11 w-full rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink"
          />
        </label>
        <p className="mt-2 text-sm text-cvr-body">
          Nhận về: <span className="font-semibold text-cvr-ink">{vnd(value)}</span>
        </p>

        {!cfg.active && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            Chương trình điểm thưởng đang tạm tắt.
          </p>
        )}
        {cfg.active && points < cfg.minRedeem && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            Bạn cần tối thiểu {cfg.minRedeem} điểm để đổi. Nạp tiền để tích thêm điểm.
          </p>
        )}
        {done && (
          <p className="mt-3 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
            Đã gửi yêu cầu đổi điểm. Số dư sẽ được cộng sau khi quản trị viên xác nhận.
          </p>
        )}

        <button
          type="button"
          disabled={!canRedeem}
          onClick={() => setDone(true)}
          className="mt-4 h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
        >
          Đổi {amount} điểm
        </button>
      </section>
    </div>
  );
}
