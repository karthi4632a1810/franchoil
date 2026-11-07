<?php

declare(strict_types=1);

namespace Franchglobal;

final class OrderEmailTemplates
{
    private static function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /** Customer-facing links in emails (never localhost). */
    private static function emailPublicSiteUrl(): string
    {
        $custom = trim((string) Config::get('EMAIL_SITE_URL', ''));
        if ($custom !== '') {
            return rtrim($custom, '/');
        }

        $frontendRaw = trim((string) Config::get('FRONTEND_ORIGIN', ''));
        $frontend = trim(explode(',', $frontendRaw)[0] ?? '');
        $appUrl = trim((string) Config::get('APP_URL', ''));
        $candidate = $frontend !== '' ? $frontend : ($appUrl !== '' ? $appUrl : 'https://franchglobal.com');
        $candidate = rtrim($candidate, '/');
        $host = strtolower((string) (parse_url($candidate, PHP_URL_HOST) ?: ''));

        if ($host === '' || $host === 'localhost' || str_starts_with($host, '127.')) {
            return 'https://franchglobal.com';
        }

        return $candidate;
    }

    /** Public path to the email header logo (Vite `public/` folder). */
    private const EMAIL_LOGO_PATH = '/email-template-logo/logo.png';

    /** Absolute logo URL for email clients (always public HTTPS — never localhost). */
    private static function logoUrl(): string
    {
        $custom = trim((string) Config::get('EMAIL_LOGO_URL', ''));
        if ($custom !== '') {
            return $custom;
        }

        return self::emailPublicSiteUrl() . self::EMAIL_LOGO_PATH;
    }

    private static function buildHeaderLogoHtml(): string
    {
        $logoUrl = self::logoUrl();
        if ($logoUrl === '') {
            return '
              <p style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:46px;line-height:1;font-weight:700;color:#ffffff;letter-spacing:2px;">
                FM
              </p>
              <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#D9F2E4;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">
                Group of Companies
              </p>';
        }

        return '
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 10px;">
                <tr>
                  <td style="background:#ffffff;padding:12px 20px;border-radius:10px;">
                    <img src="' . self::esc($logoUrl) . '" alt="FM Group of Companies" width="180" style="display:block;margin:0 auto;max-width:180px;width:180px;height:auto;border:0;">
                  </td>
                </tr>
              </table>';
    }

    /** Customer-facing order ID (payments table `id`). */
    public static function customerOrderId(array $order): string
    {
        $id = trim((string) ($order['id'] ?? ''));
        if ($id !== '') {
            return $id;
        }

        return trim((string) ($order['firebase_id'] ?? $order['orderRef'] ?? ''));
    }

    private static function formatMoney(float $amount): string
    {
        return '₹' . number_format($amount, 2);
    }

