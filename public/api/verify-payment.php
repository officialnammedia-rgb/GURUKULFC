<?php
/**
 * Razorpay Payment Verification API - PHP Version for Hostinger / Apache
 * Gurukul Football Academy
 */

// Error handling settings
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set JSON headers early
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'ok']);
    exit();
}

// Health check for GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    http_response_code(200);
    echo json_encode([
        'status' => 'API is running',
        'endpoint' => 'verify-payment.php',
        'message' => 'Use POST method to verify payment'
    ]);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed. Use POST.']);
    exit();
}

try {
    // 1. Load environment variables from possible locations
    $envDirs = [
        __DIR__ . '/../.env',
        __DIR__ . '/.env',
        dirname(__DIR__) . '/.env',
        (isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] . '/.env' : '')
    ];

    foreach ($envDirs as $envFile) {
        if (!empty($envFile) && file_exists($envFile) && is_readable($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines !== false) {
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
                        continue;
                    }
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value, " \t\n\r\0\x0B\"'");
                    $_ENV[$key] = $value;
                    putenv("{$key}={$value}");
                }
            }
            break;
        }
    }

    // 2. Retrieve secret key
    $keySecret = getenv('RAZORPAY_KEY_SECRET') 
        ?: ($_ENV['RAZORPAY_KEY_SECRET'] 
        ?? null);

    $keySecret = trim((string)$keySecret);

    if (empty($keySecret)) {
        throw new Exception('Razorpay secret key not configured. Please ensure .env file contains RAZORPAY_KEY_SECRET.');
    }

    // 3. Parse input body
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        throw new Exception('Invalid JSON payload in request.');
    }

    $orderId = isset($data['razorpay_order_id']) ? $data['razorpay_order_id'] : (isset($data['order_id']) ? $data['order_id'] : null);
    $paymentId = isset($data['razorpay_payment_id']) ? $data['razorpay_payment_id'] : (isset($data['payment_id']) ? $data['payment_id'] : null);
    $signature = isset($data['razorpay_signature']) ? $data['razorpay_signature'] : (isset($data['signature']) ? $data['signature'] : null);

    if (empty($orderId) || empty($paymentId) || empty($signature)) {
        throw new Exception('Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.');
    }

    // 4. Verify signature via HMAC-SHA256
    $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);

    if (hash_equals($expectedSignature, $signature)) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Payment signature verified successfully.',
            'order_id' => $orderId,
            'payment_id' => $paymentId
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid payment signature. Verification failed.'
        ]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
