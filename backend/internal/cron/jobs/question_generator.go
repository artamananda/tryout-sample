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
	config           config.Config
	bankSoalRepo     *repository.BankSoalRepository
	systemConfigRepo *repository.SystemConfigRepository
}

func NewQuestionGenerator(cfg config.Config, bankSoalRepo *repository.BankSoalRepository, systemConfigRepo *repository.SystemConfigRepository) *QuestionGenerator {
	return &QuestionGenerator{
		config:           cfg,
		bankSoalRepo:     bankSoalRepo,
		systemConfigRepo: systemConfigRepo,
	}
}

// ==================== UTBK Question Types ====================

type utbkTypeConfig struct {
	Name   string
	Topics []string
}

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

// ==================== SKD CPNS Question Types ====================

type skdTypeConfig struct {
	Name   string
	Topics []string
}

var skdQuestionTypes = map[string]skdTypeConfig{
	"twk": {
		Name: "Tes Wawasan Kebangsaan",
		Topics: []string{
			// Pilar kebangsaan
			"Pancasila: Sejarah, Nilai-nilai Dasar, dan Pengamalan",
			"Pancasila: Implementasi dalam Kehidupan Berbangsa dan Bernegara",
			"UUD 1945: Pasal-pasal Utama, Amandemen, dan Implikasinya",
			"UUD 1945: Hak dan Kewajiban Warga Negara dalam Konstitusi",
			"Bhinneka Tunggal Ika: Keberagaman, Toleransi, dan Moderasi Beragama",
			"Bhinneka Tunggal Ika: Persatuan dalam Keberagaman Suku, Budaya, dan Agama",
			"NKRI: Wawasan Nusantara dan Ketahanan Nasional",
			// Kehidupan bernegara
			"Sistem Ketatanegaraan: Lembaga-lembaga Negara dan Kewenangannya",
			"Demokrasi Pancasila: Sistem Pemilihan Umum dan Kedaulatan Rakyat",
			"Otonomi Daerah: Desentralisasi dan Hubungan Pusat-Daerah",
			"Hukum dan Peraturan Perundang-undangan: Hierarki dan Supremasi Hukum",
			"Sistem Pertahanan dan Keamanan Negara: TNI, Polri, dan Bela Negara",
			"Kebijakan Publik: Penyelenggaraan Pemerintahan yang Baik (Good Governance)",
			"Hubungan Internasional: Politik Luar Negeri Bebas Aktif Indonesia",
			"Ekonomi Kerakyatan: Kesejahteraan Sosial dan Pembangunan Nasional",
			"Sejarah Indonesia: Proklamasi, Perjuangan Kemerdekaan, dan Peristiwa Penting",
			"Sejarah Indonesia: Orde Lama, Orde Baru, Reformasi, dan Pelajarannya",
			"Nasionalisme dan Bela Negara: Cinta Tanah Air dalam Konteks Kekinian",
			"Integritas, Anti-Korupsi, dan Penyelenggaraan Negara yang Bersih",
		},
	},
	"tiu": {
		Name: "Tes Intelegensia Umum",
		Topics: []string{
			"Verbal: Sinonim dan Antonim",
			"Verbal: Analogi Kata",
			"Verbal: Pengelompokan Kata",
			"Numerik: Berhitung dan Operasi Dasar",
			"Numerik: Deret Angka dan Pola Bilangan",
			"Numerik: Perbandingan Kuantitatif",
			"Numerik: Soal Cerita Matematika",
			"Penalaran Logis: Silogisme dan Inferensi",
			"Penalaran Analitis: Hubungan dan Urutan",
			"Penalaran Logis: Pola Deret Huruf dan Angka",
			"Verbal: Padanan Hubungan Kata",
			"Numerik: Persamaan Linear dan Proporsi",
		},
	},
	"tkp": {
		Name: "Tes Karakteristik Pribadi",
		Topics: []string{
			// Pelayanan Publik
			"Pelayanan Publik: Orientasi dan Komitmen Melayani Masyarakat",
			"Pelayanan Publik: Menangani Keluhan, Pengaduan, dan Situasi Sulit",
			"Pelayanan Publik: Standar Pelayanan Prima dan Kepuasan Pengguna Layanan",
			// Jejaring Kerja
			"Jejaring Kerja: Membangun Kolaborasi Lintas Unit dan Instansi",
			"Jejaring Kerja: Koordinasi, Komunikasi, dan Kerja Sama Tim",
			"Jejaring Kerja: Mengelola Hubungan dengan Pemangku Kepentingan",
			// Sosial Budaya
			"Sosial Budaya: Kepekaan terhadap Keberagaman Sosial dan Budaya",
			"Sosial Budaya: Toleransi, Inklusivitas, dan Penghargaan Perbedaan",
			// TIK - Teknologi Informasi dan Komunikasi
			"TIK: Pemanfaatan Teknologi Digital dalam Pelayanan dan Pekerjaan",
			"TIK: Literasi Digital, Etika Bermedia Sosial, dan Keamanan Informasi",
			// Profesionalisme
			"Profesionalisme: Integritas, Disiplin, dan Tanggung Jawab Kerja",
			"Profesionalisme: Semangat Berprestasi, Inovasi, dan Pengembangan Diri",
			"Profesionalisme: Mengelola Konflik Kepentingan dan Pengambilan Keputusan Etis",
			// Anti Radikalisme
			"Anti Radikalisme: Mengenali dan Menyikapi Paham Radikal di Lingkungan Kerja",
			"Anti Radikalisme: Wawasan Kebangsaan sebagai Benteng dari Ideologi Ekstrem",
		},
	},
}