    /** @return list<array{title: string, qty: int, price: float, total: float}> */
    private static function normalizeItems(array $order): array
    {
        $raw = $order['items'] ?? $order['cart'] ?? [];
        if (!is_array($raw)) {
            return [];
        }

        $items = [];
        foreach ($raw as $item) {
            if (!is_array($item)) {
                continue;
            }
            $qty = max(1, (int) ($item['qty'] ?? $item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0);
            if ($price > 1000) {
                $price /= 100;
            }
            $lineTotal = (float) ($item['total'] ?? 0);
            if ($lineTotal > 1000) {
                $lineTotal /= 100;
            }
            if ($lineTotal <= 0) {
                $lineTotal = $price * $qty;
            }
            $title = trim((string) ($item['title'] ?? $item['name'] ?? 'Product'));
            if ($title === '') {
                $title = 'Product';
            }
            $items[] = [
                'title' => $title,
                'qty' => $qty,
                'price' => $price,
                'total' => $lineTotal,
            ];
        }

        return $items;
    }

    private static function orderTotal(array $order, array $items): float
    {
        $total = (float) ($order['totalAmount'] ?? $order['amount'] ?? 0);
        if ($total > 1000) {
            $total /= 100;
        }
        if ($total > 0) {
            return $total;
        }

        $sum = 0.0;
        foreach ($items as $item) {
            $sum += (float) ($item['total'] ?? 0);
        }

        return $sum;
    }

    private static function orderDateLabel(array $order): string
    {
        $raw = $order['createdAt'] ?? $order['created_at'] ?? $order['updatedAt'] ?? '';
        if ($raw === '') {
            return date('d M Y');
        }
        if (is_numeric($raw)) {
            return date('d M Y', (int) $raw);
        }
        $ts = strtotime((string) $raw);

        return $ts ? date('d M Y', $ts) : (string) $raw;
    }

    /** @return array{line1: string, line2: string, city: string, state: string, pincode: string} */
    private static function normalizeAddress(array $order): array
    {
        $address = $order['address'] ?? $order['selectedAddress'] ?? [];
        if (!is_array($address)) {
            $address = [];
        }

        return [
            'line1' => trim((string) ($address['line1'] ?? $address['address'] ?? '')),
            'line2' => trim((string) ($address['line2'] ?? $address['area'] ?? '')),
            'city' => trim((string) ($address['city'] ?? '')),
            'state' => trim((string) ($address['state'] ?? '')),
            'pincode' => trim((string) ($address['pincode'] ?? $address['zipcode'] ?? '')),
        ];
    }

    /** @return array{headline: string, intro: string, detail: string, badge: string, badgeBg: string, badgeColor: string, icon: string} */
    private static function statusCopy(string $status, string $customerName, string $orderId): array
    {
        $orderLine = $orderId !== '' ? 'Order #' . $orderId : 'Your order';

        if ($status === 'placed') {
            return [
                'headline' => 'Order confirmed',
                'intro' => 'Hi ' . $customerName . ', thank you for shopping with Franch Global.',
                'detail' => $orderLine . ' has been placed successfully and your payment is confirmed. We will notify you when your order is shipped.',
                'badge' => 'Order placed',
                'badgeBg' => '#E8F5EE',
                'badgeColor' => '#0F6B3A',
                'icon' => '✓',
            ];
        }
        if ($status === 'shipped') {
            return [
                'headline' => 'Your order is on the way',
                'intro' => 'Hi ' . $customerName . ', good news!',
                'detail' => $orderLine . ' has been shipped. Your AWB and courier tracking link are below — you can also track from My Orders on our website.',
                'badge' => 'Shipped',
                'badgeBg' => '#E3F2FD',
                'badgeColor' => '#1565C0',
                'icon' => '📦',
            ];
        }
        if ($status === 'in_transit') {
            return [
                'headline' => 'Out for delivery',
                'intro' => 'Hi ' . $customerName . ', your order is almost there.',
                'detail' => $orderLine . ' is out for delivery today. Please keep your phone reachable for a smooth handover.',
                'badge' => 'Out for delivery',
                'badgeBg' => '#FFF3E0',
                'badgeColor' => '#E65100',
                'icon' => '🚚',
            ];
        }
        if ($status === 'delivered') {
            return [
                'headline' => 'Delivered successfully',
                'intro' => 'Hi ' . $customerName . ', your order has arrived.',
                'detail' => $orderLine . ' was delivered successfully. We hope you enjoy your purchase and thank you for choosing Franch Global.',
                'badge' => 'Delivered',
                'badgeBg' => '#E8F5EE',
                'badgeColor' => '#0F6B3A',
                'icon' => '🎉',
            ];
        }
        if ($status === 'cancelled') {
            return [
                'headline' => 'Order cancelled',
                'intro' => 'Hi ' . $customerName . ',',
                'detail' => $orderLine . ' has been cancelled. If any amount was charged, our team will process a refund shortly. Contact us if you have any questions.',
                'badge' => 'Cancelled',
                'badgeBg' => '#FDECEA',
                'badgeColor' => '#C62828',
                'icon' => '✕',
            ];
        }

        return [
            'headline' => 'Order update',
            'intro' => 'Hi ' . $customerName . ',',
            'detail' => 'There is a new update on ' . $orderLine . '.',
            'badge' => 'Updated',
            'badgeBg' => '#F3F4F6',
            'badgeColor' => '#374151',
            'icon' => 'ℹ',
        ];
    }

  /** Shipment AWB + courier link (after Shiprocket Ship Now). */
    private static function buildCourierTrackingHtml(array $order, string $status): string
    {
        if (!in_array($status, ['shipped', 'in_transit'], true)) {
            return '';
        }

        $awb = trim((string) ($order['awbNumber'] ?? ''));
        $courierUrl = trim((string) ($order['trackingUrl'] ?? ''));
        if ($courierUrl === '' && $awb !== '') {
            $courierUrl = 'https://www.delhivery.com/track/package/' . rawurlencode($awb);
        }
        if ($awb === '' && $courierUrl === '') {
            return '';
        }

        $awbRow = $awb !== ''
            ? '<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111827;">
                <strong>AWB / Tracking number:</strong> ' . self::esc($awb) . '
              </p>'
            : '';

        $trackBtn = $courierUrl !== ''
            ? '<a href="' . self::esc($courierUrl) . '" style="display:inline-block;background:#1565C0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px;margin-right:8px;">
                Track shipment (courier)
              </a>'
            : '';

        return '
        <tr>
          <td style="padding:0 28px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;">
              <tr>
                <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;">
                  <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px;">Shipment tracking</p>
                  ' . $awbRow . '
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#4B5563;">Use the button below to follow your parcel on the courier website.</p>
                  <p style="margin:14px 0 0;">' . $trackBtn . '</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>';
    }

    private static function courierTrackingPlainLines(array $order, string $status): array
    {
        if (!in_array($status, ['shipped', 'in_transit'], true)) {
            return [];
        }
        $awb = trim((string) ($order['awbNumber'] ?? ''));
        $courierUrl = trim((string) ($order['trackingUrl'] ?? ''));
        if ($courierUrl === '' && $awb !== '') {
            $courierUrl = 'https://www.delhivery.com/track/package/' . rawurlencode($awb);
        }
        if ($awb === '' && $courierUrl === '') {
            return [];
        }
        $lines = ['', 'Shipment tracking:'];
        if ($awb !== '') {
            $lines[] = 'AWB: ' . $awb;
        }
        if ($courierUrl !== '') {
            $lines[] = 'Track on courier: ' . $courierUrl;
        }

        return $lines;
    }

    private static function buildTrustBadgesHtml(): string
    {
        return '
        <tr>
          <td style="padding:0 28px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="33%" style="padding:4px;text-align:center;vertical-align:top;">
                  <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#166534;font-weight:600;">
                    ✓ Payment<br>confirmed
                  </div>
                </td>
                <td width="33%" style="padding:4px;text-align:center;vertical-align:top;">
                  <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#166534;font-weight:600;">
                    ✓ Genuine<br>Ayurvedic products
                  </div>
                </td>
                <td width="33%" style="padding:4px;text-align:center;vertical-align:top;">
                  <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#166534;font-weight:600;">
                    ✓ Official<br>Franch Global store
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>';
    }

    private static function buildOrderSummaryHtml(array $order): string
    {
        $items = self::normalizeItems($order);
        $total = self::orderTotal($order, $items);
        $orderIdLabel = self::customerOrderId($order);
        $orderDate = self::orderDateLabel($order);
        $address = self::normalizeAddress($order);
        $paymentLabel = strtolower((string) ($order['paymentStatus'] ?? 'paid')) === 'paid' ? 'Paid' : 'Confirmed';

        $itemRows = '';
        if (count($items) > 0) {
            foreach ($items as $item) {
                $itemRows .= '
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E5E7EB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;">
                    ' . self::esc($item['title']) . '
                    <span style="display:block;font-size:12px;color:#6B7280;margin-top:2px;">Qty: ' . (int) $item['qty'] . ' × ' . self::esc(self::formatMoney((float) $item['price'])) . '</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #E5E7EB;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#111827;white-space:nowrap;">
                    ' . self::esc(self::formatMoney((float) $item['total'])) . '
                  </td>
                </tr>';
            }
        } else {
            $itemRows = '
                <tr>
                  <td colspan="2" style="padding:12px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;">
                    Your order details will appear here once confirmed.
                  </td>
                </tr>';
        }

        $addressLines = array_filter([
            $address['line1'],
            $address['line2'],
            trim($address['city'] . ($address['state'] !== '' ? ', ' . $address['state'] : '')),
            $address['pincode'] !== '' ? 'PIN: ' . $address['pincode'] : '',
        ]);
        $addressHtml = count($addressLines) > 0
            ? implode('<br>', array_map(static fn ($line) => self::esc($line), $addressLines))
            : 'Delivery address on file';

        return '
        <tr>
          <td style="padding:0 28px 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="background:#F9FAFB;padding:16px 18px;border-bottom:1px solid #E5E7EB;">
                  <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111827;">
                    Your order summary
                  </p>
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;">
                    ' . ($orderIdLabel !== '' ? 'Order #' . self::esc($orderIdLabel) . ' &nbsp;|&nbsp; ' : '') . 'Placed on ' . self::esc($orderDate) . '
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 18px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    ' . $itemRows . '
                    <tr>
                      <td style="padding:14px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">
                        Order total
                      </td>
                      <td align="right" style="padding:14px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#0F6B3A;white-space:nowrap;">
                        ' . self::esc(self::formatMoney($total)) . '
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-bottom:14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#059669;">
                        Payment status: <strong>' . self::esc($paymentLabel) . '</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background:#F9FAFB;padding:14px 18px;border-top:1px solid #E5E7EB;">
                  <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">
                    Delivery address
                  </p>
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#4B5563;">
                    ' . $addressHtml . '
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>';
    }

    private static function buildOrderSummaryPlainText(array $order): string
    {
        $items = self::normalizeItems($order);
        $total = self::orderTotal($order, $items);
        $orderIdLabel = self::customerOrderId($order);
        $address = self::normalizeAddress($order);

        $lines = ['YOUR ORDER SUMMARY', '-------------------'];
        if ($orderIdLabel !== '') {
            $lines[] = 'Order #' . $orderIdLabel;
        }
        $lines[] = 'Date: ' . self::orderDateLabel($order);
        $lines[] = '';

        if (count($items) > 0) {
            foreach ($items as $item) {
                $lines[] = $item['title'] . ' — Qty ' . $item['qty'] . ' × ' . self::formatMoney((float) $item['price']) . ' = ' . self::formatMoney((float) $item['total']);
            }
        }
        $lines[] = '';
        $lines[] = 'Order total: ' . self::formatMoney($total);
        $lines[] = 'Payment: Paid';
        $lines[] = '';
        $lines[] = 'Delivery address:';
        foreach (array_filter([$address['line1'], $address['line2'], $address['city'], $address['state'], $address['pincode']]) as $part) {
            $lines[] = $part;
        }

        return implode("\r\n", $lines);
    }

    public static function buildFooterHtml(): string
    {
        $site = self::emailPublicSiteUrl();
        $year = date('Y');

        return '
        <tr>
          <td style="background:#0F6B3A;padding:28px 24px;text-align:center;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;">
              Franch Global Health Care LLP
            </p>
            <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#D9F2E4;">
              Creating unique Ayurvedic products for 25+ years
            </p>
            <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;">
              <a href="tel:+919841854321" style="color:#ffffff;text-decoration:none;">(+91) 984 185 4321</a>
              &nbsp;|&nbsp;
              <a href="mailto:contact@franchglobal.com" style="color:#ffffff;text-decoration:none;">contact@franchglobal.com</a>
            </p>
            <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#D9F2E4;">
              Mon–Sat, 10:00 AM – 7:00 PM &nbsp;|&nbsp;
              <a href="https://wa.me/919841854321" style="color:#ffffff;text-decoration:underline;">WhatsApp Support</a>
            </p>
            <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
              <a href="https://www.facebook.com/FranchFM" style="color:#ffffff;text-decoration:none;margin:0 6px;">Facebook</a>
              <a href="https://www.instagram.com/franchindia/" style="color:#ffffff;text-decoration:none;margin:0 6px;">Instagram</a>
              <a href="https://www.youtube.com/@franchglobalhealthcarellp2381" style="color:#ffffff;text-decoration:none;margin:0 6px;">YouTube</a>
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#B8E6CC;">
              © ' . $year . ' Franch Global Health Care LLP. All rights reserved.<br>
              <a href="' . self::esc($site) . '" style="color:#B8E6CC;text-decoration:underline;">' . self::esc(parse_url($site, PHP_URL_HOST) ?: 'franchglobal.com') . '</a>
            </p>
          </td>
        </tr>';
    }

    public static function buildHtml(array $order, string $status): string
    {
        $status = strtolower(trim($status));
        $customerName = trim((string) ($order['customer_name'] ?? $order['name'] ?? $order['customerName'] ?? 'Customer'));
        if ($customerName === '') {
            $customerName = 'Customer';
        }
        $orderIdLabel = self::customerOrderId($order);
        $orderId = (string) ($order['id'] ?? '');
        $siteTrackUrl = self::emailPublicSiteUrl() . '/my-orders' . ($orderId !== '' ? '/' . rawurlencode($orderId) : '');
        $copy = self::statusCopy($status, $customerName, $orderIdLabel);
        $headerLogoHtml = self::buildHeaderLogoHtml();
        $orderSummaryHtml = $status === 'placed' ? self::buildOrderSummaryHtml($order) : '';

        return '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>' . self::esc($copy['headline']) . '</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F3F4F6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#0F6B3A;padding:28px 24px 22px;text-align:center;">
              ' . $headerLogoHtml . '
              <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;letter-spacing:1px;text-transform:uppercase;font-weight:600;">
                FM Group of Companies
              </p>
              <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#D9F2E4;">
                Creating unique Ayurvedic products
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 12px;text-align:center;">
              <span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1;margin-bottom:12px;">' . $copy['icon'] . '</span>
              <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:' . $copy['badgeBg'] . ';color:' . $copy['badgeColor'] . ';font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">
                ' . self::esc($copy['badge']) . '
              </span>
              <h1 style="margin:16px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.3;color:#111827;">
                ' . self::esc($copy['headline']) . '
              </h1>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
                ' . self::esc($copy['intro']) . '
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#4B5563;">
                ' . self::esc($copy['detail']) . '
              </p>
            </td>
          </tr>
          ' . self::buildTrustBadgesHtml() . '
          ' . $orderSummaryHtml . '
          ' . self::buildCourierTrackingHtml($order, $status) . '
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <a href="' . self::esc($siteTrackUrl) . '" style="display:inline-block;background:#0F6B3A;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;">
                View order on Franch Global
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;">
                <tr>
                  <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#4B5563;">
                    <strong style="color:#111827;">Need help?</strong><br>
                    Call us at <a href="tel:+919841854321" style="color:#0F6B3A;text-decoration:none;">(+91) 984 185 4321</a><br>
                    Email <a href="mailto:contact@franchglobal.com" style="color:#0F6B3A;text-decoration:none;">contact@franchglobal.com</a><br>
                    Support hours: Mon–Sat, 10:00 AM – 7:00 PM
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ' . self::buildFooterHtml() . '
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';
    }

    public static function buildPlainText(array $order, string $status): string
    {
        $status = strtolower(trim($status));
        $customerName = trim((string) ($order['customer_name'] ?? $order['name'] ?? $order['customerName'] ?? 'Customer'));
        if ($customerName === '') {
            $customerName = 'Customer';
        }
        $orderIdLabel = self::customerOrderId($order);
        $copy = self::statusCopy($status, $customerName, $orderIdLabel);
        $orderId = (string) ($order['id'] ?? '');
        $siteTrackUrl = self::emailPublicSiteUrl() . '/my-orders' . ($orderId !== '' ? '/' . rawurlencode($orderId) : '');

        $lines = [
            $copy['intro'],
            '',
            $copy['detail'],
        ];

        if ($status === 'placed') {
            $lines[] = '';
            $lines[] = self::buildOrderSummaryPlainText($order);
        }

        $lines = array_merge($lines, self::courierTrackingPlainLines($order, $status));

        $lines = array_merge($lines, [
            '',
            'View your order: ' . $siteTrackUrl,
            '',
            'Need help?',
            'Phone: (+91) 984 185 4321',
            'Email: contact@franchglobal.com',
            'Hours: Mon-Sat, 10:00 AM - 7:00 PM',
            'WhatsApp: https://wa.me/919841854321',
            '',
            'Franch Global Health Care LLP',
            self::emailPublicSiteUrl(),
        ]);

        return implode("\r\n", $lines);
    }

    public static function buildSubject(string $status): string
    {
        $labels = [
            'placed' => 'Order placed',
            'shipped' => 'Shipped',
            'in_transit' => 'Out for delivery',
            'delivered' => 'Delivered',
            'cancelled' => 'Order cancelled',
        ];
        $label = $labels[$status] ?? 'Order update';

        return 'FranchGlobal — ' . $label;
    }
}
