<?php

declare(strict_types=1);

namespace Franchglobal;

final class Session
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $lifetimeDays = max(1, (int) Config::get('SESSION_LIFETIME_DAYS', '30'));
        $lifetime = $lifetimeDays * 86400;

        ini_set('session.gc_maxlifetime', (string) $lifetime);
        ini_set('session.cookie_lifetime', (string) $lifetime);

        $secureOverride = Config::get('SESSION_COOKIE_SECURE');
        $secure = $secureOverride !== null && $secureOverride !== ''
            ? filter_var($secureOverride, FILTER_VALIDATE_BOOLEAN)
            : self::isHttpsRequest();

        $sameSite = Config::get('SESSION_COOKIE_SAMESITE', 'Lax') ?: 'Lax';

        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path' => '/',
            'domain' => '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $sameSite,
        ]);

        session_start();
    }

    private static function isHttpsRequest(): bool
    {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }

        return strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
    }
}
