// Practice Session Manager
class PracticeSession {
  constructor() {
    this.currentSession = null;
    this.currentQuestionIndex = 0;
    this.sessionStartTime = null;
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.isPaused = false;
    this.sessionResults = [];
    this.questions = this.loadQuestions();
    
    this.initializeEventListeners();
  }

  loadQuestions() {
    // Reuse the questions from demo.js but with additional data
    return {
      arrays: {
        easy: [
          {
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            example: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
            constraints: [
              "2 ≤ nums.length ≤ 10⁴",
              "-10⁹ ≤ nums[i] ≤ 10⁹", 
              "-10⁹ ≤ target ≤ 10⁹",
              "Only one valid answer exists."
            ],
            hint: "Use a hash map to store numbers and their indices as you iterate through the array.",
            solution: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}",
            testCases: [
              { input: "nums = [2,7,11,15], target = 9", expected: "[0,1]" },
              { input: "nums = [3,2,4], target = 6", expected: "[1,2]" },
              { input: "nums = [3,3], target = 6", expected: "[0,1]" }
            ]
          },
          {
            title: "Best Time to Buy and Sell Stock",
            description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
            example: "Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
            constraints: [
              "1 ≤ prices.length ≤ 10⁵",
              "0 ≤ prices[i] ≤ 10⁴"
            ],
            hint: "Keep track of the minimum price seen so far and calculate profit for each day.",
            solution: "function maxProfit(prices) {\n  let minPrice = prices[0];\n  let maxProfit = 0;\n  \n  for (let i = 1; i < prices.length; i++) {\n    if (prices[i] < minPrice) {\n      minPrice = prices[i];\n    } else {\n      maxProfit = Math.max(maxProfit, prices[i] - minPrice);\n    }\n  }\n  \n  return maxProfit;\n}",
            testCases: [
              { input: "prices = [7,1,5,3,6,4]", expected: "5" },
              { input: "prices = [7,6,4,3,1]", expected: "0" }
            ]
          }
        ],
        medium: [
          {
            title: "3Sum",
            description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
            example: "Input: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]",
            constraints: [
              "3 ≤ nums.length ≤ 3000",
              "-10⁵ ≤ nums[i] ≤ 10⁵"
            ],
            hint: "Sort the array first, then use two pointers technique with a fixed element.",
            solution: "function threeSum(nums) {\n  nums.sort((a, b) => a - b);\n  const result = [];\n  \n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i-1]) continue;\n    \n    let left = i + 1, right = nums.length - 1;\n    while (left < right) {\n      const sum = nums[i] + nums[left] + nums[right];\n      if (sum === 0) {\n        result.push([nums[i], nums[left], nums[right]]);\n        while (left < right && nums[left] === nums[left+1]) left++;\n        while (left < right && nums[right] === nums[right-1]) right--;\n        left++;\n        right--;\n      } else if (sum < 0) {\n        left++;\n      } else {\n        right--;\n      }\n    }\n  }\n  \n  return result;\n}",
            testCases: [
              { input: "nums = [-1,0,1,2,-1,-4]", expected: "[[-1,-1,2],[-1,0,1]]" },
              { input: "nums = [0,1,1]", expected: "[]" }
            ]
          }
        ],
        hard: [
          {
            title: "Median of Two Sorted Arrays",
            description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
            example: "Input: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\nExplanation: merged array = [1,2,3] and median is 2.",
            constraints: [
              "nums1.length == m",
              "nums2.length == n",
              "0 ≤ m ≤ 1000",
              "0 ≤ n ≤ 1000",
              "1 ≤ m + n ≤ 2000",
              "-10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶"
            ],
            hint: "Use binary search to find the correct partition point.",
            solution: "function findMedianSortedArrays(nums1, nums2) {\n  if (nums1.length > nums2.length) {\n    return findMedianSortedArrays(nums2, nums1);\n  }\n  \n  const m = nums1.length, n = nums2.length;\n  let left = 0, right = m;\n  \n  while (left <= right) {\n    const partitionX = Math.floor((left + right) / 2);\n    const partitionY = Math.floor((m + n + 1) / 2) - partitionX;\n    \n    const maxLeftX = partitionX === 0 ? -Infinity : nums1[partitionX - 1];\n    const minRightX = partitionX === m ? Infinity : nums1[partitionX];\n    \n    const maxLeftY = partitionY === 0 ? -Infinity : nums2[partitionY - 1];\n    const minRightY = partitionY === n ? Infinity : nums2[partitionY];\n    \n    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {\n      if ((m + n) % 2 === 0) {\n        return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;\n      } else {\n        return Math.max(maxLeftX, maxLeftY);\n      }\n    } else if (maxLeftX > minRightY) {\n      right = partitionX - 1;\n    } else {\n      left = partitionX + 1;\n    }\n  }\n}",
            testCases: [
              { input: "nums1 = [1,3], nums2 = [2]", expected: "2.0" },
              { input: "nums1 = [1,2], nums2 = [3,4]", expected: "2.5" }
            ]
          }
        ]
      },
      strings: {
        easy: [
          {
            title: "Valid Parentheses",
            description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            example: "Input: s = \"()\"\nOutput: true",
            constraints: [
              "1 ≤ s.length ≤ 10⁴",
              "s consists of parentheses only '()[]{}'."
            ],
            hint: "Use a stack to keep track of opening brackets.",
            solution: "function isValid(s) {\n  const stack = [];\n  const map = {\n    ')': '(',\n    '}': '{',\n    ']': '['\n  };\n  \n  for (let char of s) {\n    if (char in map) {\n      if (stack.length === 0 || stack.pop() !== map[char]) {\n        return false;\n      }\n    } else {\n      stack.push(char);\n    }\n  }\n  \n  return stack.length === 0;\n}",
            testCases: [
              { input: 's = "()"', expected: "true" },
              { input: 's = "()[]{}"', expected: "true" },
              { input: 's = "(]"', expected: "false" }
            ]
          }
        ],
        medium: [
          {
            title: "Longest Substring Without Repeating Characters",
            description: "Given a string s, find the length of the longest substring without repeating characters.",
            example: "Input: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.",
            constraints: [
              "0 ≤ s.length ≤ 5 × 10⁴",
              "s consists of English letters, digits, symbols and spaces."
            ],
            hint: "Use sliding window technique with a set to track characters.",
            solution: "function lengthOfLongestSubstring(s) {\n  const charSet = new Set();\n  let left = 0;\n  let maxLength = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    while (charSet.has(s[right])) {\n      charSet.delete(s[left]);\n      left++;\n    }\n    charSet.add(s[right]);\n    maxLength = Math.max(maxLength, right - left + 1);\n  }\n  \n  return maxLength;\n}",
            testCases: [
              { input: 's = "abcabcbb"', expected: "3" },
              { input: 's = "bbbbb"', expected: "1" },
              { input: 's = "pwwkew"', expected: "3" }
            ]
          }
        ],
        hard: [
          {
            title: "Regular Expression Matching",
            description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*'.",
            example: "Input: s = \"aa\", p = \"a*\"\nOutput: true\nExplanation: '*' means zero or more of the preceding element, 'a'.",
            constraints: [
              "1 ≤ s.length ≤ 20",
              "1 ≤ p.length ≤ 30",
              "s contains only lowercase English letters.",
              "p contains only lowercase English letters, '.', and '*'.",
              "It is guaranteed for each appearance of the character '*', there will be a previous valid character to match."
            ],
            hint: "Use dynamic programming to handle the complex matching logic.",
            solution: "function isMatch(s, p) {\n  const dp = Array(s.length + 1).fill().map(() => Array(p.length + 1).fill(false));\n  dp[0][0] = true;\n  \n  for (let j = 2; j <= p.length; j++) {\n    if (p[j-1] === '*') {\n      dp[0][j] = dp[0][j-2];\n    }\n  }\n  \n  for (let i = 1; i <= s.length; i++) {\n    for (let j = 1; j <= p.length; j++) {\n      if (p[j-1] === s[i-1] || p[j-1] === '.') {\n        dp[i][j] = dp[i-1][j-1];\n      } else if (p[j-1] === '*') {\n        dp[i][j] = dp[i][j-2];\n        if (p[j-2] === s[i-1] || p[j-2] === '.') {\n          dp[i][j] = dp[i][j] || dp[i-1][j];\n        }\n      }\n    }\n  }\n  \n  return dp[s.length][p.length];\n}",
            testCases: [
              { input: 's = "aa", p = "a"', expected: "false" },
              { input: 's = "aa", p = "a*"', expected: "true" },
              { input: 's = "ab", p = ".*"', expected: "true" }
            ]
          }
        ]
      }
    };
  }

  initializeEventListeners() {
    const sessionForm = document.getElementById('sessionForm');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const runCodeBtn = document.getElementById('runCodeBtn');
    const submitSolutionBtn = document.getElementById('submitSolutionBtn');
    const getHintBtn = document.getElementById('getHintBtn');
    const showSolutionBtn = document.getElementById('showSolutionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const endSessionBtn = document.getElementById('endSessionBtn');
    const newSessionBtn = document.getElementById('newSessionBtn');

    sessionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.startSession();
    });

    pauseBtn.addEventListener('click', () => this.togglePause());
    stopBtn.addEventListener('click', () => this.endSession());
    runCodeBtn.addEventListener('click', () => this.runCode());
    submitSolutionBtn.addEventListener('click', () => this.submitSolution());
    getHintBtn.addEventListener('click', () => this.showHint());
    showSolutionBtn.addEventListener('click', () => this.showSolution());
    nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
    endSessionBtn.addEventListener('click', () => this.endSession());
    newSessionBtn.addEventListener('click', () => this.resetSession());
  }

  startSession() {
    const topic = document.getElementById('sessionTopic').value;
    const difficulty = document.getElementById('sessionDifficulty').value;
    const timeLimit = parseInt(document.getElementById('sessionTime').value);
    const questionCount = parseInt(document.getElementById('sessionQuestions').value);

    // Get questions for the session
    const topicQuestions = this.questions[topic];
    if (!topicQuestions || !topicQuestions[difficulty]) {
      alert('No questions available for this combination.');
      return;
    }

    const availableQuestions = topicQuestions[difficulty];
    const sessionQuestions = this.shuffleArray([...availableQuestions]).slice(0, questionCount);

    this.currentSession = {
      topic,
      difficulty,
      timeLimit,
      questions: sessionQuestions,
      startTime: Date.now(),
      currentQuestionStartTime: Date.now()
    };

    this.timeRemaining = timeLimit * 60; // Convert to seconds
    this.currentQuestionIndex = 0;
    this.sessionResults = [];

    this.showPracticeSession();
    this.displayCurrentQuestion();
    this.startTimer();
  }

  showPracticeSession() {
    document.getElementById('sessionSetup').style.display = 'none';
    document.getElementById('practiceSession').style.display = 'block';
    document.getElementById('sessionResults').style.display = 'none';

    // Update session info
    document.getElementById('sessionTitle').textContent = `${this.currentSession.topic.charAt(0).toUpperCase() + this.currentSession.topic.slice(1)} Practice`;
    document.getElementById('sessionTopicDisplay').textContent = this.currentSession.topic.charAt(0).toUpperCase() + this.currentSession.topic.slice(1);
    document.getElementById('sessionDifficultyDisplay').textContent = this.currentSession.difficulty.charAt(0).toUpperCase() + this.currentSession.difficulty.slice(1);
    this.updateProgress();
  }

  displayCurrentQuestion() {
    const question = this.currentSession.questions[this.currentQuestionIndex];
    
    document.getElementById('currentQuestionTitle').textContent = question.title;
    document.getElementById('currentQuestionDescription').textContent = question.description;
    document.getElementById('currentQuestionExample').textContent = question.example;
    
    // Update constraints
    const constraintsList = document.getElementById('currentQuestionConstraints');
    constraintsList.innerHTML = '';
    question.constraints.forEach(constraint => {
      const li = document.createElement('li');
      li.textContent = constraint;
      constraintsList.appendChild(li);
    });

    // Update badges
    const topicBadge = document.getElementById('currentQuestionTopic');
    const difficultyBadge = document.getElementById('currentQuestionDifficulty');
    
    topicBadge.textContent = this.currentSession.topic.charAt(0).toUpperCase() + this.currentSession.topic.slice(1);
    difficultyBadge.textContent = this.currentSession.difficulty.charAt(0).toUpperCase() + this.currentSession.difficulty.slice(1);
    
    this.styleBadge(topicBadge, '#1a73e8', '#e3ecfd');
    this.styleBadge(difficultyBadge, this.getDifficultyColor(this.currentSession.difficulty), this.getDifficultyBgColor(this.currentSession.difficulty));

    // Clear previous content
    document.getElementById('codeInput').value = `function ${question.title.toLowerCase().replace(/\s+/g, '')}(input) {\n    // Your code here\n    \n}`;
    this.hideHintsAndSolutions();
    this.hideResult();
    
    // Reset question start time
    this.currentSession.currentQuestionStartTime = Date.now();
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

  getDifficultyColor(difficulty) {
    const colors = {
      easy: '#16a34a',
      medium: '#ea580c', 
      hard: '#dc2626'
    };
    return colors[difficulty] || '#1a73e8';
  }

  getDifficultyBgColor(difficulty) {
    const colors = {
      easy: '#dcfce7',
      medium: '#fed7aa',
      hard: '#fecaca'
    };
    return colors[difficulty] || '#e3ecfd';
  }

  startTimer() {
    if (this.currentSession.timeLimit === 0) {
      document.getElementById('timerDisplay').textContent = '∞';
      return;
    }

    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.timeRemaining--;
        this.updateTimerDisplay();
        
        if (this.timeRemaining <= 0) {
          this.endSession();
        }
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    document.getElementById('timerDisplay').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is running low
    const timerDisplay = document.getElementById('timerDisplay');
    if (this.timeRemaining <= 300) { // 5 minutes
      timerDisplay.style.color = '#ef4444';
    } else if (this.timeRemaining <= 600) { // 10 minutes
      timerDisplay.style.color = '#f59e0b';
    } else {
      timerDisplay.style.color = '#1a73e8';
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    const icon = pauseBtn.querySelector('i');
    
    if (this.isPaused) {
      icon.className = 'fa-solid fa-play';
      pauseBtn.title = 'Resume';
    } else {
      icon.className = 'fa-solid fa-pause';
      pauseBtn.title = 'Pause';
    }
  }

  runCode() {
    const code = document.getElementById('codeInput').value;
    // In a real implementation, this would send code to a backend for execution
    // For demo purposes, we'll simulate running the code
    alert('Code execution would happen here. This is a demo!');
  }

  submitSolution() {
    const code = document.getElementById('codeInput').value;
    const question = this.currentSession.questions[this.currentQuestionIndex];
    
    // Simulate solution evaluation
    const isCorrect = Math.random() > 0.3; // 70% chance of being correct for demo
    
    const result = {
      questionIndex: this.currentQuestionIndex,
      questionTitle: question.title,
      isCorrect,
      timeSpent: Math.floor((Date.now() - this.currentSession.currentQuestionStartTime) / 1000),
      code: code
    };
    
    this.sessionResults.push(result);
    this.showResult(isCorrect);
    
    // Show next question button or end session button
    if (this.currentQuestionIndex < this.currentSession.questions.length - 1) {
      document.getElementById('nextQuestionBtn').style.display = 'inline-block';
    } else {
      document.getElementById('endSessionBtn').style.display = 'inline-block';
    }
  }

  showResult(isCorrect) {
    const resultDisplay = document.getElementById('resultDisplay');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    
    if (isCorrect) {
      resultIcon.className = 'fa-solid fa-check-circle';
      resultIcon.style.color = '#10b981';
      resultTitle.textContent = 'Correct!';
      resultMessage.textContent = 'Great job! Your solution passed all test cases.';
    } else {
      resultIcon.className = 'fa-solid fa-times-circle';
      resultIcon.style.color = '#ef4444';
      resultTitle.textContent = 'Incorrect';
      resultMessage.textContent = 'Your solution didn\'t pass all test cases. Try again or get a hint!';
    }
    
    resultDisplay.style.display = 'block';
    this.animateElement(resultDisplay);
  }

  showHint() {
    const question = this.currentSession.questions[this.currentQuestionIndex];
    document.getElementById('hintText').textContent = question.hint;
    document.getElementById('hintDisplay').style.display = 'block';
    this.animateElement(document.getElementById('hintDisplay'));
  }

  showSolution() {
    const question = this.currentSession.questions[this.currentQuestionIndex];
    document.getElementById('solutionText').textContent = question.solution;
    document.getElementById('solutionDisplay').style.display = 'block';
    this.animateElement(document.getElementById('solutionDisplay'));
  }

  hideHintsAndSolutions() {
    document.getElementById('hintDisplay').style.display = 'none';
    document.getElementById('solutionDisplay').style.display = 'none';
  }

  hideResult() {
    document.getElementById('resultDisplay').style.display = 'none';
    document.getElementById('nextQuestionBtn').style.display = 'none';
    document.getElementById('endSessionBtn').style.display = 'none';
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    this.updateProgress();
    this.displayCurrentQuestion();
  }

  updateProgress() {
    const progress = `Question ${this.currentQuestionIndex + 1} of ${this.currentSession.questions.length}`;
    document.getElementById('sessionProgress').textContent = progress;
  }

  endSession() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.showSessionResults();
  }

  showSessionResults() {
    document.getElementById('practiceSession').style.display = 'none';
    document.getElementById('sessionResults').style.display = 'block';
    
    const totalQuestions = this.sessionResults.length;
    const correctAnswers = this.sessionResults.filter(r => r.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const totalTime = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
    
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('correctAnswers').textContent = correctAnswers;
    document.getElementById('sessionAccuracy').textContent = `${accuracy}%`;
    document.getElementById('totalTime').textContent = this.formatTime(totalTime);
    
    this.populateQuestionBreakdown();
  }

  populateQuestionBreakdown() {
    const breakdown = document.getElementById('questionBreakdown');
    breakdown.innerHTML = '';
    
    this.sessionResults.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'breakdown-item';
      
      const iconClass = result.isCorrect ? 'fa-check-circle' : 'fa-times-circle';
      const iconColor = result.isCorrect ? '#10b981' : '#ef4444';
      
      item.innerHTML = `
        <div class="breakdown-icon" style="color: ${iconColor}">
          <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="breakdown-content">
          <h4>${result.questionTitle}</h4>
          <p>Time: ${this.formatTime(result.timeSpent)}</p>
        </div>
        <div class="breakdown-status">
          ${result.isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      `;
      
      breakdown.appendChild(item);
    });
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  resetSession() {
    document.getElementById('sessionResults').style.display = 'none';
    document.getElementById('sessionSetup').style.display = 'block';
    
    this.currentSession = null;
    this.currentQuestionIndex = 0;
    this.sessionResults = [];
    this.isPaused = false;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  animateElement(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      element.style.transition = 'all 0.3s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 10);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Initialize practice session when page loads
document.addEventListener('DOMContentLoaded', () => {
  new PracticeSession();
});
