package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type QuestionGenerator struct {
	config       config.Config
	aiClient     *common.AIClient
	bankSoalRepo *repository.BankSoalRepository
}

func NewQuestionGenerator(cfg config.Config, bankSoalRepo *repository.BankSoalRepository) *QuestionGenerator {
	return &QuestionGenerator{
		config:       cfg,
		aiClient:     common.NewAIClient(cfg.Get),
		bankSoalRepo: bankSoalRepo,
	}
}

// UTBK Question Types with their topics
var utbkQuestionTypes = map[string]utbkTypeConfig{
	"kpu": {
		Name: "Penalaran Umum",
		Topics: []string{
			"Penalaran Logis: Silogisme dan Proposisi",
			"Penalaran Logis: Analogi dan Hubungan Antar Konsep",
			"Penalaran Analitis: Pola dan Deret",
			"Penalaran Analitis: Pengelompokan dan Pengaturan",
			"Penalaran Induktif: Generalisasi dari Data",
			"Penalaran Deduktif: Kesimpulan dari Premis",
			"Penalaran Spasial: Pola Bangun Ruang",
			"Penalaran Verbal: Hubungan Kata dan Makna",
			"Penalaran Kuantitatif Dasar: Perbandingan dan Proporsi",
			"Berpikir Kritis: Evaluasi Argumen",
			"Berpikir Kritis: Identifikasi Kelemahan Argumen",
			"Analisis Tabel dan Grafik Sederhana",
		},
	},
	"ppu": {
		Name: "Pengetahuan dan Pemahaman Umum",
		Topics: []string{
			"Wawasan Kebangsaan: Pancasila dan UUD 1945",
			"Wawasan Kebangsaan: Sejarah Indonesia",
			"Ilmu Pengetahuan Alam Dasar: Biologi",
			"Ilmu Pengetahuan Alam Dasar: Fisika",
			"Ilmu Pengetahuan Alam Dasar: Kimia",
			"Ilmu Pengetahuan Sosial: Ekonomi",
			"Ilmu Pengetahuan Sosial: Geografi Indonesia",
			"Ilmu Pengetahuan Sosial: Sosiologi",
			"Teknologi dan Informasi: Literasi Digital",
			"Isu Kontemporer: Lingkungan dan Pembangunan Berkelanjutan",
			"Isu Kontemporer: Kesehatan Masyarakat",
			"Kebudayaan dan Seni Indonesia",
		},
	},
	"pbm": {
		Name: "Pemahaman Bacaan dan Menulis",
		Topics: []string{
			"Pemahaman Bacaan: Ide Pokok dan Gagasan Utama",
			"Pemahaman Bacaan: Inferensi dan Kesimpulan",
			"Pemahaman Bacaan: Makna Kata dalam Konteks",
			"Pemahaman Bacaan: Hubungan Antar Paragraf",
			"Pemahaman Bacaan: Tujuan dan Sikap Penulis",
			"Kemampuan Menulis: Kalimat Efektif",
			"Kemampuan Menulis: Ejaan dan Tanda Baca (EYD/PUEBI)",
			"Kemampuan Menulis: Paragraf yang Padu",
			"Kemampuan Menulis: Pilihan Kata (Diksi)",
			"Analisis Teks: Teks Eksposisi dan Argumentasi",
			"Analisis Teks: Teks Narasi dan Deskripsi",
			"Analisis Teks: Teks Prosedur dan Laporan",
		},
	},
	"pku": {
		Name: "Pengetahuan Kuantitatif",
		Topics: []string{
			"Aritmatika: Operasi Bilangan dan Pecahan",
			"Aritmatika: Persentase, Rasio, dan Proporsi",
			"Aljabar: Persamaan dan Pertidaksamaan Linear",
			"Aljabar: Sistem Persamaan Linear Dua Variabel",
			"Geometri Dasar: Luas dan Keliling Bangun Datar",
			"Geometri Dasar: Volume dan Luas Permukaan Bangun Ruang",
			"Statistika Dasar: Mean, Median, Modus",
			"Statistika Dasar: Interpretasi Data dan Grafik",
			"Peluang Dasar: Kejadian dan Ruang Sampel",
			"Barisan dan Deret: Aritmatika dan Geometri",
			"Logika Matematika: Pernyataan dan Negasi",
			"Pengukuran dan Konversi Satuan",
		},
	},
	"ind": {
		Name: "Literasi Bahasa Indonesia",
		Topics: []string{
			"Memahami Isi Tersurat dan Tersirat dalam Teks",
			"Mengidentifikasi Jenis Teks dan Struktur",
			"Menyimpulkan dan Memprediksi Informasi dari Teks",
			"Mengevaluasi Kekuatan dan Kelemahan Argumen dalam Teks",
			"Menganalisis Hubungan Sebab-Akibat dalam Teks",
			"Memahami Koherensi dan Kohesi Antar Paragraf",
			"Menganalisis Penggunaan Bahasa dalam Teks Resmi",
			"Mengidentifikasi Fakta dan Opini dalam Teks",
			"Memahami Teks Sastra: Puisi, Cerpen, dan Drama",
			"Menganalisis Teks Editorial dan Berita",
			"Memahami Teks Ilmiah Populer",
			"Menganalisis Penggunaan Majas dan Gaya Bahasa",
		},
	},
	"ing": {
		Name: "Literasi Bahasa Inggris",
		Topics: []string{
			"Reading Comprehension: Main Idea and Supporting Details",
			"Reading Comprehension: Inference and Implication",
			"Reading Comprehension: Vocabulary in Context",
			"Reading Comprehension: Author's Purpose and Tone",
			"Reading Comprehension: Textual Reference and Cohesion",
			"Grammar: Tenses and Subject-Verb Agreement",
			"Grammar: Conditional Sentences and Modals",
			"Grammar: Relative Clauses and Connectors",
			"Error Recognition: Sentence Structure",
			"Analytical Reading: Academic and Scientific Texts",
			"Analytical Reading: Opinion and Argumentative Texts",
			"Cloze Test: Fill in the Blank with Context Clues",
		},
	},
	"mtk": {
		Name: "Penalaran Matematika",
		Topics: []string{
			"Bilangan: Bilangan Bulat, Pecahan, dan Desimal",
			"Aljabar: Fungsi dan Grafik",
			"Aljabar: Persamaan Kuadrat",
			"Aljabar: Eksponen dan Logaritma",
			"Geometri: Teorema Pythagoras dan Trigonometri Dasar",
			"Geometri: Koordinat dan Transformasi",
			"Geometri: Lingkaran dan Sifat-sifatnya",
			"Statistika: Ukuran Pemusatan dan Penyebaran Data",
			"Peluang: Permutasi dan Kombinasi",
			"Peluang: Peluang Kejadian Majemuk",
			"Barisan dan Deret: Aplikasi dalam Konteks",
			"Logika: Pernyataan Majemuk dan Tabel Kebenaran",
			"Matriks: Operasi Dasar dan Determinan",
			"Program Linear: Optimasi Sederhana",
		},
	},
}

