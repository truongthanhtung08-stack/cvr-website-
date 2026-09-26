// Danh mục loại BĐS — CHÉP từ src/lib/categories.ts của web (nguồn duy nhất của menu + trang danh mục).
// Web đổi danh mục thì chép lại file này. types = tên loại hình đúng như cột listings.type.
export type DanhMuc = { slug: string; nhan: string; types: string[] };

export const DM_BAN: DanhMuc[] = [
  {
    "slug": "can-ho-chung-cu",
    "nhan": "Căn hộ chung cư",
    "types": [
      "Căn hộ",
      "Chung cư"
    ]
  },
  {
    "slug": "nha-rieng",
    "nhan": "Nhà riêng",
    "types": [
      "Nhà riêng"
    ]
  },
  {
    "slug": "biet-thu-lien-ke",
    "nhan": "Nhà biệt thự, liền kề",
    "types": [
      "Nhà biệt thự / Liền kề"
    ]
  },
  {
    "slug": "nha-mat-pho",
    "nhan": "Nhà mặt phố",
    "types": [
      "Nhà mặt phố"
    ]
  },
  {
    "slug": "shophouse",
    "nhan": "Shophouse, nhà phố thương mại",
    "types": [
      "Shophouse / Nhà phố thương mại"
    ]
  },
  {
    "slug": "dat-nen-du-an",
    "nhan": "Đất nền dự án",
    "types": [
      "Đất nền / Đất nền dự án"
    ]
  },
  {
    "slug": "dat",
    "nhan": "Đất",
    "types": [
      "Đất nông nghiệp",
      "Đất nền / Đất nền dự án"
    ]
  },
  {
    "slug": "trang-trai-nghi-duong",
    "nhan": "Trang trại, khu nghỉ dưỡng",
    "types": [
      "Villa / Biệt thự biển"
    ]
  },
  {
    "slug": "condotel",
    "nhan": "Condotel",
    "types": [
      "Condotel"
    ]
  },
  {
    "slug": "kho-nha-xuong",
    "nhan": "Kho, nhà xưởng",
    "types": [
      "Kho / Nhà xưởng",
      "Đất công nghiệp"
    ]
  },
  {
    "slug": "bds-khac",
    "nhan": "Bất động sản khác",
    "types": [
      "Bất động sản khác"
    ]
  }
];

export const DM_THUE: DanhMuc[] = [
  {
    "slug": "can-ho-chung-cu",
    "nhan": "Căn hộ chung cư",
    "types": [
      "Căn hộ",
      "Chung cư",
      "Căn hộ dịch vụ"
    ]
  },
  {
    "slug": "nha-rieng",
    "nhan": "Nhà riêng",
    "types": [
      "Nhà riêng"
    ]
  },
  {
    "slug": "biet-thu-lien-ke",
    "nhan": "Nhà biệt thự, liền kề",
    "types": [
      "Biệt thự / Liền kề"
    ]
  },
  {
    "slug": "nha-mat-pho",
    "nhan": "Nhà mặt phố",
    "types": [
      "Nhà mặt phố"
    ]
  },
  {
    "slug": "shophouse",
    "nhan": "Shophouse, nhà phố thương mại",
    "types": [
      "Nhà phố thương mại"
    ]
  },
  {
    "slug": "phong-tro",
    "nhan": "Nhà trọ, phòng trọ",
    "types": [
      "Nhà trọ / Phòng trọ"
    ]
  },
  {
    "slug": "van-phong",
    "nhan": "Văn phòng",
    "types": [
      "Văn phòng"
    ]
  },
  {
    "slug": "cua-hang-ki-ot",
    "nhan": "Cửa hàng, ki ốt",
    "types": [
      "Mặt bằng / Cửa hàng bán lẻ"
    ]
  },
  {
    "slug": "kho-nha-xuong",
    "nhan": "Kho, nhà xưởng, đất",
    "types": [
      "Thuê đất / Nhà xưởng / Kho bãi"
    ]
  },
  {
    "slug": "bds-khac",
    "nhan": "Bất động sản khác",
    "types": [
      "Bất động sản khác"
    ]
  }
];

// Dự án: types là CHUỖI CON dò trong cột projects.type (giống web).
export const DM_DU_AN: DanhMuc[] = [
  {
    "slug": "can-ho-chung-cu",
    "nhan": "Căn hộ chung cư",
    "types": [
      "Căn hộ",
      "Chung cư"
    ]
  },
  {
    "slug": "khu-do-thi-moi",
    "nhan": "Khu đô thị mới",
    "types": [
      "Khu đô thị"
    ]
  },
  {
    "slug": "khu-nghi-duong",
    "nhan": "Khu nghỉ dưỡng, sinh thái",
    "types": [
      "Nghỉ dưỡng",
      "Sinh thái"
    ]
  },
  {
    "slug": "nha-o-xa-hoi",
    "nhan": "Nhà ở xã hội",
    "types": [
      "Nhà ở xã hội"
    ]
  },
  {
    "slug": "cao-oc-van-phong",
    "nhan": "Cao ốc văn phòng",
    "types": [
      "Văn phòng"
    ]
  },
  {
    "slug": "trung-tam-thuong-mai",
    "nhan": "Trung tâm thương mại",
    "types": [
      "Thương mại"
    ]
  },
  {
    "slug": "biet-thu-lien-ke",
    "nhan": "Biệt thự, liền kề",
    "types": [
      "Biệt thự",
      "Liền kề"
    ]
  },
  {
    "slug": "shophouse",
    "nhan": "Shophouse",
    "types": [
      "Shophouse"
    ]
  }
];

export const danhMucTheo = (md: "ban" | "thue") => (md === "thue" ? DM_THUE : DM_BAN);
