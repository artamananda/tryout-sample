# Aturan Bisnis TELISIK SKD CPNS

Dokumen ini mencatat aturan yang **diterapkan sistem** untuk program TELISIK, berdasarkan
"Paket Kelas TELISIK CPNS v2" (16 November 2026). Setiap bagian menandai mana yang berasal dari dokumen bisnis dan mana
yang **ditetapkan saat implementasi** karena dokumen tidak mengaturnya atau saling bertentangan.

Legenda: **[Dokumen]** sesuai dokumen bisnis · **[Implementasi]** keputusan teknis yang perlu dikonfirmasi tim bisnis ·
**[Konfigurasi]** bisa diubah dari CMS tanpa mengubah kode.

Kontrak API pembayaran ada di [backend/docs/payment-bridge.md](../backend/docs/payment-bridge.md).

---

## 1. Paket

- Satu program (gelombang) punya beberapa paket. Isi paket diatur di CMS: jumlah TO, jumlah kelas, hari rekaman, sesi
  mentoring, pembahasan tertulis, email mingguan, grup belajar, sertifikat, garansi, kuota. **[Konfigurasi]**
- Tombol *Buat 5 paket sesuai dokumen bisnis* di CMS mengisi Perdana, Premium, Unggulan, Eksekutif, dan Platinum dengan
  harga dan fee dari dokumen. Hasilnya perlu diperiksa sebelum dibuka. **[Implementasi]**
- Pembeli diurutkan menurut `sort_order` (urutan/tingkat). Paket dengan `sort_order` lebih tinggi dianggap lebih lengkap.
- Harga yang berlaku adalah **harga peluncuran** selama belum melewati `launch_price_until`, setelah itu harga normal.
  Kenaikan harga ±10% setelah tiga minggu diatur dengan mengisi tanggal berakhir harga peluncuran. **[Dokumen] + [Konfigurasi]**
- Harga per sesi = harga berlaku ÷ jumlah TO. "Hemat %" = (nilai normal − harga berlaku) ÷ nilai normal. **[Dokumen]**
- Paket yang nonaktif tidak tampil dan tidak bisa dibeli. Paket yang sudah pernah dipesan tidak bisa dihapus, hanya
  dinonaktifkan.

### Template default (perlu dikonfirmasi)

| Paket | Harga | TO | Kelas | Rekaman | Fitur | Fee tutor |
|---|---|---|---|---|---|---|
| Perdana | Gratis | 1 | 0 | – | tanpa pembahasan | 0% |
| Premium | Rp50.000 | 5 | 0 | – | pembahasan | 15% |
| Unggulan | Rp149.000 | 5 | 5 | 30 hari | pembahasan, grup belajar | 35% |
| Eksekutif | Rp279.000 | 10 | 10 | 60 hari | + email mingguan, sertifikat, garansi | 33% |
| Platinum | Rp449.000 | 10 | 10 | 90 hari | + 1 mentoring, kuota 50 | 33% + Rp60.000/sesi |

Di mana dokumen bertentangan, template mengikuti **tabel perbandingan fitur**: grup belajar mulai dari Unggulan dan
sertifikat mulai dari Eksekutif. Perdana tidak menyertakan pembahasan tertulis (dokumen tidak menyebutnya).
**[Implementasi]**

## 2. Pendaftaran dan pembelian

- Pembelian hanya bisa dilakukan saat pendaftaran program terbuka (antara `open_registration` dan
  `close_registration`). **[Dokumen]**
- **Nomor WhatsApp wajib** diisi di profil sebelum memesan paket apa pun. Nomor disimpan dalam format `62xxxxxxxxxx`
  dan satu nomor hanya boleh dipakai satu akun. **[Dokumen] + [Implementasi]**
- **Perdana gratis hanya sekali per nomor WhatsApp**, bahkan jika pesertanya berganti akun. Dijaga di aplikasi dan di
  database. **[Dokumen]**
- Peserta **tidak bisa membeli paket yang sama atau lebih rendah** dari yang sudah dimilikinya. Paket yang lebih tinggi
  bisa dibeli sebagai upgrade (bagian 3). **[Implementasi]**
- Program yang dijual lewat paket **tidak bisa didaftari gratis** lewat form pendaftaran program lama. **[Implementasi]**
- Kuota paket menghitung pesanan lunas **ditambah** pesanan menunggu pembayaran yang belum kedaluwarsa, supaya kursi
  tidak terjual berlebih. Kuota dikunci saat checkout. **[Implementasi]**
- Pesanan yang belum dibayar kedaluwarsa setelah `PAYMENT_EXPIRY_MINUTES` (default 1.440 menit = 24 jam).
  Klik "beli" berulang untuk paket yang sama memakai kembali pesanan yang masih terbuka. **[Implementasi]**
