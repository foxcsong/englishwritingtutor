import { Env, UserData } from './types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    const body = await request.json() as any;
    const { username, password } = body;

    // --- Action: Change Password ---
    if (action === 'change-password') {
        const { oldPassword, newPassword } = body;
        if (!username || !oldPassword || !newPassword) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        const userKey = `user:${username}`;
        const userJson = await env.WRITING_KV.get(userKey);
        if (!userJson) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const userData = JSON.parse(userJson) as UserData;
        if (userData.passwordHash !== oldPassword) {
            return new Response(JSON.stringify({ error: 'Incorrect old password' }), { status: 401 });
        }

        userData.passwordHash = newPassword;
        await env.WRITING_KV.put(userKey, JSON.stringify(userData));

        return new Response(JSON.stringify({ message: 'Password changed successfully' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // --- Action: Default (Login/Register) ---
    if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const passwordHash = password;
    const userKey = `user:${username}`;
    const existingUserJson = await env.WRITING_KV.get(userKey);

    if (existingUserJson) {
        const existingUser = JSON.parse(existingUserJson) as UserData;
        if (existingUser.passwordHash === passwordHash) {
            return new Response(JSON.stringify({
                message: 'Login successful',
                user: { username: existingUser.username, config: existingUser.config }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else {
        // 注册新用户
        const newUser: UserData = {
            username,
            passwordHash
        };
        await env.WRITING_KV.put(userKey, JSON.stringify(newUser));
        return new Response(JSON.stringify({
            message: 'Registration successful',
            user: { username, config: null }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
