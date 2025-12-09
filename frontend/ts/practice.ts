// Practice Session System for AI Interviewer
import type { Session, SessionResult, Question, FullSupabaseClient, User } from './types.js';

interface CodeMirrorEditor {
  setValue(value: string): void;
  getValue(): string;
  save(): void;
  on(event: string, callback: () => void): void;
}

interface CodeMirror {
  fromTextArea(textarea: HTMLTextAreaElement, options: any): CodeMirrorEditor;
}

interface ExecutionOutput {
  success: boolean;
  output?: string | null;
  stderr?: string | null;
  error?: string | null;
  results?: TestResult[];
  consoleOutput?: string[];
  testCasesPassed?: number;
  totalTestCases?: number;
}

interface TestResult {
  testCase: number;
  input?: string;
  output?: any;
  expected?: any;
  passed?: boolean;
  error?: string;
}

interface TestCase {
  input: string;
  inputStr: string;
  expected: string;
  expectedStr: string;
  explanation?: string;
}

interface FormData {
  topic: string;
  difficulty: string;
  timeLimit: number;
  questionCount: number;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Note: Window interface types are declared in backend-api.ts and supabase-db.ts  
// BackendSimulator is declared in backend-simulator.ts
declare global {
  interface Window {
    CodeMirror?: CodeMirror;
  }
}

class PracticeSession {
  private backend: any;
  private currentSession: Session | null = null;
  private currentQuestionIndex: number = 0;
  private questions: Question[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private timeRemaining: number = 0;
  private sessionStartTime: Date | null = null;
  private results: SessionResult[] = [];
  private codeEditor: CodeMirrorEditor | null = null;
  private questionStartTime: Date | null = null;

  constructor() {
    this.backend = new (window.BackendSimulator as any)();
    
    // Initialize code editor after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeCodeEditor());
    } else {
      setTimeout(() => this.initializeCodeEditor(), 100);
    }
    
    this.initializeEventListeners();
    this.checkAuthentication();
  }

  initializeCodeEditor(): void {
    // Initialize CodeMirror editor with syntax highlighting
    const textarea = document.getElementById('codeInput') as HTMLTextAreaElement | null;
    if (textarea && window.CodeMirror) {
      this.codeEditor = window.CodeMirror.fromTextArea(textarea, {
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 2,
        indentWithTabs: false,
        lineWrapping: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: {
          'Ctrl-Space': 'autocomplete',
          'Tab': function(cm: any) {
            if (cm.somethingSelected()) {
              cm.indentSelection('add');
            } else {
              cm.replaceSelection('  ', 'end');
            }
          }
        }
      });
      
      // Update textarea on editor change
      this.codeEditor.on('change', () => {
        this.codeEditor!.save();
      });
    }
  }

  async checkAuthentication(): Promise<void> {
    const userData = localStorage.getItem('ai_interviewer_user');
    if (!userData) {
      this.showNotification('Please log in to start a practice session.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }
  }

  initializeEventListeners(): void {
    // Session setup form
    const sessionForm = document.getElementById('sessionForm') as HTMLFormElement | null;
    if (sessionForm) {
      sessionForm.addEventListener('submit', (e) => this.startSession(e));
    }

    // Practice session controls
    this.initializeSessionControls();
    this.initializeQuestionControls();
    this.initializeTimerControls();
  }

  initializeSessionControls(): void {
    // Pause/Resume button
    const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement | null;
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }

    // Stop button
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement | null;
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopSession());
    }

    // Next question button
    const nextQuestionBtn = document.getElementById('nextQuestionBtn') as HTMLButtonElement | null;
    if (nextQuestionBtn) {
      nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
    }

    // End session button
    const endSessionBtn = document.getElementById('endSessionBtn') as HTMLButtonElement | null;
    if (endSessionBtn) {
      endSessionBtn.addEventListener('click', () => this.endSession());
    }