- Nomor pesanan berawalan `TLS-` untuk membedakannya dari pesanan bisnis lain yang berbagi akun Midtrans.

## 3. Paket Tambah (upgrade)

- Peserta yang naik ke paket lebih tinggi **dalam 7 hari sejak pembayaran terakhir** di program itu membayar
  **harga paket tujuan dikurangi total yang sudah dibayarnya** di program tersebut. Contoh: Premium (Rp50.000) →
  Unggulan (Rp149.000) = Rp99.000. **[Dokumen] untuk Premium → Unggulan**
- Setelah 7 hari, atau jika paket sebelumnya gratis, berlaku **harga penuh** paket tujuan. **[Implementasi]**
- Aturan selisih ini berlaku untuk **semua** upgrade, bukan hanya Premium → Unggulan. **[Implementasi]**
- Jika selisih sampai nol, paket langsung diberikan tanpa pembayaran.

## 4. Pembayaran

- Pembayaran dibuat lewat API bridge Midtrans milik sistem lain. TELISIK tidak menerima webhook Midtrans langsung.
- Status pesanan berubah hanya lewat callback bridge yang **ditandatangani HMAC-SHA256**, dengan timestamp maksimal ±5 menit
  dari waktu server.
- Callback `settlement` (atau `capture` dengan fraud `accept`) menandai pesanan **lunas** dan memberikan paket. Nominal
  pada callback **harus sama** dengan nominal pesanan; bila berbeda, callback ditolak.
- Callback bersifat **idempoten**: pesanan yang sudah lunas tidak bisa kembali ke status lain, dan paket hanya diberikan
  sekali.
- `expire`, `cancel`, dan `deny/failure` mengubah status menjadi `EXPIRED`, `CANCELLED`, dan `FAILED`. Status lain
  (misalnya `refund`) **diabaikan**; refund ditangani manual. **[Implementasi]**
- Admin bisa **menandai lunas manual** di CMS (Pesanan Paket → Tandai Lunas) bila callback tidak sampai. Pastikan
  pembayaran sudah masuk di dashboard Midtrans sebelum menandai.
- Kebijakan refund dan syarat garansi untuk halaman S&K **belum ditetapkan** tim bisnis.

## 5. Akses tryout

- Tryout yang tertaut ke program **hanya bisa diikuti anggota program itu**.
- Paket membuka **TO 1 sampai N**, N = jumlah TO paket **ditambah bonus rujukan**. Tryout dengan nomor TO 0 terbuka
  untuk semua anggota. **[Dokumen] + [Implementasi]**
- Pendaftaran lama yang dibuat sebelum ada paket (tanpa paket) **tetap punya akses penuh**, supaya peserta lama tidak
  terkunci. **[Implementasi]**
- TO dari program hanya bisa **dimulai** antara `start_time` dan `end_time`. Peserta yang sudah memulai sebelum `end_time`
  boleh melanjutkan. Dokumen: TO dibuka sehari sebelum kelas dan ditutup pukul 18.00 hari kelas; atur lewat waktu
  mulai dan selesai TO. **[Dokumen] + [Konfigurasi]**
- Jawaban diterima sampai durasi TO habis **ditambah toleransi 2 menit**, lalu ditolak. **[Implementasi]**
- Token tryout tidak pernah dikirim ke peserta.

## 6. Penilaian SKD dan peringkat

- Mode penilaian dipilih per tryout: `irt` (UTBK) atau `skd`. **[Konfigurasi]**
- **TWK dan TIU:** 5 poin untuk jawaban benar, 0 untuk salah atau kosong.
- **TKP:** 1–5 poin sesuai bobot opsi yang dipilih. Jika bobot tidak diisi, dipakai urutan posisi (opsi pertama 5 sampai
  opsi kelima 1), sesuai konvensi generator soal. Bobot bisa diisi di CMS (bank soal). Jawaban kosong bernilai 0.
- **Passing grade:** TWK 65, TIU 80, TKP 166. Nilai ini ditulis di kode (`SKDSubtests`) dan perlu diubah di sana bila BKN
  mengubahnya. **[Implementasi]**
- Skor maksimum satu TO standar (30 TWK, 35 TIU, 45 TKP) = 550.
- **Subtes terlemah** = subtes dengan rasio skor terhadap passing grade paling rendah.
- **Urutan peringkat:** total skor, lalu TKP, lalu TIU, lalu TWK, lalu yang selesai lebih dulu. Skor yang identik berbagi
  peringkat. **[Implementasi]**
