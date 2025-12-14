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

func TemplateEmailRegisterGenerate(name string, email string, password string) string {
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
        background-color: #04073b;
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
      .highlight-card {
        background-color: #f0f0f0;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .highlight-card p {
        font-size: 18px;
        margin: 10px 0;
      }
      .highlight-card span {
        font-weight: bold;
        color: #04073b;
      }
      .highlight-card .label {
        display: inline-block;
        width: 100px; /* Adjust the width for alignment */
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
      .button-container {
        text-align: center;
        margin: 20px 0;
      }
      .button {
        display: inline-block;
        padding: 12px 30px;
        background-color: #25d366;
        color: #ffffff;
        font-size: 16px;
        font-weight: bold;
        text-align: center;
        text-decoration: none;
        border-radius: 5px;
        transition: background-color 0.3s;
      }
      .button:hover {
        background-color: #128c7e;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2 style="color: #f9c92d">TELISIK SYSTEM</h2>
      </div>
      <div class="content">
        <p>Halo %s,</p>
        <p>
          Selamat datang di Telisik! Kami dengan senang hati mengonfirmasi bahwa
          Anda telah menjadi bagian dari komunitas Telisik.
        </p>
        <p>
          Untuk memulai, Anda dapat login menggunakan email dan password
          berikut:
        </p>

        <div class="highlight-card">
          <p><span class="label">Email:</span> <span>%s</span></p>
          <p><span class="label">Password:</span> <span>%s</span></p>
        </div>

        <p>
          <strong>Catatan:</strong> Harap simpan informasi ini dengan baik dan
          rahasiakan, karena Anda akan membutuhkannya untuk login ke akun Anda.
        </p>
        <p>
          Jika Anda membutuhkan bantuan lebih lanjut, atau mengalami kesulitan
          saat login, silakan hubungi tim dukungan kami.
        </p>

        <p>Juga, silahkan bergabung grup WhatsApp berikut:</p>

        <div class="button-container">
          <a
            href="https://chat.whatsapp.com/Gk8SNcsHmk49ixHrnbjUNx"
            target="_blank"
            class="button"
            >Masuk Grup WhatsApp</a
          >
        </div>

        <p>Salam Hangat,</p>
        <p>Tim Telisik</p>
      </div>
      <div class="footer">
        <p>
          Email ini adalah pesan otomatis. Mohon untuk tidak membalas email ini.
        </p>
        <p>
          Jika Anda membutuhkan bantuan lebih lanjut,
          <a href="https://wa.me/6283193592551">Hubungi Kami</a>.
        </p>
      </div>
    </div>
  </body>
</html>`, name, email, password)
	return htmlBody
}

func TemplateProgramRegistrationSuccess(
	name string,
	email string,
	invoiceNumber string,
	programName string,
) string {

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
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
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #04073b;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .header h2 {
      margin: 0;
      color: #f9c92d;
    }
    .content {
      padding: 30px;
      color: #333333;
      line-height: 1.6;
    }
    .highlight-card {
      background-color: #f0f0f0;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .highlight-card p {
      margin: 10px 0;
      font-size: 16px;
    }
    .label {
      display: inline-block;
      width: 140px;
      font-weight: bold;
      color: #04073b;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #25d366;
      color: #ffffff;
      font-size: 16px;
      font-weight: bold;
      text-decoration: none;
      border-radius: 5px;
    }
    .button:hover {
      background-color: #128c7e;
    }
    .footer {
      background-color: #fafafa;
      text-align: center;
      padding: 20px;
      font-size: 14px;
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
      <h2>TELISIK SYSTEM</h2>
    </div>

    <div class="content">
      <p>Halo <strong>%s</strong>,</p>

      <p>
        Terima kasih telah melakukan pendaftaran program di <strong>Telisik</strong>.
        Pendaftaran Anda telah kami terima dengan detail sebagai berikut:
      </p>

      <div class="highlight-card">
        <p><span class="label">Nama Program</span>: %s</p>
        <p><span class="label">Email</span>: %s</p>
        <p><span class="label">Nomor Invoice</span>: %s</p>
      </div>

      <p>
        Mohon simpan nomor invoice tersebut sebagai bukti transaksi Anda.
        Informasi lanjutan terkait program akan kami sampaikan melalui email
        dan melalui grup WhatsApp resmi Telisik.
      </p>

      <p>Silakan bergabung ke grup WhatsApp berikut:</p>

      <div class="button-container">
        <a
          href="https://chat.whatsapp.com/LFW3nOq08WHLM21vIBKqIf"
          target="_blank"
          class="button"
        >
          Masuk Grup WhatsApp
        </a>
      </div>

      <p>Salam hangat,</p>
      <p><strong>Tim Telisik</strong></p>
    </div>

    <div class="footer">
      <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
      <p>
        Butuh bantuan?
        <a href="https://wa.me/6283193592551">Hubungi Kami</a>
      </p>
    </div>
  </div>
</body>
</html>
`, name, programName, email, invoiceNumber)

	return htmlBody
}