type utbkTypeConfig struct {
	Name   string
	Topics []string
}

const QUESTIONS_PER_BATCH = 5
const TYPES_PER_RUN = 1 // Process only 1 type per run to stay within free tier RPD limits (Gemini free: ~20 RPD)

// runIndex tracks which types to process next (rotates through all types)
var runIndex int

func (j *QuestionGenerator) Run() error {
	ctx := context.Background()
	if !j.aiClient.IsConfigured() {
		return fmt.Errorf("AI provider not configured: API key missing")
	}

	// Build a stable ordered list of type codes
	typeCodes := make([]string, 0, len(utbkQuestionTypes))
	for code := range utbkQuestionTypes {
		typeCodes = append(typeCodes, code)
	}
	// Sort for deterministic rotation order
	sortStrings(typeCodes)

	// Pick TYPES_PER_RUN types starting from current runIndex
	selectedCodes := make([]string, 0, TYPES_PER_RUN)
	for i := 0; i < TYPES_PER_RUN && i < len(typeCodes); i++ {
		idx := (runIndex + i) % len(typeCodes)
		selectedCodes = append(selectedCodes, typeCodes[idx])
	}
	runIndex = (runIndex + TYPES_PER_RUN) % len(typeCodes)

	log.Printf("[QuestionGenerator] Processing %d/%d types this run: %v", len(selectedCodes), len(typeCodes), selectedCodes)

	totalGenerated := 0
	totalFailed := 0

	for _, typeCode := range selectedCodes {
		typeConfig := utbkQuestionTypes[typeCode]
		// Get existing questions count for this type to avoid duplicates
		existing, err := j.bankSoalRepo.FindByType(ctx, typeCode, true)
		if err != nil {
			log.Printf("[QuestionGenerator] Error fetching existing questions for %s: %v", typeCode, err)
			continue
		}

		existingTopics := j.getExistingTopicCounts(existing)

		// Pick the topic with fewest questions (balanced distribution)
		selectedTopic := j.selectLeastCoveredTopic(typeConfig.Topics, existingTopics)
		selectedDifficulty := j.selectDifficulty(existing)

		log.Printf("[QuestionGenerator] Generating %d questions for %s (%s) - Topic: %s, Difficulty: %s",
			QUESTIONS_PER_BATCH, typeCode, typeConfig.Name, selectedTopic, selectedDifficulty)

		// Build existing question texts for uniqueness check
		existingTexts := j.getExistingTexts(existing, selectedTopic)

		questions, err := j.generateQuestions(ctx, typeCode, typeConfig.Name, selectedTopic, selectedDifficulty, existingTexts)
		if err != nil {
			log.Printf("[QuestionGenerator] Error generating questions for %s: %v", typeCode, err)
			totalFailed++
			continue
		}

		// Save generated questions
		saved := 0
		for _, q := range questions {
			isOptions := len(q.Options) > 0
			bankSoal := entity.BankSoal{
				BankSoalID:    uuid.New(),
				Type:          typeCode,
				Text:          q.Text,
				IsOptions:     &isOptions,
				Options:       q.Options,
				CorrectAnswer: q.CorrectAnswer,
				Explanation:   q.Explanation,
				Topic:         selectedTopic,
				Difficulty:    selectedDifficulty,
				IsAIGenerated: true,
				Status:        entity.BankSoalStatusDraft,
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			}

			if _, err := j.bankSoalRepo.Create(ctx, bankSoal); err != nil {
				log.Printf("[QuestionGenerator] Failed to save question: %v", err)
			} else {
				saved++
			}
		}

		totalGenerated += saved
		log.Printf("[QuestionGenerator] Saved %d/%d questions for %s (%s)", saved, len(questions), typeCode, typeConfig.Name)

		// Minimal delay between types to avoid rate limiting
		time.Sleep(1 * time.Second)
	}

	log.Printf("[QuestionGenerator] Completed: Generated %d questions across %d types (%d failures)",
		totalGenerated, len(selectedCodes), totalFailed)
	return nil
}

