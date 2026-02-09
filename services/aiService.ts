import { StudentLevel, TopicMaterial, EvaluationResult, PracticeMode, AppLanguage } from '../types';
import { LEVEL_PROMPTS } from '../constants';

const API_BASE = '/api';

export const generateTopics = async (username: string, level: StudentLevel): Promise<string[]> => {
    const levelContext = LEVEL_PROMPTS[level];
    const prompt = `
    You are an English teacher for students.
    Target Level: ${level} (${levelContext}).
    Generate 3 distinct, engaging, and age-appropriate English writing topics (titles) for this level.
    Only provide the titles in a JSON array of strings.
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    // 解析逻辑需要适配后端返回的原始格式
    // 这里简化处理，假设后端处理了部分解析或直接返回 JSON 字符串
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content;
    try {
        return JSON.parse(content);
    } catch (e) {
        return ["My Hobby", "A Memorable Day", "The Importance of Reading"];
    }
};

export const generateLearningMaterial = async (username: string, level: StudentLevel, topic: string, lang: AppLanguage): Promise<TopicMaterial> => {
    const levelContext = LEVEL_PROMPTS[level];
    const explainLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';

    const prompt = `
    You are an expert English teacher. Level: ${level}. Topic: "${topic}". Explanation Language: ${explainLang}.
    1. Write a brief introduction (in ${explainLang}).
    2. Provide a sample essay.
    3. Provide a detailed analysis (in ${explainLang}).
    Output structured JSON: {"topic": "", "introduction": "", "sampleEssay": "", "analysis": ""}
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content;
    return JSON.parse(content) as TopicMaterial;
};

export const evaluateWriting = async (
    username: string,
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
    Act as a strict but encouraging English teacher. Level: ${level}. Task: ${topic}.
    Mode: ${isSentence ? 'Sentence Drilling' : 'Essay Writing'}. Feedback Language: ${explainLang}.
    Student Submission: "${content}"
    Evaluate and output JSON: {"score": 0-100, "generalFeedback": "", "detailedCorrections": [{"original": "", "correction": "", "explanation": ""}], "improvedVersion": ""}
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    const resContent = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content;
    return JSON.parse(resContent) as EvaluationResult;
};
