// Biểu đồ LỊCH SỬ GIÁ (IV.7) — MINH HOẠ xu hướng giá khu vực.
// Dữ liệu tạo suy diễn từ giá hiện tại (KHÔNG phải số liệu thị trường thật) → có nhãn rõ.
// Component thuần SVG, không cần client JS.

function formatVnd(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 1).replace(".", ",")} tỷ`;
  if (v >= 1e6) return `${Math.round(v / 1e6)} triệu`;
  return v.toLocaleString("vi-VN");
}

const FACTORS = [0.82, 0.87, 0.9, 0.94, 0.97, 1]; // 6 mốc, tăng dần tới giá hiện tại
const LABELS = ["6 quý", "5 quý", "4 quý", "3 quý", "2 quý", "Hiện tại"];

export default function PriceHistory({ price }: { price: number }) {
  const points = FACTORS.map((f) => Math.round(price * f));
  const growth = Math.round((1 / FACTORS[0] - 1) * 100); // % tăng so với mốc đầu

  const W = 560, H = 180, padX = 8, padTop = 24, padBottom = 28;
  const barW = (W - padX * 2) / points.length;
  const maxV = points[points.length - 1];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <span className="text-sm text-cvr-muted">Xu hướng ~18 tháng:</span>
        <span className="text-sm font-bold text-cvr-gold-ink">+{growth}%</span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full min-w-[420px]" role="img" aria-label="Biểu đồ minh hoạ lịch sử giá">
          {points.map((v, i) => {
            const h = ((v / maxV) * (H - padTop - padBottom));
            const x = padX + i * barW;
            const y = H - padBottom - h;
            const last = i === points.length - 1;
            return (
              <g key={i}>
                <rect
                  x={x + barW * 0.18}
                  y={y}
                  width={barW * 0.64}
                  height={h}
                  rx={4}
                  fill={last ? "#b89254" : "#d2d2d7"}
                />
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-cvr-muted" fontSize="11" fontWeight="600">
                  {formatVnd(v)}
                </text>
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-cvr-faint" fontSize="10">
                  {LABELS[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-xs text-cvr-faint">* Biểu đồ mang tính minh hoạ xu hướng, không phải số liệu giao dịch thực tế.</p>
    </div>
  );
}
