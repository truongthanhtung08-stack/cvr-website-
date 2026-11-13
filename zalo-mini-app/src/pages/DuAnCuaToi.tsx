import React, { useEffect, useState } from "react";
import { Box, Button, Input, Page, Spinner, Text } from "zmp-ui";
import TieuDe from "../components/TieuDe";
import CanDangNhap from "../components/CanDangNhap";
import { soVN, supabase, usePhien } from "../lib/supabase";
import { nhanCoastalLand } from "../lib/zalo";

// DỰ ÁN CỦA TÔI — bản gọn của web (src/app/tai-khoan/du-an): chỉ Chủ đầu tư / Công ty phân phối được duyệt (profiles.can_post_project).
//   · Chưa được duyệt: gửi yêu cầu (customer_requests loai dang_du_an, như web) · đã gửi thì hiện trạng thái.
//   · Đã được duyệt: danh sách dự án + trạng thái duyệt. Hồ sơ dự án (nhiều mục, nhiều ảnh) gửi qua Zalo Coastal Land.
type DuAn = { id: string; name: string; province: string | null; status: "draft" | "pending" | "published"; created_at: string };
const NHAN_DA: Record<DuAn["status"], string> = { draft: "Nháp", pending: "Chờ duyệt", published: "Đang hiển thị" };
const NHAN_YC: Record<string, string> = { moi: "Đã gửi, chờ xác minh", dang_xu_ly: "Đang xác minh", xong: "Đã mở quyền đăng dự án", tu_choi: "Chưa được duyệt" };

export default function DuAnCuaToi() {
  const { san, nguoiDung } = usePhien();
  const [hs, setHs] = useState<{ can_post_project?: boolean; full_name?: string; phone?: string } | null>(null);
  const [ds, setDs] = useState<DuAn[]>([]);
  const [yc, setYc] = useState<{ status: string; admin_note: string | null } | null>(null);
  const [ten, setTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string>();

  useEffect(() => {
    if (!nguoiDung) return;
    (async () => {
      const { data: h } = await supabase.from("profiles").select("can_post_project,full_name,phone").eq("id", nguoiDung.id).maybeSingle();
      setHs(h ?? {});
      setTen(h?.full_name ?? "");
      setSdt(h?.phone ? soVN(h.phone) : "");
      if (h?.can_post_project) {
        const { data } = await supabase.from("projects").select("id,name,province,status,created_at").eq("owner_id", nguoiDung.id).order("created_at", { ascending: false });
        setDs((data ?? []) as DuAn[]);
      } else {
        const { data } = await supabase.from("customer_requests").select("status,admin_note").eq("user_id", nguoiDung.id).eq("loai", "dang_du_an").order("created_at", { ascending: false }).limit(1);
        setYc((data?.[0] as typeof yc) ?? null);
      }
    })();
  }, [nguoiDung?.id]);

  const gui = async () => {
    setLoi(undefined);
    if (!ten.trim()) return setLoi("Chưa nhập họ tên.");
    if (sdt.replace(/\D/g, "").length < 10) return setLoi("Số điện thoại chưa đúng.");
    if (!noiDung.trim()) return setLoi("Chưa nhập tên dự án.");
    setDang(true);
    const { error } = await supabase.from("customer_requests").insert({ user_id: nguoiDung!.id, loai: "dang_du_an", ten: ten.trim(), dien_thoai: sdt.trim(), noi_dung: noiDung.trim() });
    setDang(false);
    if (error) return setLoi("Chưa gửi được. Vui lòng thử lại.");
    setYc({ status: "moi", admin_note: null });
  };

  if (san && !nguoiDung) return <CanDangNhap tieuDe="Dự án của tôi" />;
  if (!hs) return <Page><TieuDe title="Dự án của bạn" /><Box flex justifyContent="center" p={6}><Spinner /></Box></Page>;
  return (
    <Page style={{ paddingBottom: 24 }}>
      <TieuDe title="Dự án của bạn" />
      {hs.can_post_project ? (
        <>
          {ds.length ? (
            <div className="ds-dong">
              {ds.map((d) => (
                <div key={d.id} className="dong-hd">
                  <div className="dong-hd-tren"><b>{d.name}</b><span>{NHAN_DA[d.status]}</span></div>
                  {d.province && <p>{d.province}</p>}
                </div>
              ))}
            </div>
          ) : <Box p={6} style={{ textAlign: "center" }}><Text className="chu-phu">Chưa có dự án nào.</Text></Box>}
          <Box p={4}><Button fullWidth onClick={() => nhanCoastalLand("Gửi hồ sơ dự án mới")}>Gửi dự án mới qua Zalo</Button></Box>
        </>
      ) : yc ? (
        <Box mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 8 }}>
          <Text.Title size="small">Yêu cầu đăng dự án</Text.Title>
          <Text size="small">{NHAN_YC[yc.status] ?? NHAN_YC.moi}</Text>
          {yc.admin_note && <Text size="small" className="chu-phu">Ghi chú từ Coastal Land: {yc.admin_note}</Text>}
        </Box>
      ) : (
        <Box mt={2} p={4} style={{ background: "#fff", display: "grid", gap: 12 }}>
          <Text.Title size="small">Đăng dự án dành cho Chủ đầu tư, Công ty phân phối</Text.Title>
          <Input label="Họ tên" value={ten} onChange={(e) => setTen(e.target.value)} />
          <Input label="Số điện thoại" inputMode="tel" value={sdt} onChange={(e) => setSdt(e.target.value)} />
          <Input label="Tên dự án muốn đăng" value={noiDung} onChange={(e) => setNoiDung(e.target.value)} />
          {loi && <Text size="small" style={{ color: "#d70018" }}>{loi}</Text>}
          <Button loading={dang} onClick={gui}>Gửi yêu cầu</Button>
        </Box>
      )}
    </Page>
  );
}
