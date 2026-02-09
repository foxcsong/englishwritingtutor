import { Env, UserData } from './types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    let body: any;
    try {
        body = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Request body is not valid JSON' }), { status: 400 });
    }

    const { username, prompt, image } = body;
    const configOverride = body.config;

    if (!username || !prompt) {
        const receivedKeys = Object.keys(body || {}).join(', ');
        return new Response(JSON.stringify({
            error: `Missing params. Received keys: [${receivedKeys}]. HasUser: ${!!username}, HasPrompt: ${!!prompt}`,
            debug: {
                hasUsername: !!username,
                hasPrompt: !!prompt,
                receivedKeys: Object.keys(body || {}),
                bodyPreview: JSON.stringify(body).slice(0, 200)
            }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let config = configOverride;

    if (!config) {
        // 尝试从 profile 获取 (新逻辑)
        const profileKey = `profile:${username}`;
        const profileJson = await env.WRITING_KV.get(profileKey);
        if (profileJson) {
            const profile = JSON.parse(profileJson);
            config = profile.config;
        }

        // 如果 profile 没找到或没配置，尝试从 user 获取 (旧逻辑/兼容性)
        if (!config) {
            const userKey = `user:${username}`;
            const userJson = await env.WRITING_KV.get(userKey);
            if (userJson) {
                const user = JSON.parse(userJson);
                config = user.config;
            }
        }
    }

    if (!config || !config.apiKey) {
        return new Response(JSON.stringify({ error: 'AI API Key not configured. Please go to Settings.' }), { status: 400 });
    }

    try {
        let resp: Response;
        if (config.provider === 'gemini') {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

            // Construct parts array
            const parts: any[] = [{ text: prompt }];
            if (image) {
                // Image is expected to be base64 string without data URI prefix for Gemini API inlineData
                // But frontend usually sends full data URI. Let's strip it if present.
                const base64Data = image.split(',').pop();
                parts.push({
                    inline_data: {
                        mime_type: "image/jpeg", // As a simplification, assuming jpeg or letting API detect. 
                        // Better to detect from prefix if available: data:image/png;base64,...
                        // But for now, let's try to extract mime from prefix or default to jpeg/png
                        data: base64Data
                    }
                });
            }

            resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });
        } else if (config.provider === 'openai') {
            const messages: any[] = [{
                role: 'user',
                content: [
                    { type: "text", text: prompt }
                ]
            }];

            if (image) {
                // OpenAI expects data URL or URL. We have base64 data URL.
                // Ensure it's a full data URL.
                const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
                (messages[0].content as any[]).push({
                    type: "image_url",
                    image_url: {
                        url: imageUrl
                    }
                });
            }

            resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: messages,
                    response_format: { type: "json_object" }
                })
            });
        } else {
            return new Response(JSON.stringify({ error: 'Unsupported provider' }), { status: 400 });
        }

        const data = await resp.json();
        if (!resp.ok) {
            return new Response(JSON.stringify({
                error: 'AI Provider Error',
                details: data,
                status: resp.status
            }), { status: resp.status });
        }

        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'AI request failed', details: error.message }), { status: 500 });
    }
};
