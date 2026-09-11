import type { ChiSoKhuVuc, MatBangGia, OSanh } from "@/lib/chiSoGia";
import { vndM2, tenNguonHienThi } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// LỊCH SỬ GIÁ — nói về THỊ TRƯỜNG, không nói lại về tin đang xem:
//   1. Khu này bao nhiêu một m², đang lên hay xuống?  → ba đường theo kỳ
//   2. So với phường bên cạnh thì sao?                → bảng khu vực lân cận
//
// Ba quy tắc không phá:
//   · KHÔNG BỊA. Thiếu dữ liệu thì không vẽ, nói thẳng là chưa đủ.
//   · KHÔNG PHÔ SỐ MẪU. Ngưỡng tối thiểu vẫn giữ nguyên bên trong, nhưng không
//     in "tính từ 6 tin" lên màn hình — web còn ít tin, nói ra chỉ làm người xem
//     mất tin tưởng vào con số vốn đã tính đúng.
//   · KHÔNG NHẮC LẠI GIÁ CỦA TIN NÀY. Giá tin đã nằm ngay trên đầu trang, đặt
//     thêm "tin này đắt hơn X%" vào đây là nói thừa — khách tự đối chiếu được.
// ════════════════════════════════════════════════════════════════════════════

/** Số trên biểu đồ bỏ đuôi "/m²" và "/tháng" cho đỡ chật — đơn vị đã nói ở trên. */
function soGon(v: number, laThue: boolean): string {
  return vndM2(v, laThue).replace("/m²", "").replace("/tháng", "");
}

/** "2025-Q1" → "Q1/25" · "2026-09" → "T9/26" · "2025" → "2025" */
function nhanKy(q: string): string {
  const quy = q.match(/^(\d{4})-?Q([1-4])$/i);
  if (quy) return `Q${quy[2]}/${quy[1].slice(2)}`;
  const thang = q.match(/^(\d{4})-(\d{2})$/);
  if (thang) return `T${Number(thang[2])}/${thang[1].slice(2)}`;
  return q;
}

/** Gọi mốc là "tháng", "quý" hay "năm" — nói sai đơn vị là mất tin ngay. */
function tenKy(q: string): string {
  if (/^\d{4}-\d{2}$/.test(q)) return "tháng";
  if (/^\d{4}-?Q[1-4]$/i.test(q)) return "quý";
  return "năm";
}

