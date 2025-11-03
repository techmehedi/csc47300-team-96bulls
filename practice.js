// Practice Session System for AI Interviewer
class PracticeSession {
  constructor() {
    this.backend = new BackendSimulator();
    this.currentSession = null;
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.timer = null;
    this.timeRemaining = 0;
    this.sessionStartTime = null;
    this.results = [];
    this.codeEditor = null;
    
    // Initialize code editor after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeCodeEditor());
    } else {
      setTimeout(() => this.initializeCodeEditor(), 100);
    }
    
    this.initializeEventListeners();
    this.checkAuthentication();
  }

  initializeCodeEditor() {
    // Initialize CodeMirror editor with syntax highlighting
    const textarea = document.getElementById('codeInput');
    if (textarea && window.CodeMirror) {
      this.codeEditor = CodeMirror.fromTextArea(textarea, {
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
          'Tab': function(cm) {
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
        this.codeEditor.save();
      });
    }
  }

  async checkAuthentication() {
    const userData = localStorage.getItem('ai_interviewer_user');
    if (!userData) {
      this.showNotification('Please log in to start a practice session.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }
  }

  initializeEventListeners() {
    // Session setup form
    const sessionForm = document.getElementById('sessionForm');
    if (sessionForm) {
      sessionForm.addEventListener('submit', (e) => this.startSession(e));
    }

    // Practice session controls
    this.initializeSessionControls();
    this.initializeQuestionControls();
    this.initializeTimerControls();
  }

  initializeSessionControls() {
    // Pause/Resume button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }

    // Stop button
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopSession());
    }

    // Next question button
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    if (nextQuestionBtn) {
      nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
    }

    // End session button
    const endSessionBtn = document.getElementById('endSessionBtn');
    if (endSessionBtn) {
      endSessionBtn.addEventListener('click', () => this.endSession());
    }

    // New session button
    const newSessionBtn = document.getElementById('newSessionBtn');
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => this.resetSession());
    }
  }

  initializeQuestionControls() {
    // Run code button
    const runCodeBtn = document.getElementById('runCodeBtn');
    if (runCodeBtn) {
      runCodeBtn.addEventListener('click', () => this.runCode());
    }

    // Submit solution button
    const submitSolutionBtn = document.getElementById('submitSolutionBtn');
    if (submitSolutionBtn) {
      submitSolutionBtn.addEventListener('click', () => this.submitSolution());
    }

    // Get hint button
    const getHintBtn = document.getElementById('getHintBtn');
    if (getHintBtn) {
      getHintBtn.addEventListener('click', () => this.showHint());
    }

    // Show solution button
    const showSolutionBtn = document.getElementById('showSolutionBtn');
    if (showSolutionBtn) {
      showSolutionBtn.addEventListener('click', () => this.showSolution());
    }
  }

  initializeTimerControls() {
    // Timer will be initialized when session starts
  }

  async startSession(e) {
    e.preventDefault();
    
    const formData = {
      topic: document.getElementById('sessionTopic').value,
      difficulty: document.getElementById('sessionDifficulty').value,
      timeLimit: parseInt(document.getElementById('sessionTime').value),
      questionCount: parseInt(document.getElementById('sessionQuestions').value)
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
      let userId = null;
      if (window.supabaseClient) {
        try {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          userId = user?.id;
        } catch (error) {
          console.warn('Could not get user from Supabase session:', error);
        }
      }
      
      // Fallback to localStorage if Supabase user not available
      if (!userId) {
        const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
        userId = userData?.id;
      }
      
      if (!userId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log('Creating session for user:', userId);
      
      // Try Express backend first, then Supabase, then simulator
      if (window.backendAPI) {
        try {
          this.currentSession = await window.backendAPI.createSession({
            userId: userId,
            topic: formData.topic,
            difficulty: formData.difficulty,
            timeLimit: formData.timeLimit,
            questions: this.questions.map(q => q.id)
          });
          console.log('Session created in Express backend:', this.currentSession.id);
        } catch (backendError) {
          console.warn('Backend API createSession failed, trying Supabase:', backendError);
          // Fallback to Supabase
          if (window.supabaseDB) {
            try {
              this.currentSession = await window.supabaseDB.createSession({
                userId: userId,
                topic: formData.topic,
                difficulty: formData.difficulty,
                timeLimit: formData.timeLimit,
                questions: this.questions.map(q => q.id)
              });
              console.log('Session created in Supabase:', this.currentSession.id);
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
        try {
          this.currentSession = await window.supabaseDB.createSession({
            userId: userId,
            topic: formData.topic,
            difficulty: formData.difficulty,
            timeLimit: formData.timeLimit,
            questions: this.questions.map(q => q.id)
          });
        } catch (supabaseError) {
          console.warn('Supabase createSession failed, using simulator:', supabaseError);
          this.currentSession = await this.backend.createSession({
            userId: userData.id,
            topic: formData.topic,
            difficulty: formData.difficulty,
            timeLimit: formData.timeLimit,
            questions: this.questions.map(q => q.id)
          });
        }
      } else {
        this.currentSession = await this.backend.createSession({
          userId: userData.id,
          topic: formData.topic,
          difficulty: formData.difficulty,
          timeLimit: formData.timeLimit,
          questions: this.questions.map(q => q.id)
        });
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

    } catch (error) {
      this.showNotification(error.message, 'error');
    } finally {
      this.hideLoading('sessionForm');
    }
  }

  showPracticeSession() {
    document.getElementById('sessionSetup').style.display = 'none';
    document.getElementById('practiceSession').style.display = 'block';
    
    // Update session info
    const topic = document.getElementById('sessionTopic').selectedOptions[0].text;
    const difficulty = document.getElementById('sessionDifficulty').selectedOptions[0].text;
    
    document.getElementById('sessionTopicDisplay').textContent = topic;
    document.getElementById('sessionDifficultyDisplay').textContent = difficulty;
    this.updateProgress();
  }

  loadCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endSession();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    
    // Update question display
    document.getElementById('currentQuestionTitle').textContent = question.title;
    document.getElementById('currentQuestionDescription').textContent = question.description;
    document.getElementById('currentQuestionExample').textContent = question.example;
    
    // Update constraints
    const constraintsList = document.getElementById('currentQuestionConstraints');
    constraintsList.innerHTML = question.constraints.map(constraint => 
      `<li>${constraint}</li>`
    ).join('');

    // Update topic and difficulty badges
    const topicBadge = document.getElementById('currentQuestionTopic');
    const difficultyBadge = document.getElementById('currentQuestionDifficulty');
    
    topicBadge.textContent = document.getElementById('sessionTopic').selectedOptions[0].text;
    difficultyBadge.textContent = document.getElementById('sessionDifficulty').selectedOptions[0].text;
    
    // Style badges
    this.styleBadge(topicBadge, '#1a73e8', '#e3ecfd');
    this.styleBadge(difficultyBadge, this.getDifficultyColor(), this.getDifficultyBgColor());

    // Clear code editor
    const defaultCode = `function ${question.title.toLowerCase().replace(/\s+/g, '')}(${this.getFunctionParameters(question)}) {
    // Your code here
    
}`;
    
    if (this.codeEditor) {
      this.codeEditor.setValue(defaultCode);
    } else {
      document.getElementById('codeInput').value = defaultCode;
    }

    // Hide hints and solutions
    this.hideHintsAndSolutions();
    this.hideResult();

    // Update progress
    this.updateProgress();
  }

  getFunctionParameters(question) {
    // Extract parameters from examples
    if (!question) return 'input';
    
    // Check if examples array exists and has items
    const examples = question.examples || question.example || [];
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

  styleBadge(element, color, backgroundColor) {
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

  getDifficultyColor() {
    const difficulty = document.getElementById('sessionDifficulty').value;
    const colors = {
      easy: '#16a34a',
      medium: '#ea580c', 
      hard: '#dc2626'
    };
    return colors[difficulty] || '#1a73e8';
  }

  getDifficultyBgColor() {
    const difficulty = document.getElementById('sessionDifficulty').value;
    const colors = {
      easy: '#dcfce7',
      medium: '#fed7aa',
      hard: '#fecaca'
    };
    return colors[difficulty] || '#e3ecfd';
  }

  updateProgress() {
    const progress = `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
    document.getElementById('sessionProgress').textContent = progress;
  }

  startTimer() {
    if (this.timeRemaining <= 0) return;

    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
  }

  togglePause() {
    const pauseBtn = document.getElementById('pauseBtn');
    const icon = pauseBtn.querySelector('i');
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
      pauseBtn.title = 'Resume';
    } else {
      this.startTimer();
      icon.classList.remove('fa-play');
      icon.classList.add('fa-pause');
      pauseBtn.title = 'Pause';
    }
  }

  timeUp() {
    this.showNotification('Time\'s up! Session ended.', 'warning');
    this.endSession();
  }

  async runCode() {
    // Get code from editor or textarea
    const code = this.codeEditor ? this.codeEditor.getValue() : document.getElementById('codeInput').value;
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

    } catch (error) {
      console.error('Code execution error:', error);
      this.displayCodeOutput({
        error: error.message,
        output: null
      });
      this.showNotification('Code execution failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('runCodeBtn');
    }
  }

  prepareCodeForExecution(code, question) {
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

  formatExecutionResult(result, question) {
    // Parse console output to extract test results
    const output = result.output || '';
    const stderr = result.stderr || '';
    const testCases = this.parseTestCases(question);
    
    // Try to extract test results from output
    const results = [];
    const lines = output.split('\n');
    let currentTest = null;
    let consoleOutput = [];
    let inTestSummary = false;
    
    lines.forEach(line => {
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
              passed: passed,
              error: error
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
      } else if (currentTest && line.includes('ERROR -')) {
        currentTest.error = line.replace(/Test \d+: ERROR -/, '').trim();
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
        consoleOutput: output.split('\n').filter(l => l.trim())
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

  executeCode(code, question) {
    try {
      // Capture console.log output
      let consoleOutput = [];
      const originalLog = console.log;
      console.log = (...args) => {
        consoleOutput.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
        originalLog.apply(console, args);
      };

      // Try to extract function name from question
      const funcName = this.getFunctionName(question);
      
      // Parse test cases from examples
      const testCases = this.parseTestCases(question);
      
      const results = [];
      
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

      } catch (error) {
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

    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: [],
        consoleOutput: []
      };
    }
  }

  getFunctionName(question) {
    // Try to find function name in user's code first
    const userCode = this.codeEditor ? this.codeEditor.getValue() : (document.getElementById('codeInput')?.value || '');
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

  parseTestCases(question) {
    const testCases = [];
    
    // Get examples from question
    const examples = question.examples || [];
    
    examples.forEach((example, index) => {
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

  parseInputString(inputStr) {
    // Parse input like "nums = [2,7,11,15], target = 9" into function arguments
    // This is a simplified parser - may need enhancement for complex cases
    const parts = inputStr.split(',').map(p => p.trim());
    const args = [];
    
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

  parseOutputString(outputStr) {
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
      if (!isNaN(outputStr.trim())) {
        return outputStr.trim();
      }
      return `"${outputStr}"`;
    }
  }

  displayCodeOutput(output) {
    const outputDisplay = document.getElementById('codeOutputDisplay');
    const outputElement = document.getElementById('codeOutput');
    
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

  async submitSolution() {
    const code = this.codeEditor ? this.codeEditor.getValue() : document.getElementById('codeInput').value;
    if (!code.trim()) {
      this.showNotification('Please write a solution first.', 'warning');
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    const startTime = new Date();
    
    try {
      this.showLoading('submitSolutionBtn');
      
      // Simulate solution validation
      const isCorrect = await this.validateSolution(code, question);
      const endTime = new Date();
      const timeSpent = Math.floor((endTime - startTime) / 1000);

      // Record result
      const result = {
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
      if (this.currentQuestionIndex < this.questions.length - 1) {
        document.getElementById('nextQuestionBtn').style.display = 'inline-block';
      } else {
        document.getElementById('endSessionBtn').style.display = 'inline-block';
      }

    } catch (error) {
      this.showNotification('Submission failed: ' + error.message, 'error');
    } finally {
      this.hideLoading('submitSolutionBtn');
    }
  }

  async validateSolution(code, question) {
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

  showResult(isCorrect, timeSpent) {
    const resultDisplay = document.getElementById('resultDisplay');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');

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

  hideResult() {
    const resultDisplay = document.getElementById('resultDisplay');
    if (resultDisplay) {
      resultDisplay.style.display = 'none';
    }
    // Also hide code output when hiding result
    const codeOutputDisplay = document.getElementById('codeOutputDisplay');
    if (codeOutputDisplay) {
      codeOutputDisplay.style.display = 'none';
    }
  }

  showHint() {
    const question = this.questions[this.currentQuestionIndex];
    if (!question) {
      this.showNotification('No question loaded.', 'warning');
      return;
    }

    // Get hints - handle both hints (array) and hint (string) formats
    let hints = [];
    if (question.hints && Array.isArray(question.hints)) {
      hints = question.hints;
    } else if (question.hint) {
      hints = [question.hint];
    } else {
      hints = ['Think about the problem constraints and try a different approach.'];
    }

    // Display hints properly
    const hintDisplay = document.getElementById('hintDisplay');
    const hintText = document.getElementById('hintText');
    
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

  showSolution() {
    const question = this.questions[this.currentQuestionIndex];
    document.getElementById('solutionText').textContent = question.solution;
    document.getElementById('solutionDisplay').style.display = 'block';
  }

  hideHintsAndSolutions() {
    document.getElementById('hintDisplay').style.display = 'none';
    document.getElementById('solutionDisplay').style.display = 'none';
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    this.hideHintsAndSolutions();
    this.hideResult();
    document.getElementById('nextQuestionBtn').style.display = 'none';
    this.loadCurrentQuestion();
  }

  async endSession() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    try {
      const endTime = new Date().toISOString();
      const totalTime = Math.floor((new Date() - this.sessionStartTime) / 1000);
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
        questionId: r.questionId || r.question_id,
        isCorrect: r.isCorrect === true,
        timeSpent: r.timeSpent || r.time_spent || 0,
        attempts: r.attempts || 1,
        hintsUsed: r.hintsUsed || r.hints_used || 0,
        solution: r.solution || ''
      }));

      // Try Express backend first, then Supabase, then show warning
      if (window.backendAPI && this.currentSession?.id) {
        try {
          console.log('Saving session to Express backend:', this.currentSession.id);
          
          await window.backendAPI.updateSession(this.currentSession.id, {
            userId: this.currentSession.userId,
            endTime: endTime,
            status: 'completed',
            results: formattedResults,
            totalTime: totalTime,
            score: score,
            accuracy: accuracy
          });
          
          console.log('Session saved to backend successfully');
          
          // Get user ID from Supabase session or localStorage
          let userId = null;
          if (window.supabaseClient) {
            try {
              const { data: { user } } = await window.supabaseClient.auth.getUser();
              userId = user?.id;
            } catch (error) {
              console.warn('Could not get user from Supabase session:', error);
            }
          }
          
          if (!userId) {
            const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
            userId = userData?.id;
          }
          
          if (userId) {
            console.log('Updating user progress for user:', userId);
            
            const sessionData = {
              ...this.currentSession,
              endTime: endTime,
              totalTime: totalTime,
              results: formattedResults,
              status: 'completed',
              score: score,
              accuracy: accuracy
            };
            
            await window.backendAPI.updateProgress(userId, {
              topic: this.currentSession.topic,
              difficulty: this.currentSession.difficulty,
              sessionData: sessionData
            });
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
          if (window.supabaseDB) {
            try {
              await window.supabaseDB.updateSession(this.currentSession.id, {
                endTime: endTime,
                status: 'completed',
                results: formattedResults,
                totalTime: totalTime,
                score: score,
                accuracy: accuracy
              });
              
              // Get user ID from Supabase session or localStorage
              let userId = null;
              if (window.supabaseClient) {
                try {
                  const { data: { user } } = await window.supabaseClient.auth.getUser();
                  userId = user?.id;
                } catch (error) {
                  console.warn('Could not get user from Supabase session:', error);
                }
              }
              
              if (!userId) {
                const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
                userId = userData?.id;
              }
              
              if (userId) {
                const sessionData = {
                  ...this.currentSession,
                  endTime: endTime,
                  totalTime: totalTime,
                  results: formattedResults,
                  status: 'completed',
                  score: score,
                  accuracy: accuracy
                };
                await window.supabaseDB.updateUserProgress(userId, sessionData);
                console.log('User progress updated in Supabase');
              }
              this.showNotification('Session saved! Redirecting to dashboard to see your updated progress.', 'success');
              
              // Mark that we're returning from practice so dashboard knows to refresh
              sessionStorage.setItem('returningFromPractice', 'true');
              
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                window.location.href = 'dashboard.html';
              }, 2000);
            } catch (supabaseError) {
              console.error('Supabase save failed:', supabaseError);
              this.showNotification('Error saving to database: ' + supabaseError.message, 'error');
            }
          } else {
            this.showNotification('Session completed but not saved (backend not configured)', 'warning');
          }
        }
      } else if (window.supabaseDB && this.currentSession?.id) {
        try {
          await window.supabaseDB.updateSession(this.currentSession.id, {
            endTime: endTime,
            status: 'completed',
            results: formattedResults,
            totalTime: totalTime,
            score: score,
            accuracy: accuracy
          });
          
          // Get user ID from Supabase session or localStorage
          let userId = null;
          if (window.supabaseClient) {
            try {
              const { data: { user } } = await window.supabaseClient.auth.getUser();
              userId = user?.id;
            } catch (error) {
              console.warn('Could not get user from Supabase session:', error);
            }
          }
          
          if (!userId) {
            const userData = JSON.parse(localStorage.getItem('ai_interviewer_user') || '{}');
            userId = userData?.id;
          }
          
          if (userId) {
            const sessionData = {
              ...this.currentSession,
              endTime: endTime,
              totalTime: totalTime,
              results: formattedResults,
              status: 'completed',
              score: score,
              accuracy: accuracy
            };
            await window.supabaseDB.updateUserProgress(userId, sessionData);
            console.log('User progress updated in Supabase');
          }
          
          this.showNotification('Session saved! Redirecting to dashboard to see your updated progress.', 'success');
          
          // Mark that we're returning from practice so dashboard knows to refresh
          sessionStorage.setItem('returningFromPractice', 'true');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 2000);
        } catch (supabaseError) {
          console.error('Supabase save failed:', supabaseError);
          this.showNotification('Error saving: ' + supabaseError.message, 'error');
        }
      } else {
        console.warn('No backend available, session not saved');
        this.showNotification('Session completed but not saved (backend not configured)', 'warning');
      }
      
      // Show results
      this.showSessionResults();
      
    } catch (error) {
      console.error('Error ending session:', error);
      this.showNotification('Error ending session: ' + error.message, 'error');
    }
  }

  showSessionResults() {
    document.getElementById('practiceSession').style.display = 'none';
    document.getElementById('sessionResults').style.display = 'block';

    // Calculate results
    const totalQuestions = this.questions.length;
    const correctAnswers = this.results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const totalTime = Math.floor((new Date() - this.sessionStartTime) / 1000);
    const timeDisplay = `${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}`;

    // Update result display
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('correctAnswers').textContent = correctAnswers;
    document.getElementById('sessionAccuracy').textContent = accuracy + '%';
    document.getElementById('totalTime').textContent = timeDisplay;

    // Show question breakdown
    this.showQuestionBreakdown();
  }

  showQuestionBreakdown() {
    const breakdownContainer = document.getElementById('questionBreakdown');
    breakdownContainer.innerHTML = '';

    this.results.forEach((result, index) => {
      const question = this.questions[index];
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

  stopSession() {
    if (confirm('Are you sure you want to stop this session? Your progress will be lost.')) {
      this.endSession();
    }
  }

  resetSession() {
    // Ask user if they want to go to dashboard or start new session
    if (confirm('Would you like to view your updated progress on the dashboard?')) {
      window.location.href = 'dashboard.html';
    } else {
      document.getElementById('sessionResults').style.display = 'none';
      document.getElementById('sessionSetup').style.display = 'block';
      
      // Reset form
      document.getElementById('sessionForm').reset();
      
      // Reset session data
      this.currentSession = null;
      this.currentQuestionIndex = 0;
      this.questions = [];
      this.results = [];
      this.timeRemaining = 0;
    }
  }

  showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.opacity = '0.6';
      element.style.pointerEvents = 'none';
    }
  }

  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.opacity = '1';
      element.style.pointerEvents = 'auto';
    }
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
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

  getNotificationIcon(type) {
    const icons = {
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