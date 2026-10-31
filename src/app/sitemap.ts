import type { MetadataRoute } from "next";
import { getProjects, getArticles } from "@/lib/contentDb";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { getChuyenGia, NGUONG_INDEX_HO_SO } from "@/lib/chuyenGiaDb";
import { duAnThuocNhom, NGUONG_INDEX_DANH_MUC, projectCategories, rentCategories, saleCategories, soTinDanhMuc } from "@/lib/categories";
import { packages, trangTienIchDat, utilityTools } from "@/lib/packages";
import { khuVucList, khuVucTrongDiem, slugKhuVuc, timKhuVuc } from "@/lib/khuVuc";
import { trangGiaNhaDat } from "@/lib/giaNhaDat";
import { banGocCua, tinDatChuan, trangIndex } from "@/lib/pseo";
import { NGUONG_INDEX_CDT, nhomChuDauTu } from "@/lib/chuDauTu";
import { duongDanTin } from "@/lib/duongDanTin";

// TỰ LÀM MỚI MỖI GIỜ. Trước đây để `force-static` (di sản thời GitHub Pages):
// sitemap chỉ sinh 1 lần lúc build, nên MỌI tin/dự án/bài viết đăng sau lần
// deploy gần nhất đều KHÔNG có trong sitemap → Google không biết mà vào lấy.
// 03/10/2026: đo thật bản lưu sẵn 9 tiếng chưa làm mới (Age 32920) → tin vừa hết hạn vẫn
// nằm trong sitemap. Dựng mới mỗi lượt đọc: dữ liệu bên dưới vẫn có cache theo thẻ
// "listings" (60s, xoá ngay khi tin hết hạn/duyệt) nên không chậm, mà luôn đúng.
export const dynamic = "force-dynamic";

