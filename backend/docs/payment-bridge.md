# Kontrak API Bridge Pembayaran (Midtrans)

TELISIK tidak terhubung langsung ke Midtrans. Akun Midtrans dan webhook-nya milik sistem bisnis lain ("bridge"). Alurnya:

```
Peserta ──► TELISIK API ──(1) buat pembayaran──► Bridge ──► Midtrans (Snap)
                ▲                                   │
                └──────(3) callback status──────────┘ ◄──(2) notifikasi Midtrans
```

1. TELISIK membuat order `PENDING` lalu meminta bridge membuat transaksi Snap.
2. Midtrans mengirim notifikasi ke webhook bridge (tetap seperti sekarang).
3. Untuk `order_id` berawalan `TLS-`, bridge meneruskan status ke callback TELISIK.

## 1. TELISIK → Bridge: buat pembayaran

`POST {PAYMENT_BRIDGE_URL}`

Header:

```
Content-Type: application/json
Authorization: Bearer {PAYMENT_BRIDGE_API_KEY}
```

Body:

```json
{
  "source": "telisik",
  "order_id": "TLS-261122-1A2B3C4D",
  "gross_amount": 279000,
  "customer": { "name": "Nama Peserta", "email": "peserta@example.com", "phone": "6281234567890" },
  "items": [{ "id": "<package_id>", "name": "Eksekutif - TELISIK SKD CPNS 2027", "price": 279000, "quantity": 1 }],
  "callback_url": "https://<api-telisik>/v1/api/payment/callback",
  "finish_redirect_url": "https://<web-telisik>/pesanan/TLS-261122-1A2B3C4D",
  "expiry_minutes": 1440
}
```

- `order_id` dipakai apa adanya sebagai `transaction_details.order_id` Midtrans. Prefiks `TLS-` membedakannya dari order bisnis lain.
- `gross_amount` dalam rupiah, bilangan bulat.
- `finish_redirect_url` dipakai sebagai `callbacks.finish` Snap, supaya peserta kembali ke halaman status pesanan.
- `expiry_minutes` dipakai untuk `expiry` Snap.

Respons sukses (HTTP 2xx) minimal berisi salah satu dari `token` dan `redirect_url`. Keduanya boleh di level atas, atau dibungkus di `data` atau `payload`:

```json
{ "token": "<snap token>", "redirect_url": "https://app.midtrans.com/snap/v4/redirection/<token>" }
```

Kalau gagal, balas status non-2xx. TELISIK menandai order `FAILED` dan peserta diminta mencoba lagi.

## 2. Bridge → TELISIK: callback status

`POST {callback_url}`, yaitu `/v1/api/payment/callback`.

Body cukup berisi field notifikasi Midtrans (boleh diteruskan apa adanya):

```json
{
  "order_id": "TLS-261122-1A2B3C4D",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "gross_amount": "279000.00",
  "transaction_id": "<id transaksi midtrans>",
  "payment_type": "qris",
  "settlement_time": "2026-11-25 10:00:00"
}
```

Header tanda tangan (wajib):

```
X-Callback-Timestamp: <unix detik saat dikirim>
X-Callback-Signature: hex(HMAC-SHA256(PAYMENT_CALLBACK_SECRET, "<timestamp>.<raw body>"))
```

- Tanda tangan dihitung dari **byte body yang persis dikirim**, jadi jangan serialisasi ulang setelah ditandatangani.
- Timestamp harus dalam ±5 menit dari waktu server TELISIK. Callback lama ditolak.
- Bridge sebaiknya sudah memverifikasi `signature_key` Midtrans sebelum meneruskan.

Contoh (Node.js):

```js
const ts = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify(notification);
const signature = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
await fetch(callbackUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Callback-Timestamp": ts, "X-Callback-Signature": signature },
  body,
});
```

Pemetaan status:

| `transaction_status` | Status order TELISIK |
|---|---|
| `settlement`, `capture` + `fraud_status` `accept` | `PAID` (paket langsung aktif) |
| `pending`, `capture` + `challenge` | `PENDING` |
| `expire` | `EXPIRED` |
| `cancel` | `CANCELLED` |
| `deny`, `failure` | `FAILED` |
| lainnya (mis. `refund`) | diabaikan; refund ditangani manual |

Respons TELISIK:

| HTTP | Arti | Bridge sebaiknya |
|---|---|---|
| 200 | Diterima (termasuk callback ulang untuk order yang sudah lunas, dan order non-`TLS-`) | selesai |
| 401 | Tanda tangan salah atau timestamp kedaluwarsa | perbaiki konfigurasi, jangan diulang terus |
| 400 | Nominal tidak sama dengan order, atau body rusak | periksa manual |
| 404 | `order_id` tidak dikenal | periksa manual |
| 5xx | Gangguan sementara | ulangi dengan jeda (retry) |

Callback bersifat idempoten: order yang sudah `PAID` tidak berubah lagi, dan paket hanya diberikan sekali.

## Cadangan

Kalau callback tidak sampai, admin bisa menandai order lunas di CMS (**Pesanan Paket → Tandai Lunas**) setelah memastikan pembayaran masuk di dashboard Midtrans.
