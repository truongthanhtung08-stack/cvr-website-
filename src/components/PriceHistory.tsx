import type { ChiSoKhuVuc, GiaDatNhaNuoc, MatBangGia, OSanh } from "@/lib/chiSoGia";
import { vndM2, tenNguonHienThi } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// MẶT BẰNG GIÁ — CÔNG CỤ ĐỂ NGƯỜI MUA RA QUYẾT ĐỊNH, KHÔNG PHẢI HÌNH TRANG TRÍ.
//
// Người mua đứng trước một tin luôn hỏi đúng ba câu, khối này trả lời đúng ba:
//   1. Tin này ĐẮT HAY RẺ so với khu vực?  → thước đo có vị trí tin này trên đó
//   2. Khu này đang LÊN HAY XUỐNG?          → cột theo quý, có nguồn và ngày
//   3. So với PHƯỜNG BÊN CẠNH thì sao?      → bảng xếp hạng giá các phường
//
// Bản cũ lấy giá tin nhân dãy hệ số cố định nên tin nào cũng "+22%" — mở hai tin
// cạnh nhau là lộ ngay. Nay chỉ vẽ khi có số thật, và luôn ghi SỐ MẪU + NGUỒN.
// Phần nào thiếu dữ liệu thì tự ẩn, không chế số cho đủ hình.
// ════════════════════════════════════════════════════════════════════════════

function nhanQuy(q: string): string {
  const m = q.match(/^(\d{4})-?Q([1-4])$/i);
  return m ? `Q${m[2]}/${m[1]}` : q;
}

