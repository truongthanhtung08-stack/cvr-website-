import ProjectForm from "@/components/admin/ProjectForm";

// ?ten=&ma=&tinh= — bấm "Tạo hồ sơ" ở danh sách dự án khách ghi trong tin (22/10/2026): điền sẵn tên + mã của tin.
export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ ten?: string; ma?: string; tinh?: string }> }) {
  const sp = await searchParams;
  const dienSan = sp.ten && sp.ma ? { ten: sp.ten, ma: sp.ma, tinh: sp.tinh ?? "" } : undefined;
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Thêm dự án mới</h1>
      <p className="mt-1 text-sm text-cvr-muted">
        Bấm <strong>Đăng dự án</strong> → dự án hiện ngay trên trang Dự án &amp; trang chủ.
      </p>
      <div className="mt-6">
        <ProjectForm dienSan={dienSan} />
      </div>
    </div>
  );
}
