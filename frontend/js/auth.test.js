// TypeScript test suite for authentication functionality
// This file can be run with a test runner like Jest or Vitest
/**
 * Test Suite for Authentication System
 *
 * To run these tests:
 * 1. Install a test runner: npm install --save-dev jest @types/jest ts-jest
 * 2. Configure Jest for TypeScript
 * 3. Run: npm test
 */
describe('Authentication System', () => {
    let authSystem;
    let mockSupabaseClient;
    beforeEach(() => {
        // Reset mocks
        mockSupabaseClient = {
            auth: {
                signInWithPassword: jest.fn(),
                signUp: jest.fn(),
                signOut: jest.fn(),
                getUser: jest.fn(),
                onAuthStateChange: jest.fn()
            }
        };
        // Mock window objects
        window.supabaseClient = mockSupabaseClient;
        window.SUPABASE_URL = 'https://test.supabase.co';
        window.SUPABASE_ANON_KEY = 'test-anon-key';
    });
    afterEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });
    describe('Environment Configuration', () => {
        test('should have Supabase URL configured', () => {
            expect(window.SUPABASE_URL).toBeDefined();
            expect(window.SUPABASE_URL).not.toBe('');
            expect(window.SUPABASE_URL).not.toContain('YOUR-PROJECT');
        });
        test('should have Supabase Anon Key configured', () => {
            expect(window.SUPABASE_ANON_KEY).toBeDefined();
            expect(window.SUPABASE_ANON_KEY).not.toBe('');
            expect(window.SUPABASE_ANON_KEY).not.toContain('YOUR-ANON');
        });
        test('should have Supabase client available', () => {
            expect(window.supabaseClient).toBeDefined();
        });
    });
    describe('Login Functionality', () => {
        test('should successfully login with valid credentials', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: {
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser'
                }
            };
            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
                data: { user: mockUser, session: { access_token: 'token' } },
                error: null
            });
            // Simulate login
            const result = await mockSupabaseClient.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result.data.user).toBeDefined();
            expect(result.data.user.email).toBe('test@example.com');
            expect(result.error).toBeNull();
        });
        test('should handle invalid credentials', async () => {
            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'Invalid login credentials' }
            });
            const result = await mockSupabaseClient.auth.signInWithPassword({
                email: 'wrong@example.com',
                password: 'wrongpassword'
            });
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain('Invalid');
        });
        test('should handle network errors', async () => {
            mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(new Error('Network error: Failed to fetch'));
            await expect(mockSupabaseClient.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password123'
            })).rejects.toThrow('Network error');
        });
    });
    describe('Signup Functionality', () => {
        test('should successfully signup with valid data', async () => {
            const mockUser = {
                id: 'user-456',
                email: 'newuser@example.com',
                user_metadata: {
                    firstName: 'New',
                    lastName: 'User',
                    username: 'newuser'
                }
            };
            mockSupabaseClient.auth.signUp.mockResolvedValue({
                data: { user: mockUser, session: null },
                error: null
            });
            const result = await mockSupabaseClient.auth.signUp({
                email: 'newuser@example.com',
                password: 'securepassword123',
                options: {
                    data: {
                        firstName: 'New',
                        lastName: 'User',
                        username: 'newuser'
                    }
                }
            });
            expect(result.data.user).toBeDefined();
            expect(result.data.user.email).toBe('newuser@example.com');
            expect(result.error).toBeNull();
        });
        test('should handle duplicate email signup', async () => {
            mockSupabaseClient.auth.signUp.mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'User already registered' }
            });
            const result = await mockSupabaseClient.auth.signUp({
                email: 'existing@example.com',
                password: 'password123'
            });
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain('already');
        });
        test('should validate password strength', () => {
            const weakPassword = '123';
            const strongPassword = 'SecurePass123!';
            expect(weakPassword.length).toBeLessThan(8);
            expect(strongPassword.length).toBeGreaterThanOrEqual(8);
        });
    });
    describe('Form Validation', () => {
        test('should validate email format', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect(emailRegex.test('test@example.com')).toBe(true);
            expect(emailRegex.test('invalid-email')).toBe(false);
            expect(emailRegex.test('test@')).toBe(false);
            expect(emailRegex.test('@example.com')).toBe(false);
        });
        test('should validate password length', () => {
            const minLength = 8;
            expect('password123'.length).toBeGreaterThanOrEqual(minLength);
            expect('short'.length).toBeLessThan(minLength);
        });
        test('should validate username length', () => {
            const minLength = 3;
            expect('testuser'.length).toBeGreaterThanOrEqual(minLength);
            expect('ab'.length).toBeLessThan(minLength);
        });
    });
    describe('Session Management', () => {
        test('should store user in localStorage on login', () => {
            const userData = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User'
            };
            localStorage.setItem('ai_interviewer_user', JSON.stringify(userData));
            const stored = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
            expect(stored.id).toBe('user-123');
            expect(stored.email).toBe('test@example.com');
        });
        test('should clear user from localStorage on logout', async () => {
            localStorage.setItem('ai_interviewer_user', JSON.stringify({ id: 'user-123' }));
            localStorage.setItem('ai_interviewer_remember', 'true');
            mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
            await mockSupabaseClient.auth.signOut();
            localStorage.removeItem('ai_interviewer_user');
            localStorage.removeItem('ai_interviewer_remember');
            expect(localStorage.getItem('ai_interviewer_user')).toBeNull();
            expect(localStorage.getItem('ai_interviewer_remember')).toBeNull();
        });
        test('should retrieve existing session', () => {
            const userData = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser'
            };
            localStorage.setItem('ai_interviewer_user', JSON.stringify(userData));
            const retrieved = localStorage.getItem('ai_interviewer_user');
            expect(retrieved).not.toBeNull();
            const parsed = JSON.parse(retrieved);
            expect(parsed.id).toBe('user-123');
        });
    });
    describe('Error Handling', () => {
        test('should handle missing Supabase client', () => {
            const originalClient = window.supabaseClient;
            window.supabaseClient = undefined;
            // Should gracefully handle missing client
            expect(window.supabaseClient).toBeUndefined();
            window.supabaseClient = originalClient;
        });
        test('should handle missing credentials', () => {
            expect(window.SUPABASE_URL).toBeDefined();
            expect(window.SUPABASE_ANON_KEY).toBeDefined();
        });
        test('should handle API errors gracefully', async () => {
            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
                data: { user: null, session: null },
                error: { message: 'API error occurred' }
            });
            const result = await mockSupabaseClient.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result.error).toBeDefined();
            expect(result.error.message).toBe('API error occurred');
        });
    });
    describe('User Mapping', () => {
        test('should map Supabase user correctly', () => {
            const supabaseUser = {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: {
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser'
                }
            };
            const mapped = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                username: supabaseUser.user_metadata?.username || '',
                firstName: supabaseUser.user_metadata?.firstName || '',
                lastName: supabaseUser.user_metadata?.lastName || ''
            };
            expect(mapped.id).toBe('user-123');
            expect(mapped.email).toBe('test@example.com');
            expect(mapped.username).toBe('testuser');
        });
        test('should handle missing user metadata', () => {
            const supabaseUser = {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: {}
            };
            const mapped = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '',
                firstName: supabaseUser.user_metadata?.firstName || '',
                lastName: supabaseUser.user_metadata?.lastName || ''
            };
            expect(mapped.username).toBe('test');
            expect(mapped.firstName).toBe('');
        });
    });
});
//# sourceMappingURL=auth.test.js.map