// sortStrings sorts a string slice in-place (simple insertion sort to avoid importing sort package)
func sortStrings(s []string) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j] < s[j-1]; j-- {
			s[j], s[j-1] = s[j-1], s[j]
		}
	}
}

func (j *QuestionGenerator) generateQuestions(ctx context.Context, typeCode, typeName, topic, difficulty string, existingTexts []string) ([]GeneratedQuestion, error) {
	// Build uniqueness context
	var uniquenessInstruction string
	if len(existingTexts) > 0 {
		maxExamples := 10
		if len(existingTexts) < maxExamples {
			maxExamples = len(existingTexts)
		}
		uniquenessInstruction = "\n\nBERIKUT ADALAH SOAL YANG SUDAH ADA (JANGAN membuat soal yang mirip atau serupa):\n"
		for i := 0; i < maxExamples; i++ {
			text := existingTexts[i]
			if len(text) > 100 {
				text = text[:100] + "..."
			}
			uniquenessInstruction += fmt.Sprintf("- %s\n", text)
		}
		uniquenessInstruction += "\nPastikan soal yang kamu buat BERBEDA sepenuhnya dari daftar di atas.\n"
	}

	systemPrompt := j.buildUTBKSystemPrompt(typeCode, typeName)

	userPrompt := fmt.Sprintf(`Buatkan %d soal UTBK untuk kategori %s (%s) dengan topik "%s" dan tingkat kesulitan "%s".

KETENTUAN PENTING:
1. Semua soal WAJIB dalam Bahasa Indonesia (kecuali untuk Literasi Bahasa Inggris)
2. Setiap soal harus memiliki tepat 5 pilihan jawaban (A, B, C, D, E)
3. Soal harus berkualitas tinggi, setara dengan soal UTBK yang asli
4. Setiap soal harus memiliki penjelasan yang lengkap
5. Soal harus UNIK dan tidak boleh mirip dengan soal yang sudah ada
6. Gunakan konteks yang relevan dengan kehidupan sehari-hari atau isu terkini Indonesia
7. Tingkat kesulitan "%s": %s
8. PENTING: Jika soal memerlukan wacana/teks bacaan/stimulus/tabel/data, 
   WAJIB sertakan wacana LENGKAP di field "text" SETIAP soal (bukan hanya di soal pertama).
   Setiap soal harus bisa dipahami secara mandiri tanpa perlu melihat soal lain.
   Gunakan HTML untuk format: <p><b>Bacalah teks berikut!</b></p><p>[wacana lengkap]</p><p><b>Pertanyaan:</b> [pertanyaan]</p>
%s

Format JSON yang HARUS diikuti:
{
  "questions": [
    {
      "text": "<p><b>Bacalah teks berikut!</b></p><p>[ISI WACANA/STIMULUS LENGKAP DI SINI - jangan dipotong]</p><p><b>Pertanyaan:</b> Teks pertanyaan spesifik di sini?</p>",
      "options": ["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4", "E. Pilihan 5"],
      "correct_answer": "A",
      "explanation": "Penjelasan lengkap mengapa jawaban A benar dan mengapa pilihan lain salah"
    }
  ]
}

CATATAN: Untuk soal yang TIDAK memerlukan wacana (misalnya soal matematika langsung), 
field "text" cukup berisi pertanyaan saja tanpa format wacana.`,
		QUESTIONS_PER_BATCH,
		typeName,
		typeCode,
		topic,
		difficulty,
		difficulty,
		j.getDifficultyDescription(difficulty),
		uniquenessInstruction,
	)

	aiResp, err := j.aiClient.Chat(ctx, common.AIRequest{
		Messages: []common.AIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	})
	if err != nil {
		return nil, err
	}

	content := common.CleanJSONContent(aiResp.Content)

	var result GenerateResponse
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		var questions []GeneratedQuestion
		if jsonErr := json.Unmarshal([]byte(content), &questions); jsonErr == nil {
			result.Questions = questions
		} else {
			truncated := content
			if len(truncated) > 200 {
				truncated = truncated[:200]
			}
			return nil, fmt.Errorf("failed to parse AI response: %w (content: %s)", err, truncated)
		}
	}

	return result.Questions, nil
}

