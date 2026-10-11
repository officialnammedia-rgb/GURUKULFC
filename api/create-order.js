import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  // Set proper content-type header first
  res.setHeader('Content-Type', 'application/json');
  
  // Ensure helper methods exist in case running in raw Connect/Vite middleware
  if (!res.status) {
    res.status = (statusCode) => {
      res.statusCode = statusCode;
      return res;
    };
  }
  if (!res.json) {
    res.json = (data) => {
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
  
  // Health check for GET requests
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'API is running',
      endpoint: 'create-order',
      message: 'Use POST method to create an order'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('Razorpay credentials missing in environment');
      return res.status(500).json({
        error: 'Razorpay credentials not configured on the server. Please check .env file.',
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }
    body = body || {};

    const rawAmount = body.amount;
    const currency = (body.currency || 'INR').toUpperCase();
    const receipt = body.receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const notes = body.notes || {};

    if (rawAmount === undefined || rawAmount === null || isNaN(Number(rawAmount))) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const amountInPaise = Math.round(Number(rawAmount));

    // Minimum amount: 100 paise (₹1.00)
    if (amountInPaise < 100) {
      return res.status(400).json({
        error: 'Amount must be at least 100 paise (₹1.00).',
      });
    }

    const razorpay = new Razorpay({
      key_id: key_id.trim(),
      key_secret: key_secret.trim(),
    });

    const options = {
      amount: amountInPaise,
      currency,
      receipt: String(receipt).slice(0, 40),
      notes,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      key_id: key_id.trim(),
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);

    // Authentication failure check
    if (error.statusCode === 401 || (error.error && error.error.code === 'BAD_REQUEST_ERROR' && error.statusCode === 401)) {
      return res.status(401).json({
        error: 'Razorpay authentication failed. Verify API key and secret.',
        details: error.error?.description || error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to create Razorpay order',
      details: error.error?.description || error.message,
    });
  }
}
