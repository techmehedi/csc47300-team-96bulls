// AI Interview Page JavaScript
class AIInterview {
  constructor() {
    this.sessionId = null;
    this.conversationHistory = [];
    this.sessionStartTime = null;
    this.messageCount = 0;
    this.timerInterval = null;
    this.topic = null;
    this.difficulty = null;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Setup form submission
    const setupForm = document.getElementById('setupForm');
    if (setupForm) {
      setupForm.addEventListener('submit', (e) => this.handleSetupSubmit(e));
    }

    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Chat input - Enter to send (Shift+Enter for new line)
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Action buttons
    const hintBtn = document.getElementById('requestHintBtn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.requestHint());
    }

    const evalBtn = document.getElementById('requestEvaluationBtn');
    if (evalBtn) {
      evalBtn.addEventListener('click', () => this.requestEvaluation());
    }

    // End interview button
    const endBtn = document.getElementById('endInterviewBtn');
    if (endBtn) {
      endBtn.addEventListener('click', () => this.endInterview());
    }
  }

  async handleSetupSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    this.topic = formData.get('topic');
    this.difficulty = formData.get('difficulty');

    if (!this.topic || !this.difficulty) {
      alert('Please select both topic and difficulty');
      return;
    }

    // Hide setup panel and show interview panel
    document.getElementById('setupPanel').style.display = 'none';
    document.getElementById('interviewPanel').style.display = 'grid';

    // Update session info
    document.getElementById('sessionTopic').textContent = this.getTopicName(this.topic);
    document.getElementById('sessionDifficulty').textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);

    // Start the interview
    await this.startInterview();
  }

  getTopicName(topicKey) {
    const topicNames = {
      'arrays': 'Arrays & Hashing',
      'two-pointers': 'Two Pointers',
      'sliding-window': 'Sliding Window',
      'stack': 'Stack',
      'binary-search': 'Binary Search',
      'linked-list': 'Linked List',
      'trees': 'Trees',
      'tries': 'Tries',
      'heap': 'Heap / Priority Queue',
      'backtracking': 'Backtracking',
      'graphs': 'Graphs',
      'dynamic-programming': 'Dynamic Programming',
      'greedy': 'Greedy',
      'intervals': 'Intervals',
      'math': 'Math & Geometry',
      'bit-manipulation': 'Bit Manipulation'
    };
    return topicNames[topicKey] || topicKey;
  }

  async startInterview() {
    try {
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = new Date();
      this.startTimer();

      // Add welcome message
      this.addSystemMessage('Starting your AI interview session...');

      // Request first question from AI
      const response = await this.callAI('start', {
        topic: this.topic,
        difficulty: this.difficulty
      });

      if (response.success) {
        this.addAIMessage(response.message);
      } else {
        this.addSystemMessage('Error starting interview. Please try again.');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      this.addSystemMessage('Failed to start interview. Please check your connection.');
    }
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    this.addUserMessage(message);
    input.value = '';
    this.messageCount++;
    document.getElementById('messageCount').textContent = this.messageCount;

    // Show typing indicator
    this.showTypingIndicator(true);

    try {
      // Send to AI
      const response = await this.callAI('message', { message });

      if (response.success) {
        this.addAIMessage(response.message);
      } else {
        this.addSystemMessage('Error getting AI response. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.addSystemMessage('Failed to send message. Please check your connection.');
    } finally {
      this.showTypingIndicator(false);
    }
  }

  async requestHint() {
    this.addSystemMessage('Requesting hint...');
    this.showTypingIndicator(true);

    try {
      const response = await this.callAI('hint');
      
      if (response.success) {
        this.addAIMessage('💡 Hint: ' + response.message);
      } else {
        this.addSystemMessage('Error getting hint. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting hint:', error);
      this.addSystemMessage('Failed to get hint. Please check your connection.');
    } finally {
      this.showTypingIndicator(false);
    }
  }

  async requestEvaluation() {
    this.addSystemMessage('Requesting evaluation of your approach...');
    this.showTypingIndicator(true);

    try {
      const response = await this.callAI('evaluate');
      
      if (response.success) {
        this.addAIMessage('📊 Evaluation: ' + response.message);
      } else {
        this.addSystemMessage('Error getting evaluation. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting evaluation:', error);
      this.addSystemMessage('Failed to get evaluation. Please check your connection.');
    } finally {
      this.showTypingIndicator(false);
    }
  }

  async callAI(action, data = {}) {
    // Get the base URL (should be http://localhost:3000 without /api)
    let apiUrl = window.API_URL || 'http://localhost:3000';
    // Remove /api if it's already included in the URL
    if (apiUrl.endsWith('/api')) {
      apiUrl = apiUrl.slice(0, -4);
    }
    
    const requestBody = {
      sessionId: this.sessionId,
      action,
      topic: this.topic,
      difficulty: this.difficulty,
      conversationHistory: this.conversationHistory,
      ...data
    };

    const response = await fetch(`${apiUrl}/api/ai-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Update conversation history
    if (result.conversationHistory) {
      this.conversationHistory = result.conversationHistory;
    }

    return result;
  }

  addUserMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = this.createMessageElement('user', message);
    messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  addAIMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = this.createMessageElement('ai', message);
    messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  addSystemMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = this.createMessageElement('system', message);
    messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  createMessageElement(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    if (type === 'system') {
      messageDiv.innerHTML = `
        <div class="message-content">${this.escapeHtml(content)}</div>
      `;
    } else {
      const avatar = type === 'ai' ? '🤖' : '👤';
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-bubble">
          <div class="message-content">${this.formatMessage(content)}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
    }

    return messageDiv;
  }

  formatMessage(message) {
    // Convert code blocks
    message = message.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Convert inline code
    message = message.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert newlines to <br>
    message = message.replace(/\n/g, '<br>');

    return message;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showTypingIndicator(show) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.style.display = show ? 'flex' : 'none';
      if (show) {
        this.scrollToBottom();
      }
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const duration = Math.floor((new Date() - this.sessionStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      document.getElementById('sessionDuration').textContent = timeStr;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  endInterview() {
    if (confirm('Are you sure you want to end this interview session?')) {
      this.stopTimer();
      this.addSystemMessage('Interview session ended. Thank you for practicing!');
      
      // Disable input
      document.getElementById('chatInput').disabled = true;
      document.getElementById('sendBtn').disabled = true;
      document.getElementById('requestHintBtn').disabled = true;
      document.getElementById('requestEvaluationBtn').disabled = true;
      document.getElementById('endInterviewBtn').disabled = true;

      // Show summary after 2 seconds
      setTimeout(() => {
        this.showSummary();
      }, 2000);
    }
  }

  showSummary() {
    const duration = Math.floor((new Date() - this.sessionStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    
    const summary = `
      <strong>Interview Summary:</strong><br><br>
      Duration: ${minutes} minute${minutes !== 1 ? 's' : ''}<br>
      Messages: ${this.messageCount}<br>
      Topic: ${this.getTopicName(this.topic)}<br>
      Difficulty: ${this.difficulty}<br><br>
      <a href="dashboard.html" class="btn primary">Return to Dashboard</a>
    `;

    this.addSystemMessage(summary);
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize when page loads
new AIInterview();

