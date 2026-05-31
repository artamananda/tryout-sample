// Shared constants and utilities for Bank Soal

export const UTBK_QUESTION_TYPES = [
  { value: "kpu", label: "Penalaran Umum (KPU)" },
  { value: "ppu", label: "Pengetahuan dan Pemahaman Umum (PPU)" },
  { value: "pbm", label: "Pemahaman Bacaan dan Menulis (PBM)" },
  { value: "pku", label: "Pengetahuan Kuantitatif (PKU)" },
  { value: "ind", label: "Literasi Bahasa Indonesia (IND)" },
  { value: "ing", label: "Literasi Bahasa Inggris (ING)" },
  { value: "mtk", label: "Penalaran Matematika (MTK)" },
];

export const SKD_QUESTION_TYPES = [
  { value: "twk", label: "Tes Wawasan Kebangsaan (TWK)" },
  { value: "tiu", label: "Tes Intelegensia Umum (TIU)" },
  { value: "tkp", label: "Tes Karakteristik Pribadi (TKP)" },
];

// All known types combined (for backwards compatibility)
export const DEFAULT_QUESTION_TYPES = [...UTBK_QUESTION_TYPES, ...SKD_QUESTION_TYPES];

export const KNOWN_TYPE_LABELS: Record<string, string> = {
  kpu: "Penalaran Umum (KPU)",
  ppu: "Pengetahuan dan Pemahaman Umum (PPU)",
  pbm: "Pemahaman Bacaan dan Menulis (PBM)",
  pku: "Pengetahuan Kuantitatif (PKU)",
  ind: "Literasi Bahasa Indonesia (IND)",
  ing: "Literasi Bahasa Inggris (ING)",
  mtk: "Penalaran Matematika (MTK)",
  twk: "Tes Wawasan Kebangsaan (TWK)",
  tiu: "Tes Intelegensia Umum (TIU)",
  tkp: "Tes Karakteristik Pribadi (TKP)",
};

export const UTBK_TYPE_CODES = new Set(["kpu", "ppu", "pbm", "pku", "ind", "ing", "mtk"]);
export const SKD_TYPE_CODES = new Set(["twk", "tiu", "tkp"]);

export const getCategoryFromType = (typeCode: string): "utbk" | "skd" =>
  SKD_TYPE_CODES.has(typeCode) ? "skd" : "utbk";

export const getQuestionTypeName = (code: string) => {
  return KNOWN_TYPE_LABELS[code] || code.toUpperCase();
};

export const formatTypeOptions = (rawTypes: string[], category?: "utbk" | "skd") => {
  const baseTypes = category === "skd" ? SKD_QUESTION_TYPES : category === "utbk" ? UTBK_QUESTION_TYPES : DEFAULT_QUESTION_TYPES;
  const customTypes = getCustomTypes().map(t => t.value);
  const allRawTypes = Array.from(new Set([...rawTypes, ...customTypes]));

  const options = allRawTypes
    .filter(type => !category || (category === "skd" ? SKD_TYPE_CODES.has(type) : UTBK_TYPE_CODES.has(type)))
    .map(type => ({ value: type, label: getQuestionTypeName(type) }));

  baseTypes.forEach(def => {
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
