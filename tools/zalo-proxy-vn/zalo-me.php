<?php
/* ============================================================================
 * TRẠM TRUNG CHUYỂN GỌI API ZALO — ĐẶT TRÊN HOSTING PA VIETNAM
 *
 * VÌ SAO CẦN: Zalo chỉ cho đọc thông tin người dùng từ máy chủ có IP Việt Nam.
 * Web coastalland.vn chạy trên Vercel (máy chủ ở Mỹ) nên bị Zalo từ chối:
 *   error -501 "Personal information is limited due to IP address not inside Vietnam"
 * File này đặt trên hosting VN, nhận lệnh từ web rồi gọi Zalo hộ.
 *
 * AN TOÀN:
 *   · Chỉ nhận POST kèm đúng mã bí mật → người ngoài gọi vào bị chặn
 *   · KHÔNG lưu gì cả, không ghi log, chỉ chuyển tiếp đúng một lời gọi
 *   · Chỉ gọi được 2 API của Zalo: thông tin người dùng + đổi mã số điện thoại (Mini App)
 *
 * CÀI ĐẶT:
 *   1. Tạo file ma-bi-mat.php CẠNH file này, nội dung: <?php return '<mã mới>';
 *      (mã phải TRÙNG biến ZALO_PROXY_KEY trên Vercel). KHÔNG đưa mã vào repo —
 *      repo công khai; mã cũ từng nằm ở đây ĐÃ LỘ, cấm dùng lại.
 *   2. Tải file này lên thư mục gốc website của hosting (thường là public_html)
 *   3. Địa chỉ file sẽ là:  https://<tên-miền-hosting>/zalo-me.php
 *      → dán địa chỉ đó vào biến ZALO_PROXY_URL trên Vercel
 * ========================================================================== */

$MA_BI_MAT = @include __DIR__ . '/ma-bi-mat.php';
if (!is_string($MA_BI_MAT) || strlen($MA_BI_MAT) < 24) {
    http_response_code(500);
    echo json_encode(['error' => 'chua_cai_ma_bi_mat']);
    exit;
}

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
// Hai việc DUY NHẤT trạm được làm:
//   · loai = "sdt" → đổi mã số điện thoại của Zalo Mini App (getPhoneNumber) ra SỐ THẬT:
//                    graph.zalo.me/v2.0/me/info (header access_token, code, secret_key)
//   · mặc định     → lấy tên + ảnh người dùng (đăng nhập Zalo trên web): graph.zalo.me/v2.0/me
$loai = isset($body['loai']) ? (string) $body['loai'] : '';
if ($loai === 'sdt') {
    $code = isset($body['code']) ? trim((string) $body['code']) : '';
    $secret = isset($body['secret_key']) ? trim((string) $body['secret_key']) : '';
    if ($code === '' || $secret === '') {
        http_response_code(400);
        echo json_encode(['error' => 'thieu_code_hoac_secret']);
        exit;
    }
    $ch = curl_init('https://graph.zalo.me/v2.0/me/info');
    $dauMuc = ['access_token: ' . $token, 'code: ' . $code, 'secret_key: ' . $secret];
} else {
    $ch = curl_init('https://graph.zalo.me/v2.0/me?fields=' . rawurlencode($fields)
        . '&access_token=' . rawurlencode($token));
    $dauMuc = ['access_token: ' . $token];
}
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER     => $dauMuc,
    // Chỉ đi đường IPv4: hosting VN hay khai IPv6 mà không có đường ra,
    // curl thử IPv6 trước rồi treo tới hết 10 giây → "Connection timeout".
    CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
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
