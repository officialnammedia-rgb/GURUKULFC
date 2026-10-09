import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  // Ensure helper methods exist in case running in raw Connect/Vite middleware
  if (!res.status) {
    res.status = (statusCode) => {
      res.statusCode = statusCode;
      return res;
    };
  }
  if (!res.json) {
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error('RAZORPAY_KEY_SECRET missing in environment');
      return res.status(500).json({
        success: false,
        error: 'Razorpay secret key not configured on server.',
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Malformed JSON payload.' });
      }
    }
    body = body || {};

    const order_id = body.razorpay_order_id || body.order_id;
    const payment_id = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    // Validate required fields
    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${order_id}|${payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', key_secret.trim())
      .update(payload)
      .digest('hex');

    // Safe comparison
    let isMatch = false;
    try {
      const generatedBuffer = Buffer.from(generatedSignature, 'utf-8');
      const receivedBuffer = Buffer.from(signature, 'utf-8');
      if (generatedBuffer.length === receivedBuffer.length) {
        isMatch = crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
      }
    } catch (e) {
      isMatch = generatedSignature === signature;
    }

    if (!isMatch) {
      console.warn('Payment verification signature mismatch', {
        order_id,
        payment_id,
      });
      return res.status(400).json({
        success: false,
        error: 'Signature verification failed. Invalid payment signature.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      payment_id,
      order_id,
      verified_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error during signature verification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while verifying payment signature.',
      details: error.message,
    });
  }
}
