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

    // 1. Update User Key (Auth & Config)
    const userKey = `user:${username}`;
    const userJson = await env.WRITING_KV.get(userKey);

    if (userJson) {
        const user = JSON.parse(userJson) as UserData;
        user.config = config;
        await env.WRITING_KV.put(userKey, JSON.stringify(user));
    } else {
        // Should not happen for registered users, but good for robustness
        // Note: We don't have password here, so we can't create a full user if missing
        // This suggests an error state if user doesn't exist.
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // 2. Update Profile Key (Dashboard Stats & Config)
    // CRITICAL FIX: Create profile if it doesn't exist, to ensure config is saved
    const profileKey = `profile:${username}`;
    let profile: any = {};
    const profileJson = await env.WRITING_KV.get(profileKey);

    if (profileJson) {
        profile = JSON.parse(profileJson);
    } else {
        // Initialize default profile if missing
        profile = {
            username,
            points: 0,
            badges: [],
            level: null
        };
    }

    // Always update config
    profile.config = config;
    await env.WRITING_KV.put(profileKey, JSON.stringify(profile));

    return new Response(JSON.stringify({ message: 'Config saved successfully', config }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
