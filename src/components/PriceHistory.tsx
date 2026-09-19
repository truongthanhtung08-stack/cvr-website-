import type { ChiSoKhuVuc, MatBangGia, OSanh, MauSo } from "@/lib/chiSoGia";
import { vndM2, tenNguonHienThi, coDuDeHienLichSuGia, TEN_VI_TRI, TEN_MAU_SO } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// LỊCH SỬ GIÁ — nói về THỊ TRƯỜNG, không nói lại về tin đang xem:
//   1. Khu này bao nhiêu một m², đang lên hay xuống?  → ba đường theo kỳ
//   2. So với phường bên cạnh thì sao?                → bảng khu vực lân cận
//
// Ba quy tắc không phá:
//   · KHÔNG BỊA, và chưa đủ số thì ẨN HẲN khối — không vẽ, cũng không phân trần.
//   · KHÔNG PHÔ SỐ MẪU. Ngưỡng tối thiểu vẫn giữ nguyên bên trong, nhưng không
//     in "tính từ 6 tin" lên màn hình — web còn ít tin, nói ra chỉ làm người xem
//     mất tin tưởng vào con số vốn đã tính đúng.
//   · KHÔNG NHẮC LẠI GIÁ CỦA TIN NÀY. Giá tin đã nằm ngay trên đầu trang, đặt
//     thêm "tin này đắt hơn X%" vào đây là nói thừa — khách tự đối chiếu được.
// ════════════════════════════════════════════════════════════════════════════

// ── QUY ƯỚC MÀU SỐ LIỆU GIÁ — chủ dự án chốt 19/09/2026 ────────────────────
// Một quy ước duy nhất cho MỌI chỗ nói về giá, giống bảng điện chứng khoán mà
// người Việt nào cũng đọc được ngay, không phải tra chú thích:
//   XANH LÁ = TĂNG · ĐỎ = GIẢM · VÀNG = mức phổ biến (đường giữa, giá trung bình)
// Trước đây khối này tô NGƯỢC (tăng ra đỏ, giảm ra xanh) vì nhìn từ phía người
// mua "giá lên là xấu" — nhưng biểu đồ là số liệu thị trường, không phải lời
// khuyên, nên phải theo quy ước chung.
const MAU = {
  tang: "#0f8a5f",   // xanh lá — đường cao nhất, mũi tên đi lên
  giam: "#dc2626",   // đỏ — đường thấp nhất, mũi tên đi xuống
  phoBien: "#c8a250", // vàng thương hiệu — đường giá phổ biến, dày nhất
  tinNay: "#1d1d1f",  // chấm giá của chính tin đang xem — trung tính, không tranh màu
};
const CHU = { tang: "text-[#0f8a5f]", giam: "text-[#dc2626]" };

/** "2025-Q1" → "Q1/25" · "2026-09" → "T9/26" · "2025" → "2025" */
function nhanKy(q: string): string {
  const quy = q.match(/^(\d{4})-?Q([1-4])$/i);
  if (quy) return `Q${quy[2]}/${quy[1].slice(2)}`;
  const thang = q.match(/^(\d{4})-(\d{2})$/);
  if (thang) return `T${Number(thang[2])}/${thang[1].slice(2)}`;
  return q;
}

/** Bước chia trục dọc, bo về bội số dễ đọc: 1 · 2 · 2,5 · 5 · 10 nhân luỹ thừa 10. */
function buocTron(tho: number): number {
  const mu = Math.pow(10, Math.floor(Math.log10(Math.max(tho, 1))));
  return (([1, 2, 2.5, 5, 10].find((h) => h * mu >= tho) ?? 10) as number) * mu;
}

/** Số trên trục dọc: chỉ con số, đơn vị đã ghi một lần ở đầu trục. */
function soTruc(v: number, laThue: boolean): string {
  const n = laThue ? v / 1_000 : v / 1_000_000;
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n);
}

/** Lùi đúng một năm: "2026-08" → "2025-08" · "2026-Q2" → "2025-Q2" · "2026" → "2025".
 *  Dùng để nói "tăng bao nhiêu trong một năm qua" — so đúng cùng kỳ năm trước,
 *  không so với mốc đầu dãy (dãy dài ngắn khác nhau thì con số vô nghĩa). */
