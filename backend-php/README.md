# Franchglobal PHP Backend

This folder contains a plain PHP backend scaffold that replaces Firebase Functions for:

- Razorpay order create/verify/webhook
- Meta Conversions API (CAPI) tracking
- MySQL persistence (`franchglobal` database)

## Requirements

- PHP 8.1+
- MySQL 8+
- Web server pointing document root to `backend-php/public`

## Environment Variables

Set these in your web server/env:

- `APP_ENV=production`
- `APP_URL=https://your-api-domain.com`
- `FRONTEND_ORIGIN=https://franchglobal.com`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_NAME=franchglobal`
- `DB_USER=root`
- `DB_PASS=`
- `RAZORPAY_KEY_ID=`
- `RAZORPAY_KEY_SECRET=`
- `RAZORPAY_WEBHOOK_SECRET=`
- `META_PIXEL_ID=829463349947822`
- `META_ACCESS_TOKEN=`
- `META_TEST_EVENT_CODE=` (optional)
- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USER=`
- `EMAIL_PASSWORD=`
- `SHIPROCKET_EMAIL=`
- `SHIPROCKET_PASSWORD=`
- `TELEGRAM_BOT_TOKEN=`
- `TELEGRAM_GROUP_ID=`

## Routes

- `POST /api/payments/razorpay/create-order`
- `POST /api/payments/razorpay/verify`
- `POST /api/webhooks/razorpay`
- `POST /api/meta/track`

## SQL

Run `backend-php/sql/schema.sql` against the `franchglobal` database.

## Hostinger Shared Hosting Deploy

1. Build frontend:
   - `npm run build`
2. Upload `dist/*` into `public_html/`.
3. Upload `backend-php/public/*` into `public_html/api/`.
4. Upload `backend-php/src/*` into `public_html/api/src/`.
5. Ensure `public_html/.htaccess` keeps SPA fallback and excludes `api/`.
6. Ensure `public_html/api/.htaccess` routes API requests to `index.php`.
7. Set env vars in Hostinger PHP environment:
   - DB credentials (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`)
   - Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`)
   - Meta keys (`META_PIXEL_ID`, `META_ACCESS_TOKEN`)
