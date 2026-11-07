<?php

declare(strict_types=1);

namespace Franchglobal;

final class Http
{
    public static function cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigin = Config::get('FRONTEND_ORIGIN', '*');

        if ($allowedOrigin === '*') {
            $finalOrigin = $origin !== '' ? $origin : '*';
        } else {
            $allowedList = array_filter(array_map('trim', explode(',', (string) $allowedOrigin)));
            $expandedList = [];
            foreach ($allowedList as $item) {
                $expandedList[] = strtolower($item);
                if (str_starts_with($item, 'https://www.')) {
                    $expandedList[] = 'https://' . substr($item, 12);
                } elseif (str_starts_with($item, 'https://')) {
                    $expandedList[] = 'https://' . substr($item, 8);
                } elseif (str_starts_with($item, 'http://www.')) {
                    $expandedList[] = 'http://' . substr($item, 11);
                } elseif (str_starts_with($item, 'http://')) {
                    $expandedList[] = 'http://' . substr($item, 7);
                }
            }

            if ($origin !== '' && in_array(strtolower($origin), $expandedList, true)) {
                $finalOrigin = $origin;
            } else {
                $finalOrigin = $allowedList[0] ?? '*';
            }
        }

        header('Access-Control-Allow-Origin: ' . $finalOrigin);
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
    }

    public static function preflight(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    public static function json(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        if (!$raw) {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
