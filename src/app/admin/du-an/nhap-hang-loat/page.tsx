"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { docDuAnTuCsv, anhTepCuaDong, type DongDuAn } from "@/lib/csvDuAn";
import { lapKeHoach, thucHienNap, type KeHoachDuAn } from "@/lib/napDuAn";
import { uploadImageFile } from "@/lib/uploadImage";
import { lamMoiWeb } from "@/lib/lamMoiWeb";

// ============================================================================
// ADMIN — NẠP DỰ ÁN HÀNG LOẠT (Cowork, hằng tuần) → trạng thái CHỜ DUYỆT
//   B1. Tải tệp mẫu → mỗi dòng một dự án, có nguồn + ngày cập nhật
//   B2. Chọn tệp CSV + chọn ảnh dự án (thư mục ảnh đặt tên <mã dự án>.jpg, hoặc tên ghi ở cột `anh`)
//       → xem trước: dự án mới · hồ sơ đã có sẽ điền ô nào · dòng bị chặn vì thiếu gì
//   B3. Bấm Nạp → ảnh tải lên kho ảnh của web (cùng đường ảnh tin) · dự án mới vào "Chờ duyệt" ·
//       hồ sơ đã có CHỈ ĐIỀN Ô TRỐNG, không đổi trạng thái đăng/duyệt (napDuAn.ts)
// ============================================================================

