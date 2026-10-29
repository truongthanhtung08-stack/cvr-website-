// APP NGÂN HÀNG — nhấn logo mở THẲNG app (không qua trang trung gian dl.vietqr.io: trang đó chen vào lịch sử làm Back rối,
// và không điền sẵn được số tiền — 27/10/2026). Khách vào app chọn Quét mã QR → ảnh mã đã Lưu (số tiền nằm trong mã).
// Danh sách + cách mở lấy từ api.vietqr.io (android/ios-app-deeplinks) ngày 27/10/2026. Logo: cdn.vietqr.io.
// [mã app, tên app, scheme Android, gói Android, đường mở iPhone (rỗng = iPhone không mở được)]
const DS: [string, string, string, string, string][] = [
  ["icb", "VietinBank iPay", "vietinbankipay", "com.vietinbank.ipay", "vietinbankipay://"],
  ["bidv", "BIDV SmartBanking", "bidv.smartbanking.partner", "com.vnpay.bidv", "bidv.smartbanking.partner://"],
  ["ocb", "OCB OMNI", "newomni-app", "vn.com.ocb.awe", "newomni-app://"],
  ["acb", "ACB ONE", "acbone", "mobile.acb.com.vn", "acbone://"],
  ["mb", "MB Bank", "mbbank", "com.mbmobile", "mbbank://"],
  ["vcb", "VCB Digibank", "vietcombankmobile", "com.VCB", "vietcombankmobile://"],
  ["tcb", "Techcombank Mobile", "tcb", "vn.com.techcombank.bb.app", "tcb://"],
  ["vpb", "VPBank NEO", "vpbankneo", "com.vnpay.vpbankonline", "vpbankneo://"],
  ["vib-2", "MyVIB", "myvib2", "com.vib.myvib2", "myvib2://"],
  ["shb", "SHB SAHA", "shbmobile", "vn.shb.saha.mbanking", "shbmobile://"],
  ["lpb", "LPBank", "lv24h", "vn.com.lpb.lienviet24h", "lv24h://"],
  ["seab", "SeAMobile", "seamobile", "vn.com.seabank.mb1", "seamobile://"],
  ["scb", "SCB Mobile Banking", "scbmobilebanking", "com.vnpay.SCB", "scbmobilebanking://"],
  ["cake", "CAKE - Ngân hàng số", "cake.vn", "xyz.be.cake", "cake.vn://"],
  ["hdb", "HDBank", "hdbankmobile", "com.vnpay.hdbank", "hdbankmobile://"],
  ["vba", "Agribank Plus", "agribankmobile", "com.vnpay.Agribank3g", "agribankmobile://"],
  ["tpb", "TPBank Mobile", "hydro", "com.tpb.mb.gprsandroid", "hydro://"],
  ["timo", "Timo - Ngân hàng số by BVBank", "plus", "io.lifestyle.plus", "plus://"],
  ["vib", "MyVIB", "myvib", "com.vib.myvib2", ""],
  ["shbvn", "Shinhan SOL Việt Nam", "shinhanglbvnbank", "com.shinhan.global.vn.bank", "shinhanglbvnbank://"],
  ["nab", "Nam A Bank Open Banking", "deeplinkapp", "ops.namabank.com.vn", ""],
  ["abb", "ABBank", "abbankmobile", "vn.abbank.retail", "abbankmobile://"],
  ["eib", "Eximbank EDigi", "eximbankmobile", "com.vnpay.EximBankOmni", "eximbankmobile://"],
  ["coopbank", "Co-opBank Mobile Banking", "coopbankmobile", "com.vnpay.coopbank", "coopbankmobile://"],
  ["pvcb", "PVConnect", "pvcombankapp", "com.pvcombank.retail", "pvcombankapp://"],
  ["wvn", "Woori WON Vietnam", "wvbs", "vn.com.woori.smart", "wvbs://"],
  ["klb", "KienlongBank Plus", "ksbank", "com.sunshine.ksbank", "kienlongbankmobilebanking://"],
  ["bvb", "BAOVIET Smart", "baovietmobile", "com.vnpay.bvbank", "baovietmobile://"],
  ["vab", "Vietbank Digital Plus", "vabmobilebanking", "com.vn.vietbankomni", "vabmobilebanking://"],
  ["ncb", "NCB iziMobile", "ncbizimobile", "com.ncb.bank", "ncbizimobile://"],
  ["oceanbank", "Ocean Bank Mobile Banking", "oceanbankmobilebanking", "com.aci.ocean.mobile", "oceanbankmobilebanking://"],
  ["pbvn", "PB engage VN", "publicbankmobile", "com.vnpay.publicbank", "publicbankmobile://"],
  ["sgicb", "SAIGONBANK Smart Banking", "Sgbmobile", "com.vnpay.sgbank", "saigonbankmobilebanking://"],
  ["cimb", "Octo by CIMB Vietnam", "cimb", "vn.cimbbank.octo", "cimb://"],
];

export type AppNganHang = { id: string; ten: string; logo: string; android: string; iphone: string };

export const APP_NGAN_HANG: AppNganHang[] = DS.map(([id, ten, scheme, goi, iphone]) => ({
  id,
  ten,
  logo: `https://cdn.vietqr.io/bank-app-icon/${id}-android.webp`,
  // Chưa cài app → mở trang app trên CH Play
  android: `intent://#Intent;scheme=${scheme};package=${goi};S.browser_fallback_url=${encodeURIComponent(`https://play.google.com/store/apps/details?id=${goi}`)};end`,
  iphone,
}));
