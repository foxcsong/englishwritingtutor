import { Env, UserData } from './types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const { username, password } = await request.json() as any;

    if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 简单的密码哈希模拟（在实际生产中应使用更强的库，但在 CF Workers 边缘环境下需注意性能和库兼容性）
    // 这里暂时使用文本，实际建议使用 Web Crypto API
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
