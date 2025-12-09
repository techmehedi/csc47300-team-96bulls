import type { User } from './types.js';
interface CurrentUser {
    id: string;
    email?: string;
    username: string;
    firstName: string;
    lastName: string;
    preferences: {
        theme: string;
        difficulty: string;
        topics: string[];
        notifications: boolean;
        emailUpdates: boolean;
    };
}
interface SignupFormData {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
}
type NotificationType = 'success' | 'error' | 'warning' | 'info';
declare global {
    interface Window {
        authSystem?: AuthenticationSystem;
        supabaseClient?: any;
        SUPABASE_URL?: string;
        SUPABASE_ANON_KEY?: string;
        getSupabaseUser?: () => Promise<User | null>;
    }
}
declare class AuthenticationSystem {
    private currentUser;
    constructor();
    initializeEventListeners(): void;
    checkExistingSession(): Promise<void>;
    updateNavigationForLoggedInUser(): void;
    addLogoutButton(profileLink: HTMLElement): void;
    handleLogin(e: Event): Promise<void>;
    handleSignup(e: Event): Promise<void>;
    mapSupabaseUser(user: User): CurrentUser;
    validateSignupForm(data: SignupFormData): void;
    initializePasswordToggles(): void;
    initializePasswordStrength(): void;
    calculatePasswordStrength(password: string): number;
    initializeFormValidation(): void;
    validateField(field: HTMLInputElement): void;
    clearFieldError(field: HTMLInputElement): void;
    showError(fieldId: string, message: string): void;
    clearErrors(): void;
    showLoading(buttonId: string): void;
    hideLoading(buttonId: string): void;
    showNotification(message: string, type?: NotificationType): void;
    getNotificationIcon(type: NotificationType): string;
    logout(): Promise<void>;
    isLoggedIn(): boolean;
    getCurrentUser(): CurrentUser | null;
    resendConfirmationEmail(email: string): Promise<void>;
    showResendConfirmationOption(email: string): void;
}
export {};