const QUESTIONS_PER_BATCH = 5
const TYPES_PER_RUN = 1

var utbkRunIndex int
var skdRunIndex int

func (j *QuestionGenerator) Run() error {
	ctx := context.Background()

	// Run UTBK generation
	if err := j.runForCategory(ctx, entity.BankSoalCategoryUTBK); err != nil {
		log.Printf("[QuestionGenerator] UTBK generation error: %v", err)
	}

	// Run SKD CPNS generation
	if err := j.runForCategory(ctx, entity.BankSoalCategorySKD); err != nil {
		log.Printf("[QuestionGenerator] SKD generation error: %v", err)
	}

	return nil
}

// RunForType generates questions for a specific subtest type (manual trigger).
// Returns the number of questions saved.
func (j *QuestionGenerator) RunForType(typeCode string, count int) (int, error) {
	ctx := context.Background()
	category := entity.GetCategoryFromType(typeCode)

	aiClient := j.buildAIClient(ctx, category)
	if !aiClient.IsConfigured() {
		return 0, fmt.Errorf("AI client tidak terkonfigurasi untuk kategori %s. Set API key di Settings > LLM Config atau .env", category)
	}

	var name string
	var topics []string
	if category == entity.BankSoalCategorySKD {
		cfg, ok := skdQuestionTypes[typeCode]
		if !ok {
			return 0, fmt.Errorf("tipe soal tidak dikenal: %s", typeCode)
		}
		name = cfg.Name
		topics = cfg.Topics
	} else {
		cfg, ok := utbkQuestionTypes[typeCode]
		if !ok {
			return 0, fmt.Errorf("tipe soal tidak dikenal: %s", typeCode)
		}
		name = cfg.Name
		topics = cfg.Topics
	}

	existing, err := j.bankSoalRepo.FindByType(ctx, typeCode, true)
	if err != nil {
		return 0, fmt.Errorf("gagal mengambil soal existing: %w", err)
	}

	existingTopics := j.getExistingTopicCounts(existing)
	selectedTopic := j.selectLeastCoveredTopic(topics, existingTopics)
	selectedDifficulty := j.selectDifficulty(existing)
	existingTexts := j.getExistingTexts(existing, selectedTopic)

	log.Printf("[QuestionGenerator] Manual trigger: generating %d questions for %s (%s) - Topic: %s, Difficulty: %s",
		count, typeCode, name, selectedTopic, selectedDifficulty)

	var questions []GeneratedQuestion
	if category == entity.BankSoalCategorySKD {
		questions, err = j.generateSKDQuestions(ctx, aiClient, typeCode, name, selectedTopic, selectedDifficulty, existingTexts)
	} else {
		questions, err = j.generateUTBKQuestions(ctx, aiClient, typeCode, name, selectedTopic, selectedDifficulty, existingTexts)
	}
	if err != nil {
		return 0, fmt.Errorf("gagal generate soal: %w", err)
	}

	// Limit to requested count
	if len(questions) > count {
		questions = questions[:count]
	}

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

	log.Printf("[QuestionGenerator] Manual trigger done: saved %d/%d for %s", saved, len(questions), typeCode)
	return saved, nil
}