export default function PriceHistory({
  chiSo,
  matBang,
  giaTinNayM2,
  soSanh = [],
  laThue = false,
  giaDat = null,
  soTinCo = 0,
  canToiThieu = 5,
}: {
  chiSo: ChiSoKhuVuc | null;
  matBang: MatBangGia | null;
  giaTinNayM2: number | null;
  soSanh?: OSanh[];
  /** Tin cho thuê thì giá mỗi m² là giá THUÊ mỗi tháng — đơn vị và chữ khác hẳn. */
  laThue?: boolean;
  /** Giá đất Nhà nước theo quyết định UBND tỉnh — dùng tính thuế phí. */
  giaDat?: GiaDatNhaNuoc | null;
  /** Đang có bao nhiêu tin cùng loại trong khu vực (kể cả khi chưa đủ để tính). */
  soTinCo?: number;
  canToiThieu?: number;
}) {
  const moc = (chiSo?.moc ?? []).filter((m) => m.giaM2 > 0).slice(-8);
  const coBieuDo = moc.length >= 2;
  const coSanh = soSanh.length >= 2;
  if (!matBang && !coBieuDo && !coSanh && !giaDat) {
    if (soTinCo <= 0) return null;
    return (
      <div className="flex gap-2.5 rounded-xl bg-cvr-surface px-4 py-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
        </svg>
        <p className="text-[12px] leading-relaxed text-cvr-muted">
          <strong className="font-semibold text-cvr-body">Chưa đủ dữ liệu để nói mặt bằng giá khu
          vực này.</strong>{" "}
          Coastal Land chỉ đưa ra con số khi có ít nhất {canToiThieu} tin cùng loại hình trong khu
          vực — hiện mới có {soTinCo} tin. Chúng tôi thà để trống còn hơn đưa một con số chưa đủ
          căn cứ.
        </p>
      </div>
    );
  }

  const dau = moc[0]?.giaM2 ?? 0;
  const cuoi = moc[moc.length - 1]?.giaM2 ?? 0;
  const tang = dau > 0 ? Math.round(((cuoi - dau) / dau) * 100) : 0;

  // Vị trí của tin này trên thước giá thấp — cao của khu vực (0…100%)
  const viTri =
    matBang && giaTinNayM2 && matBang.cao > matBang.thap
      ? Math.min(100, Math.max(0, ((giaTinNayM2 - matBang.thap) / (matBang.cao - matBang.thap)) * 100))
      : null;
  const lech =
    matBang && giaTinNayM2
      ? Math.round(((giaTinNayM2 - matBang.trungVi) / matBang.trungVi) * 100)
      : null;
  const nganh = Math.abs(lech ?? 0) < 5;

  const W = 560;
  const H = 190;
  const padX = 10;
  const padTop = 26;
  const padBottom = 30;
  const barW = coBieuDo ? (W - padX * 2) / moc.length : 0;
  const maxV = coBieuDo ? Math.max(...moc.map((m) => m.giaM2)) : 1;
  const maxSanh = coSanh ? Math.max(...soSanh.map((x) => x.trungVi)) : 1;

  return (
    <div className="space-y-5">
      {/* ── 1. TIN NÀY ĐỨNG ĐÂU TRONG KHU VỰC ────────────────────────────── */}
      {matBang && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-cvr-line">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-sm text-cvr-muted">
              {laThue ? "Giá thuê phổ biến" : "Giá bán phổ biến"} tại {matBang.tenPham}
            </span>
            <span className="text-[19px] font-bold text-cvr-ink">{vndM2(matBang.trungVi, laThue)}</span>
          </div>

          {viTri !== null && giaTinNayM2 && (
            <>
              {/* Thước giá: chấm đỏ là tin này nằm ở đâu giữa thấp nhất và cao nhất */}
              <div className="relative mt-5 h-1.5 rounded-full bg-gradient-to-r from-green-200 via-amber-200 to-red-200">
                <span
                  className="absolute -top-[5px] h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-white bg-cvr-ink shadow"
                  style={{ left: `${viTri}%` }}
                  aria-hidden
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between text-[12px] text-cvr-faint">
                <span>{vndM2(matBang.thap, laThue)}</span>
                <span className="text-[11px]">khoảng phổ biến</span>
                <span>{vndM2(matBang.cao, laThue)}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 border-t border-cvr-line pt-3">
                <span className="text-sm text-cvr-muted">Tin này</span>
                <span className="text-sm font-semibold text-cvr-ink">
                  {vndM2(giaTinNayM2, laThue)}
                  <span
                    className={`ml-2 font-bold ${
                      nganh ? "text-cvr-muted" : (lech ?? 0) > 0 ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    {nganh
                      ? "ngang mặt bằng"
                      : (lech ?? 0) > 0
                        ? `cao hơn ${lech}%`
                        : `thấp hơn ${Math.abs(lech ?? 0)}%`}
                  </span>
                </span>
              </div>
            </>
          )}

          <p className="mt-2 text-[12px] text-cvr-faint">
            Tính từ {matBang.soMau} tin cùng loại hình
            {matBang.pham === "tinh" ? " — gộp cả tỉnh vì khu vực này chưa đủ tin" : ""}
          </p>
        </div>
      )}

      {/* ── 1B. GIÁ ĐẤT NHÀ NƯỚC — con số để tính thuế trước bạ, phí công chứng.
              Chỉ hiện với tin BÁN; tin thuê không liên quan. Khớp tới TÊN ĐƯỜNG là
              đủ — bảng giá đất chia theo đoạn, mà tin đăng không ai ghi đoạn, nên
              nói rõ "mức cao nhất của tuyến" thay vì giả vờ khớp chính xác. */}
      {giaDat && !laThue && (
        <div className="rounded-xl bg-cvr-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-sm text-cvr-muted">
              Giá đất Nhà nước · {giaDat.duong}
            </span>
            <span className="text-[17px] font-bold text-cvr-ink">{vndM2(giaDat.giaM2)}</span>
          </div>
          {matBang && (
            <p className="mt-1 text-[13px] text-cvr-body">
              Giá thị trường đang gấp{" "}
              <strong className="font-semibold">
                {(matBang.trungVi / giaDat.giaM2).toFixed(1).replace(".", ",")} lần
              </strong>{" "}
              giá Nhà nước
            </p>
          )}
          <p className="mt-2 text-[12px] leading-relaxed text-cvr-faint">
            {giaDat.nhieuDoan
              ? "Mức cao nhất của tuyến đường này (vị trí mặt tiền). "
              : "Vị trí mặt tiền. "}
            Dùng để tính thuế trước bạ và phí công chứng · {giaDat.canCu}
          </p>
        </div>
      )}

      {/* ── 2. KHU NÀY ĐANG LÊN HAY XUỐNG ────────────────────────────────── */}
      {coBieuDo && chiSo && (
        <div>
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-cvr-ink">
              Xu hướng {laThue ? "giá thuê" : "giá bán"} toàn {chiSo.tinh} · {moc.length} quý gần nhất
            </span>
            <span
              className={`text-sm font-bold ${tang >= 0 ? "text-cvr-gold-ink" : "text-green-700"}`}
            >
              {tang >= 0 ? "+" : ""}
              {tang}%
            </span>
          </div>

          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-48 w-full min-w-[420px]"
              role="img"
              aria-label="Biểu đồ giá trung bình mỗi mét vuông theo quý"
            >
              {moc.map((m, i) => {
                const h = (m.giaM2 / maxV) * (H - padTop - padBottom);
                const x = padX + i * barW;
                const y = H - padBottom - h;
                const cuoiCung = i === moc.length - 1;
                return (
                  <g key={m.quy}>
                    <rect
                      x={x + barW * 0.18}
                      y={y}
                      width={barW * 0.64}
                      height={h}
                      rx={4}
                      fill={cuoiCung ? "#b89254" : "#d2d2d7"}
                    />
                    <text
                      x={x + barW / 2}
                      y={y - 7}
                      textAnchor="middle"
                      className="fill-cvr-muted"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {vndM2(m.giaM2, laThue).replace("/m²", "")}
                    </text>
                    <text
                      x={x + barW / 2}
                      y={H - 9}
                      textAnchor="middle"
                      className="fill-cvr-faint"
                      fontSize="10"
                    >
                      {nhanQuy(m.quy)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-cvr-faint">
            Giá trung bình mỗi m² theo{" "}
            <strong className="font-semibold">{tenNguonHienThi(chiSo.nguon)}</strong>
            {chiSo.loaiHinh ? ` · ${chiSo.loaiHinh}` : ""} · cập nhật {chiSo.capNhat}
          </p>
        </div>
      )}

      {/* ── 3. SO VỚI PHƯỜNG BÊN CẠNH ───────────────────────────────────── */}
      {coSanh && (
        <div>
          <p className="mb-1 text-sm font-semibold text-cvr-ink">
            {laThue ? "Giá thuê" : "Giá bán"} các khu vực lân cận
          </p>
          <p className="mb-3 text-[12px] text-cvr-faint">
            Cùng loại hình, tính từ tin đang đăng — số trong ngoặc là số tin làm mẫu
          </p>
          <div className="space-y-2">
            {soSanh.map((o) => (
              <div key={o.ten} className="flex items-center gap-3">
                <span
                  className={`w-28 shrink-0 truncate text-[13px] sm:w-36 ${
                    o.chinhNo ? "font-semibold text-cvr-ink" : "text-cvr-body"
                  }`}
                  title={o.ten}
                >
                  {o.ten}
                </span>
                <span className="h-2.5 min-w-[4px] rounded-full" style={{ width: `${(o.trungVi / maxSanh) * 100}%`, background: o.chinhNo ? "#b89254" : "#d2d2d7" }} />
                <span
                  className={`ml-auto shrink-0 text-[13px] ${
                    o.chinhNo ? "font-semibold text-cvr-ink" : "text-cvr-muted"
                  }`}
                >
                  {vndM2(o.trungVi, laThue)}
                  <span className="ml-1 text-[11px] text-cvr-faint">({o.soMau} tin)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Một khung chú thích duy nhất cho cả khối — nói thẳng số ở đâu ra và
          cảnh báo tin nằm ngoài khoảng giá, thay vì rải chữ nhỏ khắp nơi. */}
      <div className="flex gap-2.5 rounded-xl bg-cvr-surface px-4 py-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
        </svg>
        <p className="text-[12px] leading-relaxed text-cvr-muted">
          Số liệu tổng hợp từ <strong className="font-semibold text-cvr-body">tin đang đăng trên
          Coastal Land</strong>, là giá rao chứ không phải giá đã giao dịch. Trung vị và khoảng
          phổ biến tính sau khi bỏ 25% rẻ nhất và 25% đắt nhất để một tin lệch không kéo cả nhóm.
          Tin nằm ngoài khoảng giá này thì nên hỏi kỹ và xác minh thêm trước khi giao dịch.
        </p>
      </div>
    </div>
  );
}