func (j *QuestionGenerator) buildUTBKSystemPrompt(typeCode, typeName string) string {
	basePrompt := `Kamu adalah pembuat soal UTBK (Ujian Tulis Berbasis Komputer) profesional dari Indonesia.
Kamu memiliki pengalaman lebih dari 10 tahun dalam membuat soal-soal seleksi masuk perguruan tinggi negeri di Indonesia.

PEDOMAN UTAMA:
1. Semua soal HARUS dalam Bahasa Indonesia yang baku dan benar (sesuai PUEBI/EYD V)
2. Soal harus setara dengan kualitas soal UTBK resmi dari LTMPT/SNPMB
3. Setiap soal harus mengukur kemampuan berpikir tingkat tinggi (HOTS - Higher Order Thinking Skills)
4. Gunakan konteks yang relevan dengan Indonesia (budaya, geografi, sejarah, isu terkini)
5. Hindari soal yang ambigu atau memiliki lebih dari satu jawaban benar
6. Setiap pilihan jawaban harus masuk akal (plausible distractors)
7. SELALU sertakan penjelasan yang komprehensif

ATURAN FORMAT:
- Setiap soal HARUS memiliki tepat 5 pilihan jawaban (A, B, C, D, E)
- correct_answer harus berupa huruf tunggal (A, B, C, D, atau E)
- Respon HANYA dalam format JSON yang valid, tanpa markdown blocks

ATURAN WACANA/TEKS BACAAN (SANGAT PENTING - WAJIB DIPATUHI):
- Jika soal memerlukan wacana, teks bacaan, stimulus, tabel, grafik, atau konteks apa pun, 
  maka teks tersebut HARUS disertakan LENGKAP di dalam field "text" pada SETIAP soal yang merujuk wacana itu.
- JANGAN pernah menulis wacana hanya di satu soal dan merujuknya dari soal lain 
  (misalnya "Berdasarkan teks di atas..." tanpa menyertakan teksnya).
- Setiap soal harus BERDIRI SENDIRI (self-contained) karena soal ditampilkan SATU PER SATU dan BISA DIACAK.
- Wacana/teks TIDAK BOLEH dipotong, disingkat, dihilangkan, atau ditulis "..." - harus LENGKAP.
- Gunakan format HTML di dalam field "text" agar tampilan rapi:
  <p><b>Bacalah teks berikut!</b></p><p>[seluruh isi wacana lengkap tanpa dipotong]</p><p><b>Pertanyaan:</b> [pertanyaan]</p>
- Boleh ada beberapa soal yang berbagi wacana yang sama - tapi SETIAP soal tersebut HARUS 
  menyertakan wacana lengkap yang sama di field "text"-nya masing-masing.
- Field "text" boleh panjang. JANGAN khawatir tentang panjang teks.
`

	// Add type-specific instructions
	switch typeCode {
	case "kpu":
		basePrompt += `
KHUSUS PENALARAN UMUM:
- Soal harus menguji kemampuan penalaran logis, analitis, dan kritis
- Gunakan pola silogisme, analogi, deret, dan pengelompokan
- Sertakan soal yang memerlukan analisis argumen dan penarikan kesimpulan
- Jika soal memerlukan stimulus/bacaan, masukkan stimulus LENGKAP di field "text" setiap soal
- Contoh gaya soal: "Jika semua X adalah Y, dan sebagian Y adalah Z, maka..."
`
	case "ppu":
		basePrompt += `
KHUSUS PENGETAHUAN DAN PEMAHAMAN UMUM:
- Soal harus menguji wawasan kebangsaan dan pengetahuan umum
- Gunakan konteks Indonesia: Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika
- Sertakan soal tentang isu terkini Indonesia yang relevan
- Gunakan fakta-fakta yang akurat dan dapat diverifikasi
- Integrasikan pengetahuan lintas bidang (sains, sosial, budaya)
- Jika soal merujuk pada teks/kutipan/data, sertakan LENGKAP di setiap soal
`
	case "pbm":
		basePrompt += `
KHUSUS PEMAHAMAN BACAAN DAN MENULIS:
- Buat teks bacaan/stimulus (200-400 kata) yang bervariasi: ilmiah populer, editorial, narasi, eksposisi
- WAJIB: Sertakan teks bacaan LENGKAP di field "text" SETIAP soal. JANGAN pisahkan wacana dari soal.
- Soal harus menguji pemahaman literal, inferensial, dan evaluatif
- Sertakan soal tentang EYD/PUEBI, kalimat efektif, dan kepaduan paragraf
- Gunakan bahasa Indonesia yang baku dan benar
- Format field "text" setiap soal: 
  <p><b>Bacalah teks berikut!</b></p><p>[TEKS BACAAN LENGKAP 200-400 KATA - JANGAN DIPOTONG]</p><p><b>Pertanyaan:</b> [pertanyaan spesifik]</p>
`
	case "pku":
		basePrompt += `
KHUSUS PENGETAHUAN KUANTITATIF:
- Soal harus menguji kemampuan numerik dan kuantitatif
- Gunakan konteks kehidupan sehari-hari (belanja, perjalanan, data statistik)
- Sertakan soal tentang perbandingan, persentase, rata-rata, dan proporsi
- Jika soal memerlukan tabel/grafik/data, sertakan data LENGKAP di setiap soal (gunakan HTML table)
- Pastikan perhitungan dan jawaban benar secara matematis
`
	case "ind":
		basePrompt += `
KHUSUS LITERASI BAHASA INDONESIA:
- Buat teks bacaan/stimulus yang substansial (300-500 kata)
- Teks harus mencakup berbagai genre: berita, opini, ilmiah, sastra
- WAJIB: Sertakan teks bacaan LENGKAP di field "text" SETIAP soal. JANGAN pisahkan wacana dari soal.
- Soal harus menguji kemampuan memahami isi tersurat dan tersirat
- Sertakan soal tentang struktur teks, koherensi, dan kohesi
- Gunakan teks yang relevan dengan konteks Indonesia terkini
- Uji kemampuan menganalisis argumen dan mengevaluasi informasi
- Format field "text" setiap soal:
  <p><b>Bacalah teks berikut dengan saksama!</b></p><p>[TEKS BACAAN LENGKAP 300-500 KATA - JANGAN DIPOTONG]</p><p><b>Pertanyaan:</b> [pertanyaan spesifik]</p>
`
	case "ing":
		basePrompt += `
KHUSUS LITERASI BAHASA INGGRIS:
- SOAL dan TEKS BACAAN dalam Bahasa Inggris (ini pengecualian dari aturan Bahasa Indonesia)
- Buat reading passage (200-400 kata) menggunakan teks akademik dan ilmiah populer
- WAJIB: Sertakan reading passage LENGKAP di field "text" SETIAP soal. JANGAN pisahkan passage dari soal.
- Soal harus menguji reading comprehension, vocabulary in context, dan inference
- Sertakan soal grammar dan error recognition
- Level bahasa setara CEFR B2-C1
- Format field "text" setiap soal:
  <p><b>Read the following passage carefully!</b></p><p>[FULL READING PASSAGE 200-400 WORDS - DO NOT TRUNCATE]</p><p><b>Question:</b> [specific question]</p>
`
	case "mtk":
		basePrompt += `
KHUSUS PENALARAN MATEMATIKA:
- Soal harus menguji kemampuan penalaran matematika, bukan sekadar hafalan rumus
- Gunakan konteks kehidupan sehari-hari Indonesia
- Sertakan soal yang memerlukan analisis dan pemecahan masalah multi-langkah
- Pastikan semua perhitungan dan jawaban 100% benar secara matematis
- Sertakan langkah-langkah penyelesaian dalam penjelasan
- Gunakan notasi matematika yang benar
- Jika soal merujuk pada tabel/grafik/data, sertakan data LENGKAP di setiap soal
`
	}

	return basePrompt
}

