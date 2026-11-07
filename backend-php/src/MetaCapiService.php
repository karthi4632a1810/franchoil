<?php

declare(strict_types=1);

namespace Franchglobal;

final class MetaCapiService
{
    private const META_CATALOG_IDS = [
        'franch-oil-nh-plus' => 'hj949dhw77',
        'landing-franch-oil-nh-plus-pack-of-2' => 'hj949dhw77',
        'franch-orthovin-thailam' => '7gljowkn08',
        'omega-3' => 'gaj2ifflhn',
        'franch-ayurveda-skin-soap' => 'qsarjijoa4',
    ];

    public static function track(array $event): array
    {
        $pixelId = Config::get('META_PIXEL_ID', '829463349947822');
        $accessToken = Config::get('META_ACCESS_TOKEN', '');
        if (!$accessToken) {
            return ['success' => false, 'error' => 'META_ACCESS_TOKEN missing'];
        }

        $url = "https://graph.facebook.com/v19.0/{$pixelId}/events?access_token={$accessToken}";
        $testCode = Config::get('META_TEST_EVENT_CODE');

        $payload = ['data' => [$event]];
        if ($testCode) {
            $payload['test_event_code'] = $testCode;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
            CURLOPT_TIMEOUT => 20,
        ]);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['success' => false, 'error' => $error];
        }

        $data = json_decode((string) $response, true);
        if ($status >= 400 || (is_array($data) && isset($data['error']))) {
            return ['success' => false, 'status' => $status, 'response' => $data ?: $response];
        }

        return ['success' => true, 'status' => $status, 'response' => $data ?: $response];
    }

    public static function buildUserData(array $input): array
    {
        $user = [];

        if (!empty($input['email'])) {
            $user['em'] = [self::hashPII(mb_strtolower(trim((string) $input['email'])))];
        }
        if (!empty($input['phone'])) {
            $normalized = self::normalizePhone((string) $input['phone']);
            if ($normalized) {
                $user['ph'] = [self::hashPII($normalized)];
            }
        }
        if (!empty($input['name'])) {
            $parts = preg_split('/\s+/', mb_strtolower(trim((string) $input['name'])));
            if (!empty($parts[0])) {
                $user['fn'] = [self::hashPII($parts[0])];
            }
            if (count($parts) > 1) {
                $user['ln'] = [self::hashPII(implode(' ', array_slice($parts, 1)))];
            }
        }

        if (!empty($input['fbp'])) {
            $user['fbp'] = (string) $input['fbp'];
        }
        if (!empty($input['fbc'])) {
            $user['fbc'] = (string) $input['fbc'];
        }
        if (!empty($input['client_ip_address'])) {
            $user['client_ip_address'] = (string) $input['client_ip_address'];
        }
        if (!empty($input['client_user_agent'])) {
            $user['client_user_agent'] = (string) $input['client_user_agent'];
        }

        return $user;
    }

    public static function productCatalogId(?string $sku): ?string
    {
        if (!$sku) {
            return null;
        }
        if (isset(self::META_CATALOG_IDS[$sku])) {
            return self::META_CATALOG_IDS[$sku];
        }
        $clean = str_replace(['landing-', '-pack-of-2'], '', $sku);
        return self::META_CATALOG_IDS[$clean] ?? $sku;
    }

    private static function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (!$digits) {
            return null;
        }
        if (str_starts_with($digits, '91') && strlen($digits) === 12) {
            $digits = substr($digits, 2);
        }
        return strlen($digits) >= 10 ? $digits : null;
    }

    private static function hashPII(string $value): string
    {
        return hash('sha256', trim($value));
    }
}

