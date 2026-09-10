"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// ADMIN — DUYỆT "NHẬN TIN VỀ TÀI KHOẢN"
//
// Môi giới thật (tin do chủ dự án đăng hộ) xin nhận lại tin mang số điện thoại
// của họ. Người đã XÁC MINH được số thì tự nhận, không rơi vào đây. Còn lại nằm
// ở bảng này chờ chủ dự án đối chiếu rồi bấm Duyệt — bấm một cái là toàn bộ tin
// mang số đó chuyển sang tài khoản của họ.
//
// Trước khi duyệt hãy nhìn đúng hai thứ: SỐ ĐIỆN THOẠI và SỐ TIN sẽ chuyển đi.
// Duyệt nhầm là giao cả tin lẫn danh sách khách quan tâm cho người khác.
//
// Chưa chạy migration 0024 thì khối này tự ẩn.
// ============================================================================

type YeuCau = {
  id: string;
  user_id: string;
  ds_sdt: string[];
  so_tin: number;
  trang_thai: string;
  created_at: string;
  nguoi?: { full_name: string | null; email: string | null; phone: string | null } | null;
};

export default function YeuCauNhanTin() {
  const [ds, setDs] = useState<YeuCau[] | null>(null);
  const [dangLam, setDangLam] = useState("");
  const [bao, setBao] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("yeu_cau_nhan_tin")
        .select("id,user_id,ds_sdt,so_tin,trang_thai,created_at,nguoi:profiles!yeu_cau_nhan_tin_user_id_fkey(full_name,email,phone)")
        .eq("trang_thai", "cho_duyet")
        .order("created_at", { ascending: false });
      if (error) { setDs([]); return; }          // chưa chạy migration → ẩn
      setDs((data ?? []) as unknown as YeuCau[]);
    })();
  }, []);

  async function duyet(yc: YeuCau) {
    if (!window.confirm(`Chuyển toàn bộ tin mang số ${(yc.ds_sdt ?? []).join(" · ")} sang tài khoản của ${yc.nguoi?.full_name || "người này"}?`)) return;
    setDangLam(yc.id);
    setBao("");
    const { data, error } = await createClient().rpc("duyet_nhan_tin", { p_yeu_cau: yc.id });
    setDangLam("");
    if (error) { setBao(error.message); return; }
    setBao(`Đã chuyển ${Number(data ?? 0)} tin cho ${yc.nguoi?.full_name || (yc.ds_sdt ?? []).join(" · ")}.`);
    setDs((cu) => (cu ?? []).filter((x) => x.id !== yc.id));
  }

  async function tuChoi(yc: YeuCau) {
    if (!window.confirm("Từ chối yêu cầu này?")) return;
    setDangLam(yc.id);
    const { error } = await createClient()
      .from("yeu_cau_nhan_tin")
      .update({ trang_thai: "tu_choi", duyet_luc: new Date().toISOString() })
      .eq("id", yc.id);
    setDangLam("");
    if (error) { setBao(error.message); return; }
    setDs((cu) => (cu ?? []).filter((x) => x.id !== yc.id));
  }

  if (!ds || ds.length === 0) {
    return bao ? <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{bao}</p> : null;
  }

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <h2 className="text-base font-semibold text-amber-900">
        Yêu cầu nhận tin về tài khoản ({ds.length})
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
        Môi giới xin nhận lại tin đã đăng hộ. Đối chiếu số điện thoại trước khi duyệt —
        duyệt là chuyển cả tin lẫn danh sách khách quan tâm sang tài khoản của họ.
      </p>

      {bao && <p className="mt-3 rounded-lg bg-white px-4 py-2 text-sm text-cvr-ink">{bao}</p>}

      <ul className="mt-4 space-y-3">
        {ds.map((yc) => (
          <li key={yc.id} className="rounded-xl bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-cvr-ink">
                  {yc.nguoi?.full_name || "(chưa có tên)"}{" "}
                  <span className="font-normal text-cvr-muted">
                    · xin nhận tin mang {(yc.ds_sdt ?? []).length > 1 ? "các số" : "số"}{" "}
                  </span>
                  <strong>{(yc.ds_sdt ?? []).join(" · ")}</strong>
                </p>
                <p className="mt-0.5 text-xs text-cvr-faint">
                  {yc.nguoi?.email || "chưa có email"}
                  {yc.nguoi?.phone ? ` · SĐT hồ sơ: ${yc.nguoi.phone}` : ""}
                  {" · gửi "}{new Date(yc.created_at).toLocaleDateString("vi-VN")}
                  {yc.so_tin > 0 ? ` · khoảng ${yc.so_tin} tin` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => duyet(yc)}
                  disabled={dangLam === yc.id}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                >
                  {dangLam === yc.id ? "Đang chuyển…" : "Duyệt & chuyển tin"}
                </button>
                <button
                  type="button"
                  onClick={() => tuChoi(yc)}
                  disabled={dangLam === yc.id}
                  className="rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink disabled:opacity-60"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
