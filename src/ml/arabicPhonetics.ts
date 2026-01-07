/**
 * Arabic Phonetics Database
 * Maps each Arabic letter to phonetic representations for ML-based speech recognition
 */

export interface PhoneticVariation {
  primary: string;
  variations: string[];
  commonMispronunciations: string[];
  weight: number; // Importance weight for ML algorithm
}

/**
 * Comprehensive phonetic mapping for all 28 Arabic letters
 * Includes multiple dialects and child pronunciation variations
 */
export const arabicPhoneticMap: Record<string, PhoneticVariation> = {
  'ا': {
    primary: 'alif',
    variations: ['a', 'aa', 'ah', 'aaa', 'alef', 'elif'],
    commonMispronunciations: ['al', 'alf', 'alfa'],
    weight: 1.0,
  },
  'ب': {
    primary: 'baa',
    variations: ['ba', 'bah', 'be', 'beh', 'bee'],
    commonMispronunciations: ['pa', 'paa', 'va'],
    weight: 0.9,
  },
  'ت': {
    primary: 'taa',
    variations: ['ta', 'tah', 'te', 'teh', 'tee'],
    commonMispronunciations: ['tha', 'da', 'tea'],
    weight: 0.9,
  },
  'ث': {
    primary: 'thaa',
    variations: ['tha', 'thah', 'the', 'theh', 'sa'],
    commonMispronunciations: ['ta', 'za', 'fa'],
    weight: 0.85,
  },
  'ج': {
    primary: 'jeem',
    variations: ['ja', 'jah', 'jee', 'gee', 'ge', 'jim'],
    commonMispronunciations: ['gim', 'jem', 'gem'],
    weight: 0.9,
  },
  'ح': {
    primary: 'haa',
    variations: ['ha', 'hah', 'he', 'heh', 'hha'],
    commonMispronunciations: ['kha', 'ah', 'h'],
    weight: 0.85,
  },
  'خ': {
    primary: 'khaa',
    variations: ['kha', 'khah', 'khe', 'kheh', 'x'],
    commonMispronunciations: ['ka', 'ha', 'cha'],
    weight: 0.85,
  },
  'د': {
    primary: 'daal',
    variations: ['da', 'dah', 'de', 'dal'],
    commonMispronunciations: ['ta', 'dul'],
    weight: 0.9,
  },
  'ذ': {
    primary: 'dhaal',
    variations: ['dha', 'dhah', 'the', 'zal', 'thal', 'zaal'],
    commonMispronunciations: ['da', 'za', 'tha'],
    weight: 0.85,
  },
  'ر': {
    primary: 'raa',
    variations: ['ra', 'rah', 're', 'reh', 'rrr'],
    commonMispronunciations: ['ar', 'ruh'],
    weight: 0.9,
  },
  'ز': {
    primary: 'zaay',
    variations: ['za', 'zah', 'ze', 'zeh', 'zay'],
    commonMispronunciations: ['sa', 'zi'],
    weight: 0.9,
  },
  'س': {
    primary: 'seen',
    variations: ['sa', 'sah', 'se', 'seen', 'sin'],
    commonMispronunciations: ['za', 'tha'],
    weight: 0.9,
  },
  'ش': {
    primary: 'sheen',
    variations: ['sha', 'shah', 'she', 'sheh', 'shin', 'sheen'],
    commonMispronunciations: ['sa', 'cha', 'shee'],
    weight: 0.9,
  },
  'ص': {
    primary: 'saad',
    variations: ['sa', 'saa', 'sod', 'ssaa', 'sad', 'swad', 'swaad'],
    commonMispronunciations: ['sud', 'sa'],
    weight: 0.85,
  },
  'ض': {
    primary: 'daad',
    variations: ['da', 'daa', 'dod', 'ddaa', 'dad', 'dwad', 'dwaad', 'zwad', 'zwaad'],
    commonMispronunciations: ['dud', 'da', 'za'],
    weight: 0.85,
  },
  'ط': {
    primary: 'taa',
    variations: ['ta', 'taa', 'toh', 'ttaa', 'tah'],
    commonMispronunciations: ['tuu', 'tui', 'da'],
    weight: 0.85,
  },
  'ظ': {
    primary: 'dhaa',
    variations: ['za', 'zaa', 'zoh', 'zzaa', 'thaa'],
    commonMispronunciations: ['za', 'dha'],
    weight: 0.85,
  },
  'ع': {
    primary: 'ayn',
    variations: ['ay', 'ayn', 'ein', 'aa', 'a'],
    commonMispronunciations: ['aun', 'an', 'aah'],
    weight: 0.8,
  },
  'غ': {
    primary: 'ghayn',
    variations: ['gha', 'ghah', 'gh', 'ghein'],
    commonMispronunciations: ['ga', 'kha', 'rain'],
    weight: 0.85,
  },
  'ف': {
    primary: 'faa',
    variations: ['fa', 'fah', 'fe', 'feh'],
    commonMispronunciations: ['va', 'pha'],
    weight: 0.9,
  },
  'ق': {
    primary: 'qaaf',
    variations: ['qa', 'qah', 'qaf', 'kaf'],
    commonMispronunciations: ['ka', 'ga', 'qaa'],
    weight: 0.85,
  },
  'ك': {
    primary: 'kaaf',
    variations: ['ka', 'kah', 'ke', 'keh', 'kaf'],
    commonMispronunciations: ['qa', 'ca'],
    weight: 0.9,
  },
  'ل': {
    primary: 'laam',
    variations: ['la', 'lah', 'le', 'leh', 'lam'],
    commonMispronunciations: ['al', 'laa'],
    weight: 0.9,
  },
  'م': {
    primary: 'meem',
    variations: ['ma', 'mah', 'me', 'meh', 'mim'],
    commonMispronunciations: ['mee', 'em'],
    weight: 0.9,
  },
  'ن': {
    primary: 'noon',
    variations: ['na', 'nah', 'ne', 'neh', 'nun'],
    commonMispronunciations: ['en', 'noon'],
    weight: 0.9,
  },
  'ه': {
    primary: 'haa',
    variations: ['ha', 'hah', 'he', 'heh', 'heh'],
    commonMispronunciations: ['ah', 'h'],
    weight: 0.9,
  },
  'و': {
    primary: 'waaw',
    variations: ['wa', 'wah', 'wo', 'woh', 'waw'],
    commonMispronunciations: ['oo', 'wo'],
    weight: 0.9,
  },
  'ي': {
    primary: 'yaa',
    variations: ['ya', 'yah', 'ye', 'yeh', 'yay'],
    commonMispronunciations: ['ee', 'yi'],
    weight: 0.9,
  },
};

/**
 * Get all valid phonetic representations for a letter
 */
export const getPhoneticVariations = (letter: string): string[] => {
  const phonetic = arabicPhoneticMap[letter];
  if (!phonetic) return [];
  
  return [
    phonetic.primary,
    ...phonetic.variations,
    ...phonetic.commonMispronunciations,
  ];
};

/**
 * Get weight for ML scoring algorithm
 */
export const getPhoneticWeight = (letter: string): number => {
  return arabicPhoneticMap[letter]?.weight || 0.5;
};

/**
 * Check if a sound is a valid pronunciation (even if mispronounced)
 */
export const isValidPronunciation = (letter: string, spokenSound: string): boolean => {
  const variations = getPhoneticVariations(letter);
  const normalizedSound = spokenSound.toLowerCase().trim();
  
  return variations.some(variant => 
    normalizedSound.includes(variant) || 
    variant.includes(normalizedSound)
  );
};

/**
 * Normalize Arabic letter for consistent processing
 */
export const normalizeArabicLetter = (letter: string): string => {
  // Remove diacritics and normalize to base form
  return letter.normalize('NFD').replace(/[\u064B-\u065F]/g, '');
};
