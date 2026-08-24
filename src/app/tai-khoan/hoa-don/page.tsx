"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { vnd } from "@/lib/billing";
import { PageHeader } from "@/components/Ui";

// ============================================================================
// TÀI KHOẢN — HÓA ĐƠN CỦA TÔI
// Khách tự xem lại mọi giao dịch đã dùng dịch vụ và tải bảng kê về.
// Chỉ thấy bản ghi của CHÍNH MÌNH — chặn ở tầng CSDL bằng RLS
// (policy doanh_thu_select_self_or_admin: user_id = auth.uid()), không phải
// chặn bằng giao diện, nên không thể xem trộm của người khác.
//
// LƯU Ý: đây là danh sách GIAO DỊCH ĐÃ DÙNG DỊCH VỤ, không phải lịch sử nạp ví.
// Nạp tiền vào ví chưa phải doanh thu nên không có hóa đơn — xem ở mục Ví.
// ============================================================================

type Dong = {
  id: string;
  ngay_ghi_nhan: string;
  mo_ta: string;
  tien_hang: number;
  tien_thue: number;
  tong_tra: number;
  hoa_don_so: string | null;
  hoa_don_ngay: string | null;
  hoa_don_trang_thai: string;
  hoa_don_loai: string;
};

export default function HoaDonCuaToiPage() {
  const [rows, setRows] = useState<Dong[] | null>(null);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("doanh_thu")
        .select("id,ngay_ghi_nhan,mo_ta,tien_hang,tien_thue,tong_tra,hoa_don_so,hoa_don_ngay,hoa_don_trang_thai,hoa_don_loai")
        .order("ngay_ghi_nhan", { ascending: false });
      if (error) {
        setLoi(/does not exist|schema cache/i.test(error.message) ? "" : error.message);
        setRows([]);
        return;
      }
      setRows((data ?? []) as Dong[]);
    })();
  }, []);

  const tongTra = (rows ?? []).reduce((s, d) => s + Number(d.tong_tra || 0), 0);
  const tongThue = (rows ?? []).reduce((s, d) => s + Number(d.tien_thue || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hóa đơn của tôi"
        desc="Các giao dịch bạn đã dùng dịch vụ đăng tin. Tiền nạp vào ví chưa phải giao dịch dịch vụ nên không có ở đây."
      />

      {loi && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{loi}</div>
      )}

      {rows && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <O nhan="Số giao dịch" giaTri={String(rows.length)} />
          <O nhan="Tổng đã thanh toán" giaTri={vnd(tongTra)} />
          <O nhan="Trong đó thuế GTGT" giaTri={vnd(tongThue)} />
        </div>
      )}

      <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-cvr-ink">Danh sách giao dịch</h2>
          {rows && rows.length > 0 && (
            <button onClick={() => taiCsv(rows)} className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
              Tải bảng kê (CSV)
            </button>
          )}
        </div>

        {!rows ? (
          <p className="mt-3 text-sm text-cvr-muted">Đang tải…</p>
        ) : rows.length === 0 ? (
          <div className="mt-4 rounded-xl bg-cvr-surface px-4 py-8 text-center">
            <p className="text-sm text-cvr-body">Bạn chưa có giao dịch dịch vụ nào.</p>
            <Link href="/bao-gia-dang-tin" className="mt-3 inline-block text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
              Xem bảng giá dịch vụ
            </Link>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wide text-cvr-muted">
                  <th className="py-2 pr-3 font-medium">Ngày</th>
                  <th className="py-2 pr-3 font-medium">Dịch vụ</th>
                  <th className="py-2 pr-3 text-right font-medium">Tiền dịch vụ</th>
                  <th className="py-2 pr-3 text-right font-medium">Thuế GTGT</th>
                  <th className="py-2 pr-3 text-right font-medium">Đã trả</th>
                  <th className="py-2 font-medium">Hóa đơn</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-cvr-line/60">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-cvr-body">{ngayVn(d.ngay_ghi_nhan)}</td>
                    <td className="py-2.5 pr-3 text-cvr-body">{d.mo_ta}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_hang)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-cvr-ink">{vnd(d.tien_thue)}</td>
                    <td className="py-2.5 pr-3 text-right font-medium tabular-nums text-cvr-ink">{vnd(d.tong_tra)}</td>
                    <td className="py-2.5">{trangThaiHoaDon(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 rounded-lg bg-cvr-surface px-3 py-2.5 text-xs leading-relaxed text-cvr-muted">
          Cần hóa đơn giá trị gia tăng mang tên công ty? Vào{" "}
          <Link href="/tai-khoan/cai-dat" className="font-medium text-cvr-blue-ink hover:text-cvr-blue">
            Cài đặt tài khoản
          </Link>{" "}
          → mục <strong>Thông tin xuất hóa đơn</strong> để khai tên công ty và mã số thuế. Khai một lần,
          các giao dịch sau tự động xuất hóa đơn riêng và gửi về email của bạn.
        </p>
      </div>
    </div>
  );
}

function trangThaiHoaDon(d: Dong) {
  if (d.hoa_don_so) {
    return (
      <span className="text-xs">
        <span className="font-medium text-cvr-ink">{d.hoa_don_so}</span>
        {d.hoa_don_ngay && <span className="block text-cvr-muted">{ngayVn(d.hoa_don_ngay)}</span>}
      </span>
    );
  }
  if (d.hoa_don_trang_thai === "loi") {
    return <span className="text-xs text-red-700">Đang xử lý lại</span>;
  }
  return (
    <span className="text-xs text-cvr-muted">
      {d.hoa_don_loai === "rieng" ? "Đang phát hành" : "Đã ghi nhận"}
    </span>
  );
}

function O({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-cvr-muted">{nhan}</div>
      <div className="mt-1 text-lg font-semibold text-cvr-ink">{giaTri}</div>
    </div>
  );
}

function ngayVn(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

// CSV có BOM để Excel không vỡ dấu tiếng Việt.
function taiCsv(rows: Dong[]) {
  const q = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const noiDung = [
    ["Ngay", "Dich vu", "Tien dich vu", "Thue GTGT", "Da tra", "So hoa don"].join(","),
    ...rows.map((d) => [q(ngayVn(d.ngay_ghi_nhan)), q(d.mo_ta), d.tien_hang, d.tien_thue, d.tong_tra, q(d.hoa_don_so)].join(",")),
  ].join("\n");
  const blob = new Blob(["﻿" + noiDung], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "hoa-don-coastal-land.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
