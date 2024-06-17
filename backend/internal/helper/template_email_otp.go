package helper

import "fmt"

func TemplateEmailOtp(name string, otp string) string {
	htmlBody := fmt.Sprintf(`
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #04073B;
                color: #ffffff;
                padding: 10px;
                text-align: center;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            .content {
                padding: 20px 0;
                text-align: justify;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666666;
            }
            .footer a {
                color: #007bff;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="color: #F9C92D;">TELISIK SYSTEM</h2>
            </div>
            <div class="content">
                <p>Halo %s,</p>
                <p>Terima kasih telah mendaftar untuk menjadi bagian dari Telisik. Untuk melanjutkan proses pendaftaran, silakan gunakan Kode One-Time Password (OTP) berikut:</p>
                <h3 style="text-align: center; font-size: 50px;">%s</h3>
                <p>Kode OTP ini digunakan untuk verifikasi identitas Anda dan hanya berlaku untuk satu kali penggunaan. Mohon untuk tidak memberikan kode ini kepada siapa pun.</p>
                <p>Jika Anda tidak melakukan permintaan ini, silakan abaikan email ini. Hubungi tim dukungan kami segera jika Anda membutuhkan bantuan lebih lanjut.</p>
                <p>Salam Hangat,</p>
                <p>Tim Telisik</p>
            </div>
            <div class="footer">
                <p>Email ini adalah pesan otomatis. Mohon untuk tidak membalas email ini.</p>
                <p>Jika Anda membutuhkan bantuan lebih lanjut, <a href="https://wa.me/6283193592551">Hubungi Kami</a>.</p>
            </div>
        </div>
    </body>
    </html>`, name, otp)
	return htmlBody
}
