<?php
/**
 * Razorpay Create Order API - PHP Version for Hostinger
 * Gurukul Football Academy
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set JSON response header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Use POST.']);
    exit();
}

try {
    // Load environment variables
    $envFile = __DIR__ . '/../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }

    // Get Razorpay credentials
    $keyId = getenv('RAZORPAY_KEY_ID') ?: $_ENV['RAZORPAY_KEY_ID'] ?? null;
    $keySecret = getenv('RAZORPAY_KEY_SECRET') ?: $_ENV['RAZORPAY_KEY_SECRET'] ?? null;

    if (!$keyId || !$keySecret) {
        throw new Exception('Razorpay credentials not configured. Check .env file.');
    }

    // Get POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON payload.');
    }

    // Validate required fields
    $amount = $data['amount'] ?? null;
    $currency = strtoupper($data['currency'] ?? 'INR');
    $receipt = $data['receipt'] ?? 'rcpt_' . time() . '_' . rand(100, 999);
    $notes = $data['notes'] ?? [];

    if (!$amount || !is_numeric($amount)) {
        throw new Exception('Valid amount is required.');
    }

    $amountInPaise = (int) round($amount);

    if ($amountInPaise < 100) {
        throw new Exception('Amount must be at least 100 paise (₹1.00).');
    }

    // Prepare Razorpay API request
    $orderData = [
        'amount' => $amountInPaise,
        'currency' => $currency,
        'receipt' => substr($receipt, 0, 40),
        'notes' => $notes
    ];

    // Call Razorpay Orders API
    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_USERPWD, trim($keyId) . ':' . trim($keySecret));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $error = json_decode($response, true);
        throw new Exception($error['error']['description'] ?? 'Failed to create Razorpay order');
    }

    $order = json_decode($response, true);

    // Return success response
    echo json_encode([
        'order_id' => $order['id'],
        'id' => $order['id'],
        'amount' => $order['amount'],
        'currency' => $order['currency'],
        'receipt' => $order['receipt'],
        'status' => $order['status'],
        'key_id' => trim($keyId)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
