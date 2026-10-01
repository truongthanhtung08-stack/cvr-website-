import React, { useEffect, useRef, useState } from "react";
import { Page, Text, useNavigate } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import DanhSachTin from "../components/DanhSachTin";
import IconCL from "../components/IconCL";
import { boDau, timTin, type Tin } from "../lib/tin";
import { danhMucTheo } from "../lib/danhMuc";

// ============================================================================
// TÌM KIẾM — CHUẨN NHƯ WEB (chủ dự án yêu cầu 28/09/2026), dùng CHUNG bộ gợi ý của web
// (/api/goi-y — cùng suggest.ts + goiYNoiLong của FilterBar):
//   · 3 tab Mua bán / Cho thuê / Dự án
//   · chưa gõ → Gợi ý phổ biến · gõ (không cần dấu) → "Tìm “…”", bậc thang khớp đủ → nới
//     dần, khu vực / loại hình / dự án khớp (chữ khớp in đậm)
//   · bấm một gợi ý là ra kết quả ngay; nút ↖ chèn gợi ý vào ô để sửa tiếp
// ============================================================================
// Xem thử trong máy (vite dev) → gợi ý lấy từ web chạy trong máy; bản build lên Zalo dùng web thật.
const WEB = import.meta.env.DEV ? "http://localhost:3000" : "https://coastalland.vn";
type Tab = "ban" | "thue" | "duan";
type GoiY = {
  label: string;
  kind: string;
  sub?: string;
  href?: string;
  keyword?: string;
  province?: string;
  district?: string;
  ward?: string;
  type?: string;
  patch?: { keyword?: string; types?: string[]; locations?: { province: string; district?: string; ward?: string }[] };
};

const TAB: { gt: Tab; nhan: string }[] = [
  { gt: "ban", nhan: "Mua bán" },
  { gt: "thue", nhan: "Cho thuê" },
  { gt: "duan", nhan: "Dự án" },
];

// Chữ khớp in đậm (không phân biệt dấu) — như panel gợi ý của web.
function ChuDam({ chu, tu }: { chu: string; tu: string }) {
  const tk = boDau(tu).split(" ").filter((t) => t.length > 1);
  if (!tk.length) return <>{chu}</>;
  return (
    <>
      {chu.split(/(\s+)/).map((w, i) => (tk.some((t) => boDau(w).replace(/[^a-z0-9]/g, "").startsWith(t)) ? <strong key={i}>{w}</strong> : <span key={i}>{w}</span>))}
    </>
  );
}

