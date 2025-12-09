interface CodeMirrorEditor {
    setValue(value: string): void;
    getValue(): string;
    save(): void;
    on(event: string, callback: () => void): void;
}
interface CodeMirror {
    fromTextArea(textarea: HTMLTextAreaElement, options: any): CodeMirrorEditor;
}
declare global {
    interface Window {
        CodeMirror?: CodeMirror;
    }
}
export {};
