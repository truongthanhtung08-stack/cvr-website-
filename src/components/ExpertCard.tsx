import type { Expert } from "@/lib/experts";

// Thẻ CHUYÊN GIA (kiểu danh bạ Batdongsan/Homedy) — avatar chữ cái, tên + xác minh,
// chức danh · công ty, đánh giá + số giao dịch, phân khúc, nút Gọi/Zalo.
export default function ExpertCard({ e }: { e: Expert }) {
  const initials = e.name.trim().split(" ").slice(-2).map((s) => s[0]).join("").toUpperCase();
  return (
    <div className="shadow-lux flex flex-col rounded-none border border-cvr-line bg-white p-5 transition hover:-translate-y-1 hover:border-cvr-blue/40">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-lg font-bold text-cvr-ink ring-1 ring-cvr-line">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-cvr-ink">{e.name}</h3>
            {e.verified && (
              <svg className="h-4 w-4 shrink-0 text-cvr-blue" viewBox="0 0 24 24" fill="currentColor" aria-label="Đã xác minh">
                <path d="M12 1l2.7 2.1 3.4-.3 1 3.3 2.9 1.8-1.2 3.2 1.2 3.2-2.9 1.8-1 3.3-3.4-.3L12 23l-2.7-2.1-3.4.3-1-3.3L2 16.1l1.2-3.2L2 9.7l2.9-1.8 1-3.3 3.4.3z" />
                <path d="M10.6 14.6l-2.2-2.2 1.1-1.1 1.1 1.1 3-3 1.1 1.1z" fill="#fff" />
              </svg>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-cvr-muted">{e.role}</p>
          <p className="truncate text-xs text-cvr-muted">{e.company}</p>
        </div>
      </div>

      {/* Chỉ số */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-cvr-surface py-2.5 text-center">
        <Metric value={`${e.rating}★`} label={`${e.reviews} đánh giá`} />
        <Metric value={`${e.deals}`} label="giao dịch" border />
        <Metric value={`${e.years} năm`} label="kinh nghiệm" border />
      </div>

      {/* Khu vực + phân khúc */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {e.areas.map((a) => (
          <span key={a} className="rounded-full bg-cvr-surface px-2.5 py-1 text-[11px] font-medium text-cvr-body">{a}</span>
        ))}
        {e.specialties.map((s) => (
          <span key={s} className="rounded-full border border-cvr-gold/30 bg-cvr-gold/10 px-2.5 py-1 text-[11px] font-medium text-cvr-gold-ink">{s}</span>
        ))}
      </div>

      {/* Liên hệ */}
      <div className="mt-5 flex gap-2.5 pt-0.5">
        <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-body">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" /></svg>
          Gọi
        </a>
        <a href={`https://zalo.me/${e.zalo}`} className="flex flex-1 items-center justify-center rounded-lg border border-cvr-line px-4 py-2.5 text-sm font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
          Nhắn Zalo
        </a>
      </div>
    </div>
  );
}

function Metric({ value, label, border }: { value: string; label: string; border?: boolean }) {
  return (
    <div className={border ? "border-l border-cvr-line" : ""}>
      <p className="text-sm font-bold text-cvr-ink">{value}</p>
      <p className="text-[11px] text-cvr-muted">{label}</p>
    </div>
  );
}
