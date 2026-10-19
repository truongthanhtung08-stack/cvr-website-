#target photoshop
// Chỉnh ảnh hàng loạt Coastal Land: Auto Tone → Auto Color → JPG chất lượng 12, lưu đè.
// Camera Raw Auto (Shift+Ctrl+A → Auto) KHÔNG gọi được bằng script — đã đo 19/10: lệch 5,9 so với bấm tay. Bước này chủ dự án tự làm.
app.displayDialogs = DialogModes.NO;
var thuMuc = Folder(THU_MUC);
var s = function(k){ return stringIDToTypeID(k); };
var tep = thuMuc.getFiles(function(f){ return f instanceof File && /\.jpe?g$/i.test(f.name) && !/^goc-/.test(f.name) && (typeof BO_QUA_SAU == "undefined" || f.modified < BO_QUA_SAU); });
var log = [];
// Ảnh anh đang mở trong Photoshop thì KHÔNG đụng (tránh lưu đè lên bản anh đang sửa dở)
var dangMo = {}; for (var j = 0; j < app.documents.length; j++) { try { dangMo[app.documents[j].fullName.fsName.toLowerCase()] = 1; } catch (e) {} }
for (var i = 0; i < tep.length; i++) {
  if (dangMo[tep[i].fsName.toLowerCase()]) { log.push("BO QUA (dang mo) " + tep[i].name); continue; }
  try {
    var doc = app.open(tep[i]);
    if (doc.mode != DocumentMode.RGB) doc.changeMode(ChangeMode.RGB);
    var d1 = new ActionDescriptor(); d1.putBoolean(s("autoBlackWhite"), true); executeAction(charIDToTypeID("Lvls"), d1, DialogModes.NO);
    var d2 = new ActionDescriptor(); d2.putBoolean(s("autoBlackWhite"), true); d2.putBoolean(s("autoNeutrals"), true); executeAction(charIDToTypeID("Lvls"), d2, DialogModes.NO);
    var o = new JPEGSaveOptions(); o.quality = 12; o.embedColorProfile = true; o.formatOptions = FormatOptions.STANDARDBASELINE;
    doc.saveAs(tep[i], o, false, Extension.LOWERCASE); doc.close(SaveOptions.DONOTSAVECHANGES);
    log.push("OK " + tep[i].name);
  } catch (e) { log.push("LOI " + tep[i].name + ": " + e); try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (x) {} }
}
var f = File(thuMuc.parent + "/CHINH-ANH-XONG.txt"); f.encoding = "UTF-8"; f.open("w"); f.write(log.join("\n")); f.close();
