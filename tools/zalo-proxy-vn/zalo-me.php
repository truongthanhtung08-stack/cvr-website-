<?php
/* ============================================================================
 * TRẠM TRUNG CHUYỂN GỌI API ZALO — ĐẶT TRÊN HOSTING VIỆT NAM
 *
 * VÌ SAO CẦN: Zalo chỉ cho đọc thông tin người dùng từ máy chủ có IP Việt Nam.
 * Web coastalland.vn chạy trên Vercel (máy chủ ở Mỹ) nên bị Zalo từ chối:
 *   error -501 "Personal information is limited due to IP address not inside Vietnam"
 * File này đặt trên hosting VN, nhận lệnh từ web rồi gọi Zalo hộ.
 *
 * AN TOÀN:
 *   · Chỉ nhận POST kèm đúng mã bí mật → người ngoài gọi vào bị chặn
 *   · KHÔNG lưu gì cả, không ghi log, chỉ chuyển tiếp đúng một lời gọi
 *   · Chỉ gọi được duy nhất API "lấy thông tin người dùng" của Zalo
 *
 * CÀI ĐẶT:
 *   1. Sửa dòng $MA_BI_MAT bên dưới (phải TRÙNG biến ZALO_PROXY_KEY trên Vercel)
 *   2. Tải file này lên thư mục gốc website của hosting (thường là public_html)
 *   3. Địa chỉ file sẽ là:  https://<tên-miền-hosting>/zalo-me.php
 *      → dán địa chỉ đó vào biến ZALO_PROXY_URL trên Vercel
 * ========================================================================== */

$MA_BI_MAT = 'l5IUHC2XJVJNDUa_4uk0xZkRTu7BolzA';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

// ── Chỉ nhận POST ───────────────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'chi_nhan_post']);
    exit;
}

// ── Kiểm mã bí mật ──────────────────────────────────────────────────────────
$key = $_SERVER['HTTP_X_CL_KEY'] ?? '';
if (!is_string($key) || !hash_equals($MA_BI_MAT, $key)) {
    http_response_code(403);
    echo json_encode(['error' => 'sai_ma_bi_mat']);
    exit;
}

// ── Đọc yêu cầu ─────────────────────────────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true);
$token = isset($body['access_token']) ? trim((string) $body['access_token']) : '';
$fields = isset($body['fields']) ? (string) $body['fields'] : 'id,name,picture';

if ($token === '') {
    http_response_code(400);
    echo json_encode(['error' => 'thieu_access_token']);
    exit;
}
// Chỉ cho phép tên trường hợp lệ — chặn chèn tham số lạ
if (!preg_match('/^[a-z_]+(,[a-z_]+)*$/', $fields)) {
    $fields = 'id,name,picture';
}

// ── Gọi Zalo (từ IP Việt Nam) ───────────────────────────────────────────────
$url = 'https://graph.zalo.me/v2.0/me?fields=' . rawurlencode($fields)
     . '&access_token=' . rawurlencode($token);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER     => ['access_token: ' . $token],
]);
$ketQua = curl_exec($ch);

if ($ketQua === false) {
    $loi = curl_error($ch);
    curl_close($ch);
    http_response_code(502);
    echo json_encode(['error' => 'khong_goi_duoc_zalo', 'message' => $loi], JSON_UNESCAPED_UNICODE);
    exit;
}

curl_close($ch);
echo $ketQua;
