import ProjectForm from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Thêm dự án mới</h1>
      <p className="mt-1 text-sm text-cvr-muted">
        Bấm <strong>Đăng dự án</strong> → dự án hiện ngay trên trang Dự án &amp; trang chủ.
      </p>
      <div className="mt-6">
        <ProjectForm />
      </div>
    </div>
  );
}
