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

export const KNOWN_TYPE_LABELS: Record<string, string> = {
  kpu: "Penalaran Umum (KPU)",
  ppu: "Pengetahuan dan Pemahaman Umum (PPU)",
  pbm: "Pemahaman Bacaan dan Menulis (PBM)",
  pku: "Pengetahuan Kuantitatif (PKU)",
  ind: "Literasi Bahasa Indonesia (IND)",
  ing: "Literasi Bahasa Inggris (ING)",
  mtk: "Penalaran Matematika (MTK)",
};

export const getQuestionTypeName = (code: string) => {
  return KNOWN_TYPE_LABELS[code] || code.toUpperCase();
};

export const formatTypeOptions = (rawTypes: string[]) => {
  const customTypes = getCustomTypes().map(t => t.value);
  const allRawTypes = Array.from(new Set([...rawTypes, ...customTypes]));
  
  const options = allRawTypes.map(type => ({
      value: type,
      label: getQuestionTypeName(type)
  }));
  
  // Also include defaults that might not be in the database yet but are "known"
  DEFAULT_QUESTION_TYPES.forEach(def => {
      if (!options.find(o => o.value === def.value)) {
          options.push(def);
      }
  });

  return options;
};

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
