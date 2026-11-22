package helper

import (
	"bytes"
	"html/template"
)

// WeeklyReportTryout is one TO line in the weekly progress email.
type WeeklyReportTryout struct {
	Title        string
	Completed    bool
	Total        int
	Trend        string // "naik 12", "turun 5", "sama", ""
	Rank         int
	Participants int
	TWK, TIU     int
	TKP          int
	PassedAll    bool
}

type WeeklyReportItem struct {
	When  string
	Title string
}

type WeeklyReportData struct {
	Name         string
	ProgramName  string
	PackageName  string
	Tryouts      []WeeklyReportTryout
	Weakest      string
	Upcoming     []WeeklyReportItem
	Note         string
	DashboardURL string
	NothingYet   bool
}

var weeklyReportTemplate = template.Must(template.New("weekly").Parse(`<!doctype html>
<html><body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0f2f78;color:#fff;border-radius:12px 12px 0 0;padding:20px 24px">
    <div style="font-size:13px;opacity:.85">Laporan progres mingguan</div>
    <div style="font-size:20px;font-weight:bold;margin-top:4px">{{.ProgramName}}</div>
  </div>
  <div style="background:#fff;border-radius:0 0 12px 12px;padding:24px">
    <p>Halo {{.Name}},</p>
    {{if .NothingYet}}
      <p>Minggu ini belum ada tryout yang kamu selesaikan. Yuk kerjakan TO berikutnya supaya progresmu terukur.</p>
    {{else}}
      <p>Berikut ringkasan hasil tryout paket <b>{{.PackageName}}</b> kamu sejauh ini.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="background:#f0f4ff;text-align:left">
          <th style="padding:8px">TO</th><th style="padding:8px">TWK</th><th style="padding:8px">TIU</th>
          <th style="padding:8px">TKP</th><th style="padding:8px">Total</th><th style="padding:8px">Peringkat</th>
        </tr>
        {{range .Tryouts}}
        <tr style="border-bottom:1px solid #eef0f4">
          <td style="padding:8px">{{.Title}}</td>
          {{if .Completed}}
            <td style="padding:8px">{{.TWK}}</td><td style="padding:8px">{{.TIU}}</td><td style="padding:8px">{{.TKP}}</td>
            <td style="padding:8px"><b>{{.Total}}</b>{{if .Trend}}<br><span style="font-size:12px;color:#6b7280">{{.Trend}}</span>{{end}}</td>
            <td style="padding:8px">{{.Rank}} / {{.Participants}}</td>
          {{else}}
            <td style="padding:8px;color:#9ca3af" colspan="5">belum dikerjakan</td>
          {{end}}
        </tr>
        {{end}}
      </table>
      {{if .Weakest}}<p style="margin-top:16px">Subtes terlemahmu saat ini: <b>{{.Weakest}}</b>. Fokuskan latihan minggu depan di sini.</p>{{end}}
    {{end}}
    {{if .Upcoming}}
      <p style="margin-top:16px"><b>Jadwal 7 hari ke depan</b></p>
      <ul style="padding-left:18px">{{range .Upcoming}}<li>{{.When}} — {{.Title}}</li>{{end}}</ul>
    {{end}}
    {{if .Note}}<div style="margin-top:16px;padding:12px;background:#fff8e1;border-radius:8px">{{.Note}}</div>{{end}}
    {{if .DashboardURL}}<p style="margin-top:20px"><a href="{{.DashboardURL}}" style="background:#0f2f78;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Buka TELISIK</a></p>{{end}}
    <p style="font-size:12px;color:#9ca3af;margin-top:24px">Email ini dikirim karena paketmu termasuk laporan progres mingguan.</p>
  </div>
</div>
</body></html>`))

// TemplateWeeklyReport renders the weekly progress email; values are escaped.
func TemplateWeeklyReport(data WeeklyReportData) (string, error) {
	var buffer bytes.Buffer
	if err := weeklyReportTemplate.Execute(&buffer, data); err != nil {
		return "", err
	}
	return buffer.String(), nil
}
