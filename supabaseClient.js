(function() {
  function initSupabaseClient() {
    // Wait for supabase library
    if (!window.supabase) {
      console.warn('Supabase library not loaded yet, retrying...');
      setTimeout(initSupabaseClient, 100);
      return;
    }

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
      window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: window.localStorage,
          detectSessionInUrl: true
        }
      });

      console.log('Supabase client initialized successfully');

      window.getSupabaseUser = async function() {
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


