import type { User } from './types.js';
interface Chart {
    destroy(): void;
}
declare global {
    interface Window {
        Chart: {
            new (ctx: HTMLCanvasElement, config: any): Chart;
        };
        getSupabaseUser?: () => Promise<User | null>;
        dashboardErrorHandlerAdded?: boolean;
    }
}
export {};
