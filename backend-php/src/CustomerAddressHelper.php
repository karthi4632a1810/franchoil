<?php

declare(strict_types=1);

namespace Franchglobal;

/**
 * Customer address book stored in customers_login.address_json:
 * { "addresses": [ { "id", "label", "name", "phone", "email", "line1", ... } ], "selectedId": "addr_..." }
 * Legacy single-address objects are migrated on read.
 */
final class CustomerAddressHelper
{
    public static function decodeBook(?string $addressJson): array
    {
        if ($addressJson === null || trim($addressJson) === '') {
            return ['addresses' => [], 'selectedId' => null];
        }

        $decoded = json_decode($addressJson, true);
        if (!is_array($decoded)) {
            return ['addresses' => [], 'selectedId' => null];
        }

        if (isset($decoded['addresses']) && is_array($decoded['addresses'])) {
            $addresses = [];
            foreach ($decoded['addresses'] as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $normalized = self::normalizeAddress($row);
                if ($normalized['id'] === '') {
                    $normalized['id'] = self::newAddressId();
                }
                $addresses[] = $normalized;
            }

            $selectedId = isset($decoded['selectedId']) ? trim((string) $decoded['selectedId']) : null;
            if ($selectedId === '') {
                $selectedId = null;
            }

            if ($selectedId !== null && !self::findById($addresses, $selectedId)) {
                $selectedId = $addresses[0]['id'] ?? null;
            }
            if ($selectedId === null && count($addresses) > 0) {
                $selectedId = $addresses[0]['id'];
            }

            return ['addresses' => $addresses, 'selectedId' => $selectedId];
        }

        if (self::looksLikeAddress($decoded)) {
            $addr = self::normalizeAddress($decoded);
            if ($addr['id'] === '') {
                $addr['id'] = self::newAddressId();
            }

            return ['addresses' => [$addr], 'selectedId' => $addr['id']];
        }

        return ['addresses' => [], 'selectedId' => null];
    }

    public static function encodeBook(array $book): string
    {
        $addresses = [];
        foreach ($book['addresses'] ?? [] as $row) {
            if (!is_array($row)) {
                continue;
            }
            $normalized = self::normalizeAddress($row);
            if ($normalized['line1'] === '' && $normalized['city'] === '') {
                continue;
            }
            if ($normalized['id'] === '') {
                $normalized['id'] = self::newAddressId();
            }
            $addresses[] = $normalized;
        }

        $selectedId = isset($book['selectedId']) ? trim((string) $book['selectedId']) : null;
        if ($selectedId === '' || !self::findById($addresses, $selectedId)) {
            $selectedId = $addresses[0]['id'] ?? null;
        }

        return json_encode(
            ['addresses' => $addresses, 'selectedId' => $selectedId],
            JSON_UNESCAPED_SLASHES
        );
    }

    /** @return array<string, mixed> */
    public static function getSelectedAddress(array $book): array
    {
        $addresses = is_array($book['addresses'] ?? null) ? $book['addresses'] : [];
        $selectedId = $book['selectedId'] ?? null;
        if ($selectedId !== null) {
            $found = self::findById($addresses, (string) $selectedId);
            if ($found !== null) {
                return $found;
            }
        }

        return count($addresses) > 0 ? $addresses[0] : [];
    }

