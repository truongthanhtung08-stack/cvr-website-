"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// "CÓ N TIN MANG SỐ CỦA BẠN" — môi giới nhận lại tin đã được đăng hộ.
//
// Rất nhiều tin trên web do chủ dự án đăng hộ môi giới thật. Khi chính người đó
// lập tài khoản, tin vẫn đứng tên người đăng hộ → họ vào trang tài khoản thấy
// trống trơn. Khối này bắc cầu: thấy đúng số điện thoại của họ trong tin thì mời
// nhận về, nhận xong là có ngay số liệu và đăng tiếp bằng tài khoản của mình.
//
// HAI ĐƯỜNG NHẬN (chủ dự án chốt):
//   · SĐT đã xác minh → tự nhận ngay.
//   · Chưa xác minh   → gửi yêu cầu, chủ dự án duyệt tay trong /admin.
// Chỉ khai trùng số mà không xác minh thì KHÔNG được nhận — tránh người lạ
// chiếm tin và chiếm luôn danh sách khách quan tâm.
//
// Chưa chạy migration 0024 thì khối này tự ẩn, không làm hỏng trang.
// ============================================================================

type TrangThai = "dang-do" | "an" | "moi-nhan" | "da-nhan" | "cho-duyet" | "thieu-sdt" | "loi";

export default function NhanTinCuaToi() {
  const [tt, setTt] = useState<TrangThai>("dang-do");
  const [soTin, setSoTin] = useState(0);
  // Môi giới thường dùng NHIỀU SỐ (một số gọi, một số Zalo) — giữ cả danh sách,
  // không chỉ một số trong hồ sơ.
  const [dsSdt, setDsSdt] = useState<string[]>([]);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setTt("an"); return; }

      // Đã gửi yêu cầu và đang chờ duyệt → khỏi mời nhận nữa
      const { data: yc } = await supabase
        .from("yeu_cau_nhan_tin")
        .select("id,trang_thai,so_tin")
        .eq("user_id", user.id)
        .eq("trang_thai", "cho_duyet")
        .maybeSingle();
      if (yc) { setSoTin(yc.so_tin ?? 0); setTt("cho-duyet"); return; }

      const { data: dem, error } = await supabase.rpc("dem_tin_theo_sdt_cua_toi");
      if (error) { setTt("an"); return; }   // chưa chạy migration → ẩn hẳn
      const n = Number(dem ?? 0);
      if (n <= 0) { setTt("an"); return; }

      const { data: ds } = await supabase.rpc("sdt_cua_toi", { p_chi_da_xac_minh: false });
      setDsSdt(((ds ?? []) as string[]).filter(Boolean));
      setSoTin(n);
      setTt("moi-nhan");
    })();
  }, []);

  async function nhanVe() {
    setDangGui(true);
    setLoi("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("tu_nhan_tin_theo_sdt");

    if (!error) {
      setSoTin(Number(data ?? 0));
      setTt("da-nhan");
      setDangGui(false);
      return;
    }

    // Chưa xác minh SĐT → chuyển sang gửi yêu cầu cho quản trị viên duyệt tay.
    if (/chưa xác minh/i.test(error.message)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: loiGui } = await supabase
          .from("yeu_cau_nhan_tin")
          .insert({ user_id: user.id, ds_sdt: dsSdt, so_tin: soTin });
        if (!loiGui) { setTt("cho-duyet"); setDangGui(false); return; }
      }
      setLoi("Không gửi được yêu cầu. Vui lòng thử lại.");
    } else if (/chưa có số điện thoại/i.test(error.message)) {
      setTt("thieu-sdt");
    } else {
      setLoi(error.message);
    }
    setDangGui(false);
  }

  if (tt === "dang-do" || tt === "an") return null;

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      {tt === "moi-nhan" && (
        <>
          <h2 className="text-base font-semibold text-amber-900">
            Có {soTin} tin đang đăng mang số điện thoại của bạn
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
            {soTin} tin trên Coastal Land ghi {dsSdt.length > 1 ? "các số" : "số"}{" "}
            <strong>{dsSdt.join(" · ")}</strong> — nhận về tài khoản để tự sửa tin,
            xem lượt xem và biết ai đang quan tâm.
          </p>
          {loi && <p className="mt-2 text-sm font-medium text-red-700">{loi}</p>}
          <button
            type="button"
            onClick={nhanVe}
            disabled={dangGui}
            className="mt-4 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            {dangGui ? "Đang xử lý…" : "Nhận về tài khoản của tôi"}
          </button>
        </>
      )}

      {tt === "da-nhan" && (
        <>
          <h2 className="text-base font-semibold text-amber-900">Đã nhận {soTin} tin về tài khoản của bạn</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
            Từ giờ bạn tự sửa được các tin này và xem được số liệu của từng tin.
          </p>
          <Link href="/tai-khoan/tin-dang" className="mt-4 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700">
            Xem tin của tôi →
          </Link>
        </>
      )}

      {tt === "cho-duyet" && (
        <>
          <h2 className="text-base font-semibold text-amber-900">Yêu cầu nhận tin đang chờ duyệt</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
            Coastal Land sẽ đối chiếu số điện thoại rồi chuyển {soTin > 0 ? `${soTin} tin` : "các tin"} về tài khoản của bạn.
            Muốn nhận ngay, hãy xác minh số điện thoại trong phần cài đặt.
          </p>
          <Link href="/tai-khoan/cai-dat" className="mt-4 inline-block rounded-lg border border-amber-600 px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
            Xác minh số điện thoại
          </Link>
        </>
      )}

      {tt === "thieu-sdt" && (
        <>
          <h2 className="text-base font-semibold text-amber-900">Hồ sơ chưa có số điện thoại</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
            Thêm số điện thoại bạn dùng để đăng tin, hệ thống sẽ tìm các tin mang số đó.
          </p>
          <Link href="/tai-khoan/cai-dat" className="mt-4 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700">
            Thêm số điện thoại
          </Link>
        </>
      )}
    </div>
  );
}
