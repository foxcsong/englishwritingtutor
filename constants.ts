import { BadgeDef, StudentLevel } from './types';

export const LEVELS = Object.values(StudentLevel);

export const BADGES: BadgeDef[] = [
  { id: 'novice_1', name: 'Newbie', icon: '🌱', description: 'First steps (10 pts)', threshold: 10 },
  { id: 'novice_2', name: 'Learner', icon: '📖', description: 'Keep going (50 pts)', threshold: 50 },
  { id: 'scholar_1', name: 'Scholar', icon: '📚', description: 'Good start (100 pts)', threshold: 100 },
  { id: 'scholar_2', name: 'Explorer', icon: '🧭', description: 'Exploring topics (200 pts)', threshold: 200 },
  { id: 'scholar_3', name: 'Thinker', icon: '💡', description: 'Deep thoughts (300 pts)', threshold: 300 },
  { id: 'scholar_4', name: 'Writer', icon: '✍️', description: 'Regular practice (400 pts)', threshold: 400 },
  { id: 'master_1', name: 'Wordsmith', icon: '🖋️', description: 'Skilled writer (500 pts)', threshold: 500 },
  { id: 'master_2', name: 'Creator', icon: '🎨', description: 'Creative mind (600 pts)', threshold: 600 },
  { id: 'master_3', name: 'Achiever', icon: '🏅', description: 'High achiever (700 pts)', threshold: 700 },
  { id: 'master_4', name: 'Expert', icon: '🎓', description: 'Knowledgeable (800 pts)', threshold: 800 },
  { id: 'legend_1', name: 'Elite', icon: '💎', description: 'Top tier (900 pts)', threshold: 900 },
  { id: 'legend_2', name: 'Legend', icon: '👑', description: 'Writing Legend (1000 pts)', threshold: 1000 },
  { id: 'legend_3', name: 'Hero', icon: '🦸', description: 'Writing Hero (1200 pts)', threshold: 1200 },
  { id: 'legend_4', name: 'Star', icon: '🌟', description: 'Super Star (1400 pts)', threshold: 1400 },
  { id: 'titan_1', name: 'Titan', icon: '🗿', description: 'Unstoppable (1600 pts)', threshold: 1600 },
  { id: 'titan_2', name: 'Giant', icon: '🌋', description: 'Writing Giant (1800 pts)', threshold: 1800 },
  { id: 'titan_3', name: 'Sagar', icon: '🌊', description: 'Ocean of words (2000 pts)', threshold: 2000 },
  { id: 'titan_4', name: 'Mountain', icon: '🏔️', description: 'Peak performance (2200 pts)', threshold: 2200 },
  { id: 'god_1', name: 'Demigod', icon: '⚡', description: 'Beyond human (2500 pts)', threshold: 2500 },
  { id: 'god_2', name: 'Apollo', icon: '☀️', description: 'God of Arts (2800 pts)', threshold: 2800 },
  { id: 'god_3', name: 'Athena', icon: '🦉', description: 'God of Wisdom (3100 pts)', threshold: 3100 },
  { id: 'god_4', name: 'Zeus', icon: '🌩️', description: 'King of Gods (3500 pts)', threshold: 3500 },
  { id: 'cosmic_1', name: 'Moon', icon: '🌙', description: 'Celestial Body (4000 pts)', threshold: 4000 },
  { id: 'cosmic_2', name: 'Sun', icon: '🌞', description: 'Source of Light (4500 pts)', threshold: 4500 },
  { id: 'cosmic_3', name: 'Galaxy', icon: '🌌', description: 'Vast knowledge (5000 pts)', threshold: 5000 },
  { id: 'cosmic_4', name: 'Universe', icon: '🪐', description: 'Limitless (6000 pts)', threshold: 6000 },
  { id: 'eternal_1', name: 'Time', icon: '⏳', description: 'Timeless (7000 pts)', threshold: 7000 },
  { id: 'eternal_2', name: 'Void', icon: '⚫', description: 'The Beginning (8000 pts)', threshold: 8000 },
  { id: 'eternal_3', name: 'Light', icon: '✨', description: 'Pure Energy (9000 pts)', threshold: 9000 },
  { id: 'eternal_4', name: 'Omniscient', icon: '👁️', description: 'All Knowing (10000 pts)', threshold: 10000 },
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