import { StudentLevel, TopicMaterial, EvaluationResult, PracticeMode, AppLanguage } from '../types';
import { LEVEL_PROMPTS } from '../constants';

const API_BASE = '/api';

/**
 * 助手函数：从 AI 返回的文本中提取并解析 JSON
 */
const extractJson = (text: string) => {
    try {
        // 尝试直接解析
        return JSON.parse(text);
    } catch (e) {
        // 尝试从 markdown 代码块中提取
        const match = text.match(/```json\s?([\s\S]*?)\s?```/) || text.match(/```\s?([\s\S]*?)\s?```/);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1].trim());
            } catch (e2) {
                // 如果提取后仍失败，尝试查找第一个 { 和最后一个 }
                const fallbackMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (fallbackMatch) {
                    try {
                        return JSON.parse(fallbackMatch[0]);
                    } catch (e3) {
                        throw new Error("Failed to parse AI response as JSON");
                    }
                }
            }
        }
        throw e;
    }
};

export const generateTopics = async (username: string, level: StudentLevel): Promise<string[]> => {
    const levelContext = LEVEL_PROMPTS[level];
    const prompt = `
    You are an English teacher for students. 
    Target Level: ${level} (${levelContext}). 
    Generate 3 distinct, engaging, and age-appropriate English writing topics (titles) for this level.
    Only provide the titles in a JSON array of strings, e.g., ["Topic 1", "Topic 2", "Topic 3"].
    Do not include any other text.
  `;

    try {
        const res = await fetch(`${API_BASE}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, prompt })
        });

        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "";
        return extractJson(content);
    } catch (e) {
        console.error("Topic generation error:", e);
        // 即使失败也返回一些随机话题，保证功能可用
        const fallbacks = [
            ["My Hobby", "A Memorable Day", "The Importance of Reading"],
            ["My Favorite Food", "Life in the Future", "Protecting our Environment"],
            ["A Hero in My Mind", "My School Life", "The Power of Friendship"],
            ["Traveling around the World", "The Benefits of Sports", "Online Learning vs Traditional Learning"]
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
    Output structured JSON: {"topic": "${topic}", "introduction": "...", "sampleEssay": "...", "analysis": "..."}
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    if (!res.ok) throw new Error("AI Service Error");

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "";
    return extractJson(content) as TopicMaterial;
};

export const evaluateWriting = async (
    username: string,
    level: StudentLevel,
    mode: PracticeMode,
    topic: string,
    content: string,
    lang: AppLanguage
): Promise<EvaluationResult> => {
    const explainLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';

    const prompt = `
    Act as a strict but encouraging English teacher. Level: ${level}. Task: ${topic}. 
    Mode: ${mode === PracticeMode.Sentence ? 'Sentence Drilling' : 'Essay Writing'}. Feedback Language: ${explainLang}.
    Student Submission: "${content}"
    Evaluate and output JSON: {"score": 0-100, "generalFeedback": "...", "detailedCorrections": [{"original": "...", "correction": "...", "explanation": "..."}], "improvedVersion": "..."}
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    if (!res.ok) throw new Error("AI Service Error");

    const data = await res.json();
    const resContent = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "";
    return extractJson(resContent) as EvaluationResult;
};
