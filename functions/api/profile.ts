import { Env } from './types';

// GET /api/profile?username=xxx
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
        return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 });
    }

    const profileKey = `profile:${username}`;
    const profile = await env.WRITING_KV.get(profileKey);

    return new Response(profile || JSON.stringify({ points: 0, badges: [], level: null }), {
        headers: { 'Content-Type': 'application/json' }
    });
};

// POST /api/profile
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const { username, points, badges, level } = await request.json() as any;

    if (!username) {
        return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 });
    }

    const profileKey = `profile:${username}`;
    const currentProfile = JSON.parse(await env.WRITING_KV.get(profileKey) || '{"points":0,"badges":[],"level":null}');

    const newProfile = {
        ...currentProfile,
        points: points !== undefined ? points : currentProfile.points,
        badges: badges !== undefined ? badges : currentProfile.badges,
        level: level !== undefined ? level : currentProfile.level
    };

    await env.WRITING_KV.put(profileKey, JSON.stringify(newProfile));

    return new Response(JSON.stringify(newProfile), {
        headers: { 'Content-Type': 'application/json' }
    });
};
