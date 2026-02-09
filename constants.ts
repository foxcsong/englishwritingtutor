import { BadgeDef, StudentLevel } from './types';

export const LEVELS = Object.values(StudentLevel);

export const BADGES: BadgeDef[] = [
  { id: 'novice', name: 'Novice Writer', icon: '🌱', description: 'Complete your first exercise', threshold: 10 },
  { id: 'scholar', name: 'Diligent Scholar', icon: '📚', description: 'Earn 100 points', threshold: 100 },
  { id: 'master', name: 'Wordsmith', icon: '✍️', description: 'Earn 500 points', threshold: 500 },
  { id: 'legend', name: 'English Legend', icon: '👑', description: 'Earn 1000 points', threshold: 1000 },
];

export const POINTS_PER_SENTENCE = 20;
export const POINTS_PER_ESSAY = 100;

export const LEVEL_PROMPTS: Record<StudentLevel, string> = {
  [StudentLevel.Primary1_2]: "simple, focusing on basic vocabulary (colors, animals, family) and simple sentence structures.",
  [StudentLevel.Primary3_4]: "basic, focusing on daily routines, hobbies, and weather with simple paragraphs.",
  [StudentLevel.Primary5_6]: "elementary, focusing on past events, future plans, and describing places.",
  [StudentLevel.Junior1]: "lower-intermediate, simple argumentative or narrative essays about school life.",
  [StudentLevel.Junior2]: "intermediate, expressing opinions, making comparisons, and writing letters.",
  [StudentLevel.Junior3]: "intermediate, complex sentences, past/present perfect tenses, preparation for high school entrance.",
  [StudentLevel.Senior1]: "upper-intermediate, logical reasoning, social issues, and more formal vocabulary.",
  [StudentLevel.Senior2]: "advanced, analyzing charts, literary appreciation, and structured arguments.",
  [StudentLevel.Senior3]: "advanced,高考 (Gaokao) standard, complex grammar, and rich vocabulary.",
  [StudentLevel.University1_2]: "CET-4 standard, academic or semi-formal writing, clear structure.",
  [StudentLevel.University3_4]: "CET-6 standard, sophisticated arguments, complex sentence variety.",
  [StudentLevel.Graduate]: "Graduate entrance exam standard, academic rigor, formal tone.",
  [StudentLevel.TOEFL]: "TOEFL standard, integrated and independent writing tasks, academic and campus contexts.",
  [StudentLevel.IELTS]: "IELTS standard, Task 1 (data description) and Task 2 (argumentative essay)."
};

export const LEVEL_WORD_COUNTS: Record<StudentLevel, { min: number, max: number, label: string }> = {
  [StudentLevel.Primary1_2]: { min: 20, max: 40, label: "20-40 words" },
  [StudentLevel.Primary3_4]: { min: 30, max: 50, label: "30-50 words" },
  [StudentLevel.Primary5_6]: { min: 40, max: 70, label: "40-70 words" },
  [StudentLevel.Junior1]: { min: 50, max: 80, label: "50-80 words" },
  [StudentLevel.Junior2]: { min: 60, max: 90, label: "60-90 words" },
  [StudentLevel.Junior3]: { min: 80, max: 100, label: "80-100 words" },
  [StudentLevel.Senior1]: { min: 100, max: 120, label: "100-120 words" },
  [StudentLevel.Senior2]: { min: 110, max: 130, label: "110-130 words" },
  [StudentLevel.Senior3]: { min: 120, max: 150, label: "120-150 words" },
  [StudentLevel.University1_2]: { min: 120, max: 180, label: "120-180 words" },
  [StudentLevel.University3_4]: { min: 150, max: 200, label: "150-200 words" },
  [StudentLevel.Graduate]: { min: 160, max: 220, label: "160-220 words" },
  [StudentLevel.TOEFL]: { min: 250, max: 350, label: "250-350 words" },
  [StudentLevel.IELTS]: { min: 250, max: 400, label: "250-400 words" }
};