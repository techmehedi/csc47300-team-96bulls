(function () {
    function initSupabaseClient() {
        // Wait for supabase library - CDN from jsdelivr exposes it as window.supabase
        // Check multiple possible global names
        let supabaseLib = null;
        // Try window.supabase first (most common)
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseLib = window.supabase;
        }
        // Try window.supabaseJs
        else if (window.supabaseJs) {
            supabaseLib = window.supabaseJs;
            if (supabaseLib.default && typeof supabaseLib.default.createClient === 'function') {
                supabaseLib = supabaseLib.default;
            }
        }
        // Try accessing via module if loaded as ES module
        else if (window.supabase && window.supabase.default) {
            supabaseLib = window.supabase.default;
        }
        // Check if library is loaded
        if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
            const retryCount = initSupabaseClient.retryCount || 0;
            if (retryCount < 100) {
                initSupabaseClient.retryCount = retryCount + 1;
                if (retryCount === 1 || retryCount % 10 === 0) {
                    console.log('Waiting for Supabase library to load...', {
                        attempt: retryCount,
                        hasSupabase: !!window.supabase,
                        hasSupabaseJs: !!window.supabaseJs,
                        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('supabase'))
                    });
                }
                setTimeout(initSupabaseClient, 100);
                return;
            }
            else {
                console.error('Supabase library failed to load after 10 seconds');
                console.error('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
                console.error('Please check that the Supabase CDN script is loaded before this script');
                return;
            }
        }
        // Reset retry count on success
        initSupabaseClient.retryCount = 0;
        console.log('Supabase library found, initializing client...');
        const supabaseUrl = window.SUPABASE_URL;
        const supabaseAnonKey = window.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Supabase configuration missing. Set window.SUPABASE_URL and window.SUPABASE_ANON_KEY.');
            console.error('Current values:', {
                url: supabaseUrl || 'MISSING',
                key: supabaseAnonKey ? 'PRESENT' : 'MISSING'
            });
            return;
        }
        // Check for placeholder values
        if (supabaseUrl.includes('YOUR-PROJECT-REF') || supabaseAnonKey.includes('YOUR-ANON-KEY')) {
            console.error('Supabase configuration not set! Please:');
            console.error('1. Create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY');
            console.error('2. Run: node inject-env.mjs');
            return;
        }
        try {
            const client = supabaseLib.createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    storage: window.localStorage,
                    detectSessionInUrl: true,
                    // Handle email confirmation redirects
                    flowType: 'pkce'
                }
            });
            window.supabaseClient = client;
            // Listen for auth state changes (silent - only for internal handling)
            // Don't log here as auth-check.js already handles state changes
            client.auth.onAuthStateChange((event, session) => {
                // Silent handler - auth-check.js handles logging
            });
            console.log('Supabase client initialized successfully');
            window.getSupabaseUser = async function () {
                try {
                    if (!window.supabaseClient)
                        return null;
                    const { data, error } = await window.supabaseClient.auth.getUser();
                    if (error) {
                        console.error('Error getting user:', error);
                        return null;
                    }
                    return data?.user || null;
                }
                catch (e) {
                    console.error('Exception getting user:', e);
                    return null;
                }
            };
        }
        catch (error) {
            console.error('Error initializing Supabase client:', error);
        }
    }
    // Try to initialize immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabaseClient);
    }
    else {
        initSupabaseClient();
    }
})();
//# sourceMappingURL=supabaseClient.js.map