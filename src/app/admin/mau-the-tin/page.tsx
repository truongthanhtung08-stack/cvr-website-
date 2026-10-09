import type { Listing } from "@/lib/data";
import { getListings, getListingDetail } from "@/lib/listingsDb";
import { getTier, type TierId } from "@/lib/packages";
import TheTinMobile from "@/components/TheTinMobile";

// ============================================================================
// MẪU DEMO THẺ TIN THEO CẤP — BẢN MOBILE (chủ dự án 09/10/2026: "lên mẫu demo trước",
// "giống một trang mạng xã hội"). Chỉ để duyệt; KHÔNG dùng ở trang thật. Tin + ảnh + video thật.
// Mỗi cấp: Trang chủ · Danh sách tin (ảnh bìa ngang / dọc) · Chi tiết tin (mọi cấp giống nhau).
// ============================================================================

export const dynamic = "force-dynamic";

// Mã ảnh bìa đã đo (09/10/2026)
const BIA_NGANG = ["79504a3155c03fcc15ebf18f", "b1bfacfed83a8cd61cfbfad9", "ef93774ed89ceb892401bb3f", "3aaabd21779ac88a2e3bcbd3", "6adef0d4cd243d2b838801af", "72e7f7de025dfe72a2694260"];
const CAP: TierId[] = ["diamond", "gold", "silver", "basic"];
const BADGE: Record<TierId, Listing["badge"]> = { diamond: "VIP", gold: "Nổi bật", silver: "Mới", basic: undefined };

type Mau = { l: Listing; anh: string[]; videos: string[]; moTa: string };

export default async function MauTheTinPage() {
  const ds = await getListings();
  const tim = (ma: string[]) => ma.map((m) => ds.find((l) => l.image?.includes(m))).filter((l): l is Listing => Boolean(l));
  const nhieuAnh = (l: Listing) => (l.imageCount ?? 0) >= 6;
  // Tin có VIDEO đứng đầu (để xem video trong lưới ảnh), rồi tới tin nhiều ảnh.
  const coVideo = ds.filter((l) => l.hasVideo && nhieuAnh(l));
  // Ưu tiên tin có ĐỦ thông tin (số phòng ngủ) để mẫu thấy đủ dòng thông số theo cấp
  const duTin = (l: Listing) => nhieuAnh(l) && Boolean(l.beds);
  const ngangDs = [...new Map([...coVideo.filter((l) => l.beds).slice(0, 1), ...ds.filter(duTin).slice(0, 4), ...tim(BIA_NGANG).filter(nhieuAnh), ...tim(BIA_NGANG)].map((l) => [l.id, l])).values()]; // mỗi cấp một tin khác nhau
  if (!ngangDs.length) return <p className="text-sm text-cvr-muted">Không tìm thấy tin mẫu.</p>;

  const day = async (l: Listing): Promise<Mau> => {
    const d = await getListingDetail(l.id);
    return { l, anh: d?.images.length ? d.images : [l.image], videos: d?.videos ?? [], moTa: d?.descriptionParas.join("\n") ?? "" };
  };
  // Mỗi cấp một tin có ẢNH BÌA NGANG (đã đo) — ảnh dọc đặt vào khung ngang bị cắt mất nửa, không xem được.
  // Tin nhiều ảnh dành cho cấp cao.
  const bia = [...new Map(tim(BIA_NGANG).map((l) => [l.id, l])).values()].sort((x, y) => (y.imageCount ?? 0) - (x.imageCount ?? 0));
  const ngang = await Promise.all(CAP.map((_, i) => day(bia[i] ?? ngangDs[i % ngangDs.length])));

  // Số đo khung ảnh ghi dưới mỗi thẻ (thẻ rộng 343px)
  const SO_DO: Record<TierId, string> = {
    diamond: "Chính 4:3 · 343×257 · 3 phụ 4:3 · 113×85 dưới",
    gold: "Khung 4:3 · 343×257: chính 245×257 trái · 2 phụ 3:4 · 96×128 phải",
    silver: "1 ảnh 4:3 · 343×257",
    basic: "1 ảnh 16:9 (Google Discover) · 343×193",
  };
  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Mẫu thẻ tin theo cấp · Mobile</h1>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-cvr-ink">Thẻ đang dùng ở trang chủ và danh sách</h2>
        <div className="flex flex-wrap items-start gap-6">
          {CAP.map((t, i) => (
            <div key={t} className="w-[375px] shrink-0">
              <p className="mb-2 text-sm font-semibold" style={{ color: getTier(t).accent }}>{getTier(t).name}</p>
              <div className="rounded-2xl border border-cvr-line bg-cvr-surface p-4">
                {/* THẺ THẬT của web (TheTinMobile) — gán thử cấp để xem đủ 4 cấp */}
                <TheTinMobile item={{ ...ngang[i].l, badge: BADGE[t] }} />
              </div>
              <p className="mt-2 text-[13px] text-cvr-ink">{SO_DO[t]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
