// ============================================================================
// NOMINATIM (OpenStreetMap) — GỌI TỪ MÁY CHỦ
//
// Dùng chung cho route /api/dia-chi (trình duyệt hỏi qua máy chủ vì không đặt được User-Agent — xem ghi chú route đó) và
// việc máy tự tra toạ độ mỗi tin (/api/tin-dang/toa-do). Miễn phí; chính sách của họ: khai danh tính, tối đa 1 lượt/giây.
// ============================================================================

const NOMINATIM = "https://nominatim.openstreetmap.org";
// Nominatim yêu cầu khai báo ứng dụng + cách liên hệ. Khai đúng thì họ không chặn.
const UA = "CoastalLand/1.0 (+https://coastalland.vn; hotro@coastalland.vn)";

// Nhớ trong bộ nhớ máy chủ. Đủ cho nhu cầu hiện tại; hết đời tiến trình thì thôi.
const nho = new Map<string, unknown>();
const MOC_NHO = 500;

export async function hoiNominatim(duong: string): Promise<unknown> {
  if (nho.has(duong)) return nho.get(duong);
  const r = await fetch(NOMINATIM + duong, { headers: { "User-Agent": UA, "Accept-Language": "vi" } });
  if (!r.ok) throw new Error(`Nominatim ${r.status}`);
  const kq = await r.json();
  // Quá đầy thì bỏ bớt cái cũ nhất, khỏi phình bộ nhớ.
  if (nho.size >= MOC_NHO) nho.delete(nho.keys().next().value as string);
  nho.set(duong, kq);
  return kq;
}

// MÁY CHỦ TỰ TRA (timToaDo chạy trong cron toạ độ): giãn ≥ 1,1 giây giữa hai lượt cho đúng chính sách 1 lượt/giây.
// Cùng đường hỏi với /api/dia-chi?viec=tim nên dùng chung bộ nhớ ở trên.
let lanCuoi = 0;
export async function timNominatim(q: string): Promise<unknown> {
  const duong = `/search?format=json&limit=5&countrycodes=vn&accept-language=vi&q=${encodeURIComponent(q)}`;
  if (nho.has(duong)) return nho.get(duong);
  const cho = lanCuoi + 1100 - Date.now();
  if (cho > 0) await new Promise((r) => setTimeout(r, cho));
  lanCuoi = Date.now();
  try {
    return await hoiNominatim(duong);
  } catch {
    // CHỈ KHI CHẠY THỬ TRÊN MÁY (next dev): máy chạy thử không kết nối được Nominatim → hỏi qua coastalland.vn (như route).
    if (process.env.NODE_ENV === "development") {
      const r = await fetch("https://coastalland.vn/api/dia-chi?viec=tim&q=" + encodeURIComponent(q)).catch(() => null);
      if (r?.ok) return r.json();
    }
    return [];
  }
}