// sitemap.xml (Next tự sinh khi build) — giúp Google phát hiện & lập chỉ mục nhanh.
// Gồm các trang tĩnh chính + trang chi tiết động (dự án, tin tức, bất động sản).
// Lỗi tải dữ liệu → CHỈ giữ trang tĩnh, KHÔNG làm hỏng build.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE = "https://coastalland.vn";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/mua-ban", "/cho-thue", "/du-an", "/tin-tuc",
    // KHÔNG đưa /so-sanh, /tin-luu, /tim-kiem vào sitemap: nội dung sinh theo
    // từng khách hoặc theo bộ lọc → Google coi là trang mỏng/trùng lặp.
    "/gioi-thieu", "/chuyen-gia", "/bao-gia-dang-tin", "/dang-tin",
    "/chuyen-gia/da-nang", "/chuyen-gia/hue", "/chuyen-gia/dang-ky",
  ].map((p) => ({
    url: `${SITE}${p}`,
    // Không ghi lastmod cho trang tĩnh/danh mục: MASTER 6.4 chỉ cho ghi ngày nội dung đổi thật.
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  // TRANG THÔNG TIN & PHÁP LÝ — ít thay đổi, nhưng Google dùng để chấm độ TIN CẬY
  // của một sàn (E-E-A-T): có địa chỉ, có điều khoản, có kênh khiếu nại rõ ràng.
  // Bỏ chúng ra ngoài sitemap là mất không một điểm cộng miễn phí.
  const infoRoutes: MetadataRoute.Sitemap = [
    "/lien-he", "/huong-dan", "/faq", "/quy-dinh", "/quy-che",
    "/dieu-khoan", "/bao-mat", "/tuyen-dung", "/gop-y",
  ].map((p) => ({ url: `${SITE}${p}`, changeFrequency: "monthly" as const, priority: 0.4 }));

  // Trang DANH MỤC loại hình — nhóm từ khoá quan trọng nhất của sàn
  // ("bán căn hộ chung cư Đà Nẵng", "cho thuê văn phòng Huế"…)
  // Cổng 3 tin (20/10/2026): danh mục mua bán / cho thuê chưa đủ 3 tin còn hạn đã noindex ở trang → không khai ở đây.
  const tinDm = await getListings().catch(() => []);
  const duAnDm = await getProjects().catch(() => []); // nhóm dự án chưa có dự án nào: không khai (22/10/2026)
  const categoryRoutes: MetadataRoute.Sitemap = [
    ...saleCategories.filter((c) => soTinDanhMuc(tinDm, c, "ban") >= NGUONG_INDEX_DANH_MUC).map((c) => `/mua-ban/${c.slug}`),
    ...rentCategories.filter((c) => soTinDanhMuc(tinDm, c, "thue") >= NGUONG_INDEX_DANH_MUC).map((c) => `/cho-thue/${c.slug}`),
    ...projectCategories.filter((c) => duAnThuocNhom(duAnDm, c).length > 0).map((c) => `/du-an/${c.slug}`),
  ].map((p) => ({ url: `${SITE}${p}`, changeFrequency: "daily" as const, priority: 0.9 }));

  // Trang gói dịch vụ & công cụ tiện ích
  const toolRoutes: MetadataRoute.Sitemap = [...packages, ...utilityTools].filter(trangTienIchDat).map((t) => ({
    url: `${SITE}/tien-ich/${t.slug}`,
   
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const dynamic: MetadataRoute.Sitemap = [];
  try {
    const [projects, articles, listings, chuyenGia, tinHetHan] = await Promise.all([
      getProjects(), getArticles(), getListings(), getChuyenGia(), getListingsHetHan(),
    ]);
    // KHAI CẢ ẢNH của từng trang (sitemap ảnh). Bất động sản là ngành khách xem
    // BẰNG MẮT: rất nhiều người tìm qua Google Hình ảnh rồi mới bấm vào web.
    // Không khai thì ảnh tin gần như không bao giờ được lập chỉ mục.
    const anhTuyetDoi = (u?: string) => (!u ? [] : [u.startsWith("http") ? u : `${SITE}${u}`]);

    // ── TRANG THEO KHU VỰC — CHỈ khu vực ĐANG CÓ TIN ────────────────────────
    // /mua-ban/da-nang · /cho-thue/hue · /du-an/quang-ngai …
    // Nhóm truy vấn địa phương là nhóm đông nhất của ngành. Nhưng chỉ đưa vào
    // sitemap khu vực có tin thật: rải hàng loạt trang rỗng là cách nhanh nhất
    // để Google đánh giá thấp cả tên miền (trang khu vực rỗng đã tự gắn noindex).
    const tinhCua = (loc: string) => loc.split(",").pop()?.trim() ?? "";
    const demTheo = (arr: { location: string }[]) => {
      const m = new Map<string, number>();
      for (const x of arr) {
        const t = tinhCua(x.location);
        if (t) m.set(t, (m.get(t) ?? 0) + 1);
      }
      return m;
    };
    const demBan = demTheo(listings.filter((l) => (l.purpose ?? "ban") === "ban"));
    const demThue = demTheo(listings.filter((l) => (l.purpose ?? "ban") === "thue"));
    const demDuAn = demTheo(projects);

    for (const [duong, dem] of [["/mua-ban", demBan], ["/cho-thue", demThue], ["/du-an", demDuAn]] as const) {
      for (const [ten, so] of dem) {
        // Tin mua bán / cho thuê: cổng 3 tin như trang (20/10/2026); dự án giữ luật cũ (có là khai)
        if (so <= 0 || (duong !== "/du-an" && so < NGUONG_INDEX_DANH_MUC)) continue;
        const kv = khuVucList.find((k) => k.name === ten);
        if (!kv) continue;
        dynamic.push({
          url: `${SITE}${duong}/${kv.slug}`,
         
          changeFrequency: "daily",
          // Trang khu vực đông tin đáng ưu tiên ngang trang danh mục loại hình
          priority: so >= 10 ? 0.9 : 0.7,
        });
      }
    }

    // ── TRANG pSEO (src/lib/pseo.ts) — CHỈ trang qua cổng chất lượng (≥ 3 tin còn hạn,
    // không trùng trang cha). lastmod = lần đăng/đẩy tin mới nhất của chính trang đó.
    for (const p of trangIndex([...listings, ...tinHetHan])) { // cổng đếm cả tin hết hạn (29/10/2026)
      dynamic.push({
        url: `${SITE}${p.path}`,
        ...(p.moiNhat ? { lastModified: new Date(p.moiNhat) } : {}),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // TRANG GIÁ NHÀ ĐẤT THEO TỈNH (kế hoạch SEO 5b-D3, 27/10/2026) — chỉ tỉnh qua cổng (≥ 2 loại hình có số)
    for (const t of khuVucTrongDiem) {
      const kv = timKhuVuc(slugKhuVuc(t));
      if (kv && trangGiaNhaDat(kv, [...listings, ...tinHetHan]).index) dynamic.push({ url: `${SITE}/gia-nha-dat/${kv.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }

    // TRANG CHỦ ĐẦU TƯ — chỉ chủ đầu tư có ≥ 2 dự án đã đăng (src/lib/chuDauTu.ts)
    for (const [cdt, g] of nhomChuDauTu(projects)) {
      if (g.duAn.length >= NGUONG_INDEX_CDT) dynamic.push({ url: `${SITE}/chu-dau-tu/${cdt}`, changeFrequency: "weekly", priority: 0.6 });
    }

    for (const p of projects) {
      dynamic.push({
        url: `${SITE}/du-an/${p.slug}`, changeFrequency: "weekly", priority: 0.7,
        // Chỉ ảnh thật của dự án — chưa có ảnh thì không gửi ảnh mẫu chung cho Google (30/10/2026)
        images: (p.photos ?? []).slice(0, 5).flatMap(anhTuyetDoi),
      });
    }
    for (const a of articles) {
      dynamic.push({
        url: `${SITE}/tin-tuc/${a.slug}`, changeFrequency: "monthly", priority: 0.6,
        images: anhTuyetDoi(a.image),
      });
    }
    // Ngày sửa THẬT (đẩy tin / đăng) — khai "vừa sửa" cho mọi trang thì Google thôi tin
    // ngày này và ít quay lại đọc.
    const ngayTin = (l: { bumpedAt?: string; postedAt?: string }) => {
      const d = new Date(l.bumpedAt ?? l.postedAt ?? "");
      return Number.isNaN(d.getTime()) ? now : d;
    };
    // Chỉ tin ĐẠT CHUẨN (≥ 3 ảnh thật, mô tả ≥ 100 ký tự) — tin chưa đạt gắn noindex ở trang tin.
    const tatCaTin = [...listings, ...tinHetHan];
    for (const l of listings.filter((x) => tinDatChuan(x) && !banGocCua(x, tatCaTin))) {
      dynamic.push({
        url: `${SITE}${duongDanTin(l)}`, lastModified: ngayTin(l), changeFrequency: "weekly", priority: 0.7,
        images: anhTuyetDoi(l.image),
      });
    }
    // TIN HẾT HẠN cũng khai (chủ dự án 08/10/2026): trang vẫn mở, vẫn lập chỉ mục.
    for (const l of tinHetHan.filter((x) => tinDatChuan(x) && !banGocCua(x, tatCaTin))) {
      dynamic.push({
        url: `${SITE}${duongDanTin(l)}`, lastModified: ngayTin(l), changeFrequency: "monthly", priority: 0.5,
        images: anhTuyetDoi(l.image),
      });
    }
    // HỒ SƠ CHUYÊN GIA — mỗi môi giới thật một trang, nội dung là tin thật của họ.
    // Đây là loại trang Google rất chuộng cho truy vấn "môi giới bất động sản
    // <khu vực>", mà lại sinh ra miễn phí từ dữ liệu đã có. Không khai vào sitemap
    // thì Google gần như không tự tìm ra (trang chỉ được link từ danh bạ).
    // CHỈ khai hồ sơ ĐỦ TIN (xem NGUONG_INDEX_HO_SO trong chuyenGiaDb.ts). Hồ sơ
    // mỏng đã tự gắn noindex; khai chúng trong sitemap nữa là vừa mời Google vào
    // một trang mình bảo đừng lập chỉ mục, vừa tự báo cáo là site nhiều trang mỏng.
    for (const cg of chuyenGia) {
      if (cg.soTin < NGUONG_INDEX_HO_SO || cg.laCongTy) continue;
      dynamic.push({
        url: `${SITE}/chuyen-gia/${cg.slug}`, changeFrequency: "weekly", priority: 0.6,
        images: anhTuyetDoi(cg.anh),
      });
    }
  } catch {
    // Bỏ qua — giữ nguyên các trang tĩnh.
  }

  return [...staticRoutes, ...infoRoutes, ...categoryRoutes, ...toolRoutes, ...dynamic];
}