    // New session button
    const newSessionBtn = document.getElementById('newSessionBtn') as HTMLButtonElement | null;
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => this.resetSession());
    }
  }

  initializeQuestionControls(): void {
    // Run code button
    const runCodeBtn = document.getElementById('runCodeBtn') as HTMLButtonElement | null;
    if (runCodeBtn) {
      runCodeBtn.addEventListener('click', () => this.runCode());
    }

    // Submit solution button
    const submitSolutionBtn = document.getElementById('submitSolutionBtn') as HTMLButtonElement | null;
    if (submitSolutionBtn) {
      submitSolutionBtn.addEventListener('click', () => this.submitSolution());
    }

    // Get hint button
    const getHintBtn = document.getElementById('getHintBtn') as HTMLButtonElement | null;
    if (getHintBtn) {
      getHintBtn.addEventListener('click', () => this.showHint());
    }

    // Show solution button
    const showSolutionBtn = document.getElementById('showSolutionBtn') as HTMLButtonElement | null;
    if (showSolutionBtn) {
      showSolutionBtn.addEventListener('click', () => this.showSolution());
    }
  }

  initializeTimerControls(): void {
    // Timer will be initialized when session starts
  }

  async startSession(e: Event): Promise<void> {
    e.preventDefault();
    
    const topicEl = document.getElementById('sessionTopic') as HTMLSelectElement | null;
    const difficultyEl = document.getElementById('sessionDifficulty') as HTMLSelectElement | null;
    const timeEl = document.getElementById('sessionTime') as HTMLInputElement | null;
    const questionsEl = document.getElementById('sessionQuestions') as HTMLInputElement | null;
    
    if (!topicEl || !difficultyEl || !timeEl || !questionsEl) {
      this.showNotification('Session form elements not found', 'error');
      return;
    }
    
    const formData: FormData = {
      topic: topicEl.value,
      difficulty: difficultyEl.value,
      timeLimit: parseInt(timeEl.value),
      questionCount: parseInt(questionsEl.value)
    };

    try {
      this.showLoading('sessionForm');
      
      // Get questions - try Express backend first, then fallback to simulator
      if (window.backendAPI) {
        try {
          this.questions = await window.backendAPI.getQuestions(formData.topic, formData.difficulty, formData.questionCount);
        } catch (backendError) {
          console.warn('Backend API getQuestions failed, using simulator:', backendError);
          this.questions = await this.backend.getQuestions(formData.topic, formData.difficulty, formData.questionCount);
        }
      } else {
        this.questions = await this.backend.getQuestions(formData.topic, formData.difficulty, formData.questionCount);
      }
      
      if (this.questions.length === 0) {
        throw new Error('No questions available for this topic and difficulty combination.');
      }

      // Get user ID from Supabase session or localStorage
      let userId: string | null = null;
      if (window.supabaseClient) {
        try {
          const client = window.supabaseClient as FullSupabaseClient;
          const { data: { user } } = await client.auth.getUser();
          userId = user?.id || null;
        } catch (error) {
          console.warn('Could not get user from Supabase session:', error);
        }
      }
      
      // Fallback to localStorage if Supabase user not available
      if (!userId) {
        try {
          const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
          userId = userData?.id || null;
        } catch {
          // Ignore parse errors
        }
      }
      
      if (!userId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log('Creating session for user:', userId);
      
      // Try Express backend first, then Supabase, then simulator
      if (window.backendAPI) {
        try {
      const backendAPI = window.backendAPI as any;
      this.currentSession = await backendAPI.createSession({
        userId: userId,
        topic: formData.topic,
        difficulty: formData.difficulty as 'easy' | 'medium' | 'hard',
        timeLimit: formData.timeLimit,
        questions: this.questions.map(q => q.id)
      });
          console.log('Session created in Express backend:', this.currentSession?.id);
        } catch (backendError) {
          console.warn('Backend API createSession failed, trying Supabase:', backendError);
          // Fallback to Supabase
          const supabaseDB = window.supabaseDB as any;
          if (supabaseDB) {
            try {
              this.currentSession = await supabaseDB.createSession({
                userId: userId,
                topic: formData.topic,
                difficulty: formData.difficulty,
                timeLimit: formData.timeLimit,
                questions: this.questions.map(q => q.id)
              });
              console.log('Session created in Supabase:', this.currentSession?.id);
            } catch (supabaseError) {
              console.warn('Supabase createSession failed, using simulator:', supabaseError);
              this.currentSession = await this.backend.createSession({
                userId: userId,
                topic: formData.topic,
                difficulty: formData.difficulty,
                timeLimit: formData.timeLimit,
                questions: this.questions.map(q => q.id)
              });
            }
          } else {
            this.currentSession = await this.backend.createSession({
              userId: userId,
              topic: formData.topic,
              difficulty: formData.difficulty,
              timeLimit: formData.timeLimit,
              questions: this.questions.map(q => q.id)
            });
          }
        }
      } else if (window.supabaseDB) {
        const supabaseDB = window.supabaseDB as any;
        try {
          this.currentSession = await supabaseDB.createSession({
            userId: userId,
            topic: formData.topic,
            difficulty: formData.difficulty,
            timeLimit: formData.timeLimit,
            questions: this.questions.map(q => q.id)
          });
        } catch (supabaseError) {
          console.warn('Supabase createSession failed, using simulator:', supabaseError);
          try {
            const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
            this.currentSession = await this.backend.createSession({
              userId: userData.id || userId,
              topic: formData.topic,
              difficulty: formData.difficulty,
              timeLimit: formData.timeLimit,
              questions: this.questions.map(q => q.id)
            });
          } catch {
            this.currentSession = await this.backend.createSession({
              userId: userId,
              topic: formData.topic,
              difficulty: formData.difficulty,
              timeLimit: formData.timeLimit,
              questions: this.questions.map(q => q.id)
            });
          }
        }
      } else {
        try {
          const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
          this.currentSession = await this.backend.createSession({
            userId: userData.id || userId,
            topic: formData.topic,
            difficulty: formData.difficulty,
            timeLimit: formData.timeLimit,
            questions: this.questions.map(q => q.id)
          });
        } catch {
          this.currentSession = await this.backend.createSession({
            userId: userId,
            topic: formData.topic,
            difficulty: formData.difficulty,
            timeLimit: formData.timeLimit,
            questions: this.questions.map(q => q.id)
          });
        }
      }

      // Initialize session
      this.currentQuestionIndex = 0;
      this.results = [];
      this.sessionStartTime = new Date();
      this.timeRemaining = formData.timeLimit * 60; // Convert to seconds

      // Show practice session
      this.showPracticeSession();
      this.loadCurrentQuestion();
      this.startTimer();

      this.showNotification('Practice session started!', 'success');

    } catch (error: any) {
      this.showNotification(error.message, 'error');
    } finally {
      this.hideLoading('sessionForm');
    }
  }

  showPracticeSession(): void {
    const sessionSetup = document.getElementById('sessionSetup') as HTMLElement | null;
    const practiceSession = document.getElementById('practiceSession') as HTMLElement | null;
    
    if (!sessionSetup || !practiceSession) return;
    
    sessionSetup.style.display = 'none';
    practiceSession.style.display = 'block';
    
    // Update session info
    const topicEl = document.getElementById('sessionTopic') as HTMLSelectElement | null;
    const difficultyEl = document.getElementById('sessionDifficulty') as HTMLSelectElement | null;
    
    if (topicEl && difficultyEl && topicEl.selectedOptions[0] && difficultyEl.selectedOptions[0]) {
      const topic = topicEl.selectedOptions[0].text;
      const difficulty = difficultyEl.selectedOptions[0].text;
      
      const topicDisplay = document.getElementById('sessionTopicDisplay');
      const difficultyDisplay = document.getElementById('sessionDifficultyDisplay');
      
      if (topicDisplay) topicDisplay.textContent = topic;
      if (difficultyDisplay) difficultyDisplay.textContent = difficulty;
    }
    
    this.updateProgress();
  }

  loadCurrentQuestion(): void {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endSession();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    
    // Update question display
    const titleEl = document.getElementById('currentQuestionTitle');
    const descEl = document.getElementById('currentQuestionDescription');
    
    if (titleEl) titleEl.textContent = question.title;
    if (descEl) descEl.textContent = question.description;
    
    // Format and display examples
    const exampleElement = document.getElementById('currentQuestionExample');
    if (exampleElement) {
      const questionAny = question as any;
      if (questionAny.examples && Array.isArray(questionAny.examples) && questionAny.examples.length > 0) {
        // Format examples from array
        const exampleText = questionAny.examples.map((ex: any, index: number) => {
          let formatted = `Input: ${ex.input || 'N/A'}\nOutput: ${ex.output || 'N/A'}`;
          if (ex.explanation) {
            formatted += `\nExplanation: ${ex.explanation}`;
          }
          return formatted;
        }).join('\n\n');
        exampleElement.textContent = exampleText;
      } else if ((question as any).example) {
        // Fallback to singular example string if it exists
        exampleElement.textContent = (question as any).example;
      } else {
        exampleElement.textContent = 'No example provided.';
      }
    }
    
    // Update constraints
    const constraintsList = document.getElementById('currentQuestionConstraints');
    if (constraintsList) {
      if ((question as any).constraints && Array.isArray((question as any).constraints) && (question as any).constraints.length > 0) {
        constraintsList.innerHTML = (question as any).constraints.map((constraint: string) => 
          `<li>${constraint}</li>`
        ).join('');
      } else {
        constraintsList.innerHTML = '<li>No constraints specified.</li>';
      }
    }

    // Update topic and difficulty badges
    const topicBadge = document.getElementById('currentQuestionTopic');
    const difficultyBadge = document.getElementById('currentQuestionDifficulty');
    const topicEl = document.getElementById('sessionTopic') as HTMLSelectElement | null;
    const difficultyEl = document.getElementById('sessionDifficulty') as HTMLSelectElement | null;
    
    if (topicBadge && topicEl && topicEl.selectedOptions[0]) {
      topicBadge.textContent = topicEl.selectedOptions[0].text;
    }
    if (difficultyBadge && difficultyEl && difficultyEl.selectedOptions[0]) {
      difficultyBadge.textContent = difficultyEl.selectedOptions[0].text;
    }
    
    // Style badges
    if (topicBadge) this.styleBadge(topicBadge, '#1a73e8', '#e3ecfd');
    if (difficultyBadge) this.styleBadge(difficultyBadge, this.getDifficultyColor(), this.getDifficultyBgColor());

    // Clear code editor
    const defaultCode = `function ${question.title.toLowerCase().replace(/\s+/g, '')}(${this.getFunctionParameters(question)}) {
    // Your code here
    
}`;
    
    if (this.codeEditor) {
      this.codeEditor.setValue(defaultCode);
    } else {
      const codeInput = document.getElementById('codeInput') as HTMLTextAreaElement | null;
      if (codeInput) {
        codeInput.value = defaultCode;
      }
    }

    // Hide hints and solutions
    this.hideHintsAndSolutions();
    this.hideResult();

    // Start timing for this question
    this.questionStartTime = new Date();

    // Update progress
    this.updateProgress();
  }

  getFunctionParameters(question: Question): string {
    // Extract parameters from examples
    if (!question) return 'input';
    
    // Check if examples array exists and has items
    const questionAny = question as any;
    const examples = questionAny.examples || questionAny.example || [];
    if (Array.isArray(examples) && examples.length > 0) {
      const firstExample = examples[0];
      const inputStr = firstExample.input || firstExample || '';
      
      // Try to extract parameters from input string
      if (inputStr.includes('nums, target') || inputStr.includes('target')) {
        return 'nums, target';
      }
      if (inputStr.includes('prices')) {
        return 'prices';
      }
      if (inputStr.includes('s') && !inputStr.includes('nums')) {
        return 's';
      }
      if (inputStr.includes('nums')) {
        return 'nums';
      }
      if (inputStr.includes('matrix')) {
        return 'matrix';
      }
      if (inputStr.includes('str')) {
        return 'str';
      }
    }
    
    // Fallback: try to infer from title or description
    const title = (question.title || '').toLowerCase();
    const description = (question.description || '').toLowerCase();
    
    if (title.includes('two sum') || description.includes('target')) {
      return 'nums, target';
    }
    if (title.includes('stock') || description.includes('price')) {
      return 'prices';
    }
    if (title.includes('string') || description.includes('string')) {
      return 's';
    }
    if (description.includes('array') || description.includes('nums')) {
      return 'nums';
    }
    
    // Default fallback
    return 'input';
  }

  styleBadge(element: HTMLElement, color: string, backgroundColor: string): void {
    element.style.cssText = `
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      color: ${color};
      background-color: ${backgroundColor};
      margin-right: 8px;
    `;
  }

  getDifficultyColor(): string {
    const difficultyEl = document.getElementById('sessionDifficulty') as HTMLSelectElement | null;
    const difficulty = difficultyEl?.value || '';
    const colors: Record<string, string> = {
      easy: '#16a34a',
      medium: '#ea580c', 
      hard: '#dc2626'
    };
    return colors[difficulty] || '#1a73e8';
  }

  getDifficultyBgColor(): string {
    const difficultyEl = document.getElementById('sessionDifficulty') as HTMLSelectElement | null;
    const difficulty = difficultyEl?.value || '';
    const colors: Record<string, string> = {
      easy: '#dcfce7',
      medium: '#fed7aa',
      hard: '#fecaca'
    };
    return colors[difficulty] || '#e3ecfd';
  }

  updateProgress(): void {
    const progressEl = document.getElementById('sessionProgress');
    if (progressEl) {
      const progress = `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
      progressEl.textContent = progress;
    }
  }

  startTimer(): void {
    if (this.timeRemaining <= 0) return;

    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  updateTimerDisplay(): void {
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      timerDisplay.textContent = display;
    }
  }

  togglePause(): void {
    const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement | null;
    if (!pauseBtn) return;
    
    const icon = pauseBtn.querySelector('i');
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      if (icon) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
      }
      pauseBtn.title = 'Resume';
    } else {
      this.startTimer();
      if (icon) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
      }
      pauseBtn.title = 'Pause';
    }
  }

  timeUp(): void {
    this.showNotification('Time\'s up! Session ended.', 'warning');
    this.endSession();
  }

  async runCode(): Promise<void> {
    // Get code from editor or textarea
    const code = this.codeEditor ? this.codeEditor.getValue() : (document.getElementById('codeInput') as HTMLTextAreaElement | null)?.value || '';
    if (!code.trim()) {
      this.showNotification('Please write some code first.', 'warning');
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    if (!question) {
      this.showNotification('No question loaded.', 'warning');
      return;
    }

    try {
      this.showLoading('runCodeBtn');
      this.showNotification('Running code...', 'info');
      
      // Try using backend execution API first (Piston), fallback to local execution
      if (window.backendAPI) {
        try {
          // Prepare code with test cases
          const testCode = this.prepareCodeForExecution(code, question);
          const result = await window.backendAPI.executeCode(testCode);
          
          if (result.success) {
            // Parse and display results
            const output = this.formatExecutionResult(result, question);
            this.displayCodeOutput(output);
          } else {
            this.displayCodeOutput({
              success: false,
              error: result.error || result.stderr || 'Execution failed',
              output: null
            });
          }
        } catch (apiError) {
          console.warn('Backend execution failed, using local execution:', apiError);
          // Fallback to local execution
          const output = this.executeCode(code, question);
          this.displayCodeOutput(output);
        }
      } else {
        // Use local execution
        const output = this.executeCode(code, question);
        this.displayCodeOutput(output);
      }

    } catch (error: any) {
      console.error('Code execution error:', error);
      this.displayCodeOutput({
        success: false,
        error: error.message,
        output: null
      });
      this.showNotification('Code execution failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('runCodeBtn');
    }
  }

  prepareCodeForExecution(code: string, question: Question): string {
    // Prepare code to execute with test cases
    const funcName = this.getFunctionName(question);
    const testCases = this.parseTestCases(question);
    
    // Wrap code to run test cases
    const testRunner = `
${code}

// Test runner
const results = [];
${testCases.map((testCase, index) => `
try {
  const result_${index} = ${funcName}(${testCase.inputStr});
  const expected_${index} = ${testCase.expectedStr};
  const passed_${index} = JSON.stringify(result_${index}) === JSON.stringify(expected_${index});
  console.log(\`Test ${index + 1}: \${passed_${index} ? 'PASSED' : 'FAILED'}\`);
  console.log(\`  Input: ${testCase.input}\`);
  console.log(\`  Expected: \${JSON.stringify(expected_${index})}\`);
  console.log(\`  Got: \${JSON.stringify(result_${index})}\`);
  results.push({
    input: '${testCase.input}',
    output: result_${index},
    expected: expected_${index},
    passed: passed_${index},
    testCase: ${index + 1}
  });
} catch (e) {
  console.log(\`Test ${index + 1}: ERROR - \${e.message}\`);
  results.push({
    input: '${testCase.input}',
    error: e.message,
    testCase: ${index + 1}
  });
}
`).join('\n')}

console.log('\\n=== Test Summary ===');
console.log(\`Passed: \${results.filter(r => r.passed).length}/\${results.length}\`);
    `.trim();
    
    return testRunner;
  }

  formatExecutionResult(result: any, question: Question): ExecutionOutput {
    // Parse console output to extract test results
    const output = result.output || '';
    const stderr = result.stderr || '';
    const testCases = this.parseTestCases(question);
    
    // Try to extract test results from output
    const results: TestResult[] = [];
    const lines = output.split('\n');
    let currentTest: TestResult | null = null;
    const consoleOutput: string[] = [];
    let inTestSummary = false;
    
    lines.forEach((line: string) => {
      if (line.includes('Test Summary')) {
        inTestSummary = true;
      } else if (line.includes('Test ')) {
        const testMatch = line.match(/Test (\d+):/);
        if (testMatch) {
          const testNum = parseInt(testMatch[1]);
          const passed = line.includes('PASSED');
          const failed = line.includes('FAILED');
          const error = line.includes('ERROR');
          
          if (passed || failed || error) {
            if (currentTest) {
              results.push(currentTest);
            }
            currentTest = {
              testCase: testNum,
              input: '',
              passed: passed,
              error: error ? line.replace(/Test \d+: ERROR -/, '').trim() : undefined
            };
          }
        }
      } else if (currentTest && line.includes('Input:')) {
        currentTest.input = line.replace('Input:', '').trim();
      } else if (currentTest && line.includes('Expected:')) {
        try {
          currentTest.expected = JSON.parse(line.replace('Expected:', '').trim());
        } catch (e) {
          currentTest.expected = line.replace('Expected:', '').trim();
        }
      } else if (currentTest && line.includes('Got:')) {
        try {
          currentTest.output = JSON.parse(line.replace('Got:', '').trim());
        } catch (e) {
          currentTest.output = line.replace('Got:', '').trim();
        }
      } else if (!inTestSummary) {
        consoleOutput.push(line);
      }
    });
    
    if (currentTest) {
      results.push(currentTest);
    }
    
    // If we couldn't parse test results, use fallback
    if (results.length === 0) {
      return {
        success: !result.error && !stderr,
        output: output,
        stderr: stderr,
        error: result.error || (stderr ? 'Runtime error' : null),
        consoleOutput: output.split('\n').filter((l: string) => l.trim())
      };
    }
    
    return {
      success: true,
      results: results,
      consoleOutput: consoleOutput.filter(l => l.trim()),
      testCasesPassed: results.filter(r => r.passed === true).length,
      totalTestCases: results.length,
      output: output,
      stderr: stderr
    };
  }

  executeCode(code: string, question: Question): ExecutionOutput {
    try {
      // Capture console.log output
      const consoleOutput: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleOutput.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
        originalLog.apply(console, args);
      };

      // Try to extract function name from question
      const funcName = this.getFunctionName(question);
      
      // Parse test cases from examples
      const testCases = this.parseTestCases(question);
      
      const results: TestResult[] = [];
      
      // Wrap code in try-catch for execution
      try {
        // Create a new Function scope to execute the code
        const wrappedCode = `
          ${code}
          
          // Test cases
          ${testCases.map((testCase, index) => {
            return `
              try {
                const result_${index} = ${funcName}(${testCase.inputStr});
                const expected_${index} = ${testCase.expectedStr};
                const passed_${index} = JSON.stringify(result_${index}) === JSON.stringify(expected_${index});
                results.push({
                  input: ${JSON.stringify(testCase.input)},
                  output: result_${index},
                  expected: expected_${index},
                  passed: passed_${index},
                  testCase: ${index + 1}
                });
              } catch (e) {
                results.push({
                  input: ${JSON.stringify(testCase.input)},
                  error: e.message,
                  testCase: ${index + 1}
                });
              }
            `;
          }).join('\n')}
        `;

        // Execute the code
        const func = new Function('results', wrappedCode);
        func(results);

      } catch (error: any) {
        throw new Error(error.message);
      } finally {
        // Restore console.log
        console.log = originalLog;
      }

      return {
        success: true,
        results: results,
        consoleOutput: consoleOutput,
        testCasesPassed: results.filter(r => r.passed === true).length,
        totalTestCases: results.length
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        results: [],
        consoleOutput: []
      };
    }
  }

  getFunctionName(question: Question): string {
    // Try to find function name in user's code first
    const userCode = this.codeEditor ? this.codeEditor.getValue() : (document.getElementById('codeInput') as HTMLTextAreaElement | null)?.value || '';
    if (userCode) {
      // Match function declarations: function name(...) or const name = function(...)
      const funcMatch = userCode.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=|\()/);
      if (funcMatch) {
        return funcMatch[1];
      }
      // Match arrow functions: const name = (...) =>
      const arrowMatch = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*\(/);
      if (arrowMatch) {
        return arrowMatch[1];
      }
    }
    
    // Try to find function name in the solution
    if (question.solution) {
      const funcMatch = question.solution.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=|\()/);
      if (funcMatch) {
        return funcMatch[1];
      }
    }
    
    // Extract from title as fallback
    const title = question.title || '';
    // Convert "Two Sum" to "twoSum"
    const funcName = title
      .toLowerCase()
      .replace(/\s+([a-z])/g, (_, letter) => letter.toUpperCase())
      .replace(/^[a-z]/, letter => letter.toUpperCase());
    
    return funcName || 'solution';
  }

  parseTestCases(question: Question): TestCase[] {
    const testCases: TestCase[] = [];
    
    // Get examples from question
    const examples = (question as any).examples || [];
    
    examples.forEach((example: any, index: number) => {
      if (example.input && example.output) {
        try {
          // Parse input string (e.g., "nums = [2,7,11,15], target = 9")
          const inputStr = this.parseInputString(example.input);
          // Parse expected output
          const expectedStr = this.parseOutputString(example.output);
          
          testCases.push({
            input: example.input,
            inputStr: inputStr,
            expected: example.output,
            expectedStr: expectedStr,
            explanation: example.explanation || ''
          });
        } catch (error) {
          console.warn(`Failed to parse test case ${index}:`, error);
        }
      }
    });
    
    return testCases;
  }

  parseInputString(inputStr: string): string {
    // Parse input like "nums = [2,7,11,15], target = 9" into function arguments
    // This is a simplified parser - may need enhancement for complex cases
    const parts = inputStr.split(',').map(p => p.trim());
    const args: string[] = [];
    
    parts.forEach(part => {
      if (part.includes('=')) {
        const [, value] = part.split('=').map(s => s.trim());
        args.push(value);
      } else {
        args.push(part);
      }
    });
    
    return args.join(', ');
  }

  parseOutputString(outputStr: string): string {
    // Try to parse the output string
    try {
      // If it's already valid JSON, return as is
      JSON.parse(outputStr);
      return outputStr;
    } catch {
      // Otherwise, try to wrap it appropriately
      if (outputStr.trim().startsWith('[') || outputStr.trim().startsWith('{')) {
        return outputStr.trim();
      }
      // For primitive values, try to infer type
      if (outputStr.trim() === 'true' || outputStr.trim() === 'false') {
        return outputStr.trim();
      }
      if (!isNaN(Number(outputStr.trim()))) {
        return outputStr.trim();
      }
      return `"${outputStr}"`;
    }
  }

  displayCodeOutput(output: ExecutionOutput): void {
    const outputDisplay = document.getElementById('codeOutputDisplay') as HTMLElement | null;
    const outputElement = document.getElementById('codeOutput') as HTMLElement | null;
    
    if (!outputDisplay || !outputElement) {
      console.warn('Output display elements not found');
      return;
    }

    outputElement.innerHTML = '';

    if (output.error) {
      outputElement.innerHTML = `<div class="output-error">
        <strong>Error:</strong> ${output.error}
      </div>`;
      outputDisplay.style.display = 'block';
      return;
    }

    if (output.results && output.results.length > 0) {
      const resultsHTML = output.results.map((result, index) => {
        if (result.error) {
          return `
            <div class="test-case test-case-error">
              <div class="test-case-header">
                <span class="test-case-number">Test Case ${result.testCase || index + 1}</span>
                <span class="test-case-status status-error">Error</span>
              </div>
              <div class="test-case-content">
                <div class="test-input"><strong>Input:</strong> ${result.input}</div>
                <div class="test-error"><strong>Error:</strong> ${result.error}</div>
              </div>
            </div>
          `;
        }
        
        const passed = result.passed;
        return `
          <div class="test-case ${passed ? 'test-case-pass' : 'test-case-fail'}">
            <div class="test-case-header">
              <span class="test-case-number">Test Case ${result.testCase || index + 1}</span>
              <span class="test-case-status ${passed ? 'status-pass' : 'status-fail'}">
                ${passed ? '✓ Passed' : '✗ Failed'}
              </span>
            </div>
            <div class="test-case-content">
              <div class="test-input"><strong>Input:</strong> ${result.input}</div>
              <div class="test-output"><strong>Your Output:</strong> ${JSON.stringify(result.output)}</div>
              <div class="test-expected"><strong>Expected:</strong> ${JSON.stringify(result.expected)}</div>
            </div>
          </div>
        `;
      }).join('');

      const summary = `
        <div class="output-summary">
          <strong>Test Results:</strong> ${output.testCasesPassed || 0} / ${output.totalTestCases || 0} passed
        </div>
      `;

      outputElement.innerHTML = summary + resultsHTML;
    } else {
      outputElement.innerHTML = '<div class="output-info">No test cases to run.</div>';
    }

    if (output.consoleOutput && output.consoleOutput.length > 0) {
      const consoleOutput = `
        <div class="console-output">
          <strong>Console Output:</strong>
          <pre>${output.consoleOutput.join('\n')}</pre>
        </div>
      `;
      outputElement.innerHTML += consoleOutput;
    }

    outputDisplay.style.display = 'block';
  }

  async submitSolution(): Promise<void> {
    const code = this.codeEditor ? this.codeEditor.getValue() : (document.getElementById('codeInput') as HTMLTextAreaElement | null)?.value || '';
    if (!code.trim()) {
      this.showNotification('Please write a solution first.', 'warning');
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    // Use the time when the question was loaded to measure solve duration
    const questionStart = this.questionStartTime || this.sessionStartTime || new Date();
    
    try {
      this.showLoading('submitSolutionBtn');
      
      // Simulate solution validation
      const isCorrect = await this.validateSolution(code, question);
      const endTime = new Date();
      const timeSpent = Math.max(0, Math.floor((endTime.getTime() - questionStart.getTime()) / 1000));

      // Record result
      const result: SessionResult = {
        questionId: question.id,
        isCorrect: isCorrect === true, // Ensure boolean
        timeSpent: timeSpent,
        attempts: 1, // Simplified
        hintsUsed: 0, // Simplified
        solution: code
      };

      this.results.push(result);
      console.log('Result recorded:', result, 'Total results:', this.results.length);

      // Show result
      this.showResult(isCorrect, timeSpent);

      // Show next question button or end session button
      const nextBtn = document.getElementById('nextQuestionBtn') as HTMLElement | null;
      const endBtn = document.getElementById('endSessionBtn') as HTMLElement | null;
      
      if (this.currentQuestionIndex < this.questions.length - 1) {
        if (nextBtn) nextBtn.style.display = 'inline-block';
      } else {
        if (endBtn) endBtn.style.display = 'inline-block';
      }

    } catch (error: any) {
      this.showNotification('Submission failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('submitSolutionBtn');
    }
  }

  async validateSolution(code: string, question: Question): Promise<boolean> {
    // Run actual test cases
    try {
      const output = this.executeCode(code, question);
      
      if (output.error) {
        return false;
      }
      
      // Check if all test cases passed
      if (output.results && output.results.length > 0) {
        const allPassed = output.results.every(r => r.passed === true);
        return allPassed;
      }
      
      return false;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  showResult(isCorrect: boolean, timeSpent: number): void {
    const resultDisplay = document.getElementById('resultDisplay') as HTMLElement | null;
    const resultIcon = document.getElementById('resultIcon') as HTMLElement | null;
    const resultTitle = document.getElementById('resultTitle') as HTMLElement | null;
    const resultMessage = document.getElementById('resultMessage') as HTMLElement | null;

    if (!resultDisplay || !resultIcon || !resultTitle || !resultMessage) return;

    if (isCorrect) {
      resultIcon.className = 'fa-solid fa-check-circle';
      resultTitle.textContent = 'Correct!';
      resultMessage.textContent = `Great job! You solved it in ${timeSpent} seconds.`;
      resultDisplay.className = 'result-display';
    } else {
      resultIcon.className = 'fa-solid fa-times-circle';
      resultTitle.textContent = 'Incorrect';
      resultMessage.textContent = 'Try again or get a hint to improve your solution.';
      resultDisplay.className = 'result-display';
    }

    resultDisplay.style.display = 'block';
  }

  hideResult(): void {
    const resultDisplay = document.getElementById('resultDisplay') as HTMLElement | null;
    if (resultDisplay) {
      resultDisplay.style.display = 'none';
    }
    // Also hide code output when hiding result
    const codeOutputDisplay = document.getElementById('codeOutputDisplay') as HTMLElement | null;
    if (codeOutputDisplay) {
      codeOutputDisplay.style.display = 'none';
    }
  }

  showHint(): void {
    const question = this.questions[this.currentQuestionIndex];
    if (!question) {
      this.showNotification('No question loaded.', 'warning');
      return;
    }

    // Get hints - handle both hints (array) and hint (string) formats
    let hints: string[] = [];
    if (question.hints && Array.isArray(question.hints)) {
      hints = question.hints;
    } else if ((question as any).hint) {
      hints = [(question as any).hint];
    } else {
      hints = ['Think about the problem constraints and try a different approach.'];
    }

    // Display hints properly
    const hintDisplay = document.getElementById('hintDisplay') as HTMLElement | null;
    const hintText = document.getElementById('hintText') as HTMLElement | null;
    
    if (!hintDisplay || !hintText) return;
    
    // Clear previous content
    hintText.innerHTML = '';
    
    // Display all hints
    if (hints.length === 1) {
      hintText.textContent = hints[0];
    } else {
      // Display hints as a numbered list
      const hintList = document.createElement('ul');
      hintList.style.cssText = 'list-style: none; padding: 0; margin: 0;';
      hints.forEach((hint, index) => {
        const listItem = document.createElement('li');
        listItem.style.cssText = 'margin-bottom: 12px; padding-left: 24px; position: relative;';
        listItem.innerHTML = `<span style="position: absolute; left: 0; color: #818cf8; font-weight: 600;">${index + 1}.</span> ${hint}`;
        hintList.appendChild(listItem);
      });
      hintText.appendChild(hintList);
    }
    
    hintDisplay.style.display = 'block';
    
    // Animate the hint display
    hintDisplay.style.opacity = '0';
    hintDisplay.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      hintDisplay.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      hintDisplay.style.opacity = '1';
      hintDisplay.style.transform = 'translateY(0)';
    }, 10);
  }

  showSolution(): void {
    const question = this.questions[this.currentQuestionIndex];
    const solutionText = document.getElementById('solutionText') as HTMLElement | null;
    const solutionDisplay = document.getElementById('solutionDisplay') as HTMLElement | null;
    
    if (solutionText && question.solution) {
      solutionText.textContent = question.solution;
    }
    if (solutionDisplay) {
      solutionDisplay.style.display = 'block';
    }
  }

  hideHintsAndSolutions(): void {
    const hintDisplay = document.getElementById('hintDisplay') as HTMLElement | null;
    const solutionDisplay = document.getElementById('solutionDisplay') as HTMLElement | null;
    
    if (hintDisplay) hintDisplay.style.display = 'none';
    if (solutionDisplay) solutionDisplay.style.display = 'none';
  }

  nextQuestion(): void {
    this.currentQuestionIndex++;
    this.hideHintsAndSolutions();
    this.hideResult();
    const nextBtn = document.getElementById('nextQuestionBtn') as HTMLElement | null;
    if (nextBtn) nextBtn.style.display = 'none';
    this.loadCurrentQuestion();
  }

  async endSession(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    try {
      if (!this.sessionStartTime) {
        this.sessionStartTime = new Date();
      }
      
      const endTime = new Date().toISOString();
      const totalTime = Math.floor((new Date().getTime() - this.sessionStartTime.getTime()) / 1000);
      const correctAnswers = this.results.filter(r => r.isCorrect === true).length;
      const accuracy = this.results.length > 0 ? correctAnswers / this.results.length : 0;
      const score = Math.round(accuracy * 100);

      console.log('Ending session:', {
        sessionId: this.currentSession?.id,
        resultsCount: this.results.length,
        correctAnswers,
        totalTime,
        accuracy
      });

      // Ensure results are properly formatted
      const formattedResults = this.results.map(r => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect === true,
        timeSpent: r.timeSpent || 0,
        attempts: r.attempts || 1,
        hintsUsed: r.hintsUsed || 0,
        solution: r.solution || ''
      }));

      // Try Express backend first, then Supabase, then show warning
      if (window.backendAPI && this.currentSession?.id) {
        try {
          console.log('Saving session to Express backend:', this.currentSession.id);
          
          await window.backendAPI.updateSession(this.currentSession.id, {
            endTime: endTime,
            status: 'completed',
            results: formattedResults,
            totalTime: totalTime,
            score: score,
            accuracy: accuracy
          } as any);
          
          console.log('Session saved to backend successfully');
          
          // Get user ID from Supabase session or localStorage
          let userId: string | null = null;
          if (window.supabaseClient) {
            try {
              const client = window.supabaseClient as FullSupabaseClient;
              const { data: { user } } = await client.auth.getUser();
              userId = user?.id || null;
            } catch (error) {
              console.warn('Could not get user from Supabase session:', error);
            }
          }
          
          if (!userId) {
            try {
              const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
              userId = userData?.id || null;
            } catch {
              // Ignore parse errors
            }
          }
          
          if (userId) {
            console.log('Updating user progress for user:', userId);
            
            const sessionData = {
              ...this.currentSession,
              endTime: endTime,
              totalTime: totalTime,
              results: formattedResults,
              status: 'completed' as const,
              score: score,
              accuracy: accuracy
            };
            
            await window.backendAPI.updateProgress(userId, {
              topic: this.currentSession.topic,
              difficulty: this.currentSession.difficulty,
              sessionData: sessionData
            } as any);
            console.log('User progress updated successfully');
          }
          
          this.showNotification('Session saved! Redirecting to dashboard to see your updated progress.', 'success');
          
          // Mark that we're returning from practice so dashboard knows to refresh
          sessionStorage.setItem('returningFromPractice', 'true');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 2000);
        } catch (backendError) {
          console.warn('Backend API save failed, trying Supabase:', backendError);
          // Fallback to Supabase
          const supabaseDB = window.supabaseDB as any;
          if (supabaseDB) {
            try {
              await supabaseDB.updateSession(this.currentSession!.id, {
                endTime: endTime,
                status: 'completed',
                results: formattedResults,
                totalTime: totalTime,
                score: score,
                accuracy: accuracy
              });
              
              // Get user ID from Supabase session or localStorage
              let userId: string | null = null;
              if (window.supabaseClient) {
                try {
                  const client = window.supabaseClient as FullSupabaseClient;
                  const { data: { user } } = await client.auth.getUser();
                  userId = user?.id || null;
                } catch (error) {
                  console.warn('Could not get user from Supabase session:', error);
                }
              }
              
              if (!userId) {
                try {
                  const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
                  userId = userData?.id || null;
                } catch {
                  // Ignore parse errors
                }
              }
              
              if (userId) {
                const sessionData = {
                  ...this.currentSession!,
                  endTime: endTime,
                  totalTime: totalTime,
                  results: formattedResults,
                  status: 'completed' as const,
                  score: score,
                  accuracy: accuracy
                };
                await supabaseDB.updateUserProgress(userId, sessionData);
                console.log('User progress updated in Supabase');
              }
              this.showNotification('Session saved! Redirecting to dashboard to see your updated progress.', 'success');
              
              // Mark that we're returning from practice so dashboard knows to refresh
              sessionStorage.setItem('returningFromPractice', 'true');
              
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                window.location.href = 'dashboard.html';
              }, 2000);
            } catch (supabaseError: any) {
              console.error('Supabase save failed:', supabaseError);
              this.showNotification('Error saving to database: ' + supabaseError.message, 'error');
            }
          } else {
            this.showNotification('Session completed but not saved (backend not configured)', 'warning');
          }
        }
      } else if (window.supabaseDB && this.currentSession?.id) {
        const supabaseDB = (window.supabaseDB as any);
        try {
          await supabaseDB.updateSession(this.currentSession.id, {
            endTime: endTime,
            status: 'completed',
            results: formattedResults,
            totalTime: totalTime,
            score: score,
            accuracy: accuracy
          });
          
          // Get user ID from Supabase session or localStorage
          let userId: string | null = null;
          if (window.supabaseClient) {
            try {
              const client = window.supabaseClient as FullSupabaseClient;
              const { data: { user } } = await client.auth.getUser();
              userId = user?.id || null;
            } catch (error) {
              console.warn('Could not get user from Supabase session:', error);
            }
          }
          
          if (!userId) {
            try {
              const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
              userId = userData?.id || null;
            } catch {
              // Ignore parse errors
            }
          }
          
          if (userId) {
            const sessionData = {
              ...this.currentSession,
              endTime: endTime,
              totalTime: totalTime,
              results: formattedResults,
              status: 'completed' as const,
              score: score,
              accuracy: accuracy
            };
            await supabaseDB.updateUserProgress(userId, sessionData);
            console.log('User progress updated in Supabase');
          }
          
          this.showNotification('Session saved! Redirecting to dashboard to see your updated progress.', 'success');
          
          // Mark that we're returning from practice so dashboard knows to refresh
          sessionStorage.setItem('returningFromPractice', 'true');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 2000);
        } catch (supabaseError: any) {
          console.error('Supabase save failed:', supabaseError);
          this.showNotification('Error saving: ' + supabaseError.message, 'error');
        }
      } else {
        console.warn('No backend available, session not saved');
        this.showNotification('Session completed but not saved (backend not configured)', 'warning');
      }
      
      // Show results
      this.showSessionResults();
      
    } catch (error: any) {
      console.error('Error ending session:', error);
      this.showNotification('Error ending session: ' + error.message, 'error');
    }
  }

  showSessionResults(): void {
    const practiceSession = document.getElementById('practiceSession') as HTMLElement | null;
    const sessionResults = document.getElementById('sessionResults') as HTMLElement | null;
    
    if (!practiceSession || !sessionResults) return;
    
    practiceSession.style.display = 'none';
    sessionResults.style.display = 'block';

    // Calculate results
    const totalQuestions = this.questions.length;
    const correctAnswers = this.results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const totalTime = this.sessionStartTime ? Math.floor((new Date().getTime() - this.sessionStartTime.getTime()) / 1000) : 0;
    const timeDisplay = `${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}`;

    // Update result display
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const correctAnswersEl = document.getElementById('correctAnswers');
    const sessionAccuracyEl = document.getElementById('sessionAccuracy');
    const totalTimeEl = document.getElementById('totalTime');
    
    if (totalQuestionsEl) totalQuestionsEl.textContent = String(totalQuestions);
    if (correctAnswersEl) correctAnswersEl.textContent = String(correctAnswers);
    if (sessionAccuracyEl) sessionAccuracyEl.textContent = accuracy + '%';
    if (totalTimeEl) totalTimeEl.textContent = timeDisplay;

    // Show question breakdown
    this.showQuestionBreakdown();
  }

  showQuestionBreakdown(): void {
    const breakdownContainer = document.getElementById('questionBreakdown');
    if (!breakdownContainer) return;
    
    breakdownContainer.innerHTML = '';

    this.results.forEach((result, index) => {
      const question = this.questions[index];
      if (!question) return;
      
      const breakdownItem = document.createElement('div');
      breakdownItem.className = 'breakdown-item';
      
      breakdownItem.innerHTML = `
        <div class="breakdown-icon">
          <i class="fa-solid fa-${result.isCorrect ? 'check-circle' : 'times-circle'}"></i>
        </div>
        <div class="breakdown-content">
          <h4>${question.title}</h4>
          <p>Time: ${result.timeSpent}s | Attempts: ${result.attempts}</p>
        </div>
        <div class="breakdown-status">
          ${result.isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      `;

      breakdownContainer.appendChild(breakdownItem);
    });
  }

  async showConfirmModal(title: string, message: string, type: string = 'warning'): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal') as HTMLElement | null;
      const titleEl = document.getElementById('confirmModalTitle') as HTMLElement | null;
      const messageEl = document.getElementById('confirmModalMessage') as HTMLElement | null;
      const cancelBtn = document.getElementById('confirmModalCancel') as HTMLElement | null;
      const confirmBtn = document.getElementById('confirmModalConfirm') as HTMLElement | null;
      
      if (!modal || !titleEl || !messageEl || !cancelBtn || !confirmBtn) {
        resolve(false);
        return;
      }
      
      // Set content
      titleEl.textContent = title;
      messageEl.textContent = message;
      
      // Set modal type
      modal.classList.remove('danger');
      if (type === 'danger') {
        modal.classList.add('danger');
      }
      
      // Show modal
      modal.style.display = 'flex';
      
      // Remove existing listeners
      const newCancelBtn = cancelBtn.cloneNode(true) as HTMLElement;
      const newConfirmBtn = confirmBtn.cloneNode(true) as HTMLElement;
      cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
      confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);
      
      // Add new listeners
      newCancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resolve(false);
      });
      
      newConfirmBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resolve(true);
      });
      
      // Close on overlay click
      const overlay = modal.querySelector('.confirm-modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => {
          modal.style.display = 'none';
          resolve(false);
        });
      }
      
      // Close on Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          modal.style.display = 'none';
          document.removeEventListener('keydown', handleEscape);
          resolve(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  async stopSession(): Promise<void> {
    const confirmed = await this.showConfirmModal(
      'Stop Session',
      'Are you sure you want to stop this session? Your progress will be lost.',
      'danger'
    );
    
    if (confirmed) {
      this.endSession();
    }
  }

  async resetSession(): Promise<void> {
    // Ask user if they want to go to dashboard or start new session
    const goToDashboard = await this.showConfirmModal(
      'View Progress?',
      'Would you like to view your updated progress on the dashboard?',
      'warning'
    );
    
    if (goToDashboard) {
      window.location.href = 'dashboard.html';
    } else {
      const sessionResults = document.getElementById('sessionResults') as HTMLElement | null;
      const sessionSetup = document.getElementById('sessionSetup') as HTMLElement | null;
      
      if (sessionResults) sessionResults.style.display = 'none';
      if (sessionSetup) sessionSetup.style.display = 'block';
      
      // Reset form
      const sessionForm = document.getElementById('sessionForm') as HTMLFormElement | null;
      if (sessionForm) {
        sessionForm.reset();
      }
      
      // Reset session data
      this.currentSession = null;
      this.currentQuestionIndex = 0;
      this.questions = [];
      this.results = [];
      this.timeRemaining = 0;
    }
  }

  showLoading(elementId: string): void {
    const element = document.getElementById(elementId) as HTMLElement | null;
    if (element) {
      element.style.opacity = '0.6';
      element.style.pointerEvents = 'none';
    }
  }

  hideLoading(elementId: string): void {
    const element = document.getElementById(elementId) as HTMLElement | null;
    if (element) {
      element.style.opacity = '1';
      element.style.pointerEvents = 'auto';
    }
  }

  showNotification(message: string, type: NotificationType = 'info'): void {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll<HTMLElement>('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fa-solid fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }
}

// Initialize practice session when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PracticeSession();
});