func (j *QuestionGenerator) getDifficultyDescription(difficulty string) string {
	switch difficulty {
	case "easy":
		return "Soal mudah - menguji pemahaman dasar, satu langkah penyelesaian, konteks sederhana"
	case "medium":
		return "Soal sedang - menguji penerapan konsep, 2-3 langkah penyelesaian, memerlukan analisis"
	case "hard":
		return "Soal sulit - menguji kemampuan analisis tingkat tinggi, multi-langkah, memerlukan sintesis dan evaluasi"
	default:
		return "Soal sedang"
	}
}

func (j *QuestionGenerator) getExistingTopicCounts(questions []entity.BankSoal) map[string]int {
	counts := make(map[string]int)
	for _, q := range questions {
		counts[q.Topic]++
	}
	return counts
}

func (j *QuestionGenerator) selectLeastCoveredTopic(topics []string, existingCounts map[string]int) string {
	minCount := int(^uint(0) >> 1) // Max int
	var candidates []string

	for _, topic := range topics {
		count := existingCounts[topic]
		if count < minCount {
			minCount = count
			candidates = []string{topic}
		} else if count == minCount {
			candidates = append(candidates, topic)
		}
	}

	if len(candidates) == 0 {
		return topics[rand.Intn(len(topics))]
	}
	return candidates[rand.Intn(len(candidates))]
}

func (j *QuestionGenerator) selectDifficulty(existing []entity.BankSoal) string {
	counts := map[string]int{"easy": 0, "medium": 0, "hard": 0}
	for _, q := range existing {
		counts[q.Difficulty]++
	}

	// Target ratio: 30% easy, 40% medium, 30% hard
	total := len(existing)
	if total == 0 {
		return "medium"
	}

	easyRatio := float64(counts["easy"]) / float64(total)
	mediumRatio := float64(counts["medium"]) / float64(total)
	hardRatio := float64(counts["hard"]) / float64(total)

	if easyRatio < 0.25 {
		return "easy"
	}
	if hardRatio < 0.25 {
		return "hard"
	}
	if mediumRatio < 0.35 {
		return "medium"
	}

	// Random if balanced
	diffs := []string{"easy", "medium", "hard"}
	return diffs[rand.Intn(3)]
}

func (j *QuestionGenerator) getExistingTexts(questions []entity.BankSoal, topic string) []string {
	var texts []string
	for _, q := range questions {
		if q.Topic == topic {
			texts = append(texts, q.Text)
		}
	}
	return texts
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