func (j *QuestionGenerator) runForCategory(ctx context.Context, category string) error {
	aiClient := j.buildAIClient(ctx, category)
	if !aiClient.IsConfigured() {
		log.Printf("[QuestionGenerator] AI client not configured for category %s, skipping", category)
		return nil
	}

	var typeCodes []string
	switch category {
	case entity.BankSoalCategorySKD:
		for code := range skdQuestionTypes {
			typeCodes = append(typeCodes, code)
		}
	default:
		for code := range utbkQuestionTypes {
			typeCodes = append(typeCodes, code)
		}
	}
	sortStrings(typeCodes)

	var selectedCodes []string
	switch category {
	case entity.BankSoalCategorySKD:
		for i := 0; i < TYPES_PER_RUN && i < len(typeCodes); i++ {
			idx := (skdRunIndex + i) % len(typeCodes)
			selectedCodes = append(selectedCodes, typeCodes[idx])
		}
		skdRunIndex = (skdRunIndex + TYPES_PER_RUN) % len(typeCodes)
	default:
		for i := 0; i < TYPES_PER_RUN && i < len(typeCodes); i++ {
			idx := (utbkRunIndex + i) % len(typeCodes)
			selectedCodes = append(selectedCodes, typeCodes[idx])
		}
		utbkRunIndex = (utbkRunIndex + TYPES_PER_RUN) % len(typeCodes)
	}

	log.Printf("[QuestionGenerator][%s] Processing types: %v", category, selectedCodes)

	totalGenerated := 0
	for _, typeCode := range selectedCodes {
		var name string
		var topics []string
		if category == entity.BankSoalCategorySKD {
			cfg := skdQuestionTypes[typeCode]
			name = cfg.Name
			topics = cfg.Topics
		} else {
			cfg := utbkQuestionTypes[typeCode]
			name = cfg.Name
			topics = cfg.Topics
		}

		existing, err := j.bankSoalRepo.FindByType(ctx, typeCode, true)
		if err != nil {
			log.Printf("[QuestionGenerator] Error fetching existing questions for %s: %v", typeCode, err)
			continue
		}

		existingTopics := j.getExistingTopicCounts(existing)
		selectedTopic := j.selectLeastCoveredTopic(topics, existingTopics)
		selectedDifficulty := j.selectDifficulty(existing)

		log.Printf("[QuestionGenerator][%s] Generating %d questions for %s (%s) - Topic: %s, Difficulty: %s",
			category, QUESTIONS_PER_BATCH, typeCode, name, selectedTopic, selectedDifficulty)

		existingTexts := j.getExistingTexts(existing, selectedTopic)

		var questions []GeneratedQuestion
		var genErr error
		if category == entity.BankSoalCategorySKD {
			questions, genErr = j.generateSKDQuestions(ctx, aiClient, typeCode, name, selectedTopic, selectedDifficulty, existingTexts)
		} else {
			questions, genErr = j.generateUTBKQuestions(ctx, aiClient, typeCode, name, selectedTopic, selectedDifficulty, existingTexts)
		}
		if genErr != nil {
			log.Printf("[QuestionGenerator] Error generating questions for %s: %v", typeCode, genErr)
			continue
		}

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
		log.Printf("[QuestionGenerator][%s] Saved %d/%d questions for %s", category, saved, len(questions), typeCode)
		time.Sleep(1 * time.Second)
	}

	log.Printf("[QuestionGenerator][%s] Completed: generated %d questions", category, totalGenerated)
	return nil
}