export default function NapDuAnPage() {
  const [dong, setDong] = useState<DongDuAn[]>([]);
  const [tenTep, setTenTep] = useState("");
  const [tepAnh, setTepAnh] = useState<File[]>([]);
  const [keHoachDoc, setKeHoach] = useState<KeHoachDuAn[]>([]);
  const [loiDoc, setLoiDoc] = useState("");
  const [dangNap, setDangNap] = useState(false);
  const [ketQua, setKetQua] = useState("");

  async function chonTep(f: File | undefined) {
    if (!f) return;
    setTenTep(f.name);
    setKetQua("");
    setDong(docDuAnTuCsv(await f.text()));
  }

  // Chọn lại ảnh cùng tên → giữ tệp chọn sau cùng
  function chonAnh(ds: FileList | null) {
    if (!ds?.length) return;
    setKetQua("");
    setTepAnh((cu) => {
      const theoTen = new Map(cu.map((f) => [f.name.toLowerCase(), f]));
      for (const f of Array.from(ds)) if (f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(f.name)) theoTen.set(f.name.toLowerCase(), f);
      return [...theoTen.values()];
    });
  }

  const anhCua = (d: DongDuAn) => anhTepCuaDong(d, tepAnh);

  // So với hồ sơ đã có trên web (chỉ đọc) mỗi khi đổi tệp hoặc ảnh
  useEffect(() => {
    if (!dong.length) return;
    let huy = false;
    lapKeHoach(createClient(), dong, (d) => {
      const a = anhTepCuaDong(d, tepAnh);
      return { co: a.tep.length > 0 || d.anhLink.length > 0, thieu: a.thieu };
    })
      .then((k) => { if (!huy) { setKeHoach(k); setLoiDoc(""); } })
      .catch((e) => { if (!huy) setLoiDoc(`Không đọc được danh sách dự án trên web: ${e instanceof Error ? e.message : "lỗi không rõ"}`); });
    return () => { huy = true; };
  }, [dong, tepAnh]);

  // Ảnh xem trước: tệp chọn kèm (ảnh đầu = ảnh tiêu biểu), không có thì link đầu tiên
  const xemAnh = useMemo(() => {
    const m = new Map<number, string>();
    for (const d of dong) {
      const f = anhTepCuaDong(d, tepAnh).tep[0];
      if (f) m.set(d.dong, URL.createObjectURL(f));
      else if (d.anhLink[0]) m.set(d.dong, d.anhLink[0]);
    }
    return m;
  }, [dong, tepAnh]);
  useEffect(() => () => { for (const u of xemAnh.values()) if (u.startsWith("blob:")) URL.revokeObjectURL(u); }, [xemAnh]);

  const keHoach = dong.length ? keHoachDoc : [];
  const soMoi = keHoach.filter((k) => k.loai === "moi").length;
  const soCapNhat = keHoach.filter((k) => k.loai === "capNhat").length;
  const soKhongDoi = keHoach.filter((k) => k.loai === "khongDoi").length;
  const soChan = keHoach.filter((k) => k.loai === "chan").length;

  async function nap() {
    setDangNap(true);
    setKetQua("");
    const supabase = createClient();
    try {
      const kq = await thucHienNap(supabase, keHoach, async (k) => {
        const tep = anhCua(k.d).tep;
        if (!tep.length) return { urls: k.d.anhLink };
        const urls: string[] = [];
        for (const f of tep) {
          const { url, error } = await uploadImageFile(f);
          if (error || !url) return { urls: [], loi: error ?? `không tải được ảnh ${f.name}` };
          urls.push(url);
        }
        return { urls };
      });
      if (kq.capNhat.length) await lamMoiWeb();
      setKetQua(
        `Đã nạp ${kq.moi.length} dự án mới vào "Chờ duyệt"` +
          (kq.capNhat.length ? ` · điền thêm ô trống cho ${kq.capNhat.length} hồ sơ đã có: ${kq.capNhat.join(", ")}` : "") +
          (soKhongDoi ? ` · ${soKhongDoi} hồ sơ đã có không có ô nào để điền` : "") +
          (kq.loi.length ? ` · Lỗi: ${kq.loi.join(" · ")}` : "") + ".",
      );
      setDong([]);
      setTepAnh([]);
      setTenTep("");
    } catch (e) {
      setKetQua(`Nạp thất bại: ${e instanceof Error ? e.message : "lỗi không rõ"}`);
    }
    setDangNap(false);
  }

  return (
    <div className="max-w-5xl">
      <Link href="/admin/du-an" className="text-sm text-cvr-muted hover:text-cvr-ink">← Dự án</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-cvr-ink">Nạp dự án bằng tệp CSV</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a href="/mau-nhap-du-an.csv" download className="rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-ink hover:border-cvr-ink">
          Tải tệp mẫu
        </a>
        <label className="cursor-pointer rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white hover:bg-cvr-ink/90">
          Chọn tệp CSV
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { chonTep(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <label className="cursor-pointer rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-ink hover:border-cvr-ink">
          Chọn ảnh dự án
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { chonAnh(e.target.files); e.target.value = ""; }} />
        </label>
        {tenTep && <span className="text-sm text-cvr-muted">{tenTep}</span>}
        {tepAnh.length > 0 && <span className="text-sm text-cvr-muted">{tepAnh.length} ảnh</span>}
      </div>

      {loiDoc && <p className="mt-3 text-sm text-red-600">{loiDoc}</p>}

      {keHoach.length > 0 && (
        <>
          <p className="mt-5 text-sm text-cvr-body">
            {soMoi} dự án mới · {soCapNhat} hồ sơ đã có sẽ điền thêm · {soKhongDoi} hồ sơ đã có không đổi · {soChan} dòng chưa nạp được
          </p>
          <div className="mt-2 overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux">
            {keHoach.map((k) => (
              <div key={k.d.dong} className="flex gap-3 border-b border-cvr-line/70 px-4 py-2.5 text-sm last:border-0">
                <span className="w-12 shrink-0 pt-0.5 text-cvr-faint">#{k.d.dong}</span>
                {xemAnh.get(k.d.dong) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={xemAnh.get(k.d.dong)} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                ) : (
                  <span className="h-12 w-16 shrink-0 rounded bg-cvr-line/40" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cvr-ink">{k.d.ten || "—"} <span className="font-normal text-cvr-muted">/du-an/{k.d.slug}</span></p>
                  {k.loai === "chan" && <p className="text-red-600">{k.chan.join(" · ")}</p>}
                  {k.loai === "moi" && <p className="text-green-700">{'Dự án mới — vào "Chờ duyệt"'}</p>}
                  {k.loai === "khongDoi" && <p className="text-cvr-muted">Đã có trên web — không có ô nào để điền</p>}
                  {k.loai === "capNhat" && (
                    <p className="text-cvr-body">
                      <span className="text-green-700">Đã có trên web — điền ô trống: </span>
                      {k.doi.map((x) => `${x.o}: ${x.moi}`).join(" · ")}
                    </p>
                  )}
                  {k.giuWeb.length > 0 && k.loai !== "chan" && (
                    <p className="text-cvr-muted">Tệp ghi khác, giữ bản trên web: {k.giuWeb.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={dangNap || soMoi + soCapNhat === 0}
            onClick={nap}
            className="mt-4 rounded-lg bg-cvr-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-50"
          >
            {dangNap ? "Đang nạp…" : `Nạp ${soMoi + soCapNhat} dự án`}
          </button>
        </>
      )}
      {ketQua && <p className="mt-3 text-sm font-medium text-cvr-ink">{ketQua}</p>}
    </div>
  );
}
