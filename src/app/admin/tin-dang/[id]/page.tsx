"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ListingForm from "@/components/admin/ListingForm";
import { type ListingRow, listingStatusBadge, tierBadge } from "@/lib/listingAdmin";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<ListingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", id).single();
      setRow((data as ListingRow) ?? null);
      setLoading(false);
    })();
  }, [id]);

  async function handleDelete() {
    if (!row) return;
    if (!window.confirm(`Xoá vĩnh viễn tin "${row.title}"?\nMẹo: muốn gỡ tạm khỏi web thì dùng trạng thái "Ẩn tạm" thay vì xoá.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("listings").delete().eq("id", row.id);
    setDeleting(false);
    if (!error) {
      router.push("/admin/tin-dang");
      router.refresh();
    }
  }

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;
  if (!row)
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-cvr-body">Không tìm thấy tin này.</p>
        <Link href="/admin/tin-dang" className="mt-3 inline-block text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
          ← Về danh sách tin
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Sửa tin đăng</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-cvr-muted">
            {tierBadge(row.tier)} {listingStatusBadge(row.status)}
            <span>· {row.view_count} lượt xem</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/bat-dong-san/${row.id}`}
            target="_blank"
            className="rounded-lg border border-cvr-line px-3 py-1.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Xem trên web ↗
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Đang xoá…" : "Xoá tin"}
          </button>
        </div>
      </div>
      <div className="mt-6">
        <ListingForm initial={row} />
      </div>
    </div>
  );
}
