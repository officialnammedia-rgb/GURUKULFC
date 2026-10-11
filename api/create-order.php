<?php
/**
 * Razorpay Create Order API - PHP Version for Hostinger / Apache
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
        'endpoint' => 'create-order.php',
        'message' => 'Use POST method to create an order'
    ]);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Use POST.']);
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

    // 2. Retrieve credentials
    $keyId = getenv('RAZORPAY_KEY_ID') 
        ?: ($_ENV['RAZORPAY_KEY_ID'] 
        ?? getenv('VITE_RAZORPAY_KEY_ID') 
        ?? ($_ENV['VITE_RAZORPAY_KEY_ID'] 
        ?? null));

    $keySecret = getenv('RAZORPAY_KEY_SECRET') 
        ?: ($_ENV['RAZORPAY_KEY_SECRET'] 
        ?? null);

    $keyId = trim((string)$keyId);
    $keySecret = trim((string)$keySecret);

    if (empty($keyId) || empty($keySecret)) {
        throw new Exception('Razorpay credentials not configured. Please ensure .env file contains RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }

    // 3. Parse input body
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        throw new Exception('Invalid JSON payload in request.');
    }

    // 4. Validate payment amount
    $amount = isset($data['amount']) ? $data['amount'] : null;
    $currency = strtoupper(isset($data['currency']) && !empty($data['currency']) ? (string)$data['currency'] : 'INR');
    $receipt = isset($data['receipt']) && !empty($data['receipt']) ? (string)$data['receipt'] : 'rcpt_' . time() . '_' . rand(100, 999);
    $notes = isset($data['notes']) && is_array($data['notes']) ? $data['notes'] : [];

    if ($amount === null || !is_numeric($amount)) {
        throw new Exception('Valid payment amount is required.');
    }

    $amountInPaise = (int) round((float)$amount);

    if ($amountInPaise < 100) {
        throw new Exception('Amount must be at least ₹1.00 (100 paise).');
    }

    // 5. Call Razorpay Orders API via cURL
    $orderPayload = [
        'amount' => $amountInPaise,
        'currency' => $currency,
        'receipt' => substr($receipt, 0, 40),
        'notes' => $notes
    ];

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderPayload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        throw new Exception('Network error connecting to Razorpay: ' . ($curlError ?: 'Unknown error'));
    }

    $order = json_decode($response, true);

    if ($httpCode !== 200 || empty($order['id'])) {
        $msg = isset($order['error']['description']) 
            ? $order['error']['description'] 
            : (isset($order['message']) ? $order['message'] : 'Failed to create Razorpay order');
        throw new Exception($msg);
    }

    // 6. Return response
    http_response_code(200);
    echo json_encode([
        'order_id' => $order['id'],
        'id' => $order['id'],
        'amount' => $order['amount'],
        'currency' => $order['currency'],
        'receipt' => $order['receipt'],
        'status' => $order['status'],
        'key_id' => $keyId
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => $e->getMessage()
    ]);
}
