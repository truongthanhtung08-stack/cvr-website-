#target photoshop
// Lưu đè TẤT CẢ ảnh đang mở trong Photoshop vào thư mục ảnh của đợt (JPG chất lượng 12), rồi đóng.
// Chủ dự án chỉ xoá watermark từng ảnh, nhắn "Lưu" → Claude chạy script này. Không đụng ảnh ngoài thư mục đợt.
var THU = Folder(THU_MUC), log = [];
var o = new JPEGSaveOptions(); o.quality = 12; o.embedColorProfile = true; o.formatOptions = FormatOptions.STANDARDBASELINE;
for (var i = app.documents.length - 1; i >= 0; i--) {
  var d = app.documents[i], ten = d.name.replace(/\.[^.]+$/, "") + ".jpg", dich = File(THU + "/" + ten);
  if (!dich.exists) { log.push("BO QUA (khong thuoc dot) " + d.name); continue; }
  try { if (d.mode != DocumentMode.RGB) d.changeMode(ChangeMode.RGB); if (d.layers.length > 1) d.flatten();
    d.saveAs(dich, o, false, Extension.LOWERCASE); d.close(SaveOptions.DONOTSAVECHANGES); log.push("OK " + ten); }
  catch (e) { log.push("LOI " + d.name + ": " + e); }
}
var f = File(THU.parent + "/LUU-HET.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\n")); f.close();
