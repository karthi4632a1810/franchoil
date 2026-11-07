<?php

declare(strict_types=1);

namespace Franchglobal;

final class Config
{
    private static bool $loaded = false;

    private static function loadDotEnv(): void
    {
        if (self::$loaded) {
            return;
        }
        self::$loaded = true;

        $paths = [
            dirname(__DIR__) . '/.env',
            dirname(__DIR__) . '/.env.local',
            dirname(__DIR__, 2) . '/.env',
        ];

        foreach ($paths as $path) {
            if (!is_file($path)) {
                continue;
            }

            $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (!is_array($lines)) {
                continue;
            }

            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) {
                    continue;
                }

                $pos = strpos($line, '=');
                if ($pos === false) {
                    continue;
                }

                $name = trim(substr($line, 0, $pos));
                $value = trim(substr($line, $pos + 1));
                if ($name === '') {
                    continue;
                }

                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }

                if (getenv($name) === false) {
                    putenv("{$name}={$value}");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        self::loadDotEnv();
        $value = getenv($key);
        if ($value === false || $value === '') {
            return $default;
        }
        return $value;
    }
}

