# Payment Bridge (Midtrans via Novelle)

TELISIK tidak terhubung langsung ke Midtrans. Akun Midtrans dan webhook-nya milik backend **Novelle**, yang menyediakan
bridge khusus TELISIK. Kode bridge: `novelle/backend/internal/handler/bridge.go`.

Konfigurasi di TELISIK hanya satu env:

```
PAYMENT_BRIDGE_URL=https://<domain-api-novelle>
```

Path endpoint, URL callback dan masa berlaku pembayaran (24 jam) sudah ditulis di kode
(`internal/payment/bridge.go`, `internal/controller/order_controller.go`). Jika `PAYMENT_BRIDGE_URL` kosong, checkout
berbayar ditolak dengan pesan bahwa pembayaran belum dikonfigurasi.

## Alur

```
Peserta ─► TELISIK ──(1) POST buat pembayaran──► Novelle ──► Midtrans Snap
                                                   ▲
                                 (2) notifikasi ───┘ (signature SHA512 dicek Novelle)
           TELISIK ◄──(3) ping {"order_id"}──────── Novelle
           TELISIK ──(4) GET status──────────────► Novelle ──► Midtrans Core API
```

1. TELISIK membuat order `PENDING`, lalu meminta Novelle membuat transaksi Snap.
2. Midtrans mengirim notifikasi ke webhook Novelle yang sudah ada (`/api/webhooks/midtrans`). Order berawalan `TLS-`
   dicatat di tabel `bridge_payments` dan **tidak** masuk ke pembayaran/laporan Novelle.
3. Novelle mengirim ping berisi `order_id` saja ke callback TELISIK (maks. 4 percobaan dengan jeda 2s, 6s, 18s).
4. TELISIK menanyakan status ke Novelle. Novelle mengambilnya langsung dari Midtrans, lalu TELISIK mengubah order.

Kenapa tanpa secret: TELISIK tidak pernah memercayai isi ping. Status selalu diambil sendiri dari Novelle lewat HTTPS,
dan nominal dari Midtrans harus sama dengan nominal order. Ping palsu hanya memicu pengecekan status yang tidak
mengubah apa pun.

## 1. Buat pembayaran

`POST {PAYMENT_BRIDGE_URL}/api/bridge/telisik/payments`

```json
{
  "source": "telisik",
  "order_id": "TLS-261123-AB12CD34",
  "gross_amount": 279000,
  "customer": { "name": "Budi", "email": "budi@example.com", "phone": "6281234567890" },
  "items": [{ "id": "<package-id>", "name": "Eksekutif - Gelombang 1", "price": 279000, "quantity": 1 }],
  "callback_url": "https://api.terasbelajarasik.web.id/v1/api/payment/callback",
  "finish_redirect_url": "https://terasbelajarasik.web.id/pesanan/TLS-261123-AB12CD34",
  "expiry_minutes": 1440
}
```

- `order_id` harus cocok `^TLS-[A-Z0-9-]{6,40}$`; `gross_amount` 1 s.d. 10.000.000.
- `callback_url` diambil dari alamat API TELISIK yang menerima request; `finish_redirect_url` dari `Origin` web
  (fallback `WEB_BASE_URL`). Keduanya harus HTTPS dan host-nya ada di allowlist Novelle (`bridgeAllowedHosts`).
  `localhost`/`127.0.0.1` hanya diizinkan bila Midtrans Novelle bukan production.
- Jika total `items` tidak sama dengan `gross_amount` (misalnya karena diskon), Novelle mengirim satu item
  "Paket TELISIK" seharga total.

Respons `201` (atau `200` bila order yang sama diminta ulang; token yang sama dikembalikan):

```json
{ "token": "snap-token", "redirect_url": "https://app.midtrans.com/snap/v4/redirection/snap-token" }
```

Error berbentuk `{"error": "..."}`: `400` input tidak valid, `409` order sudah ada dengan nominal berbeda, `502` Midtrans
menolak, `429` rate limit (30/menit).

## 2. Cek status

`GET {PAYMENT_BRIDGE_URL}/api/bridge/telisik/payments/{order_id}`

```json
{
  "order_id": "TLS-261123-AB12CD34",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "gross_amount": "279000.00",
  "transaction_id": "...",
  "payment_type": "qris",
  "settlement_time": "2026-11-30 10:00:00"
}
```

Bila peserta belum memilih metode bayar (Midtrans belum punya transaksi), `transaction_status` bernilai `pending`.
Order yang tidak dibuat lewat bridge menghasilkan `404`.

## 3. Ping ke TELISIK

`POST {callback_url}` dengan body `{"order_id": "TLS-..."}`. TELISIK (`/v1/api/payment/callback`, rate limit
120/menit) selalu menjawab `200` untuk order yang tidak dikenal, lalu menjalankan pengecekan status.

## Pemetaan status

| Midtrans `transaction_status`        | Status order TELISIK |
| ------------------------------------ | -------------------- |
| `settlement`, `capture` + `accept`   | `PAID`               |
| `pending`, `capture` + `challenge`   | `PENDING`            |
| `expire`                             | `EXPIRED`            |
| `cancel`                             | `CANCELLED`          |
| `deny`, `failure`                    | `FAILED`             |
| lainnya (`refund`, ...)              | tidak diubah         |

Order `PAID` tidak berubah lagi dan paket hanya diberikan sekali. Halaman detail pesanan peserta juga menanyakan status
ke Novelle selama order masih `PENDING`, jadi ping yang gagal terkirim tetap tertangani. Admin tetap bisa menandai lunas
manual dari CMS.

## Menambah domain

Domain baru untuk API atau web TELISIK harus ditambahkan ke `bridgeAllowedHosts` di Novelle, lalu Novelle di-deploy
ulang. Tanpa itu, checkout dari domain tersebut ditolak `400`.