    /**
     * @param array<string, mixed> $input PUT /api/auth/me body
     * @param array<string, mixed>|null $existingBook decoded from DB
     */
    public static function mergeProfileAddressInput(array $input, ?array $existingBook): array
    {
        $book = $existingBook ?? ['addresses' => [], 'selectedId' => null];

        if (isset($input['addresses']) && is_array($input['addresses'])) {
            $addresses = [];
            foreach ($input['addresses'] as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $normalized = self::normalizeAddress($row);
                if ($normalized['line1'] === '' && $normalized['city'] === '') {
                    continue;
                }
                if ($normalized['id'] === '') {
                    $normalized['id'] = self::newAddressId();
                }
                $addresses[] = $normalized;
            }

            $selectedId = isset($input['selectedAddressId'])
                ? trim((string) $input['selectedAddressId'])
                : (isset($input['selectedId']) ? trim((string) $input['selectedId']) : null);

            if ($selectedId === '' || !self::findById($addresses, $selectedId)) {
                $selectedId = $addresses[0]['id'] ?? null;
            }

            return ['addresses' => $addresses, 'selectedId' => $selectedId];
        }

        if (isset($input['address']) && is_array($input['address']) && self::looksLikeAddress($input['address'])) {
            $incoming = self::normalizeAddress($input['address']);
            $addresses = is_array($book['addresses'] ?? null) ? $book['addresses'] : [];
            $selectedId = $book['selectedId'] ?? null;

            if ($incoming['id'] === '') {
                $incoming['id'] = self::newAddressId();
            }

            $replaced = false;
            foreach ($addresses as $i => $existing) {
                if (!is_array($existing)) {
                    continue;
                }
                if (($existing['id'] ?? '') === $incoming['id']) {
                    $addresses[$i] = array_merge($existing, $incoming);
                    $replaced = true;
                    break;
                }
            }
            if (!$replaced) {
                if (count($addresses) === 1 && ($addresses[0]['line1'] ?? '') === '') {
                    $addresses[0] = $incoming;
                } else {
                    $addresses[] = $incoming;
                }
            }

            if ($selectedId === null || !self::findById($addresses, (string) $selectedId)) {
                $selectedId = $incoming['id'];
            } else {
                $selectedId = $incoming['id'];
            }

            return ['addresses' => $addresses, 'selectedId' => $selectedId];
        }

        return $book;
    }

    public static function newAddressId(): string
    {
        return 'addr_' . bin2hex(random_bytes(8));
    }

    /** @param array<int, array<string, mixed>> $addresses */
    private static function findById(array $addresses, string $id): ?array
    {
        foreach ($addresses as $row) {
            if (!is_array($row)) {
                continue;
            }
            if ((string) ($row['id'] ?? '') === $id) {
                return $row;
            }
        }

        return null;
    }

  /** @param array<string, mixed> $row */
    private static function looksLikeAddress(array $row): bool
    {
        return trim((string) ($row['line1'] ?? $row['address'] ?? '')) !== ''
            || trim((string) ($row['city'] ?? '')) !== ''
            || trim((string) ($row['pincode'] ?? '')) !== '';
    }

    /** @param array<string, mixed> $row */
    public static function normalizeAddress(array $row): array
    {
        $type = trim((string) ($row['address_type'] ?? $row['label'] ?? 'Home'));
        if ($type === '') {
            $type = 'Home';
        }

        return [
            'id' => trim((string) ($row['id'] ?? '')),
            'label' => $type,
            'address_type' => $type,
            'name' => trim((string) ($row['name'] ?? '')),
            'phone' => preg_replace('/\D/', '', trim((string) ($row['phone'] ?? ''))),
            'email' => strtolower(trim((string) ($row['email'] ?? ''))),
            'line1' => trim((string) ($row['line1'] ?? $row['address'] ?? '')),
            'line2' => trim((string) ($row['line2'] ?? $row['area'] ?? '')),
            'street' => trim((string) ($row['street'] ?? $row['landmark'] ?? '')),
            'landmark' => trim((string) ($row['landmark'] ?? $row['street'] ?? '')),
            'area' => trim((string) ($row['area'] ?? $row['line2'] ?? '')),
            'city' => trim((string) ($row['city'] ?? '')),
            'state' => trim((string) ($row['state'] ?? '')),
            'pincode' => trim((string) ($row['pincode'] ?? $row['zipcode'] ?? '')),
            'country' => trim((string) ($row['country'] ?? 'India')) ?: 'India',
        ];
    }
}
