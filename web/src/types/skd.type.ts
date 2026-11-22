export interface SKDSubtestScore {
  code: 'twk' | 'tiu' | 'tkp' | string;
  name: string;
  score: number;
  max_score: number;
  passing_grade: number;
  passed: boolean;
  questions: number;
  answered: number;
  correct: number;
  wrong: number;
}

export interface SKDResultProps {
  tryout_id: string;
  title: string;
  subtests: SKDSubtestScore[];
  total_score: number;
  max_total_score: number;
  passed_all: boolean;
  weakest_subtest: string;
  rank: number;
  participants: number;
  province: string;
  province_rank: number;
  province_participants: number;
  is_final: boolean;
  final_at: string;
  generated_at: string;
}

export const SKD_SUBTEST_NAMES: Record<string, string> = {
  twk: 'Tes Wawasan Kebangsaan',
  tiu: 'Tes Intelegensia Umum',
  tkp: 'Tes Karakteristik Pribadi'
};