export default function TimKiem() {
  const dieuHuong = useNavigate();
  const [tab, setTab] = useState<Tab>("ban");
  const [tuKhoa, setTuKhoa] = useState("");
  const [goiY, setGoiY] = useState<GoiY[]>([]);
  const [ketQua, setKetQua] = useState<{ tu: string; ds: Tin[]; lienQuan: boolean } | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const o = useRef<HTMLInputElement>(null);

  // Gợi ý chạy theo từng chữ gõ (chờ 0,2 giây sau lần gõ cuối).
  useEffect(() => {
    const h = setTimeout(() => {
      fetch(`${WEB}/api/goi-y?md=${tab}&q=${encodeURIComponent(tuKhoa)}`)
        .then((r) => r.json())
        .then((j) => setGoiY(j.goiY ?? []))
        .catch(() => setGoiY([]));
    }, 200);
    return () => clearTimeout(h);
  }, [tuKhoa, tab]);

  const mdDs = tab === "thue" ? "thue" : "ban";

  const timChu = async (chu: string) => {
    const t = chu.trim();
    if (!t) return;
    if (tab === "duan") return dieuHuong("/du-an");
    setDangTai(true);
    try {
      const r = await timTin(t, mdDs);
      setKetQua({ tu: t, ...r });
    } finally {
      setDangTai(false);
    }
  };

  // Loại hình của web → nhãn danh mục Mini App (trang danh sách lọc theo nhãn).
  const nhanLoai = (type: string) => danhMucTheo(mdDs).find((d) => d.nhan === type || d.types.includes(type))?.nhan ?? type;
  const moDs = (kv?: string, loai?: string) => {
    const p = new URLSearchParams();
    if (kv) p.set("kv", kv);
    if (loai) p.set("loai", nhanLoai(loai));
    dieuHuong(`/ds/${mdDs}${p.toString() ? `?${p}` : ""}`);
  };

  const chon = (g: GoiY) => {
    if (g.href) {
      const h = g.href;
      if (h === "/mua-ban") return dieuHuong("/ds/ban");
      if (h === "/cho-thue") return dieuHuong("/ds/thue");
      if (h.startsWith("/bat-dong-san/")) return dieuHuong(`/tin/${h.split("/")[2]}`);
      if (h.startsWith("/du-an") || h.startsWith("/tin-tuc")) return dieuHuong(h);
      return;
    }
    if (g.patch) {
      const l = g.patch.locations?.[0];
      const kv = l ? l.ward || l.district || l.province : undefined;
      const loai = g.patch.types?.[0];
      if (kv || loai) return moDs(kv, loai);
      if (g.patch.keyword) return timChu(g.patch.keyword);
    }
    if (g.kind === "Khu vực" && g.province) return moDs(g.ward || g.district || g.province);
    if (g.kind === "Loại hình" && g.type) return moDs(undefined, g.type);
    if (g.keyword) return timChu(g.keyword);
  };

  const chenVaoO = (g: GoiY) => {
    setTuKhoa(g.keyword || g.label.replace(/^Tìm “|”$/g, ""));
    setKetQua(null);
    o.current?.focus();
  };

  return (
    <Page style={{ background: "#fff" }}>
      <TieuDe title="Tìm kiếm" />
      <form
        className="tim-dau"
        onSubmit={(e) => {
          e.preventDefault();
          timChu(tuKhoa);
        }}
      >
        <div className="tim-o">
          <input
            ref={o}
            autoFocus
            value={tuKhoa}
            onChange={(e) => {
              setTuKhoa(e.target.value);
              setKetQua(null);
            }}
            placeholder="Nhà riêng tại Đà Nẵng"
            enterKeyHint="search"
          />
          {tuKhoa && (
            <button type="button" className="tim-xoa" onClick={() => { setTuKhoa(""); setKetQua(null); o.current?.focus(); }} aria-label="Xoá">
              ×
            </button>
          )}
        </div>
        <button type="submit" className="tim-nut" aria-label="Tìm kiếm">
          <IconCL ten="timKiem" co={20} net={2.4} />
        </button>
      </form>

      <div className="tim-tab">
        {TAB.map((t) => (
          <button key={t.gt} className={t.gt === tab ? "bat" : ""} onClick={() => { setTab(t.gt); setKetQua(null); }}>
            {t.nhan}
          </button>
        ))}
      </div>

      {ketQua ? (
        <>
          <div style={{ padding: "10px 16px 0" }}>
            <Text size="small" className="chu-phu">
              {ketQua.lienQuan ? `Chưa có tin khớp đủ “${ketQua.tu}” — tin gần giống:` : `${ketQua.ds.filter((x) => !x.banSao).length} tin khớp “${ketQua.tu}”`}
            </Text>
          </div>
          <DanhSachTin ds={ketQua.ds} dangTai={dangTai} loi={undefined} trong="Chưa có tin." />
        </>
      ) : (
        <div className="tim-goi-y">
          {!tuKhoa.trim() && <p className="tim-nhom">GỢI Ý PHỔ BIẾN</p>}
          {goiY.map((g, i) => (
            <div key={`${g.label}-${i}`} className="tim-dong">
              <button className="tim-chon" onClick={() => chon(g)}>
                <IconCL ten="timKiem" co={16} />
                <span>
                  <b className="tim-nhan">
                    {g.label.startsWith("Tìm “") ? <>Tìm <strong>“{g.keyword}”</strong></> : <ChuDam chu={g.label} tu={tuKhoa} />}
                  </b>
                  {g.sub && <small>{g.sub}</small>}
                </span>
              </button>
              <button className="tim-chen" onClick={() => chenVaoO(g)} aria-label="Đưa vào ô tìm">↖</button>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
