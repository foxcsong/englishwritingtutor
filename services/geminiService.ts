import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudentLevel, TopicMaterial, EvaluationResult, PracticeMode, AppLanguage } from '../types';
import { LEVEL_PROMPTS } from '../constants';

// Initialize Gemini
// NOTE: API KEY is managed via process.env.API_KEY as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Generates 3 topic suggestions based on the student's level.
 * Topic titles are always in English.
 */
export const generateTopics = async (level: StudentLevel): Promise<string[]> => {
  const levelContext = LEVEL_PROMPTS[level];
  
  const prompt = `
    You are an English teacher for students.
    Target Level: ${level} (${levelContext}).
    
    Generate 3 distinct, engaging, and age-appropriate English writing topics (titles) for this level.
    Only provide the titles in a JSON array of strings.
    Example: ["My Best Friend", "A Trip to the Zoo", "My Favorite Food"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const json = JSON.parse(response.text || '[]');
    return json;
  } catch (error) {
    console.error("Topic generation failed:", error);
    return ["My Hobby", "A Memorable Day", "The Importance of Reading"]; // Fallback
  }
};

/**
 * Generates learning material (Intro, Sample, Analysis) for a specific topic.
 * @param lang The language for explanations (Introduction and Analysis).
 */
export const generateLearningMaterial = async (level: StudentLevel, topic: string, lang: AppLanguage): Promise<TopicMaterial> => {
  const levelContext = LEVEL_PROMPTS[level];
  const explainLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';
  
  const prompt = `
    You are an expert English teacher.
    Level: ${level}.
    Topic: "${topic}".
    Explanation Language: ${explainLang}.
    
    1. Write a brief introduction to this writing task (in ${explainLang}).
    2. Provide a high-quality sample essay suitable for this level.
    3. Provide a detailed analysis of the sample (vocabulary, grammar, structure) in ${explainLang}.
    
    Output structured JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      introduction: { type: Type.STRING },
      sampleEssay: { type: Type.STRING },
      analysis: { type: Type.STRING }
    },
    required: ["topic", "introduction", "sampleEssay", "analysis"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || '{}') as TopicMaterial;
  } catch (error) {
    console.error("Material generation failed:", error);
    throw new Error("Failed to generate learning material.");
  }
};

/**
 * Evaluates the student's writing.
 * @param lang The language for feedback and explanations.
 */
export const evaluateWriting = async (
  level: StudentLevel,
  mode: PracticeMode,
  topic: string,
  content: string,
  lang: AppLanguage
): Promise<EvaluationResult> => {
  const levelContext = LEVEL_PROMPTS[level];
  const isSentence = mode === PracticeMode.Sentence;
  const explainLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';

  const prompt = `
    Act as a strict but encouraging English teacher.
    Level: ${level}.
    Task: ${topic}.
    Mode: ${isSentence ? 'Sentence Drilling (Focus on grammar and usage)' : 'Essay Writing (Focus on structure, coherence, vocabulary, grammar)'}.
    Feedback Language: ${explainLang}.

    Student Submission:
    "${content}"
    
    Evaluate the submission. 
    1. Give a score out of 100 based on the level standards (${levelContext}).
    2. Provide general feedback in ${explainLang}.
    3. List specific errors with corrections and explanations (in ${explainLang}).
    4. Provide a rewritten, improved version of the submission suitable for this level.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      generalFeedback: { type: Type.STRING },
      detailedCorrections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            correction: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      },
      improvedVersion: { type: Type.STRING }
    },
    required: ["score", "generalFeedback", "detailedCorrections", "improvedVersion"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || '{}') as EvaluationResult;
  } catch (error) {
    console.error("Evaluation failed:", error);
    throw new Error("Failed to evaluate writing.");
  }
};