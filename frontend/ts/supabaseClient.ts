// Supabase client initialization
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

(function(): void {
  function initSupabaseClient(): void {
    // Wait for supabase library - CDN from jsdelivr exposes it as window.supabase
    // Check multiple possible global names
    let supabaseLib: any = null;
    
    // Try window.supabase first (most common)
    if ((window as any).supabase && typeof (window as any).supabase.createClient === 'function') {
      supabaseLib = (window as any).supabase;
    }
    // Try window.supabaseJs
    else if ((window as any).supabaseJs) {
      supabaseLib = (window as any).supabaseJs;
      if (supabaseLib.default && typeof supabaseLib.default.createClient === 'function') {
        supabaseLib = supabaseLib.default;
      }
    }
    // Try accessing via module if loaded as ES module
    else if ((window as any).supabase && (window as any).supabase.default) {
      supabaseLib = (window as any).supabase.default;
    }
    
    // Check if library is loaded
    if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
      const retryCount = (initSupabaseClient as any).retryCount || 0;
      if (retryCount < 100) {
        (initSupabaseClient as any).retryCount = retryCount + 1;
        if (retryCount === 1 || retryCount % 10 === 0) {
          console.log('Waiting for Supabase library to load...', {
            attempt: retryCount,
            hasSupabase: !!(window as any).supabase,
            hasSupabaseJs: !!(window as any).supabaseJs,
            windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('supabase'))
          });
        }
        setTimeout(initSupabaseClient, 100);
        return;
      } else {
        console.error('Supabase library failed to load after 10 seconds');
        console.error('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
        console.error('Please check that the Supabase CDN script is loaded before this script');
        return;
      }
    }
    
    // Reset retry count on success
    (initSupabaseClient as any).retryCount = 0;
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
      client.auth.onAuthStateChange((event: string, session: any) => {
        // Silent handler - auth-check.js handles logging
      });

      console.log('Supabase client initialized successfully');

      window.getSupabaseUser = async function(): Promise<any> {
        try {
          if (!window.supabaseClient) return null;
          const { data, error } = await window.supabaseClient.auth.getUser();
          if (error) {
            console.error('Error getting user:', error);
            return null;
          }
          return data?.user || null;
        } catch (e) {
          console.error('Exception getting user:', e);
          return null;
        }
      };
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
    }
  }

  // Try to initialize immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseClient);
  } else {
    initSupabaseClient();
  }
})();

