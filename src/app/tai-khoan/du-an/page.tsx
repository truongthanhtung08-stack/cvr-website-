"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { getTier, type TierId } from "@/lib/packages";

// ============================================================================
// DỰ ÁN CỦA KHÁCH HÀNG — chỉ mở cho Chủ đầu tư / Công ty phân phối đã được
// quản trị viên duyệt hồ sơ (profiles.can_post_project = true).
// Danh sách dự án đã gửi + trạng thái duyệt + lối đăng dự án mới.
// ============================================================================

type DuAn = {
  id: string;
  slug: string;
  name: string;
  province: string | null;
  status: "draft" | "pending" | "published";
  details: { tier?: TierId } | null;
  created_at: string;
};

const NHAN_TRANG_THAI: Record<DuAn["status"], { chu: string; lop: string }> = {
  draft: { chu: "Nháp", lop: "bg-cvr-surface text-cvr-muted" },
  pending: { chu: "Chờ duyệt", lop: "bg-amber-50 text-amber-700" },
  published: { chu: "Đang hiển thị", lop: "bg-green-50 text-green-700" },
};

export default function DuAnKhachPage() {
  return (
    <Suspense fallback={<p className="text-sm text-cvr-muted">Đang tải…</p>}>
      <NoiDung />
    </Suspense>
  );
}

function NoiDung() {
  const { profile, loading } = useProfile();
  const params = useSearchParams();
  const vuaGui = params.get("da-gui") === "1";

  const [ds, setDs] = useState<DuAn[]>([]);
  const [dangTai, setDangTai] = useState(true);

  const duocDang = Boolean((profile as unknown as { can_post_project?: boolean } | null)?.can_post_project);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("projects")
          .select("id, slug, name, province, status, details, created_at")
          .eq("owner_id", profile.id)
          .order("created_at", { ascending: false });
        setDs((data as DuAn[]) ?? []);
      } catch {
        /* chưa chạy migration 0013 → danh sách trống, không làm hỏng trang */
      }
      setDangTai(false);
    })();
  }, [profile]);

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  // CHƯA ĐƯỢC DUYỆT — hiện điều kiện, không cho vào form
  if (!duocDang) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-cvr-line bg-white p-6 shadow-lux">
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Đăng dự án</h1>
          <p className="mt-2 text-sm text-cvr-body">
            Khu vực này dành riêng cho <strong>Chủ đầu tư</strong> và <strong>Công ty phân phối</strong>.
            Để mở quyền đăng dự án, bạn cần gửi hồ sơ pháp nhân để Coastal Land xét duyệt.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-cvr-body">
            <li>· Giấy chứng nhận đăng ký kinh doanh</li>
            <li>· Văn bản chứng minh là chủ đầu tư hoặc đơn vị được uỷ quyền phân phối</li>
            <li>· Thông tin người phụ trách (họ tên, điện thoại)</li>
          </ul>
          <Link
            href="/tai-khoan/cai-dat"
            className="mt-4 inline-block rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
          >
            Gửi hồ sơ xét duyệt
          </Link>
          <p className="mt-3 text-xs text-cvr-muted">
            Hồ sơ được duyệt trong 1–2 ngày làm việc. Duyệt xong bạn đăng dự án ngay tại đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vuaGui && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Đã gửi dự án. Quản trị viên duyệt xong dự án sẽ hiện trên trang Dự án.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Dự án của bạn</h1>
          <p className="mt-1 text-sm text-cvr-muted">Đăng và theo dõi trạng thái duyệt dự án.</p>
        </div>
        <Link
          href="/tai-khoan/du-an/moi"
          className="rounded-lg bg-cvr-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink"
        >
          + Đăng dự án mới
        </Link>
      </div>

      {dangTai ? (
        <p className="text-sm text-cvr-muted">Đang tải danh sách…</p>
      ) : ds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cvr-line bg-white p-8 text-center">
          <p className="text-sm text-cvr-muted">Bạn chưa đăng dự án nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cvr-line bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-cvr-line bg-cvr-surface text-xs uppercase tracking-wide text-cvr-muted">
              <tr>
                <th className="px-4 py-3">Dự án</th>
                <th className="px-4 py-3">Khu vực</th>
                <th className="px-4 py-3">Hạng</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {ds.map((d) => {
                const nhan = NHAN_TRANG_THAI[d.status] ?? NHAN_TRANG_THAI.draft;
                return (
                  <tr key={d.id} className="border-b border-cvr-line/60">
                    <td className="px-4 py-3 font-medium text-cvr-ink">
                      {d.status === "published" ? (
                        <Link href={`/du-an/${d.slug}`} className="underline hover:text-cvr-blue-ink">{d.name}</Link>
                      ) : (
                        d.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-cvr-body">{d.province || "—"}</td>
                    <td className="px-4 py-3 text-cvr-body">{getTier(d.details?.tier ?? "basic").name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${nhan.lop}`}>{nhan.chu}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
