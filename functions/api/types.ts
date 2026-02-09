export interface Env {
    WRITING_KV: KVNamespace;
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
