"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImagePicker from "@/components/admin/ImagePicker";
import ContentEditor from "@/components/admin/ContentEditor";
import { isVideoUrl } from "@/lib/media";
import {
  type ArticleRow,
  type ContentStatus,
  articleCategories,
  slugify,
} from "@/lib/contentAdmin";

// Form Thêm/Sửa BÀI VIẾT Tin tức (admin).
// Nội dung: mỗi ĐOẠN xuống 1 dòng — web tự tách đoạn hiển thị.
// Slug tự sinh từ tiêu đề (sửa được) — là đường dẫn /tin-tuc/[slug].
export default function ArticleForm({ initial }: { initial?: ArticleRow }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [category, setCategory] = useState(initial?.category ?? articleCategories[0]);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [images, setImages] = useState<string[]>(initial?.image ? [initial.image] : []);
  // GHIM bài này làm TIN CHÍNH trang chủ. Chỉ có ĐÚNG 1 tin chính: tick bài mới
  // là tự bỏ ghim bài cũ (chỉ lưu 1 slug trong site_content).
  const [isFeatured, setIsFeatured] = useState(false);
  const [pinnedSlug, setPinnedSlug] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await createClient()
        .from("site_content")
        .select("data")
        .eq("key", "home_featured_article")
        .maybeSingle();
      const s = ((data as { data?: { slug?: string } } | null)?.data?.slug ?? "").trim();
      setPinnedSlug(s);
      if (initial?.slug && s === initial.slug) setIsFeatured(true);
    })();
  }, [initial?.slug]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  // asDraft = true → LƯU NHÁP (chỉ cần tiêu đề, chưa hiện trên web).
  // asDraft = false → ĐĂNG BÀI (đủ thông tin, hiện ngay trên /tin-tuc).
  async function save(asDraft: boolean) {
    setError("");
    if (!title.trim())
      return setError(asDraft ? "Nhập tiêu đề để lưu nháp." : "Chưa nhập tiêu đề bài viết.");
    const finalSlug = slugify(slug.trim() || title);
    if (!finalSlug) return setError("Slug (đường dẫn) không hợp lệ.");
    if (!asDraft) {
      if (!excerpt.trim()) return setError("Chưa nhập mô tả ngắn (hiện trên thẻ bài viết).");
      if (!content.trim()) return setError("Chưa nhập nội dung bài viết.");
    }

    const newStatus: ContentStatus = asDraft ? "draft" : "published";
    setSaving(true);
    const payload = {
      slug: finalSlug,
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      category,
      content: content.trim() || null,
      image: images.find((s) => !isVideoUrl(s)) ?? null,
      status: newStatus,
      published_at:
        newStatus === "published" ? (initial?.published_at ?? new Date().toISOString()) : initial?.published_at ?? null,
    };

    const supabase = createClient();
    const { error: err } = editing
      ? await supabase.from("articles").update(payload).eq("id", initial!.id)
      : await supabase.from("articles").insert(payload);

    setSaving(false);
    if (err) {
      return setError(
        /duplicate key|unique/i.test(err.message)
          ? `Slug "${finalSlug}" đã có bài khác dùng — đổi slug rồi lưu lại.`
          : `Lưu thất bại: ${err.message}`,
      );
    }
    // Ghim / bỏ ghim tin chính trang chủ (chỉ giữ đúng 1 slug)
    if (isFeatured) {
      await supabase.from("site_content").upsert({ key: "home_featured_article", data: { slug: finalSlug } });
    } else if (pinnedSlug && pinnedSlug === finalSlug) {
      await supabase.from("site_content").upsert({ key: "home_featured_article", data: { slug: "" } });
    }

    router.push("/admin/tin-tuc");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-4">
      <Card title="Nội dung bài viết">
        <div className="space-y-4">
          <Field label="Tiêu đề bài viết">
            <input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="VD: Toàn cảnh thị trường BĐS Đà Nẵng cuối 2026" className={inputCls} />
          </Field>

          {/* Ghim tin chính trang chủ — chống trôi khi đăng bài mới */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cvr-line bg-cvr-surface/60 p-3.5">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-cvr-ink">Đặt làm TIN CHÍNH trang chủ</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-cvr-muted">
                Bài này sẽ nằm ở ô lớn của khối Tin tức trang chủ và <strong>không bị trôi</strong> khi đăng bài mới.
                Chỉ có đúng 1 tin chính — tick bài này là tự bỏ ghim bài đang ghim.
                {pinnedSlug && pinnedSlug !== slug && (
                  <> Đang ghim: <strong>{pinnedSlug}</strong>.</>
                )}
              </span>
            </span>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Chuyên mục">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {articleCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Slug (đường dẫn /tin-tuc/…)">
              <input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                placeholder="tu-sinh-tu-tieu-de"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Mô tả ngắn (hiện trên thẻ bài viết & Google)">
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="1–2 câu tóm tắt nội dung bài…" className={`${inputCls} h-auto py-2.5`} />
          </Field>
          <Field label="Nội dung bài — mỗi ĐOẠN xuống 1 dòng">
            <ContentEditor value={content} onChange={setContent} placeholder={"Đoạn mở đầu…\nĐoạn tiếp theo…\nĐoạn kết…"} />
          </Field>
        </div>
      </Card>

      <Card title="Ảnh bài viết (ảnh đầu = ảnh đại diện)">
        <ImagePicker value={images} onChange={setImages} />
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : editing ? "Cập nhật & đăng" : "Đăng bài"}
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving}
          className="rounded-lg border border-cvr-line px-5 py-2.5 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-50"
        >
          Lưu nháp
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/tin-tuc")}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-cvr-muted transition hover:text-cvr-ink"
        >
          Huỷ
        </button>
      </div>
      <p className="text-xs text-cvr-faint">
        <strong>Lưu nháp</strong>: chỉ cần tiêu đề, bài chưa hiện trên web.
        <strong> Đăng bài</strong>: bài hiện ngay tại trang Tin tức và trang chủ.
      </p>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-lux">
      <h2 className="mb-4 text-base font-semibold text-cvr-ink">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}
