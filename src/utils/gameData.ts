export interface ArabicLetter {
  id: string;
  letter: string;
  name: string;
  pronunciation: string;
  audioFile: string;
  example: string;
  exampleImage: string;
}

export const arabicLetters: ArabicLetter[] = [
  {
    id: '1',
    letter: 'ا',
    name: 'Alif',
    pronunciation: 'Ah',
    audioFile: 'alif.mp3',
    example: 'أسد',
    exampleImage: 'lion.png',
  },
  {
    id: '2',
    letter: 'ب',
    name: 'Baa',
    pronunciation: 'Baa',
    audioFile: 'baa.mp3',
    example: 'بطة',
    exampleImage: 'duck.png',
  },
  // Add all 28 Arabic letters...
];

export interface ImageMatchPair {
  id: string;
  word: string;
  image: string;
  audio: string;
}

export const imageMatchData: ImageMatchPair[] = [
  { id: '1', word: 'أسد', image: 'lion.png', audio: 'asad.mp3' },
  { id: '2', word: 'قطة', image: 'cat.png', audio: 'qitta.mp3' },
  { id: '3', word: 'كتاب', image: 'book.png', audio: 'kitab.mp3' },
  // Add more pairs...
];
