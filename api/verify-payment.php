<?php
/**
 * Razorpay Payment Verification API - PHP Version for Hostinger
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

    // Get Razorpay key secret
    $keySecret = getenv('RAZORPAY_KEY_SECRET') ?: $_ENV['RAZORPAY_KEY_SECRET'] ?? null;

    if (!$keySecret) {
        throw new Exception('Razorpay key secret not configured.');
    }

    // Get POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON payload.');
    }

    $orderId = $data['razorpay_order_id'] ?? null;
    $paymentId = $data['razorpay_payment_id'] ?? null;
    $signature = $data['razorpay_signature'] ?? null;

    if (!$orderId || !$paymentId || !$signature) {
        throw new Exception('Missing required payment verification parameters.');
    }

    // Verify signature
    $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, trim($keySecret));

    if (hash_equals($expectedSignature, $signature)) {
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
            'error' => 'Invalid payment signature. Payment verification failed.'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
