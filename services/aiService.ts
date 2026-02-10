import { StudentLevel, TopicMaterial, EvaluationResult, PracticeMode, AppLanguage, UserConfig } from '../types';
import { LEVEL_PROMPTS, LEVEL_WORD_COUNTS, LEVEL_CONFIGS } from '../constants';

const API_BASE = '/api';

/**
 * 助手函数：从 AI 返回的文本中提取并解析 JSON
 */
const extractJson = (text: string) => {
    let parsed: any = null;
    const cleanText = text.trim();

    try {
        parsed = JSON.parse(cleanText);
    } catch (e) {
        // 尝试从 markdown 代码块中提取
        const match = cleanText.match(/```json\s?([\s\S]*?)\s?```/) || cleanText.match(/```\s?([\s\S]*?)\s?```/);
        if (match && match[1]) {
            try {
                parsed = JSON.parse(match[1].trim());
            } catch (e2) { }
        }

        if (!parsed) {
            // 尝试查找第一个 { 或 [ 到最后一个 } 或 ]
            const fallbackMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (fallbackMatch) {
                try {
                    parsed = JSON.parse(fallbackMatch[0]);
                } catch (e3) { }
            }
        }
    }

    if (!parsed) {
        console.error("Failed to parse JSON. Original text:", text);
        throw new Error("AI 返回格式不正确，无法解析 JSON");
    }

    // Unwrap if wrapped in a single key like "result", "data", "learningRequest", etc.
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && typeof parsed[keys[0]] === 'object' && !Array.isArray(parsed[keys[0]])) {
            // Heuristic: if the inner object looks like what we want (has 'topic' or 'score'), use it.
            // Or just unwrap indiscriminately if size is 1.
            return parsed[keys[0]];
        }
    }

    return parsed;
};

export const generateTopics = async (username: string, level: StudentLevel): Promise<string[]> => {
    const levelContext = LEVEL_PROMPTS[level];
    const config = LEVEL_CONFIGS[level];

    const prompt = `
    Role: ${config.systemRole}
    Task: Generate 3 engaging English writing topics (titles) for Level: ${level} (${levelContext}).
    Tone: ${config.toneInstruction}
    Constraint: Topics must be age-appropriate and interesting.
    Return format: ["Topic 1", "Topic 2", "Topic 3"]
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    if (!res.ok) {
        const debugInfo = data.debug ? `\nDebug: ${JSON.stringify(data.debug)}` : '';
        throw new Error((data.error || "话题生成失败") + debugInfo);
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
    const wordCount = LEVEL_WORD_COUNTS[level];
    const config = LEVEL_CONFIGS[level];
    const explainLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';

    const prompt = `
    Role: ${config.systemRole}
    Topic: "${topic.replace(/"/g, "'")}". 
    Target Audience Level: ${level}.
    Tone: ${config.toneInstruction}
    
    Task: Create learning materials.
    1. Introduction (in ${explainLang}): Brief and engaging.
    2. Sample Essay (English): STRICTLY ${wordCount.min}-${wordCount.max} words. Use vocabulary suitable for ${config.vocabularyConstraint}.
    3. Key Points/Analysis (in ${explainLang}): Highlight 2-3 key vocabulary or grammar points used in the sample.
    
    IMPORTANT: Return ONLY valid JSON. No markdown formatting, no conversational text before or after.
    JSON Format: {"topic": "${topic.replace(/"/g, "'")}", "introduction": "...", "sampleEssay": "...", "analysis": "..."}
  `;

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    if (!res.ok) {
        const debugInfo = data.debug ? `\nDebug: ${JSON.stringify(data.debug)}` : '';
        throw new Error((data.error || "学习资料生成失败") + debugInfo);
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
    lang: AppLanguage,
    imageBase64?: string
): Promise<EvaluationResult> => {
    const explainLang = lang === 'cn' ? 'Chinese (Simplified)' : 'English';
    const wordCount = LEVEL_WORD_COUNTS[level];
    const config = LEVEL_CONFIGS[level];

    let systemPrompt = `
    Role: ${config.systemRole}
    Tone: ${config.toneInstruction}
    Vocabulary Constraint: ${config.vocabularyConstraint}
    Correction Focus: ${config.correctionFocus.join(', ')}
    Feedback Language: ${explainLang}
    Target Level: ${level}
    Target Word Count: ${wordCount.min}-${wordCount.max} words
    Topic: "${topic.replace(/"/g, "'")}"
    Mode: ${mode}
    `;

    let prompt = `
    ${systemPrompt}
    
    Task: Evaluate the following student writing.
    Content: "${content.replace(/"/g, "'")}"
    
    Instructions:
    1. Check length (${wordCount.min}-${wordCount.max} words).
    2. Give a Score (0-100) based on appropriate criteria for this level.
    3. Provide General Feedback using this template style: "${config.feedbackTemplate}"
    4. Provide Detailed Corrections. ONLY focus on: ${config.correctionFocus.join(', ')}. Do NOT be too nitpicky for lower levels.
    5. Provide an Improved Version that elevates the writing while keeping it reachable for this level.
    
    Return JSON: {"score": 0-100, "generalFeedback": "...", "detailedCorrections": [{"original": "...", "correction": "...", "explanation": "..."}], "improvedVersion": "..."}
  `;

    if (imageBase64) {
        prompt = `
    ${systemPrompt}
    
    TASK: Handwritten Essay Evaluation.
    1. RECOGNIZE: Read the handwritten English text from the provided image.
    2. EVALUATE TRANSCRIPTION: Treat the recognized text as the student's submission.
    3. ASSESS HANDWRITING: Rate the neatness/legibility on a scale of 0-10 (0=illegible, 10=perfect calligraphy). 
       - ${config.toneInstruction} (Apply this tone to the handwriting comment too)
       - Provide a short comment on the handwriting style.
    4. GRADE CONTENT: Follow the standard evaluation criteria for Level ${level}.
       - Focus corrections on: ${config.correctionFocus.join(', ')}
       - Use the feedback style: "${config.feedbackTemplate}"
    
    Return JSON format:
    {
        "score": 0-100, 
        "handwritingScore": 0-10,
        "handwritingComment": "Short comment...",
        "transcribedText": "The full text recognized...",
        "generalFeedback": "...", 
        "detailedCorrections": [{"original": "...", "correction": "...", "explanation": "..."}], 
        "improvedVersion": "..."
    }
    `;
    }

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt, image: imageBase64 })
    });

    const data = await res.json();
    if (!res.ok) {
        const debugInfo = data.debug ? `\nDebug: ${JSON.stringify(data.debug)}` : '';
        throw new Error((data.error || "评估失败") + debugInfo);
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
