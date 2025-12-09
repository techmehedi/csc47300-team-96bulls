import type { FullSupabaseClient, User } from './types.js';
declare global {
    interface Window {
        supabase?: {
            createClient(url: string, key: string, options?: any): FullSupabaseClient;
        };
        supabaseJs?: any;
        supabaseClient?: any;
        SUPABASE_URL?: string;
        SUPABASE_ANON_KEY?: string;
        getSupabaseUser?: () => Promise<User | null>;
    }
}
