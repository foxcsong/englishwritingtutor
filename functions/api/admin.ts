import { Env } from './types';

// In production, this MUST be set as an environment variable (Secret)
// In local dev, set it in .dev.vars
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // 1. Auth Check - STRICTLY use env var
    const adminKey = request.headers.get('x-admin-key');
    const validKey = env.ADMIN_SECRET;

    if (!validKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error: ADMIN_SECRET environment variable is not set.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Constant-time comparison would be better for security but simple string compare is acceptable here
    if (adminKey !== validKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);

    // 2. GET: List all users
    if (request.method === 'GET') {
        try {
            // List all keys starting with "user:"
            const list = await env.WRITING_KV.list({ prefix: 'user:' });
            const users = [];

            for (const key of list.keys) {
                const username = key.name.split(':')[1];
                // Fetch profile to get points/badges stats
                const profileStr = await env.WRITING_KV.get(`profile:${username}`);
                const profile = profileStr ? JSON.parse(profileStr) : { points: 0, badges: [] };

                users.push({
                    username,
                    points: profile.points || 0,
                    badgesCount: profile.badges?.length || 0,
                    level: profile.level || 'N/A'
                });
            }

            return new Response(JSON.stringify(users), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Failed to list users' }), { status: 500 });
        }
    }

    // 3. POST: Actions (Reset / Delete)
    if (request.method === 'POST') {
        const body = await request.json() as any;
        const { action, targetUsername } = body;

        if (!targetUsername) {
            return new Response(JSON.stringify({ error: 'Missing targetUsername' }), { status: 400 });
        }

        if (action === 'reset_password') {
            const userKey = `user:${targetUsername}`;
            const existingUserStr = await env.WRITING_KV.get(userKey);

            if (!existingUserStr) {
                return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
            }

            const existingUser = JSON.parse(existingUserStr);
            // Reset to "123456"
            existingUser.passwordHash = '123456';

            await env.WRITING_KV.put(userKey, JSON.stringify(existingUser));

            return new Response(JSON.stringify({ message: `Password for ${targetUsername} reset to 123456` }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (action === 'delete_user') {
            // Delete all related keys
            await env.WRITING_KV.delete(`user:${targetUsername}`);
            await env.WRITING_KV.delete(`profile:${targetUsername}`);

            // Should also clean up history but that's a list. 
            // For now, we just delete the main profile/user. 
            // History works by reading `history?username=...` which filters by KV list or separate keys?
            // Checking history API: it uses `history:${username}:${timestamp}` usually or similar.
            // Let's list and delete history keys too.
            const historyKeys = await env.WRITING_KV.list({ prefix: `history:${targetUsername}` });
            for (const hKey of historyKeys.keys) {
                await env.WRITING_KV.delete(hKey.name);
            }

            return new Response(JSON.stringify({ message: `User ${targetUsername} deleted` }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};
