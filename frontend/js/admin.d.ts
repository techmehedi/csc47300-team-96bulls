interface Proposal {
    id: string;
    user_id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    test_cases: Array<{
        input: string;
        expectedOutput: string;
        isHidden: boolean;
    }>;
    constraints?: string[];
    examples?: any[];
    hints?: string[];
    solution?: string;
    time_complexity?: string;
    space_complexity?: string;
    tags?: string[];
    status: 'pending' | 'approved' | 'rejected';
    admin_notes?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    created_at: string;
    updated_at?: string;
    user?: {
        email?: string;
        raw_user_meta_data?: any;
    };
}
interface AdminCheckResponse {
    isAdmin: boolean;
    debug?: {
        userId: string;
        reqUserRole?: string;
        databaseRole?: {
            account_type?: string;
            role?: string;
        };
        userMetadata?: any;
    };
}
declare class AdminPanel {
    private currentStatus;
    private proposals;
    private currentProposal;
    private isAdmin;
    constructor();
    init(): Promise<void>;
    checkAdminAccess(): Promise<void>;
    getAuthToken(): Promise<string | null>;
    setupEventListeners(): void;
    setActiveFilter(status: string): void;
    loadProposals(status?: string): Promise<void>;
    renderProposals(proposals: Proposal[]): void;
    createProposalCard(proposal: Proposal): HTMLElement;
    showProposalModal(proposal: Proposal): void;
    reviewProposal(status: 'approved' | 'rejected'): Promise<void>;
    getTimeAgo(dateString: string): string;
    escapeHtml(text: string): string;
    showError(message: string): void;
    showSuccess(message: string): void;
}
