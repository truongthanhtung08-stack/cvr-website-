"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { vnd } from "@/lib/billing";

// ============================================================================
// ADMIN — THANH TOÁN: trạng thái kết nối PayOS + danh sách giao dịch.
// Khoá PayOS nằm trong biến môi trường (không hiện ra ở đây vì lý do an toàn),
// trang này chỉ báo ĐÃ CẮM hay CHƯA và hướng dẫn cắm.
// ============================================================================

type Payment = {
  id: string;
  created_at: string;
  user_email: string | null;
  amount: number;
  status: string;
  order_code: string | null;
  note: string | null;
};

export default function AdminPaymentsPage() {
  const [cfg, setCfg] = useState<{ daCauHinh: boolean; thieu: string[] } | null>(null);
  // Webhook = đường PayOS gọi ngược về web báo "khách đã chuyển tiền" → web tự
  // cộng ví. Thiếu nó thì tiền về ngân hàng mà ví khách vẫn bằng 0.
  const [hook, setHook] = useState<{ daCauHinh: boolean; thieu: string[] } | null>(null);
  const [rows, setRows] = useState<Payment[] | null>(null);
  const [dbErr, setDbErr] = useState("");
  const [copied, setCopied] = useState(false);
  const webhookUrl = typeof window === "undefined" ? "" : `${window.location.origin}/api/thanh-toan/webhook`;

  useEffect(() => {
    fetch("/api/thanh-toan/tao-don")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ daCauHinh: false, thieu: ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"] }));

    fetch("/api/thanh-toan/webhook")
      .then((r) => r.json())
      .then(setHook)
      .catch(() => setHook({ daCauHinh: false, thieu: ["PAYOS_CHECKSUM_KEY", "SUPABASE_SERVICE_ROLE_KEY"] }));

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("payments")
          .select("id,created_at,user_email,amount,status,order_code,note")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) setDbErr(error.message);
        setRows((data as Payment[]) ?? []);
      } catch {
        setDbErr("Chưa kết nối được cơ sở dữ liệu.");
        setRows([]);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Thanh toán</h1>
        <p className="mt-1 text-sm text-cvr-muted">Cổng thanh toán PayOS và lịch sử giao dịch của khách hàng.</p>
      </div>

      {/* Trạng thái cổng thanh toán */}
      <section className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-cvr-ink">Cổng thanh toán PayOS</h2>
          {cfg && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                cfg.daCauHinh ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {cfg.daCauHinh ? "Đã kết nối" : "Chưa cắm khoá"}
            </span>
          )}
        </div>

        {cfg && !cfg.daCauHinh && (
          <div className="mt-3 space-y-2 text-sm text-cvr-body">
            <p>Còn thiếu: <span className="font-semibold text-cvr-ink">{cfg.thieu.join(" · ")}</span></p>
            <ol className="list-decimal space-y-1 pl-5 text-cvr-muted">
              <li>Đăng ký tài khoản tại <span className="font-medium text-cvr-ink">my.payos.vn</span>, tạo kênh thanh toán.</li>
              <li>Lấy 3 khoá: Client ID · API Key · Checksum Key.</li>
              <li>Gửi cho kỹ thuật để dán vào biến môi trường (máy: <code>.env.local</code> · web: Vercel → Settings → Environment Variables).</li>
              <li>Deploy lại — mục này sẽ chuyển sang “Đã kết nối”.</li>
            </ol>
          </div>
        )}
      </section>

      {/* Webhook — bước BẮT BUỘC để tiền tự vào ví */}
      <section className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-cvr-ink">Tự động cộng ví khi khách chuyển tiền</h2>
          {hook && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                hook.daCauHinh ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {hook.daCauHinh ? "Sẵn sàng" : "Chưa cắm khoá"}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-cvr-body">
          Khách chuyển khoản xong, PayOS gọi về địa chỉ dưới đây; web tự đổi giao dịch sang
          <span className="font-semibold text-cvr-ink"> Đã thanh toán</span>, cộng tiền vào ví và xét lại cấp hội viên.
          Chưa khai địa chỉ này thì tiền về ngân hàng nhưng ví khách vẫn bằng 0.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-cvr-surface px-3 py-2 text-[13px] text-cvr-ink">{webhookUrl}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(webhookUrl);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
            className="rounded-lg bg-cvr-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-95"
          >
            {copied ? "Đã chép ✓" : "Chép địa chỉ"}
          </button>
        </div>

        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-cvr-muted">
          <li>Vào <span className="font-medium text-cvr-ink">my.payos.vn</span> → Kênh thanh toán → mục Webhook.</li>
          <li>Dán địa chỉ trên rồi bấm <span className="font-medium text-cvr-ink">Kiểm tra / Lưu</span> — PayOS sẽ gọi thử, phải báo thành công.</li>
          <li>Nạp thử một khoản nhỏ (10.000 ₫) rồi xem giao dịch bên dưới có chuyển sang “Đã thanh toán” và ví có nhảy số không.</li>
        </ol>

        {hook && !hook.daCauHinh && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            Còn thiếu khoá: <span className="font-semibold">{hook.thieu.join(" · ")}</span> — dán ở Vercel → Settings → Environment Variables rồi Redeploy.
          </p>
        )}
      </section>

      {/* Giao dịch */}
      <section className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-cvr-ink">Giao dịch gần đây</h2>
        {dbErr && (
          <p className="mt-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            Chưa có bảng lưu giao dịch (payments). Chạy tệp <code>docs/sql/vi-thanh-vien-va-thanh-toan.sql</code> trong Supabase để bật.
          </p>
        )}
        {rows && rows.length === 0 && !dbErr && (
          <p className="mt-3 rounded-lg border border-dashed border-cvr-line bg-cvr-surface px-4 py-8 text-center text-sm text-cvr-muted">
            Chưa có giao dịch nào.
          </p>
        )}
        {rows && rows.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2.5">Thời gian</th>
                  <th className="py-2.5">Khách hàng</th>
                  <th className="py-2.5">Mã đơn</th>
                  <th className="py-2.5">Số tiền</th>
                  <th className="py-2.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-cvr-line/70">
                    <td className="py-3 text-cvr-muted">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                    <td className="py-3 text-cvr-ink">{r.user_email ?? "—"}</td>
                    <td className="py-3 text-cvr-body">{r.order_code ?? "—"}</td>
                    <td className="py-3 font-semibold text-cvr-ink">{vnd(r.amount)}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "paid" ? "bg-green-50 text-green-700" : r.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {r.status === "paid" ? "Đã thanh toán" : r.status === "cancelled" ? "Đã huỷ" : "Chờ thanh toán"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
