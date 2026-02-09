export interface Env {
    WRITING_KV: KVNamespace;
    ADMIN_SECRET: string;
}

export interface UserConfig {
    apiKey: string;
    provider: 'openai' | 'gemini';
    model: string;
}

export interface UserData {
    username: string;
    passwordHash: string;
    config?: UserConfig;
}
