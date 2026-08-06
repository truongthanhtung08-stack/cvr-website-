import type { Role, Status } from "@/lib/useProfile";

export function roleLabel(role: Role): string {
  return {
    buyer: "Thành viên",
    agent: "Môi giới",
    company: "Công ty / Sàn",
    admin: "Admin",
  }[role];
}

export function statusLabel(status: Status): string {
  return { active: "Hoạt động", pending: "Chờ duyệt", suspended: "Đã khoá" }[status];
}

export function statusBadge(status: Status) {
  const cls = {
    active: "bg-green-50 text-green-700 ring-green-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    suspended: "bg-red-50 text-red-700 ring-red-600/20",
  }[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {statusLabel(status)}
    </span>
  );
}
