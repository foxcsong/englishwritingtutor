export enum StudentLevel {
  Primary1_2 = '小学 1-2年级',
  Primary3_4 = '小学 3-4年级',
  Primary5_6 = '小学 5-6年级',
  Junior1 = '初中一年级',
  Junior2 = '初中二年级',
  Junior3 = '初中三年级',
  Senior1 = '高中一年级',
  Senior2 = '高中二年级',
  Senior3 = '高中三年级',
  University1_2 = '大学 1-2年级 (CET-4)',
  University3_4 = '大学 3-4年级 (CET-6)',
  Graduate = '研究生 (考研英语)',
  TOEFL = 'TOEFL (托福)',
  IELTS = 'IELTS (雅思)'
}

export enum PracticeMode {
  Sentence = 'Sentence Drill (句型演练)',
  Essay = 'Full Writing (文章写作)'
}

export interface TopicMaterial {
  topic: string;
  introduction: string;
  sampleEssay: string;
  analysis: string;
}

export interface CorrectionItem {
  original: string;
  correction: string;
  explanation: string;
}

export interface EvaluationResult {
  score: number;
  generalFeedback: string;
  detailedCorrections: CorrectionItem[];
  improvedVersion: string;
  handwritingScore?: number;
  handwritingComment?: string;
  transcribedText?: string;
}

export interface HistoryRecord {
  id: string;
  date: string;
  level: StudentLevel;
  topic: string;
  mode: PracticeMode;
  userContent: string;
  evaluation: EvaluationResult;
}

export interface UserConfig {
  apiKey: string;
  provider: 'openai' | 'gemini';
  model: string;
}

export type AppLanguage = 'en' | 'cn';

export interface UserProfile {
  username: string;
  language: AppLanguage;
  level: StudentLevel | null;
  points: number;
  badges: string[];
  config: UserConfig | null; // Added config
}

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  threshold: number;
}