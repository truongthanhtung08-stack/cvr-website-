"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// "TIN CỦA BẠN ĐÃ CÓ SẴN" — một màn GỌN, có phản hồi, tự chuyển trang.
//
// Bối cảnh: chủ dự án đã đăng hộ tin cho môi giới thật. Khi chính người đó lập
// tài khoản, tin vẫn đứng tên người đăng hộ.
//
// Bản trước bị chủ dự án bác vì "nặng nề, làm khách lo về bảo mật": chữ nhiều,
// nói chuyện đối chiếu — duyệt — chiếm tin, bấm xong thì ĐỨNG IM không báo gì.
// Bản này làm ngược lại:
//   · Nói đúng một câu: có N tin mang số của bạn.
//   · Ai có số thứ hai thì điền vào ô ngay đó (bỏ trống cũng được).
//   · Bấm LƯU → hiện "Đã lưu ✓" → chuyển thẳng sang trang tin của họ.
// Không màn chờ, không thuật ngữ, không để khách đoán chuyện gì đang xảy ra.
// ============================================================================

type TrangThai = "dang-do" | "an" | "moi" | "xong";

export default function NhanTinCuaToi() {
  const [tt, setTt] = useState<TrangThai>("dang-do");
  const [soTin, setSoTin] = useState(0);
  const [dsSdt, setDsSdt] = useState<string[]>([]);
  const [soThem, setSoThem] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setTt("an"); return; }

      // Đã gửi yêu cầu trước đó → coi như xong, đừng hỏi lại lần nữa.
      const { data: yc } = await supabase
        .from("yeu_cau_nhan_tin")
        .select("id")
        .eq("user_id", user.id)
        .eq("trang_thai", "cho_duyet")
        .maybeSingle();
      if (yc) { setTt("an"); return; }

      const { data: dem, error } = await supabase.rpc("dem_tin_theo_sdt_cua_toi");
      if (error) { setTt("an"); return; }        // chưa chạy migration → ẩn hẳn
      const n = Number(dem ?? 0);
      if (n <= 0) { setTt("an"); return; }

      const { data: ds } = await supabase.rpc("sdt_cua_toi", { p_chi_da_xac_minh: false });
      setDsSdt(((ds ?? []) as string[]).filter(Boolean));
      setSoTin(n);
      setTt("moi");
    })();
  }, []);

  async function luu() {
    setDangLuu(true);
    setLoi("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDangLuu(false); return; }

    // 1) Có khai thêm số thứ hai thì lưu trước — để lượt gom tin ngay sau đó
    //    tính luôn cả số này.
    const them = chuanHoaSdt(soThem);
    if (them) {
      if (!laSdtVN(them)) { setDangLuu(false); return setLoi("Số điện thoại thứ hai chưa đúng."); }
      const { error } = await supabase.from("sdt_nguoi_dung").insert({ user_id: user.id, sdt: them });
      if (error && !/duplicate|unique/i.test(error.message)) {
        setDangLuu(false);
        return setLoi("Không lưu được số thứ hai. Vui lòng thử lại.");
      }
    }

    // 2) Gom tin. Số đã xác minh thì về ngay; chưa xác minh thì ghi lại để
    //    Coastal Land chuyển trong ngày — cả hai trường hợp đều báo "đã lưu",
    //    khách không phải hiểu cơ chế bên trong.
    const { data, error } = await supabase.rpc("tu_nhan_tin_theo_sdt");
    if (!error) {
      setKetQua(`${Number(data ?? 0)} tin đã về tài khoản của bạn.`);
    } else {
      await supabase.from("yeu_cau_nhan_tin").insert({
        user_id: user.id,
        ds_sdt: [...dsSdt, them].filter(Boolean),
        so_tin: soTin,
      });
      setKetQua("Coastal Land sẽ chuyển tin về tài khoản của bạn trong hôm nay.");
    }

    setTt("xong");
    setDangLuu(false);
    // Báo xong là ĐI TIẾP — không để khách ngồi nhìn một tấm thông báo đứng im.
    setTimeout(() => { window.location.href = "/tai-khoan/tin-dang"; }, 1600);
  }

  if (tt === "dang-do" || tt === "an") return null;

  if (tt === "xong") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-300 bg-green-50 px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">✓</span>
        <p className="text-sm leading-relaxed text-green-900">
          <strong className="font-semibold">Đã lưu.</strong> {ketQua} Đang mở trang tin của bạn…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <h2 className="text-base font-semibold text-cvr-ink">
        Có {soTin} tin đang đăng mang số {dsSdt[0] ?? "của bạn"}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-cvr-muted">
        Nhận về tài khoản để tự sửa tin và xem ai đang quan tâm.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="tel"
          inputMode="tel"
          value={soThem}
          onChange={(e) => setSoThem(e.target.value)}
          placeholder="Số thứ hai của bạn (nếu có)"
          className="h-11 min-w-0 flex-1 rounded-lg border border-cvr-line px-4 text-sm text-cvr-ink outline-none transition placeholder:text-cvr-faint focus:border-cvr-ink"
        />
        <button
          type="button"
          onClick={luu}
          disabled={dangLuu}
          className="h-11 shrink-0 rounded-lg bg-cvr-ink px-6 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {dangLuu ? "Đang lưu…" : "Lưu"}
        </button>
      </div>

      {loi && <p className="mt-2 text-sm font-medium text-red-600">{loi}</p>}
    </div>
  );
}
