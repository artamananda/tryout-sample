// Shared constants and utilities for Bank Soal

export const DEFAULT_QUESTION_TYPES = [
  { value: "kpu", label: "Penalaran Umum (KPU)" },
  { value: "ppu", label: "Pengetahuan dan Pemahaman Umum (PPU)" },
  { value: "pbm", label: "Pemahaman Bacaan dan Menulis (PBM)" },
  { value: "pku", label: "Pengetahuan Kuantitatif (PKU)" },
  { value: "ind", label: "Literasi Bahasa Indonesia (IND)" },
  { value: "ing", label: "Literasi Bahasa Inggris (ING)" },
  { value: "mtk", label: "Penalaran Matematika (MTK)" },
];

const CUSTOM_TYPES_KEY = "banksoal_custom_types";

export const getCustomTypes = (): { value: string; label: string }[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_TYPES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomType = (typeValue: string): void => {
  const customTypes = getCustomTypes();
  const exists = customTypes.find((t) => t.value === typeValue);
  if (!exists && !DEFAULT_QUESTION_TYPES.find((t) => t.value === typeValue)) {
    customTypes.push({ value: typeValue, label: typeValue.toUpperCase() });
    localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(customTypes));
  }
};

export const getAllQuestionTypes = (): { value: string; label: string }[] => {
  return [...DEFAULT_QUESTION_TYPES, ...getCustomTypes()];
};

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Mudah" },
  { value: "medium", label: "Sedang" },
  { value: "hard", label: "Sulit" },
];