- Peserta dianggap **selesai** jika menekan selesai atau waktu pengerjaannya habis.
- **Peringkat sementara** tampil langsung setelah selesai dan berlabel "sementara". Peringkat menjadi **final** setelah
  `end_time` TO. Peringkat dihitung ulang paling lambat tiap 60 detik. **[Dokumen] (sementara + final)**
- Peringkat provinsi memakai provinsi di profil peserta.
- Opsi soal **diacak** saat tryout dibuat dari bank soal, dan bobot TKP ikut berpindah bersama opsinya.

## 6a. Pembahasan

- Kunci jawaban, bobot TKP, dan pembahasan tertulis hanya terlihat **setelah `end_time` TO** dan **hanya untuk paket
  yang menyertakan pembahasan**. Selama TO dibuka, semuanya disembunyikan. **[Dokumen] + [Implementasi]**

## 7. Kelas live

- Kelas ke-k membuka untuk paket dengan jumlah kelas ≥ k. Kelas ke-k biasanya membahas TO ke-k. **[Dokumen]**
- **Link meeting** muncul mulai **30 menit sebelum kelas** sampai kelas selesai. Menekan "Gabung" mencatat kehadiran.
  **[Implementasi]**
- **Rekaman** tersedia sampai `tanggal kelas + hari rekaman paket` (30/60/90 hari), bukan dihitung dari tanggal
  pembelian. **[Implementasi]**
- **Rating** 1–5 bisa diberikan setelah kelas dimulai, satu per peserta per kelas (bisa diubah).
- Jadwal otomatis di CMS memakai pola dokumen: Senin/Rabu/Jumat pukul 19.45–22.45 WIB mulai 30 November 2026,
  tutor bergiliran. **[Dokumen]**

## 8. Mentoring 1:1

- Jatah mentoring mengikuti paket. Sesi yang dipesan, selesai, atau tidak hadir **menghabiskan jatah**; sesi yang
  dibatalkan tidak. **[Implementasi]**
- **Booking ditutup 2 jam** sebelum sesi. **Pembatalan** oleh peserta bisa sampai **24 jam** sebelum sesi; sesudahnya
  harus lewat admin. **[Implementasi]**
- Satu slot hanya bisa dipesan satu peserta; pemesanan bersamaan dijaga dengan penguncian database.
- Link sesi hanya terlihat oleh peserta yang memesan slot itu.
- Durasi slot default **30 menit**. Dokumen menyebut 30 menit di tabel paket dan 60 menit di tabel fitur. **[Perlu diputuskan]**

## 9. Rujukan

- Setiap peserta punya kode rujukan 8 karakter (tanpa karakter yang mirip seperti 0/O dan 1/I/L).
- Teman mendapat **potongan Rp10.000** dan pengajak mendapat **+1 TO** setelah pesanan temannya lunas. **[Dokumen]**
- Kode hanya berlaku untuk **pembelian paket berbayar pertama** teman di program itu (bukan upgrade, bukan paket gratis).
  **[Implementasi]**
- Kode tidak bisa dipakai pada akun sendiri atau akun dengan nomor WhatsApp yang sama dengan pengajak. **[Implementasi]**
- Bonus +1 TO hanya masuk jika pengajak **sudah terdaftar di program yang sama**; jika belum, hadiah dicatat 0 beserta
  alasannya. Hadiah diberikan **sekali per pesanan** walaupun callback diterima berulang. **[Implementasi]**
- Satu TO tambahan membuka TO berikutnya di luar jumlah TO paket (Unggulan dengan 1 bonus bisa membuka TO 6).

## 10. Garansi naik kelas

- Hanya paket dengan opsi garansi (template: Eksekutif). **[Dokumen]**
- Syarat: **semua TO paket sudah selesai** dan **skor TO terakhir tidak lebih tinggi** dari skor TO pertama.
  **[Dokumen] + [Implementasi]**
- Satu klaim per peserta per program. Admin menyetujui atau menolak di CMS.
- Disetujui = peserta mendapat **paket yang sama di gelombang tujuan secara gratis**; gelombang tujuan harus sudah punya
  paket dengan kode yang sama. Sistem tidak memeriksa ulang bahwa peserta mengerjakan semua kelas; itu dinilai admin.
  **[Implementasi]**
- Syarat tambahan (misalnya kehadiran kelas) **belum diatur**.

## 11. Sertifikat

- Hanya paket dengan opsi sertifikat (template: Eksekutif dan Platinum). Terbit setelah **semua TO paket selesai**.
  **[Implementasi]**
- Nomor sertifikat berformat `TLS-TAHUN-XXXXXX`, satu per peserta per program, tidak berubah walau diminta ulang.
- Halaman `/sertifikat/:nomor` **terbuka untuk umum** dan sekaligus menjadi halaman verifikasi. Isinya nama, program,
  paket, skor SKD tertinggi, dan tanggal terbit.

