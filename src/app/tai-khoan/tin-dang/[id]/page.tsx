"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/Ui";
import {
  type ListingRow,
  purposeLabel,
  listingStatusBadge,
  tierBadge,
  adminPriceText,
} from "@/lib/listingAdmin";

// ============================================================================
// TÀI KHOẢN → TIN ĐÃ ĐĂNG → CHI TIẾT MỘT TIN (thống kê)
//
// Đây là chỗ khách trả lời được ba câu hỏi mà trước nay web không trả lời:
//   1. Tin của tôi được xem bao nhiêu — và ĐANG lên hay đang nguội? (biểu đồ 30 ngày)
//   2. AI đã quan tâm tin của tôi? (danh sách người bấm xem số, gọi lại được ngay)
//   3. Tin còn hạn tới bao giờ, hạng gì, cần làm gì tiếp?
//
// Dữ liệu:
//   · listings.view_count      — tổng lượt xem (0002)
//   · listing_view_daily       — lượt xem theo ngày (0023) → biểu đồ
//   · listing_leads            — người đã bấm "hiện số" (0022) → danh sách quan tâm
// Cả ba bảng đều có RLS chặn ở tầng CSDL: chỉ CHỦ TIN đọc được tin của mình.
// ============================================================================

type Lead = { id: string; viewer_name: string | null; viewer_phone: string | null; created_at: string };
type NgayXem = { ngay: string; luot: number };

const SO_NGAY = 30;

export default function ChiTietTinCuaToiPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const [row, setRow] = useState<ListingRow | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [theoNgay, setTheoNgay] = useState<NgayXem[]>([]);
  const [loading, setLoading] = useState(true);
  // Bảng thống kê theo ngày là migration 0023 — chưa chạy thì bỏ qua biểu đồ,
  // KHÔNG làm hỏng cả trang (phần "ai xem tin" vẫn dùng được).
  const [chuaCoBangNgay, setChuaCoBangNgay] = useState(false);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      setRow((data as ListingRow) ?? null);
      setLoading(false);
      if (!data) return;

      const [{ data: ld }, { data: vd, error: vErr }] = await Promise.all([
        supabase
          .from("listing_leads")
          .select("id,viewer_name,viewer_phone,created_at")
          .eq("listing_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("listing_view_daily")
          .select("ngay,luot")
          .eq("listing_id", id)
          .order("ngay", { ascending: true }),
      ]);
      setLeads((ld ?? []) as Lead[]);
      if (vErr && /does not exist|schema cache/i.test(vErr.message)) setChuaCoBangNgay(true);
      else setTheoNgay((vd ?? []) as NgayXem[]);
    })();
  }, [id]);

  // Ghép đủ 30 ngày liên tiếp — ngày không ai xem vẫn phải có cột 0, nếu không
  // biểu đồ co lại chỉ còn vài cột rời rạc, nhìn không ra xu hướng.
  const cot = useMemo(() => {
    const map = new Map(theoNgay.map((d) => [d.ngay.slice(0, 10), d.luot]));
    const out: { ngay: string; luot: number }[] = [];
    const homNay = new Date();
    for (let i = SO_NGAY - 1; i >= 0; i--) {
      const d = new Date(homNay);
      d.setDate(homNay.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({ ngay: key, luot: map.get(key) ?? 0 });
    }
    return out;
  }, [theoNgay]);

  const xem7Ngay = cot.slice(-7).reduce((s, c) => s + c.luot, 0);
  const xem30Ngay = cot.reduce((s, c) => s + c.luot, 0);
  const dinh = Math.max(1, ...cot.map((c) => c.luot));

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  if (!row) {
    return (
      <div className="rounded-2xl border border-cvr-line bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-cvr-ink">Không tìm thấy tin này</h2>
        <p className="mt-1.5 text-sm text-cvr-muted">Tin có thể đã bị xoá, hoặc không thuộc tài khoản của bạn.</p>
        <Link href="/tai-khoan/tin-dang" className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          ← Về danh sách tin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/tai-khoan/tin-dang" className="inline-flex items-center gap-1.5 text-sm font-medium text-cvr-muted transition hover:text-cvr-ink">
        ← Tin đã đăng
      </Link>

      {/* TIÊU ĐỀ ĐẦY ĐỦ — không cắt chữ. Đây là chỗ khách đối chiếu đúng tin. */}
      <PageHeader
        title={<span className="break-words">{row.title || "(chưa có tiêu đề)"}</span>}
        desc={
          <>
            {purposeLabel(row.purpose)}{row.type ? ` · ${row.type}` : ""} · {adminPriceText(row.price_vnd, row.purpose)}
            {row.area_m2 != null ? ` · ${row.area_m2} m²` : ""}
            {row.province ? ` · ${row.province}` : ""}
          </>
        }
      >
        <Link href={`/dang-tin?id=${row.id}`} className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
          Sửa tin
        </Link>
        {row.status === "approved" && (
          <Link href={`/bat-dong-san/${row.id}`} target="_blank" className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
            Xem trên web ↗
          </Link>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        {listingStatusBadge(row.status)}
        {tierBadge(row.tier)}
        {row.published_at && (
          <span className="text-xs text-cvr-faint">Đăng ngày {ngayVN(row.published_at)}</span>
        )}
        {row.expires_at && (
          <span className="text-xs text-cvr-faint">· Hết hạn {ngayVN(row.expires_at)}</span>
        )}
      </div>

      {/* CHỈ SỐ — bốn con số khách cần, không hơn */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <O nhan="Tổng lượt xem" giaTri={String(row.view_count ?? 0)} />
        <O nhan="7 ngày qua" giaTri={chuaCoBangNgay ? "—" : String(xem7Ngay)} />
        <O nhan="30 ngày qua" giaTri={chuaCoBangNgay ? "—" : String(xem30Ngay)} />
        <O nhan="Người quan tâm" giaTri={String(leads.length)} accent={leads.length > 0} />
      </div>

      {/* BIỂU ĐỒ LƯỢT XEM 30 NGÀY — cột thuần CSS, không thư viện: nhẹ, không
          chặn hiển thị, và chỉ animate transform/opacity theo kỷ luật hiệu năng. */}
      <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-cvr-ink">Lượt xem 30 ngày gần nhất</h2>
          {!chuaCoBangNgay && <span className="text-xs text-cvr-faint">Cao nhất {dinh} lượt/ngày</span>}
        </div>

        {chuaCoBangNgay ? (
          <p className="mt-3 rounded-xl bg-cvr-surface px-4 py-3 text-sm text-cvr-muted">
            Tin này chỉ có số tổng, chưa tách theo ngày.
          </p>
        ) : xem30Ngay === 0 ? (
          <p className="mt-3 rounded-xl bg-cvr-surface px-4 py-3 text-sm leading-relaxed text-cvr-muted">
            Chưa có lượt xem nào trong 30 ngày qua.{" "}
            {row.status === "approved"
              ? "Đẩy tin lên đầu danh sách hoặc nâng hạng tin để nhiều người thấy hơn."
              : "Tin chưa được duyệt nên chưa hiển thị với người mua."}
          </p>
        ) : (
          <>
            <div className="mt-4 flex h-32 items-end gap-[3px]">
              {cot.map((c) => (
                <div
                  key={c.ngay}
                  title={`${ngayNgan(c.ngay)}: ${c.luot} lượt xem`}
                  className="group flex h-full flex-1 items-end"
                >
                  <div
                    className={`w-full rounded-t transition-colors ${c.luot > 0 ? "bg-cvr-blue/70 group-hover:bg-cvr-blue" : "bg-cvr-line/60"}`}
                    style={{ height: `${Math.max(c.luot > 0 ? 6 : 3, (c.luot / dinh) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-cvr-faint">
              <span>{ngayNgan(cot[0].ngay)}</span>
              <span>Hôm nay</span>
            </div>
          </>
        )}
      </section>

      {/* AI ĐÃ QUAN TÂM TIN NÀY — đúng thứ người bán bỏ tiền ra để có. */}
      <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
        <h2 className="text-base font-semibold text-cvr-ink">Ai đã quan tâm tin này</h2>
        <p className="mt-1 text-sm leading-relaxed text-cvr-muted">
          Người đã bấm xem số điện thoại của bạn.
        </p>

        {leads.length === 0 ? (
          <p className="mt-3 rounded-xl bg-cvr-surface px-4 py-3 text-sm text-cvr-muted">
            Chưa có ai bấm xem số ở tin này.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-cvr-line">
            {leads.map((ld) => {
              const so = (ld.viewer_phone ?? "").replace(/\s/g, "");
              return (
                <li key={ld.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-cvr-ink">{ld.viewer_name || "Khách đã đăng nhập"}</p>
                    <p className="mt-0.5 text-xs text-cvr-faint">{gioNgayVN(ld.created_at)}</p>
                  </div>
                  {so ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <a href={`tel:${so}`} className="flex h-9 items-center rounded-full bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
                        Gọi {ld.viewer_phone}
                      </a>
                      <a href={`https://zalo.me/${so}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center rounded-full border border-cvr-line px-4 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
                        Zalo
                      </a>
                    </div>
                  ) : (
                    <span className="shrink-0 text-sm text-cvr-faint">Chưa có SĐT</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function O({ nhan, giaTri, accent }: { nhan: string; giaTri: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-cvr-line bg-white p-4 shadow-sm">
      <p className="text-xs text-cvr-muted">{nhan}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${accent ? "text-cvr-blue-ink" : "text-cvr-ink"}`}>{giaTri}</p>
    </div>
  );
}

function ngayVN(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}
function ngayNgan(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}
function gioNgayVN(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}
