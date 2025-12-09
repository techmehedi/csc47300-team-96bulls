interface TestCase {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}
interface ProposalFormData {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    test_cases: TestCase[];
    constraints?: string[];
    examples?: any[];
    hints?: string[];
    solution?: string | null;
    time_complexity?: string | null;
    space_complexity?: string | null;
    tags?: string[];
}
declare class ProposalForm {
    constructor();
    init(): Promise<void>;
    checkAuthentication(): Promise<boolean>;
    getAuthToken(): Promise<string | null>;
    setupEventListeners(): void;
    handleSubmit(): Promise<void>;
    parseConstraints(text: string): string[];
    parseExamples(text: string): any[];
    parseHints(text: string): string[];
    parseTags(text: string): string[];
}