export default function PriceHistory({
  chiSo,
  matBang,
  soSanh = [],
  laThue = false,
}: {
  chiSo: ChiSoKhuVuc | null;
  matBang: MatBangGia | null;
  soSanh?: OSanh[];
  /** Tin cho thuê thì giá mỗi m² là giá THUÊ mỗi tháng — đơn vị và chữ khác hẳn. */
  laThue?: boolean;
}) {
  const moc = (chiSo?.moc ?? []).filter((m) => m.giaM2 > 0).slice(-8);
  const coDuong = moc.length >= 2;
  const coSanh = soSanh.length >= 2;

  // Chưa có số thì MỘT DÒNG, trung tính, hướng về phía trước. Không kể đang có
  // mấy tin, không nêu ngưỡng, không phân trần "thà để trống còn hơn…" — đó là
  // chuyện nội bộ, khách không cần nghe.
  if (!matBang && !coDuong && !coSanh)
    return (
      <p className="text-[13px] text-cvr-muted">
        Chưa đủ dữ liệu, sẽ cập nhật khi có báo cáo mới.
      </p>
    );

  // ── Toạ độ biểu đồ đường ─────────────────────────────────────────────────
  const W = 480;
  const H = 170;
  const traiX = 16;
  const phaiX = 464;
  const dinhY = 34;
  const dayY = 124;

  const gia = moc.map((m) => m.giaM2);
  // BA ĐƯỜNG: phổ biến · thấp nhất · cao nhất. Chỉ vẽ hai đường biên khi MỌI kỳ
  // đều có đủ số — thiếu một kỳ mà vẫn nối là bịa ra đoạn không có dữ liệu.
  const coBien = moc.every((m) => (m.thap ?? 0) > 0 && (m.cao ?? 0) > 0);
  const tatCaGia = coBien
    ? moc.flatMap((m) => [m.thap as number, m.giaM2, m.cao as number])
    : gia;
  const minV = Math.min(...tatCaGia);
  const maxV = Math.max(...tatCaGia);
  // Nới hai đầu 8% để đường không dính sát mép trên/dưới khung.
  const dem = (maxV - minV) * 0.08 || maxV * 0.05 || 1;
  const day = minV - dem;
  const bien = maxV + dem - day;
  const toaX = (i: number) => traiX + (i * (phaiX - traiX)) / Math.max(1, moc.length - 1);
  const toaY = (v: number) => dayY - ((v - day) / bien) * (dayY - dinhY);
  const veDuong = (lay: (m: (typeof moc)[number]) => number) =>
    moc.map((m, i) => `${i === 0 ? "M" : "L"}${toaX(i).toFixed(1)} ${toaY(lay(m)).toFixed(1)}`).join(" ");
  const duong = veDuong((m) => m.giaM2);
  const duongThap = coBien ? veDuong((m) => m.thap as number) : "";
  const duongCao = coBien ? veDuong((m) => m.cao as number) : "";
  // Có hai đường biên thì tô vùng giữa chúng thay vì tô xuống đáy — vùng đó
  // chính là khoảng giá của thị trường, nói lên nhiều hơn một mảng màu trang trí.
  const nen = coBien
    ? `${duongCao} ${moc
        .map((m, i) => `L${toaX(moc.length - 1 - i).toFixed(1)} ${toaY(moc[moc.length - 1 - i].thap as number).toFixed(1)}`)
        .join(" ")} Z`
    : `${duong} L${phaiX} ${dayY} L${traiX} ${dayY} Z`;

  const dau = gia[0];
  const cuoi = gia[gia.length - 1];
  const tang = dau > 0 ? Math.round(((cuoi - dau) / dau) * 100) : 0;

  const maxSanh = coSanh ? Math.max(...soSanh.map((x) => x.trungVi)) : 1;

  return (
    <div className="space-y-5">
      {/* ── 1. GIÁ KHU VỰC + ĐƯỜNG LỊCH SỬ THEO QUÝ ─────────────────────── */}
      {(matBang || coDuong) && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-cvr-line sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-[13px] text-cvr-muted">
              {laThue ? "Giá thuê phổ biến" : "Giá bán phổ biến"}
              {matBang ? ` tại ${matBang.tenPham}` : chiSo ? ` tại ${chiSo.khuVuc || chiSo.tinh}` : ""}
            </span>
            <span className="text-[23px] font-bold leading-none tracking-tight text-cvr-ink">
              {vndM2(matBang ? matBang.trungVi : cuoi, laThue)}
            </span>
          </div>

          {matBang && (
            <p className="mt-1.5 text-[12.5px] text-cvr-muted">
              Khoảng phổ biến {vndM2(matBang.thap, laThue).replace("/m²", "")} –{" "}
              {vndM2(matBang.cao, laThue)}
            </p>
          )}

          {coDuong && (
            <>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-cvr-line pt-4">
                <span className="text-[13px] font-semibold text-cvr-ink">
                  Lịch sử {laThue ? "giá thuê" : "giá bán"} · {moc.length} {tenKy(moc[0].quy)} gần
                  nhất
                </span>
                <span className={`text-[13px] font-bold ${tang >= 0 ? "text-red-600" : "text-green-700"}`}>
                  {tang >= 0 ? "+" : ""}
                  {tang}%
                </span>
              </div>

              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mt-2 h-auto w-full"
                role="img"
                aria-label={`Giá mỗi mét vuông theo ${tenKy(moc[0].quy)}, ${moc.length} ${tenKy(moc[0].quy)} gần nhất${coBien ? ", ba đường: phổ biến, cao nhất, thấp nhất" : ""}`}
              >
                <line x1="0" y1={dinhY} x2={W} y2={dinhY} stroke="#ededf0" />
                <line x1="0" y1={(dinhY + dayY) / 2} x2={W} y2={(dinhY + dayY) / 2} stroke="#ededf0" />
                <line x1="0" y1={dayY} x2={W} y2={dayY} stroke="#e3e3e7" />

                <path d={nen} fill="#0071e3" fillOpacity={0.06} />

                {/* Hai đường biên mảnh hơn và nhạt hơn — đường phổ biến phải là
                    thứ mắt bắt được trước, hai đường kia chỉ nói khoảng dao động. */}
                {coBien && (
                  <>
                    <path d={duongCao} fill="none" stroke="#dc2626" strokeWidth={1.6} strokeOpacity={0.75} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={duongThap} fill="none" stroke="#0f8a5f" strokeWidth={1.6} strokeOpacity={0.75} strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                <path d={duong} fill="none" stroke="#0071e3" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />

                {moc.map((m, i) => (
                  <circle key={m.quy} cx={toaX(i)} cy={toaY(m.giaM2)} r={3} fill="#fff" stroke="#0071e3" strokeWidth={2} />
                ))}

                {/* Nhãn giá ở kỳ CUỐI của từng đường. Ba đường mà rải số khắp nơi
                    là rối ngay — chỉ ghi mức mới nhất, phần còn lại nhìn dốc là đủ. */}
                {coBien ? (
                  <>
                    <text x={phaiX} y={toaY(moc[moc.length - 1].cao as number) - 8} textAnchor="end" fontSize="10.5" fontWeight="600" fill="#c0392b">
                      {soGon(moc[moc.length - 1].cao as number, laThue)}
                    </text>
                    <text x={phaiX} y={toaY(cuoi) - 9} textAnchor="end" fontSize="11.5" fontWeight="700" fill="#1d1d1f">
                      {soGon(cuoi, laThue)}
                    </text>
                    <text x={phaiX} y={toaY(moc[moc.length - 1].thap as number) + 15} textAnchor="end" fontSize="10.5" fontWeight="600" fill="#0f8a5f">
                      {soGon(moc[moc.length - 1].thap as number, laThue)}
                    </text>
                  </>
                ) : (
                  <>
                    <text x={traiX} y={toaY(dau) - 11} textAnchor="start" fontSize="11" fontWeight="600" fill="#6e6e73">
                      {soGon(dau, laThue)}
                    </text>
                    <text x={phaiX} y={toaY(cuoi) - 11} textAnchor="end" fontSize="11.5" fontWeight="700" fill="#1d1d1f">
                      {soGon(cuoi, laThue)}
                    </text>
                  </>
                )}

                {moc.map((m, i) => (
                  <text
                    key={`n-${m.quy}`}
                    x={toaX(i)}
                    y={dayY + 20}
                    textAnchor={i === 0 ? "start" : i === moc.length - 1 ? "end" : "middle"}
                    fontSize="10.5"
                    fill="#86868b"
                  >
                    {nhanKy(m.quy)}
                  </text>
                ))}
              </svg>

              {coBien && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-cvr-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-[3px] w-4 rounded-full bg-[#0071e3]" />
                    Phổ biến
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-[2px] w-4 rounded-full bg-[#dc2626]" />
                    Cao nhất
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-[2px] w-4 rounded-full bg-[#0f8a5f]" />
                    Thấp nhất
                  </span>
                </div>
              )}
            </>
          )}

          {coDuong && chiSo && (
            <p className="mt-2 text-[11.5px] text-cvr-faint">
              Nguồn: {tenNguonHienThi(chiSo.nguon)}
              {chiSo.loaiHinh ? ` · ${chiSo.loaiHinh}` : ""} · cập nhật {chiSo.capNhat}
            </p>
          )}
        </div>
      )}

      {/* ── 2. SO VỚI KHU VỰC LÂN CẬN ───────────────────────────────────── */}
      {coSanh && (
        <div>
          <p className="mb-3 text-[13px] font-semibold text-cvr-ink">
            {laThue ? "Giá thuê" : "Giá bán"} các khu vực lân cận
          </p>
          <div className="space-y-2.5">
            {soSanh.map((o) => (
              <div key={o.ten} className="flex items-center gap-3 text-[13px]">
                <span
                  className={`w-28 shrink-0 truncate sm:w-36 ${o.chinhNo ? "font-semibold text-cvr-ink" : "text-cvr-body"}`}
                  title={o.ten}
                >
                  {o.ten}
                </span>
                <span
                  className="h-2.5 min-w-[4px] rounded-full"
                  style={{
                    width: `${(o.trungVi / maxSanh) * 100}%`,
                    background: o.chinhNo ? "#0071e3" : "#d2d2d7",
                  }}
                />
                <span className={`ml-auto shrink-0 ${o.chinhNo ? "font-semibold text-cvr-ink" : "text-cvr-muted"}`}>
                  {vndM2(o.trungVi, laThue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Một dòng duy nhất, và chỉ vì bắt buộc: khách phải biết đây là giá RAO
          chứ không phải giá đã giao dịch. Cách tính bên trong là việc của mình,
          không đem ra giải thích. */}
      <p className="text-[11.5px] text-cvr-faint">Giá rao trên thị trường, không phải giá đã giao dịch.</p>
    </div>
  );
}
