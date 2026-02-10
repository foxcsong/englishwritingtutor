import { StudentLevel, TopicMaterial, EvaluationResult, PracticeMode, AppLanguage, UserConfig, ChatMessage, ChatResponse } from '../types';
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

    // Smart Unwrap: Look for valid TopicMaterial fields (sampleEssay) OR EvaluationResult fields (score)
    if (parsed && typeof parsed === 'object') {
        const isTarget = (obj: any) => obj && (obj.sampleEssay || typeof obj.score === 'number');

        // 1. Direct match
        if (isTarget(parsed)) {
            return parsed;
        }

        // 2. Search deeper (1 level deep)
        for (const key in parsed) {
            const val = parsed[key];
            if (isTarget(val)) {
                return val;
            }
        }

        // 3. Fallback: If array, take first item if it matches
        if (Array.isArray(parsed) && parsed.length > 0) {
            if (isTarget(parsed[0])) return parsed[0];
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
    const isChinese = lang === 'cn';

    let prompt = '';

    if (isChinese) {
        prompt = `
        角色: ${config.systemRole} (请作为一位针对中国学生的英语老师)
        题目: "${topic.replace(/"/g, "'")}"
        适用等级: ${level}
        语气: ${config.toneInstruction}

        任务: 创建英语学习资料和具体的写作要求。

        1. **简介** (中文): 简短有趣地介绍这个话题。
        2. **范文** (英文): 严格限制在 ${wordCount.min}-${wordCount.max} 词。使用适合 ${config.vocabularyConstraint} 的词汇。
        3. **重点解析** (中文): 挑选范文中 2-3 个关键的高级词汇或语法点进行讲解。
        4. **写作要求** (指导学生):
           - 主要目标: 这篇文章要达成什么目的？
           - 内容范围: 必须要写的点有哪些？
           - 风格/语气: 例如 "正式", "有创意", "描述性"。
           - 关键词: 列出 3-5 个必须使用的单词。
           - 结构: 例如 "三段式：引入、主体、结论"。
           - 字数: "${wordCount.label}"。

        **重要**: 
        - 返回纯 JSON 格式。
        - **简介**、**重点解析**、**写作要求**中的具体描述必须使用**中文**。

        【正确示例 (JSON)】:
        {
          "topic": "My Hobby",
          "introduction": "这是一个关于爱好的有趣话题。我们将通过范文学习如何描述你的日常活动。",
          "sampleEssay": "I love playing soccer...",
          "analysis": "1. 'Passionate' 意思是非常热爱的。2. 'Daily routine' 指日常生活习惯。",
          "requirements": {
            "generalGoal": "向你的朋友介绍你最喜欢的运动。",
            "contentScope": "写出你为什么喜欢它，以及你多久玩一次。",
            "style": "友好且充满活力",
            "keywords": ["hobby", "exercise", "team"],
            "structure": "三段式：介绍、细节、总结",
            "wordCountRange": "50-80词"
          }
        }

        请参照上述格式和**中文要求**返回纯 JSON:
        `;
    } else {
        const explainLang = 'English';
        prompt = `
        Role: ${config.systemRole}
        Topic: "${topic.replace(/"/g, "'")}". 
        Target Audience Level: ${level}.
        Tone: ${config.toneInstruction}
        
        Task: Create learning materials and specific writing requirements.
        1. Introduction (in ${explainLang}): Brief and engaging.
        2. Sample Essay (English): STRICTLY ${wordCount.min}-${wordCount.max} words. Use vocabulary suitable for ${config.vocabularyConstraint}.
        3. Key Points/Analysis (in ${explainLang}): Highlight 2-3 key vocabulary or grammar points used in the sample.
        4. Writing Requirements (to guide student):
           - General Goal: What is the main objective?
           - Content Scope: What specific points must be covered?
           - Style/Tone: e.g., "Formal", "Creative", "Descriptive".
           - Keywords: List 3-5 keywords that MUST be used.
           - Structure: e.g., "3 paragraphs: Intro, Body, Conclusion".
           - Word Count: "${wordCount.label}".
        
        IMPORTANT: Return ONLY valid JSON.
        JSON Format: 
        {
          "topic": "${topic.replace(/"/g, "'")}", 
          "introduction": "...", 
          "sampleEssay": "...", 
          "analysis": "...",
          "requirements": {
            "generalGoal": "...",
            "contentScope": "...",
            "style": "...",
            "keywords": ["...", "..."],
            "structure": "...",
            "wordCountRange": "${wordCount.label}"
          }
        }
      `;
    }

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
    console.log('[AI Debug] Raw Content:', content);

    const parsed = extractJson(content);
    console.log('[AI Debug] Parsed JSON:', parsed);

    return parsed as TopicMaterial;
};

export const evaluateWriting = async (
    username: string,
    level: StudentLevel,
    mode: PracticeMode,
    topic: string,
    content: string,
    lang: AppLanguage,
    imageBase64?: string,
    requirements?: any // WritingRequirements
): Promise<EvaluationResult> => {
    const isChinese = lang === 'cn';
    const wordCount = LEVEL_WORD_COUNTS[level];
    const config = LEVEL_CONFIGS[level];

    // Helper to get Chinese level description
    const getCnLevel = (l: StudentLevel) => {
        if (l.includes('Primary')) return '小学阶段';
        if (l.includes('Junior')) return '初中阶段';
        if (l.includes('Senior')) return '高中阶段';
        if (l.includes('University')) return '大学英语四六级阶段';
        if (l.includes('TOEFL') || l.includes('IELTS') || l.includes('Graduate')) return '高阶学术/留学考试阶段';
        return '英语学习者';
    };

    let prompt = '';

    if (isChinese) {
        // --- CHINESE PROMPT BRANCH (Authorized Implementation) ---
        const cnLevel = getCnLevel(level);

        let reqPrompt = "";
        if (requirements) {
            reqPrompt = `
            【写作要求检查】:
            - 目标: ${requirements.generalGoal}
            - 内容范围: ${requirements.contentScope}
            - 风格: ${requirements.style}
            - 关键词: ${requirements.keywords?.join(', ')}
            - 结构: ${requirements.structure}
            `;
        }

        const basePrompt = `
        角色: 你是一位经验丰富的${cnLevel}英语老师。
        学生等级: ${level}
        目标字数: ${wordCount.min}-${wordCount.max} 词
        题目: "${topic.replace(/"/g, "'")}"
        模式: ${mode}

        你的评分风格:
        - 语气: ${config.toneInstruction} (请用中文表达这种语气)
        - 批改侧重: ${config.correctionFocus.join(', ')}

        任务: 批改学生的英语作文。
        学生作文内容: "${content.replace(/"/g, "'")}"

        ${reqPrompt}

        【核心指令 - 绝对禁令】:
        1. **禁止**在 "generalFeedback"、"explanation"、"handwritingComment"、"feedback" 字段中输出任何英文句子。
        2. **必须**将所有原本打算用英文表达的建议、评价、规则解释全部翻译成**中文**。
        3. 给出评分 (0-100)。
        4. 总体评价: 必须包含鼓励性的中文开场白。

        【正确示例 (JSON)】:
        {
          "score": 85,
          "requirementCheck": { "met": true, "feedback": "文章覆盖了所有要求的点，结构很清晰。" },
          "generalFeedback": "做得太棒了！你的故事非常精彩，句式很丰富。🌟",
          "detailedCorrections": [
            { "original": "I has a pen", "correction": "I have a pen", "explanation": "主语是第一人称 I，动词应该用 have。" }
          ],
          "improvedVersion": "I have a beautiful pen..."
        }

        请参照上述格式和**中文语言要求**返回纯 JSON:
        `;

        if (imageBase64) {
            prompt = `
            ${basePrompt}
            
            【手写识别特别任务】:
            1. **识别**: 从图片中读取手写英文。
            2. **作为提交内容**: 使用识别出的文本进行上述批改。
            3. **书写评分**: 0-10分 (0=潦草无法辨认, 10=完美书法)。
               - 给出简短的中文书写点评 ("handwritingComment")。
            
            返回 JSON (包含 strict JSON):
            {
                "score": 0-100,
                "handwritingScore": 0-10,
                "handwritingComment": "中文书写点评...",
                "transcribedText": "识别出的全文...",
                "requirementCheck": { "met": boolean, "feedback": "中文反馈..." },
                "generalFeedback": "中文评价...",
                "detailedCorrections": [...],
                "improvedVersion": "..."
            }
            `;
        } else {
            prompt = basePrompt;
        }

    } else {
        // --- ENGLISH PROMPT BRANCH (Legacy/International) ---
        const explainLang = 'English';
        let requirementPrompt = "";
        if (requirements) {
            requirementPrompt = `Specific Writing Requirements: Goal: ${requirements.generalGoal}, Scope: ${requirements.contentScope}, Keywords: ${requirements.keywords?.join(', ')}`;
        }

        let systemPrompt = `
        Role: ${config.systemRole}
        Tone: ${config.toneInstruction}
        Correction Focus: ${config.correctionFocus.join(', ')}
        Target Level: ${level}
        Topic: "${topic.replace(/"/g, "'")}"
        `;

        if (imageBase64) {
            prompt = `
            ${systemPrompt}
            TASK: Handwritten Essay Evaluation.
            1. Recognize text.
            2. Assess Handwriting (0-10) & Comment.
            3. Grade Content & Features.
            ${requirementPrompt ? `Check Requirements: ${requirementPrompt}` : ''}
            
            Return JSON:
            {
                "score": 0-100, 
                "handwritingScore": 0-10,
                "handwritingComment": "Comment...",
                "transcribedText": "Text...",
                "requirementCheck": { "met": boolean, "feedback": "..." },
                "generalFeedback": "...", 
                "detailedCorrections": [{"original": "...", "correction": "...", "explanation": "..."}], 
                "improvedVersion": "..."
            }
            `;
        } else {
            prompt = `
            ${systemPrompt}
            Task: Evaluate student writing.
            Content: "${content.replace(/"/g, "'")}"
            ${requirementPrompt}
            
            Instructions:
            1. Check length & requirements.
            2. Score (0-100).
            3. Feedback template: "${config.feedbackTemplate}"
            4. Detailed Corrections.
            
            Return JSON: 
            {
              "score": 0-100, 
              "requirementCheck": { "met": boolean, "feedback": "..." },
              "generalFeedback": "...", 
              "detailedCorrections": [{"original": "...", "correction": "...", "explanation": "..."}], 
              "improvedVersion": "..."
            }
            `;
        }
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

/**
 * Contextual Follow-up Chat
 */
export const explainCorrection = async (
    username: string,
    level: StudentLevel,
    original: string,
    correction: string,
    question: string,
    history: ChatMessage[],
    lang: AppLanguage
): Promise<ChatResponse> => {
    const config = LEVEL_CONFIGS[level];
    const isChinese = lang === 'cn';

    let prompt = '';

    if (isChinese) {
        prompt = `
        角色: 你是一位鼓励型的英语导师。
        等级: 辅导 ${level} 学生。
        语气: ${config.toneInstruction} (请用中文表达)

        上下文:
        - 学生原句: "${original.replace(/"/g, "'")}"
        - 你的修改: "${correction.replace(/"/g, "'")}"

        聊天记录:
        ${history.map(m => `- ${m.role === 'user' ? '学生' : '导师'}: ${m.content}`).join('\n')}

        学生当前问题: "${question.replace(/"/g, "'")}"

        任务: 
        - 清晰、简洁地回答学生的问题。**必须使用中文回答**。
        - 如果问 "为什么"，请简单解释语法规则。
        - 如果需要例子，提供 1-2 个简单的例句。
        - 保持鼓励的语气。

        【正确示例】:
        {"reply": "这里的 'have' 是正确的，因为主语是 I。如果是 He 或 She，才需要用 has。例如：She has a blue car."}

        请参照上述格式，使用**中文**返回纯 JSON:
        `;
    } else {
        const explainLang = 'English';
        prompt = `
        Role: You are an encouraging English Tutor helping a ${level} student.
        Tone: ${config.toneInstruction}
        Language: Reply in ${explainLang}.
    
        Context:
        - Student's Original Sentence: "${original.replace(/"/g, "'")}"
        - Your Correction: "${correction.replace(/"/g, "'")}"
    
        Chat History:
        ${history.map(m => `- ${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n')}
    
        Student's Current Question: "${question.replace(/"/g, "'")}"
    
        Task: 
        - Answer the student's question clearly and concisely.
        - If they ask "Why", explain the grammar rule simply.
        - If they ask for examples, provide 1-2 simple examples.
        - Keep the tone encouraging.
        
        IMPORTANT: Return ONLY valid JSON.
        JSON Format: {"reply": "..."}
      `;
    }

    const res = await fetch(`${API_BASE}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prompt })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "解释失败");
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.choices?.[0]?.message?.content || "";
    return extractJson(content) as ChatResponse;
};
