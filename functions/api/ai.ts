import { Env, UserData } from './types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const body = await request.json() as any;
    const { username, prompt, config: configOverride } = body;

    if (!username || !prompt) {
        return new Response(JSON.stringify({ error: 'Username and prompt are required' }), { status: 400 });
    }

    let config = configOverride;

    if (!config) {
        // 获取持久化的用户配置
        const profileKey = `profile:${username}`;
        const profileJson = await env.WRITING_KV.get(profileKey);
        if (!profileJson) return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
        const profile = JSON.parse(profileJson);
        config = profile.config;
    }

    if (!config || !config.apiKey) {
        return new Response(JSON.stringify({ error: 'AI API Key not configured' }), { status: 400 });
    }

    try {
        let resp: Response;
        if (config.provider === 'gemini') {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
            resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });
        } else if (config.provider === 'openai') {
            resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: prompt }],
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
