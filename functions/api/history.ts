import { Env } from './types';

// GET /api/history?username=xxx
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
        return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 });
    }

    const historyKey = `history:${username}`;
    const history = await env.WRITING_KV.get(historyKey);

    return new Response(history || '[]', {
        headers: { 'Content-Type': 'application/json' }
    });
};

// POST /api/history
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const { username, record } = await request.json() as any;

    if (!username || !record) {
        return new Response(JSON.stringify({ error: 'Username and record are required' }), { status: 400 });
    }

    const historyKey = `history:${username}`;
    const currentHistoryJson = await env.WRITING_KV.get(historyKey);
    const currentHistory = JSON.parse(currentHistoryJson || '[]');

    currentHistory.unshift(record); // 最新记录在前

    await env.WRITING_KV.put(historyKey, JSON.stringify(currentHistory));

    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