// buildAIClient creates an AI client using system config, falling back to .env values.
func (j *QuestionGenerator) buildAIClient(ctx context.Context, category string) *common.AIClient {
	if j.systemConfigRepo != nil {
		var providerKey, apiKeyKey, modelKey string
		if category == entity.BankSoalCategorySKD {
			providerKey = "llm_skd_provider"
			apiKeyKey = "llm_skd_api_key"
			modelKey = "llm_skd_model"
		} else {
			providerKey = "llm_utbk_provider"
			apiKeyKey = "llm_utbk_api_key"
			modelKey = "llm_utbk_model"
		}

		providerCfg, _ := j.systemConfigRepo.FindByKey(ctx, providerKey)
		apiKeyCfg, _ := j.systemConfigRepo.FindByKey(ctx, apiKeyKey)
		modelCfg, _ := j.systemConfigRepo.FindByKey(ctx, modelKey)

		if apiKeyCfg.Value != "" {
			return common.NewAIClientWithValues(providerCfg.Value, apiKeyCfg.Value, modelCfg.Value, j.config.Get)
		}
	}
	// Fall back to .env config
	return common.NewAIClient(j.config.Get)
}

func (j *QuestionGenerator) generateUTBKQuestions(ctx context.Context, aiClient *common.AIClient, typeCode, typeName, topic, difficulty string, existingTexts []string) ([]GeneratedQuestion, error) {
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

	systemPrompt := buildUTBKSystemPrompt(typeCode, typeName)
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
		QUESTIONS_PER_BATCH, typeName, typeCode, topic, difficulty, difficulty,
		getDifficultyDescription(difficulty), uniquenessInstruction,
	)

	return callAI(ctx, aiClient, systemPrompt, userPrompt)
}

func (j *QuestionGenerator) generateSKDQuestions(ctx context.Context, aiClient *common.AIClient, typeCode, typeName, topic, difficulty string, existingTexts []string) ([]GeneratedQuestion, error) {
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

	systemPrompt := buildSKDSystemPrompt(typeCode, typeName)

	var diffDescription string
	if typeCode == "tkp" {
		diffDescription = `Untuk TKP tidak ada konsep benar/salah mutlak — setiap pilihan memiliki bobot nilai berbeda (1-5).
INGAT: Buat deskripsi situasi yang PANJANG dan DETAIL (minimal 5-7 kalimat). Fokus pada:
Pelayanan Publik, Jejaring Kerja, Sosial Budaya, TIK, Profesionalisme, atau Anti Radikalisme.`
	} else {
		diffDescription = getDifficultyDescription(difficulty)
	}

	userPrompt := fmt.Sprintf(`Buatkan %d soal SKD CPNS untuk subtest %s (%s) dengan topik "%s" dan tingkat kesulitan "%s".

KETENTUAN PENTING:
1. Semua soal WAJIB dalam Bahasa Indonesia yang baku
2. Setiap soal harus memiliki tepat 5 pilihan jawaban (A, B, C, D, E)
3. Soal harus berkualitas tinggi, setara dengan soal SKD CPNS resmi BKN
4. Setiap soal harus memiliki penjelasan yang lengkap
5. Soal harus UNIK dan tidak boleh mirip dengan soal yang sudah ada
6. Tingkat kesulitan "%s": %s
7. ⚠️ DILARANG KERAS: Jangan membuat soal yang memerlukan gambar, ilustrasi, diagram,
   atau elemen visual apapun. Soal HARUS bisa dipahami sepenuhnya dari teks saja.
   Untuk pola/deret gunakan angka atau huruf, bukan gambar.
%s

Format JSON yang HARUS diikuti:
{
  "questions": [
    {
      "text": "Teks pertanyaan di sini",
      "options": ["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4", "E. Pilihan 5"],
      "correct_answer": "A",
      "explanation": "Penjelasan lengkap mengapa jawaban A benar"
    }
  ]
}`,
		QUESTIONS_PER_BATCH, typeName, typeCode, topic, difficulty, difficulty,
		diffDescription, uniquenessInstruction,
	)

	return callAI(ctx, aiClient, systemPrompt, userPrompt)
}

