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
    
    this.initializeEventListeners();
    this.checkAuthentication();
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
      
      // Get questions from backend
      this.questions = await this.backend.getQuestions(formData.topic, formData.difficulty, formData.questionCount);
      
      if (this.questions.length === 0) {
        throw new Error('No questions available for this topic and difficulty combination.');
      }

      // Create session
      const userData = JSON.parse(localStorage.getItem('ai_interviewer_user'));
      this.currentSession = await this.backend.createSession({
        userId: userData.id,
        topic: formData.topic,
        difficulty: formData.difficulty,
        timeLimit: formData.timeLimit,
        questions: this.questions.map(q => q.id)
      });

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
    document.getElementById('codeInput').value = `function ${question.title.toLowerCase().replace(/\s+/g, '')}(${this.getFunctionParameters(question)}) {
    // Your code here
    
}`;

    // Hide hints and solutions
    this.hideHintsAndSolutions();
    this.hideResult();

    // Update progress
    this.updateProgress();
  }

  getFunctionParameters(question) {
    // Extract parameters from examples (simplified)
    const example = question.example;
    if (example.includes('nums, target')) return 'nums, target';
    if (example.includes('prices')) return 'prices';
    if (example.includes('s')) return 's';
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
    const code = document.getElementById('codeInput').value;
    if (!code.trim()) {
      this.showNotification('Please write some code first.', 'warning');
      return;
    }

    try {
      // Simulate code execution
      this.showNotification('Running code...', 'info');
      
      // In a real application, this would execute the code safely
      // For simulation, we'll just show a success message
      setTimeout(() => {
        this.showNotification('Code executed successfully!', 'success');
      }, 1000);

    } catch (error) {
      this.showNotification('Code execution failed: ' + error.message, 'error');
    }
  }

  async submitSolution() {
    const code = document.getElementById('codeInput').value;
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
        isCorrect: isCorrect,
        timeSpent: timeSpent,
        attempts: 1, // Simplified
        hintsUsed: 0, // Simplified
        solution: code
      };

      this.results.push(result);

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
    // Simulate solution validation
    // In a real application, this would run test cases
    return Math.random() > 0.3; // 70% success rate for simulation
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
    document.getElementById('resultDisplay').style.display = 'none';
  }

  showHint() {
    const question = this.questions[this.currentQuestionIndex];
    document.getElementById('hintText').textContent = question.hint;
    document.getElementById('hintDisplay').style.display = 'block';
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
      // End session in backend
      await this.backend.endSession(this.currentSession.id, this.results);
      
      // Show results
      this.showSessionResults();
      
    } catch (error) {
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