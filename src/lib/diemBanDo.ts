import type { Listing } from "@/lib/data";
import { parseLatLng } from "@/lib/googleMaps";
import { coordOf } from "@/lib/geo";
import { chuoiDiaChiBanDo } from "@/lib/diaChiBanDo";
import type { DiemBanDo } from "@/components/MapViewGoogle";

/** Điểm bản đồ của một tin — dùng chung cho bản đồ nhiều tin (MapViewMo) và máy chủ (/api/danh-sach/…/loc). */
export function diemTuTin(it: Listing): DiemBanDo {
  const ghim = it.mapPin ? parseLatLng(it.mapPin) : null;
  const [lat, lng] = ghim ? [ghim.lat, ghim.lng] : coordOf(it.location, it.id);
  const dg = it.diaGioi;
  return {
    id: it.id,
    lat,
    lng,
    chinhXac: !!ghim,
    // Chưa ghim tay → bản đồ thay bằng toạ độ đã tra sẵn theo đúng chuỗi địa chỉ của trang tin (MapViewMo).
    ...(!ghim && dg ? { ma: `tin:${it.id}`, q: chuoiDiaChiBanDo(it.diaChiSo, dg.ward, dg.district, dg.province) } : {}),
    nhan: it.price,
    title: it.title,
    phu: `${it.price} · ${it.area}`,
    loc: it.location,
    image: it.image,
    href: `/bat-dong-san/${it.id}`,
  };
}