func callAI(ctx context.Context, aiClient *common.AIClient, systemPrompt, userPrompt string) ([]GeneratedQuestion, error) {
	aiResp, err := aiClient.Chat(ctx, common.AIRequest{
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
			return questions, nil
		}
		truncated := content
		if len(truncated) > 200 {
			truncated = truncated[:200]
		}
		return nil, fmt.Errorf("failed to parse AI response: %w (content: %s)", err, truncated)
	}
	return result.Questions, nil
}

// ==================== System Prompt Builders ====================

func buildUTBKSystemPrompt(typeCode, typeName string) string {
	base := `Kamu adalah pembuat soal UTBK (Ujian Tulis Berbasis Komputer) profesional dari Indonesia.
Kamu memiliki pengalaman lebih dari 10 tahun dalam membuat soal-soal seleksi masuk perguruan tinggi negeri di Indonesia.

PEDOMAN UTAMA:
1. Semua soal HARUS dalam Bahasa Indonesia yang baku dan benar (sesuai PUEBI/EYD V)
2. Soal harus setara dengan kualitas soal UTBK resmi dari LTMPT/SNPMB
3. Setiap soal harus mengukur kemampuan berpikir tingkat tinggi (HOTS)
4. Gunakan konteks yang relevan dengan Indonesia (budaya, geografi, sejarah, isu terkini)
5. Hindari soal yang ambigu atau memiliki lebih dari satu jawaban benar
6. Setiap pilihan jawaban harus masuk akal (plausible distractors)
7. SELALU sertakan penjelasan yang komprehensif

ATURAN FORMAT:
- Setiap soal HARUS memiliki tepat 5 pilihan jawaban (A, B, C, D, E)
- correct_answer harus berupa huruf tunggal (A, B, C, D, atau E)
- Respon HANYA dalam format JSON yang valid, tanpa markdown blocks

ATURAN WACANA/TEKS BACAAN (SANGAT PENTING):
- Jika soal memerlukan wacana, teks bacaan, stimulus, tabel, grafik, atau konteks apa pun,
  maka teks tersebut HARUS disertakan LENGKAP di dalam field "text" pada SETIAP soal yang merujuk wacana itu.
- JANGAN pernah menulis wacana hanya di satu soal dan merujuknya dari soal lain.
- Setiap soal harus BERDIRI SENDIRI (self-contained) karena soal ditampilkan SATU PER SATU dan BISA DIACAK.
- Wacana/teks TIDAK BOLEH dipotong, disingkat, dihilangkan, atau ditulis "..." - harus LENGKAP.
- Gunakan format HTML di dalam field "text" agar tampilan rapi:
  <p><b>Bacalah teks berikut!</b></p><p>[seluruh isi wacana lengkap tanpa dipotong]</p><p><b>Pertanyaan:</b> [pertanyaan]</p>
`

	switch typeCode {
	case "kpu":
		base += `
KHUSUS PENALARAN UMUM:
- Soal harus menguji kemampuan penalaran logis, analitis, dan kritis
- Gunakan pola silogisme, analogi, deret, dan pengelompokan
- Sertakan soal yang memerlukan analisis argumen dan penarikan kesimpulan
`
	case "ppu":
		base += `
KHUSUS PENGETAHUAN DAN PEMAHAMAN UMUM:
- Soal harus menguji wawasan kebangsaan dan pengetahuan umum
- Gunakan konteks Indonesia: Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika
- Sertakan soal tentang isu terkini Indonesia yang relevan
- Gunakan fakta-fakta yang akurat dan dapat diverifikasi
`
	case "pbm":
		base += `
KHUSUS PEMAHAMAN BACAAN DAN MENULIS:
- Buat teks bacaan/stimulus (200-400 kata) yang bervariasi: ilmiah populer, editorial, narasi, eksposisi
- WAJIB: Sertakan teks bacaan LENGKAP di field "text" SETIAP soal.
- Soal harus menguji pemahaman literal, inferensial, dan evaluatif
- Format field "text" setiap soal:
  <p><b>Bacalah teks berikut!</b></p><p>[TEKS BACAAN LENGKAP 200-400 KATA]</p><p><b>Pertanyaan:</b> [pertanyaan spesifik]</p>
`
	case "pku":
		base += `
KHUSUS PENGETAHUAN KUANTITATIF:
- Soal harus menguji kemampuan numerik dan kuantitatif
- Gunakan konteks kehidupan sehari-hari (belanja, perjalanan, data statistik)
- Pastikan perhitungan dan jawaban benar secara matematis
`
	case "ind":
		base += `
KHUSUS LITERASI BAHASA INDONESIA:
- Buat teks bacaan/stimulus yang substansial (300-500 kata)
- WAJIB: Sertakan teks bacaan LENGKAP di field "text" SETIAP soal.
- Soal harus menguji kemampuan memahami isi tersurat dan tersirat
- Format field "text" setiap soal:
  <p><b>Bacalah teks berikut dengan saksama!</b></p><p>[TEKS BACAAN LENGKAP 300-500 KATA]</p><p><b>Pertanyaan:</b> [pertanyaan spesifik]</p>
`
	case "ing":
		base += `
KHUSUS LITERASI BAHASA INGGRIS:
- SOAL dan TEKS BACAAN dalam Bahasa Inggris
- Buat reading passage (200-400 kata) menggunakan teks akademik dan ilmiah populer
- WAJIB: Sertakan reading passage LENGKAP di field "text" SETIAP soal.
- Level bahasa setara CEFR B2-C1
- Format field "text" setiap soal:
  <p><b>Read the following passage carefully!</b></p><p>[FULL READING PASSAGE 200-400 WORDS]</p><p><b>Question:</b> [specific question]</p>
`
	case "mtk":
		base += `
KHUSUS PENALARAN MATEMATIKA:
- Soal harus menguji kemampuan penalaran matematika, bukan sekadar hafalan rumus
- Gunakan konteks kehidupan sehari-hari Indonesia
- Pastikan semua perhitungan dan jawaban 100% benar secara matematis
- Sertakan langkah-langkah penyelesaian dalam penjelasan
`
	}
	return base
}

