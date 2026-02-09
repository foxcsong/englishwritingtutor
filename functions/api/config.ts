import { Env, UserData, UserConfig } from './types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const { username, config } = await request.json() as { username: string, config: UserConfig };

    if (!username || !config) {
        return new Response(JSON.stringify({ error: 'Username and config are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userKey = `user:${username}`;
    const userJson = await env.WRITING_KV.get(userKey);

    if (userJson) {
        const user = JSON.parse(userJson) as UserData;
        user.config = config;
        await env.WRITING_KV.put(userKey, JSON.stringify(user));
    }

    // 同时更新 profile 键
    const profileKey = `profile:${username}`;
    const profileJson = await env.WRITING_KV.get(profileKey);
    if (profileJson) {
        const profile = JSON.parse(profileJson);
        profile.config = config;
        await env.WRITING_KV.put(profileKey, JSON.stringify(profile));
    }

    return new Response(JSON.stringify({ message: 'Config saved successfully' }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
