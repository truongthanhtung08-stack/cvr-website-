from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape

root = Path(r"c:\Users\X1 GEN 8\Projects\cvr-website")
out_path = root / "docs" / "huong-dan-doi-noi-dung-va-anh.docx"
out_path.parent.mkdir(parents=True, exist_ok=True)

paragraphs = [
    "HƯỚNG DẪN ĐỔI NỘI DUNG VÀ ẢNH – PHẦN BÁO GIÁ",
    "",
    "1. Mục đích",
    "- Chỉ thay đổi nội dung và ảnh ở phần báo giá, không chạm các phần khác.",
    "",
    "2. File chính cần mở",
    "- src/app/bao-gia-dang-tin/page.tsx",
    "- public/images/tin",
    "",
    "3. Cách đổi nội dung văn bản",
    "- Mở file src/app/bao-gia-dang-tin/page.tsx.",
    "- Tìm các trường title, address, price, benefits, displays.",
    "- Thay đổi chữ theo ý muốn, ví dụ: tên gói, mô tả, giá.",
    "- Không đổi cấu trúc component, chỉ đổi nội dung bên trong.",
    "",
    "4. Cách đổi ảnh",
    "- Đặt ảnh mới vào thư mục public/images/tin.",
    "- Đặt tên ảnh ngắn, không dấu, không khoảng trắng, ví dụ: anh-moi.png.",
    "- Mở file src/app/bao-gia-dang-tin/page.tsx.",
    "- Tìm các dòng sample: { img: \"2.jpg\" }, sample: { img: \"3.jpg\" }, sample: { img: \"4.jpg\" }, sample: { img: \"anh-tin-diamond.png\" }.",
    "- Thay tên ảnh cũ bằng tên ảnh mới.",
    "",
    "5. Xem trước trên máy",
    "- Chạy: npm run dev",
    "- Mở: http://localhost:3000/bao-gia-dang-tin",
    "",
    "6. Đẩy lên web",
    "- Chạy: git add -A",
    "- Chạy: git commit -m \"Cap nhat website\"",
    "- Chạy: git push origin main",
    "",
    "7. Xem trên web thật",
    "- Mở: https://coastalland.vn/bao-gia-dang-tin",
    "- Nếu thấy cũ, refresh hoặc Ctrl + F5.",
    "",
    "8. Lưu ý quan trọng",
    "- Chỉ sửa phần liên quan đến ảnh và nội dung của trang báo giá.",
    "- Không đổi bố cục, màu sắc hoặc các phần khác nếu chưa cần.",
]

body = []
for p in paragraphs:
    if p == "":
        body.append('<w:p/>')
    else:
        body.append(f'<w:p><w:r><w:t xml:space="preserve">{escape(p)}</w:t></w:r></w:p>')

content_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {''.join(body)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>'''

styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
</w:styles>'''

content_types_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>'''

rels_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

with ZipFile(out_path, 'w', ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types_xml)
    z.writestr('_rels/.rels', rels_xml)
    z.writestr('word/document.xml', content_xml)
    z.writestr('word/styles.xml', styles_xml)

print(out_path)