func buildSKDSystemPrompt(typeCode, typeName string) string {
	base := `Kamu adalah pembuat soal SKD CPNS (Seleksi Kompetensi Dasar Calon Pegawai Negeri Sipil) profesional dari Indonesia.
Kamu memiliki pengalaman lebih dari 10 tahun dalam membuat soal-soal seleksi CPNS yang diselenggarakan oleh BKN (Badan Kepegawaian Negara).

PEDOMAN UTAMA:
1. Semua soal HARUS dalam Bahasa Indonesia yang baku dan benar (sesuai PUEBI/EYD V)
2. Soal harus setara dengan kualitas soal SKD CPNS resmi dari BKN
3. Gunakan konteks yang relevan dengan pemerintahan dan pelayanan publik Indonesia
4. Hindari soal yang ambigu atau tidak sesuai dengan regulasi terkini
5. SELALU sertakan penjelasan yang komprehensif

LARANGAN KERAS — SOAL GAMBAR/VISUAL:
- DILARANG KERAS membuat soal yang memerlukan gambar, ilustrasi, diagram, atau elemen visual apapun
- JANGAN membuat soal figural (analogi gambar, seri gambar, ketidaksamaan gambar)
- JANGAN mengacu pada "gambar di bawah", "perhatikan gambar", "pola gambar", atau sejenisnya
- Semua soal HARUS bisa dipahami sepenuhnya hanya dari teks
- Soal pola/deret HARUS menggunakan angka, huruf, atau simbol teks — bukan gambar

ATURAN FORMAT:
- Setiap soal HARUS memiliki tepat 5 pilihan jawaban (A, B, C, D, E)
- correct_answer harus berupa huruf tunggal (A, B, C, D, atau E)
- Respon HANYA dalam format JSON yang valid, tanpa markdown blocks
`

	switch typeCode {
	case "twk":
		base += `
KHUSUS TES WAWASAN KEBANGSAAN (TWK):
- Soal menguji pemahaman mendalam terhadap pilar kebangsaan DAN kehidupan bernegara Indonesia
- Pilar kebangsaan: Pancasila, UUD 1945, Bhinneka Tunggal Ika, NKRI
- Kehidupan bernegara: sistem ketatanegaraan, lembaga negara, demokrasi, pemilu, otonomi daerah,
  supremasi hukum, pertahanan keamanan, good governance, hubungan internasional, ekonomi kerakyatan
- Gunakan fakta sejarah, pasal UUD, dan regulasi yang AKURAT dan DAPAT DIVERIFIKASI
- Soal boleh berbentuk pemahaman konsep, penerapan nilai, atau analisis situasi bernegara
- Tingkatkan proporsi soal tentang sistem pemerintahan, kebijakan publik, dan penyelenggaraan negara
`
	case "tiu":
		base += `
KHUSUS TES INTELEGENSIA UMUM (TIU):
- Soal harus menguji kemampuan verbal dan numerik SAJA — TIDAK ada soal figural/gambar
- Verbal: sinonim, antonim, analogi kata (A:B = C:?), pengelompokan kata, padanan hubungan
- Numerik: berhitung, deret angka, deret huruf, perbandingan kuantitatif, soal cerita matematika
- Penalaran: silogisme, inferensi logis, urutan/hubungan antar objek (dinyatakan dengan teks)
- Untuk deret/pola: gunakan angka atau huruf, contoh "2, 4, 8, 16, ..." bukan pola gambar
- Pastikan semua jawaban numerik 100% benar secara matematis
- INGAT: DILARANG membuat soal yang memerlukan melihat gambar atau pola visual
`
	case "tkp":
		base += `
KHUSUS TES KARAKTERISTIK PRIBADI (TKP):
- Soal berbentuk situasional (Situational Judgment Test) yang PANJANG dan KAYA KONTEKS
- Fokus wajib pada 6 aspek utama: Pelayanan Publik, Jejaring Kerja, Sosial Budaya,
  TIK (Teknologi Informasi dan Komunikasi), Profesionalisme, dan Anti Radikalisme

ATURAN PANJANG SOAL (WAJIB):
- Field "text" HARUS berisi deskripsi situasi yang panjang dan detail (minimal 5-7 kalimat)
- Situasi harus menggambarkan: (1) konteks/latar organisasi, (2) tokoh yang terlibat,
  (3) masalah/tantangan yang dihadapi, (4) tekanan atau dilema yang ada,
  (5) pertanyaan apa yang harus dilakukan
- Gunakan format HTML untuk keterbacaan:
  <p><b>Situasi:</b> [deskripsi konteks panjang 2-3 kalimat]</p>
  <p>[Detail masalah/dilema 2-3 kalimat]</p>
  <p><b>Apa yang Anda lakukan?</b></p>

ATURAN PILIHAN JAWABAN:
- 5 pilihan mencerminkan respons berbeda (tidak ada yang mutlak salah)
- Pilihan A = respons PALING TEPAT/IDEAL (skor 5), E = kurang tepat (skor 1)
- Setiap pilihan menggambarkan perilaku positif dengan intensitas/pendekatan berbeda
- Pilihan harus cukup panjang dan spesifik (bukan hanya 1 kata)

ATURAN PENJELASAN (explanation):
- Jelaskan mengapa A adalah pilihan terbaik
- Jelaskan nilai bobot setiap pilihan (A=5, B=4, C=3, D=2, E=1) beserta alasannya
- Kaitkan dengan aspek TKP yang sedang diuji (pelayanan publik / jejaring kerja / dll)

correct_answer diisi huruf pilihan PALING TEPAT (biasanya A).
`
	}
	return base
}

// ==================== Helpers ====================

func getDifficultyDescription(difficulty string) string {
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

func sortStrings(s []string) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j] < s[j-1]; j-- {
			s[j], s[j-1] = s[j-1], s[j]
		}
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
	minCount := int(^uint(0) >> 1)
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
