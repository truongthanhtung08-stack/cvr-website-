import ArticleForm from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Viết bài mới</h1>
      <p className="mt-1 text-sm text-cvr-muted">
        Bấm <strong>Đăng bài</strong> → bài hiện ngay trên trang Tin tức &amp; trang chủ.
      </p>
      <div className="mt-6">
        <ArticleForm />
      </div>
    </div>
  );
}
