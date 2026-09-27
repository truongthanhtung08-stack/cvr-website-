import React, { ComponentProps } from "react";
import { Header, useNavigate } from "zmp-ui";
import { useLocation } from "react-router-dom";

// THANH TIÊU ĐỀ dùng cho MỌI trang — bọc Header của Zalo, thêm đúng một luật chống kẹt:
// nút ‹ quay lại trang trước; nếu KHÔNG có trang trước (khách mở thẳng từ link chia sẻ,
// tin nhắn OA…) thì về Trang chủ thay vì đứng im. Truyền `ve` để chỉ định nơi quay về
// (vd. sau khi gửi tin xong thì ‹ về Trang chủ, không quay lại form vừa gửi).
export default function TieuDe({ ve, ...props }: ComponentProps<typeof Header> & { ve?: string }) {
  const dieuHuong = useNavigate();
  const { key } = useLocation();
  const quayLai = () => {
    if (ve) dieuHuong(ve, { replace: true, direction: "backward" });
    else if (key === "default") dieuHuong("/", { replace: true, direction: "backward" }); // trang đầu tiên của phiên
    else dieuHuong(-1);
  };
  return <Header {...props} onBackClick={props.onBackClick ?? quayLai} />;
}
