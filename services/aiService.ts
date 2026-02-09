import { StudentLevel, TopicMaterial, EvaluationResult, PracticeMode, AppLanguage, UserConfig } from '../types';
import { LEVEL_PROMPTS } from '../constants';

const API_BASE = '/api';

/**
 * 助手函数：从 AI 返回的文本中提取并解析 JSON
 */
const extractJson = (text: string) => {
    const cleanText = text.trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // 尝试从 markdown 代码块中提取
        const match = cleanText.match(/```json\s?([\s\S]*?)\s?```/) || cleanText.match(/```\s?([\s\S]*?)\s?```/);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1].trim());
            } catch (e2) { }
        }

        // 尝试查找第一个 { 或 [ 到最后一个 } 或 ]
        const fallbackMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (fallbackMatch) {
            try {
                return JSON.parse(fallbackMatch[0]);
            } catch (e3) { }
        }

        console.error("Failed to parse JSON. Original text:", text);
        throw new Error("AI 返回格式不正确，无法解析 JSON");
    }
};

export const generateTopics = async (username: string, level: StudentLevel): Promise<string[]> => {
    const levelContext = LEVEL_PROMPTS[level];
    const prompt = `
    You are an English teacher. Target Level: ${level} (${levelContext}). 
    Generate 3 distinct, engaging, and age-appropriate English writing topics (titles).
    Return format: ["Topic 1", "Topic 2", "Topic 3"]
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "话题生成失败");
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "";
    const parsed = extractJson(content);

    // 适配可能的对象封装，如 {"topics": [...]}
    if (Array.isArray(parsed)) return parsed;
    if (parsed.topics && Array.isArray(parsed.topics)) return parsed.topics;
    if (typeof parsed === 'object') {
        const values = Object.values(parsed).find(v => Array.isArray(v));
        if (values) return values as string[];
    }

    throw new Error("未能从 AI 响应中提取到话题列表");
};

export const generateLearningMaterial = async (username: string, level: StudentLevel, topic: string, lang: AppLanguage): Promise<TopicMaterial> => {
    const levelContext = LEVEL_PROMPTS[level];
    const explainLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';

    const prompt = `
    You are an expert English teacher. Level: ${level}. Topic: "${topic.replace(/"/g, "'")}". Feedback Language: ${explainLang}.
    Provide:
    1. Introduction (in ${explainLang})
    2. Sample Essay (English)
    3. Key Points/Analysis (in ${explainLang})
    Return JSON: {"topic": "${topic.replace(/"/g, "'")}", "introduction": "...", "sampleEssay": "...", "analysis": "..."}
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "学习资料生成失败");
    }

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
    English teacher evaluation. Level: ${level}. Topic: "${topic.replace(/"/g, "'")}". Mode: ${mode}. Feedback Language: ${explainLang}.
    Evaluate: "${content.replace(/"/g, "'")}"
    Return JSON: {"score": 0-100, "generalFeedback": "...", "detailedCorrections": [{"original": "...", "correction": "...", "explanation": "..."}], "improvedVersion": "..."}
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "评估失败");
    }

    const resContent = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "";
    return extractJson(resContent) as EvaluationResult;
};

/**
 * 测试 AI 配置是否可用
 */
export const testAIConfig = async (username: string, config: UserConfig): Promise<void> => {
    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            prompt: "Ping test. Please reply with a short JSON: {\"status\": \"ok\"}",
            config
        })
    });

    const data = await res.json();
    if (!res.ok) {
        // 如果后端返回了具体的错误详情，抛出它
        const detail = data.details?.error?.message || data.details?.message || data.error;
        throw new Error(detail || "AI 配置验证失败，请检查 Key 或模型名称");
    }
};
