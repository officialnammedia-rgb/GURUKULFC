import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import createOrderHandler from './api/create-order.js';
import verifyPaymentHandler from './api/verify-payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupServerMiddlewares(server) {
  server.middlewares.use((req, res, next) => {
    const url = req.url.split('?')[0];

    // Handle Razorpay backend API endpoints in local Vite dev & preview server
    if (url === '/api/create-order' || url === '/api/create-order.php') {
      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', async () => {
        try {
          req.body = bodyStr ? JSON.parse(bodyStr) : {};
        } catch (e) {
          req.body = {};
        }
        await createOrderHandler(req, res);
      });
      return;
    }

    if (url === '/api/verify-payment' || url === '/api/verify-payment.php') {
      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', async () => {
        try {
          req.body = bodyStr ? JSON.parse(bodyStr) : {};
        } catch (e) {
          req.body = {};
        }
        await verifyPaymentHandler(req, res);
      });
      return;
    }

    // Clean URLs routing
    if (url === '/admin' || url === '/admin/') {
      req.url = req.url.replace(/^\/admin\/?/, '/admin.html');
    } else if (url === '/blog' || url === '/blog/') {
      req.url = req.url.replace(/^\/blog\/?/, '/blog.html');
    } else if (url === '/achievements' || url === '/achievements/' || url === '/player-achievements' || url === '/player-achievements/') {
      req.url = req.url.replace(/^\/(?:achievements|player-achievements)\/?/, '/achievements.html');
    } else if (url === '/fees' || url === '/fees/' || url === '/pay-fee' || url === '/pay-fee/') {
      req.url = req.url.replace(/^\/(?:fees|pay-fee)\/?/, '/fees.html');
    }
    next();
  });
}

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    {
      name: 'razorpay-and-clean-urls-middleware',
      configureServer(server) {
        setupServerMiddlewares(server);
      },
      configurePreviewServer(server) {
        setupServerMiddlewares(server);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        blog: path.resolve(__dirname, 'blog.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        achievements: path.resolve(__dirname, 'achievements.html'),
        fees: path.resolve(__dirname, 'fees.html'),
      },
    },
  },
});