## 12. Email progres mingguan

- Dikirim **tiap Minggu pukul 19.00 WIB** kepada peserta paket yang menyertakan email progres (template: Eksekutif dan
  Platinum). **[Dokumen] + [Implementasi]**
- Hanya program yang sedang berjalan (7 hari sebelum mulai sampai 7 hari sesudah selesai). Admin bisa mengirim manual
  per program atau menghitung penerima dulu.
- Isi: skor tiap TO, tren dibanding TO sebelumnya, peringkat, subtes terlemah, jadwal kelas dan mentoring 7 hari ke
  depan, serta **catatan admin** ("informasi terbaru") yang sama untuk semua penerima.
- **Satu email per peserta per program per minggu** (minggu dimulai Senin WIB). Pengiriman yang gagal dicatat dan dicoba
  lagi pada proses berikutnya, tanpa mengganggu peserta lain.

## 13. Fee tutor

Laporan ada di CMS (Program → Fee Tutor), dengan ekspor Excel. Nilainya **bruto, sebelum pajak** penghasilan tutor.

- **Fee per kelas** = jumlah untuk setiap peserta yang paketnya mencakup kelas itu dari
  `total yang dibayar peserta × persen fee tutor paketnya ÷ jumlah kelas paketnya`. Contoh: Unggulan Rp149.000 × 35% ÷ 5 =
  **Rp10.430**; Eksekutif Rp279.000 × 33% ÷ 10 = **Rp9.207**; Platinum Rp449.000 × 33% ÷ 10 = **Rp14.817**. **[Dokumen]**
- Dasarnya adalah **jumlah yang benar-benar dibayar**, jadi termasuk potongan rujukan dan selisih upgrade. **[Implementasi]**
- **Fee minimum Rp200.000 per kelas** diterapkan pada setiap kelas yang sudah selesai (dokumen menulis "bila peserta
  kurang dari 20", sementara contohnya sendiri memakai 20 peserta). **[Implementasi]**
- Hanya **kelas yang sudah terlaksana** yang dibayar.
- **Bonus kualitas 10%** dari fee kelas tutor bila rata-rata rating kelasnya dalam gelombang itu minimal **4,7**.
  **[Dokumen] + [Implementasi]**
- **Mentoring:** setiap sesi berstatus DONE dibayar sesuai fee mentoring paket pesertanya (template Rp60.000).
- **Pool soal:** pembayaran paket tanpa kelas (Premium, Perdana) × persen fee paket tersebut dikumpulkan sebagai pool
  penyusun soal. Pembagiannya ke penyusun soal **di luar sistem**. **[Dokumen]**
- Pembayaran fee kelas dikumpulkan dan ditransfer tiap bulan; fee soal setelah paket TO terbit dan lolos telaah.
  Sistem hanya menghitung, tidak mengirim pembayaran. **[Dokumen]**

## 14. Data pribadi

- Nomor WhatsApp hanya dilihat admin (daftar pesanan, ranking SKD, daftar mentoring, klaim garansi) dan dipakai untuk
  mengirim hasil serta penawaran kepada peserta yang setuju dihubungi.
- Peserta hanya bisa membaca data miliknya sendiri; daftar user dan data peserta lain hanya untuk admin.
- Email akun **dikunci** untuk peserta; hanya admin yang bisa mengubahnya.

## 15. Keputusan yang masih terbuka

| Topik | Keadaan sekarang | Yang perlu diputuskan |
|---|---|---|
| Kuota Platinum | template 50 | Kapasitas mentoring 4 tutor × 2 sesi × 3 Sabtu hanya 24 sebelum kelas ke-10 selesai |
| Durasi mentoring | slot default 30 menit | Dokumen menyebut 30 dan 60 menit |
| Verifikasi nomor WhatsApp | hanya keunikan nomor | Metode (kirim pesan ke nomor TELISIK, kirim hasil ke WA, atau cek nomor terdaftar). Kolom `phone_verified_at` sudah ada |
| Refund | diabaikan oleh sistem, manual | Kebijakan dan S&K |
| Syarat garansi | semua TO selesai dan skor tidak naik | Perlu syarat kehadiran kelas atau tidak |
| Upgrade selisih | berlaku untuk semua upgrade dalam 7 hari | Hanya Premium → Unggulan, atau semua |
| Rekaman | dihitung dari tanggal kelas | Dari tanggal kelas atau tanggal pembelian |
| Pajak tutor | laporan bruto | Pemotongan PPh bila TELISIK berbadan usaha (konsultan pajak) |
