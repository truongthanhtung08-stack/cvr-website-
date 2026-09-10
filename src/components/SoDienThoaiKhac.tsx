"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// "SỐ ĐIỆN THOẠI KHÁC CỦA TÔI"
//
// Môi giới hầu như ai cũng dùng hai số: một số gọi, một số Zalo — và tin đăng
// mỗi lần ghi một số khác nhau. Chỉ đối chiếu đúng số trong hồ sơ thì một nửa
// số tin của họ không bao giờ nhận về được.
//
// Khai thêm số ở đây KHÔNG có nghĩa là chiếm được tin ngay: số mới luôn ở trạng
// thái CHƯA XÁC MINH, phải qua Coastal Land duyệt (hoặc xác minh bằng OTP) mới
// dùng để nhận tin. Mỗi số chỉ thuộc MỘT tài khoản — chặn ở tầng CSDL.
//
// Chưa chạy migration 0024 thì khối này tự ẩn.
// ============================================================================

type So = { id: string; sdt: string; da_xac_minh: boolean };

export default function SoDienThoaiKhac() {
  const [ds, setDs] = useState<So[] | null>(null);
  const [an, setAn] = useState(false);
  const [moi, setMoi] = useState("");
  const [loi, setLoi] = useState("");
  const [dangLam, setDangLam] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAn(true); return; }
      const { data, error } = await supabase
        .from("sdt_nguoi_dung")
        .select("id,sdt,da_xac_minh")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) { setAn(true); return; }   // chưa chạy migration → ẩn
      setDs((data ?? []) as So[]);
    })();
  }, []);

  async function them(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    const so = chuanHoaSdt(moi);
    if (!laSdtVN(so)) { setLoi("Số điện thoại không hợp lệ. Nhập đủ 10 số, ví dụ 0905123456."); return; }

    setDangLam(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDangLam(false); return; }

    const { data, error } = await supabase
      .from("sdt_nguoi_dung")
      .insert({ user_id: user.id, sdt: so })
      .select("id,sdt,da_xac_minh")
      .single();
    setDangLam(false);

    if (error) {
      // unique(sdt): số này đã thuộc tài khoản khác — nói rõ chứ đừng báo lỗi kỹ thuật.
      setLoi(
        /duplicate|unique/i.test(error.message)
          ? "Số này đã được gắn với một tài khoản khác. Nếu đây đúng là số của bạn, hãy liên hệ Coastal Land."
          : error.message,
      );
      return;
    }
    setDs((cu) => [...(cu ?? []), data as So]);
    setMoi("");
  }

  async function xoa(id: string) {
    if (!window.confirm("Bỏ số này khỏi tài khoản?")) return;
    const { error } = await createClient().from("sdt_nguoi_dung").delete().eq("id", id);
    if (!error) setDs((cu) => (cu ?? []).filter((x) => x.id !== id));
  }

  if (an || !ds) return null;

  return (
    <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <h2 className="text-base font-semibold text-cvr-ink">Số điện thoại khác của tôi</h2>
      <p className="mt-1 text-sm leading-relaxed text-cvr-muted">
        Dùng nhiều số để đăng tin thì khai hết ở đây — hệ thống mới gom đủ tin về một tài khoản.
        Số mới cần Coastal Land xác minh trước khi dùng để nhận tin.
      </p>

      {ds.length > 0 && (
        <ul className="mt-4 divide-y divide-cvr-line">
          {ds.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <strong className="font-semibold text-cvr-ink">{s.sdt}</strong>
                {s.da_xac_minh ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Đã xác minh</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Chờ xác minh</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => xoa(s.id)}
                className="shrink-0 text-sm font-medium text-cvr-muted transition hover:text-red-600"
              >
                Bỏ
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={them} className="mt-4 flex flex-wrap gap-2">
        <input
          type="tel"
          inputMode="tel"
          value={moi}
          onChange={(e) => setMoi(e.target.value)}
          placeholder="Thêm số khác — VD: 0905123456"
          className="h-11 min-w-0 flex-1 rounded-lg border border-cvr-line px-4 text-sm text-cvr-ink outline-none transition placeholder:text-cvr-faint focus:border-cvr-ink"
        />
        <button
          type="submit"
          disabled={dangLam}
          className="h-11 shrink-0 rounded-lg bg-cvr-ink px-5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {dangLam ? "Đang thêm…" : "Thêm số"}
        </button>
      </form>
      {loi && <p className="mt-2 text-sm font-medium text-red-600">{loi}</p>}
    </section>
  );
}