function luiMotNam(q: string): string {
  const thang = q.match(/^(\d{4})-(\d{2})$/);
  if (thang) return `${Number(thang[1]) - 1}-${thang[2]}`;
  const quy = q.match(/^(\d{4})-Q([1-4])$/i);
  if (quy) return `${Number(quy[1]) - 1}-Q${quy[2]}`;
  const nam = q.match(/^(\d{4})$/);
  return nam ? String(Number(nam[1]) - 1) : "";
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
  giaTinM2,
  mauSoTin,
}: {
  chiSo: ChiSoKhuVuc | null;
  matBang: MatBangGia | null;
  soSanh?: OSanh[];
  /** Giá mỗi m² của chính tin đang xem (đồng) — chấm đen trên biểu đồ. */
  giaTinM2?: number | null;
  /** Tin cho thuê thì giá mỗi m² là giá THUÊ mỗi tháng — đơn vị và chữ khác hẳn. */
  laThue?: boolean;
  /** Mẫu số của CHÍNH TIN này (đất → m² đất · nhà → m² sàn · căn hộ → m² căn).
   *  Khối mặt bằng giá tính từ tin trên web nên luôn theo mẫu số này — phải ghi ra,
   *  không để trần một con số "triệu/m²" mà người xem không biết chia cho gì. */
  mauSoTin?: MauSo;
}) {
  // Vẽ 8 mốc cuối (bản đã duyệt), nhưng BA SỐ TÓM TẮT tính trên TOÀN dãy: mức
  // thay đổi một năm và đỉnh hai năm nằm ngoài tám mốc vẽ ra.
  const caDay = (chiSo?.moc ?? []).filter((m) => m.giaM2 > 0);
  const moc = caDay.slice(-8);
  const coDuong = moc.length >= 2;
  const coSanh = soSanh.length >= 2;

  // CHƯA ĐỦ SỐ THÌ KHÔNG HIỆN GÌ CẢ. Trang tin dùng chung hàm này để bỏ luôn cả
  // tiêu đề khối, nên ở đây chỉ cần trả về rỗng — không in dòng nào, kể cả dòng
  // "chưa có dữ liệu": khách không cần biết kho số của mình dày mỏng ra sao.
  if (!coDuDeHienLichSuGia(chiSo, matBang, soSanh)) return null;

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
  // Thang trục bo về BỘI SỐ TRÒN để vạch đọc ra số đẹp (25 · 100 · 175) thay vì
  // "47,5 · 109,0 · 170,5" — số lẻ làm biểu đồ trông như máy in ra, khó đối chiếu.
  const buoc = buocTron((maxV - minV) / 5 || maxV * 0.05 || 1);
  let day = Math.floor(minV / buoc) * buoc;
  let tran = Math.ceil(maxV / buoc) * buoc;
  if (tran <= day) tran = day + buoc * 2;
  // Số bước phải chẵn thì vạch giữa mới rơi đúng một mức tròn. Nới xuống DƯỚI
  // chứ không nới lên trên: chừa trống phía trên làm đường bị dẹt xuống đáy.
  if (Math.round((tran - day) / buoc) % 2 === 1) day = Math.max(0, day - buoc);
  if (Math.round((tran - day) / buoc) % 2 === 1) tran += buoc;
  const bien = tran - day;
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

  // ── BA SỐ TÓM TẮT (đọc trước khi nhìn biểu đồ) ────────────────────────────
  const mocCuoi = caDay[caDay.length - 1];
  const mocNamTruoc = mocCuoi
    ? caDay.find((m) => m.quy === luiMotNam(mocCuoi.quy))
    : undefined;
  const doiMotNam =
    mocNamTruoc && mocNamTruoc.giaM2 > 0
      ? ((mocCuoi.giaM2 - mocNamTruoc.giaM2) / mocNamTruoc.giaM2) * 100
      : null;
  const mocDinh = caDay.reduce((a, b) => (b.giaM2 > a.giaM2 ? b : a), caDay[0]);
  // Cách đỉnh dưới 1% thì coi như đang ở đỉnh — nói "thấp hơn đỉnh 0,3%" là bắt bẻ.
  const soVoiDinh =
    mocDinh && mocDinh.giaM2 > 0 ? ((mocCuoi.giaM2 - mocDinh.giaM2) / mocDinh.giaM2) * 100 : 0;
  const dangODinh = soVoiDinh > -1;

  return (
    <div className="space-y-5">
      {/* ── 1. GIÁ KHU VỰC + ĐƯỜNG LỊCH SỬ THEO QUÝ ─────────────────────── */}
      {(matBang || coDuong) && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-cvr-line sm:p-5">
          {/* Không có đường lịch sử thì mới hiện mặt bằng giá hiện tại ở đây; có
              đường rồi thì ba ô bên dưới đã nói mức mới nhất — in hai lần một con
              số là chỗ làm người xem khựng lại. */}
          {!coDuong && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[13px] text-cvr-muted">
                  {laThue ? "Giá thuê phổ biến" : "Giá bán phổ biến"}
                  {mauSoTin ? ` mỗi ${TEN_MAU_SO[mauSoTin]}` : ""}
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
            </>
          )}

          {coDuong && (
            <>
              {/* BA SỐ ĐỌC TRƯỚC: mức mới nhất · một năm qua · so với đỉnh. Người
                  xem nắm được tình hình mà chưa cần nhìn đường vẽ. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-cvr-line">
                <div className="sm:pr-4">
                  <p className="text-[19px] font-bold leading-none tracking-tight text-cvr-ink">
                    {vndM2(mocCuoi.giaM2, laThue)}
                  </p>
                  {/* PHẢI NÓI RÕ CON SỐ NÀY LÀ CỦA ĐÂU. Trong một tỉnh, giá giữa
                      các phường lệch nhau rất xa — 80 triệu/m² "tại Đà Nẵng" mà
                      để trần thì người xem đọc thành giá của đúng phường có tin.
                      Dãy chưa tách tới phường thì ghi thẳng "toàn <tỉnh>". */}
                  <p className="mt-1.5 text-[12.5px] text-cvr-muted">
                    Giá {laThue ? "thuê" : "bán"} phổ biến nhất {nhanKy(mocCuoi.quy)}
                    {chiSo?.mauSo ? ` · mỗi ${TEN_MAU_SO[chiSo.mauSo]}` : ""}
                    {chiSo?.tinh ? ` · ${chiSo.khuVuc ? chiSo.khuVuc : `toàn ${chiSo.tinh}`}` : ""}
                    {chiSo?.viTri ? ` · ${TEN_VI_TRI[chiSo.viTri]}` : ""}
                  </p>
                </div>

                <div className="sm:px-4">
                  {doiMotNam === null ? (
                    <>
                      <p className={`text-[19px] font-bold leading-none ${tang >= 0 ? CHU.tang : CHU.giam}`}>
                        {tang >= 0 ? "▲" : "▼"} {Math.abs(tang)}%
                      </p>
                      <p className="mt-1.5 text-[12.5px] text-cvr-muted">
                        {tang >= 0 ? "Tăng" : "Giảm"} từ {nhanKy(caDay[0].quy)} đến{" "}
                        {nhanKy(mocCuoi.quy)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`text-[19px] font-bold leading-none ${doiMotNam >= 0 ? CHU.tang : CHU.giam}`}>
                        {doiMotNam >= 0 ? "▲" : "▼"} {Math.abs(doiMotNam).toFixed(1).replace(".", ",")}%
                      </p>
                      <p className="mt-1.5 text-[12.5px] text-cvr-muted">
                        {doiMotNam >= 0 ? "Đã tăng" : "Đã giảm"} trong một năm qua ·{" "}
                        {nhanKy(luiMotNam(mocCuoi.quy))} – {nhanKy(mocCuoi.quy)}
                      </p>
                    </>
                  )}
                </div>

                <div className="sm:pl-4">
                  {dangODinh ? (
                    <>
                      <p className="text-[19px] font-bold leading-none text-cvr-ink">
                        {vndM2(mocDinh.giaM2, laThue)}
                      </p>
                      <p className="mt-1.5 text-[12.5px] text-cvr-muted">
                        Đang ở mức cao nhất trong {caDay.length} {tenKy(caDay[0].quy)} gần nhất
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`text-[19px] font-bold leading-none ${CHU.giam}`}>
                        ▼ {Math.abs(soVoiDinh).toFixed(1).replace(".", ",")}%
                      </p>
                      <p className="mt-1.5 text-[12.5px] text-cvr-muted">
                        Thấp hơn đỉnh {vndM2(mocDinh.giaM2, laThue)} vào {nhanKy(mocDinh.quy)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-4 text-[13px] font-semibold text-cvr-ink">
                Lịch sử {laThue ? "giá thuê" : "giá bán"} · {moc.length} {tenKy(moc[0].quy)} gần nhất
              </p>

              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="mt-2 h-auto w-full"
                role="img"
                aria-label={`Giá mỗi mét vuông theo ${tenKy(moc[0].quy)}, ${moc.length} ${tenKy(moc[0].quy)} gần nhất${coBien ? ", ba đường: phổ biến, cao nhất, thấp nhất" : ""}`}
              >
                <line x1="0" y1={dinhY} x2={W} y2={dinhY} stroke="#ededf0" />
                <line x1="0" y1={(dinhY + dayY) / 2} x2={W} y2={(dinhY + dayY) / 2} stroke="#ededf0" />
                <line x1="0" y1={dayY} x2={W} y2={dayY} stroke="#e3e3e7" />

                {/* Vạch giá trị trên trục dọc — vẽ TRƯỚC các đường giá để nếu có
                    trùng chỗ thì đường đè lên chữ, không phải chữ đè lên đường. */}
                <text x="0" y={dinhY - 18} fontSize="9.5" fill="#86868b">
                  {laThue ? "nghìn/m²/tháng" : "tr/m²"}
                </text>
                {[
                  { y: dinhY, v: tran },
                  { y: (dinhY + dayY) / 2, v: day + bien / 2 },
                  { y: dayY, v: day },
                ].map((vach) => (
                  <text key={vach.y} x="0" y={vach.y - 4} fontSize="9.5" fill="#86868b">
                    {soTruc(vach.v, laThue)}
                  </text>
                ))}

                <path d={nen} fill={MAU.phoBien} fillOpacity={0.08} />

                {/* Hai đường biên mảnh hơn và nhạt hơn — đường phổ biến phải là
                    thứ mắt bắt được trước, hai đường kia chỉ nói khoảng dao động. */}
                {coBien && (
                  <>
                    <path d={duongCao} fill="none" stroke={MAU.tang} strokeWidth={1.6} strokeOpacity={0.75} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={duongThap} fill="none" stroke={MAU.giam} strokeWidth={1.6} strokeOpacity={0.75} strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                <path d={duong} fill="none" stroke={MAU.phoBien} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />

                {moc.map((m, i) => (
                  <circle key={m.quy} cx={toaX(i)} cy={toaY(m.giaM2)} r={3} fill="#fff" stroke={MAU.phoBien} strokeWidth={2} />
                ))}

                {/* Giá của CHÍNH tin đang xem, đặt ở mốc mới nhất: người xem thấy
                    ngay tin này đang nằm ở đâu so với mặt bằng khu vực. Giá vượt
                    ngoài khung thì ghim vào mép, không vẽ lạc ra ngoài biểu đồ. */}
                {giaTinM2 != null && giaTinM2 > 0 && (
                  <circle
                    cx={phaiX}
                    cy={Math.min(dayY, Math.max(dinhY, toaY(giaTinM2)))}
                    r={4}
                    fill={MAU.tinNay}
                    stroke="#fff"
                    strokeWidth={1.8}
                  />
                )}

                {/* KHÔNG rải số lên các đường: trục dọc đã có vạch giá trị và ba ô
                    trên đầu đã nói mức mới nhất. Ghi thêm nữa là ba lần một thông
                    tin, đúng thứ làm biểu đồ trông rối. */}

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

              {(coBien || (giaTinM2 != null && giaTinM2 > 0)) && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-cvr-muted">
                  {coBien && (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-[3px] w-4 rounded-full" style={{ backgroundColor: MAU.phoBien }} />
                        Phổ biến
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-[2px] w-4 rounded-full" style={{ backgroundColor: MAU.tang }} />
                        Cao nhất
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-[2px] w-4 rounded-full" style={{ backgroundColor: MAU.giam }} />
                        Thấp nhất
                      </span>
                    </>
                  )}
                  {giaTinM2 != null && giaTinM2 > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white" style={{ backgroundColor: MAU.tinNay }} />
                      {/* Chấm này tính theo ĐÚNG mẫu số của dãy chỉ số (xem
                          giaTinSoDuocVoiChiSo), nên phải ghi ra — đơn giá ở đầu
                          trang tin có thể tính trên mẫu số khác. */}
                      Giá tin đang xem ~{vndM2(giaTinM2, laThue)}
                      {chiSo?.mauSo ? ` mỗi ${TEN_MAU_SO[chiSo.mauSo]}` : ""}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {coDuong && chiSo && (
            <>
              {/* NÓI THẲNG ĐÂY LÀ MỨC CHUNG. Trong cùng một phường, giá còn lệch
                  2–3 lần theo con đường trước nhà — mặt tiền 10,5 m khác hẳn kiệt
                  3 m. Dãy chưa tách theo vị trí mà để trần thì người xem đọc thành
                  giá của đúng căn họ đang xem, rồi thấy lệch là mất tin ngay.
                  Tách rồi thì dòng này tự biến mất. */}
              {!chiSo.viTri && (
                <p className="mt-2 text-[11.5px] text-cvr-muted">
                  Mức chung của cả khu vực — chưa tách theo vị trí (mặt tiền đường lớn ·
                  đường nhỏ · kiệt hẻm), là ba hạng thường lệch nhau vài lần.
                </p>
              )}
              <p className="mt-2 text-[11.5px] text-cvr-faint">
                Nguồn: {tenNguonHienThi(chiSo.nguon)}
                {chiSo.loaiHinh ? ` · ${chiSo.loaiHinh}` : ""} · cập nhật {chiSo.capNhat}
              </p>
            </>
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
