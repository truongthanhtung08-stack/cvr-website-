// DÒNG SỬA CHÍNH TẢ KIỂU GOOGLE — MỘT CHỖ cho mọi trang kết quả (Mua bán, Cho thuê, Tìm kiếm — anh 07/11/2026: "gợi ý thay thế của Google đâu"):
// "Đang hiển thị kết quả cho <câu đã sửa, chữ sửa in đậm nghiêng>" · "Tìm kiếm thay thế cho <câu khách gõ>" (bấm = tìm đúng nguyên chữ).
export default function CauSuaGoogle({ cauSua, goc, linkNguyenVan, className = "mt-4" }: { cauSua: string; goc: string; linkNguyenVan: string; className?: string }) {
  const tuGoc = goc.split(/(\s+)/);
  return (
    <div className={`${className} text-[15px] leading-relaxed`}>
      <p className="text-cvr-ink">
        Đang hiển thị kết quả cho{" "}
        <span className="text-cvr-blue-ink">
          {cauSua.split(/(\s+)/).map((w, i) => (tuGoc[i] !== undefined && tuGoc[i] === w ? w : <b key={i}><i>{w}</i></b>))}
        </span>
      </p>
      <p className="text-[13px] text-cvr-muted">
        Tìm kiếm thay thế cho <a href={linkNguyenVan} className="text-cvr-blue-ink hover:underline">{goc}</a>
      </p>
    </div>
  );
}
