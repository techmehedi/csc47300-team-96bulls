// AI Interviewer Demo Data and Functionality
class AIInterviewerDemo {
  constructor() {
    this.questions = this.initializeQuestions();
    this.currentQuestion = null;
    this.initializeEventListeners();
  }

  initializeQuestions() {
    return {
      arrays: {
        easy: [
          {
            title: "Two Sum",
            description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            example: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
            hint: "Use a hash map to store numbers and their indices as you iterate through the array.",
            solution: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}"
          },
          {
            title: "Best Time to Buy and Sell Stock",
            description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
            example: "Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
            hint: "Keep track of the minimum price seen so far and calculate profit for each day.",
            solution: "function maxProfit(prices) {\n  let minPrice = prices[0];\n  let maxProfit = 0;\n  \n  for (let i = 1; i < prices.length; i++) {\n    if (prices[i] < minPrice) {\n      minPrice = prices[i];\n    } else {\n      maxProfit = Math.max(maxProfit, prices[i] - minPrice);\n    }\n  }\n  \n  return maxProfit;\n}"
          }
        ],
        medium: [
          {
            title: "3Sum",
            description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
            example: "Input: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]",
            hint: "Sort the array first, then use two pointers technique with a fixed element.",
            solution: "function threeSum(nums) {\n  nums.sort((a, b) => a - b);\n  const result = [];\n  \n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i-1]) continue;\n    \n    let left = i + 1, right = nums.length - 1;\n    while (left < right) {\n      const sum = nums[i] + nums[left] + nums[right];\n      if (sum === 0) {\n        result.push([nums[i], nums[left], nums[right]]);\n        while (left < right && nums[left] === nums[left+1]) left++;\n        while (left < right && nums[right] === nums[right-1]) right--;\n        left++;\n        right--;\n      } else if (sum < 0) {\n        left++;\n      } else {\n        right--;\n      }\n    }\n  }\n  \n  return result;\n}"
          }
        ],
        hard: [
          {
            title: "Median of Two Sorted Arrays",
            description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
            example: "Input: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\nExplanation: merged array = [1,2,3] and median is 2.",
            hint: "Use binary search to find the correct partition point.",
            solution: "function findMedianSortedArrays(nums1, nums2) {\n  if (nums1.length > nums2.length) {\n    return findMedianSortedArrays(nums2, nums1);\n  }\n  \n  const m = nums1.length, n = nums2.length;\n  let left = 0, right = m;\n  \n  while (left <= right) {\n    const partitionX = Math.floor((left + right) / 2);\n    const partitionY = Math.floor((m + n + 1) / 2) - partitionX;\n    \n    const maxLeftX = partitionX === 0 ? -Infinity : nums1[partitionX - 1];\n    const minRightX = partitionX === m ? Infinity : nums1[partitionX];\n    \n    const maxLeftY = partitionY === 0 ? -Infinity : nums2[partitionY - 1];\n    const minRightY = partitionY === n ? Infinity : nums2[partitionY];\n    \n    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {\n      if ((m + n) % 2 === 0) {\n        return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;\n      } else {\n        return Math.max(maxLeftX, maxLeftY);\n      }\n    } else if (maxLeftX > minRightY) {\n      right = partitionX - 1;\n    } else {\n      left = partitionX + 1;\n    }\n  }\n}"
          }
        ]
      },
      strings: {
        easy: [
          {
            title: "Valid Parentheses",
            description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            example: "Input: s = \"()\"\nOutput: true",
            hint: "Use a stack to keep track of opening brackets.",
            solution: "function isValid(s) {\n  const stack = [];\n  const map = {\n    ')': '(',\n    '}': '{',\n    ']': '['\n  };\n  \n  for (let char of s) {\n    if (char in map) {\n      if (stack.length === 0 || stack.pop() !== map[char]) {\n        return false;\n      }\n    } else {\n      stack.push(char);\n    }\n  }\n  \n  return stack.length === 0;\n}"
          }
        ],
        medium: [
          {
            title: "Longest Substring Without Repeating Characters",
            description: "Given a string s, find the length of the longest substring without repeating characters.",
            example: "Input: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.",
            hint: "Use sliding window technique with a set to track characters.",
            solution: "function lengthOfLongestSubstring(s) {\n  const charSet = new Set();\n  let left = 0;\n  let maxLength = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    while (charSet.has(s[right])) {\n      charSet.delete(s[left]);\n      left++;\n    }\n    charSet.add(s[right]);\n    maxLength = Math.max(maxLength, right - left + 1);\n  }\n  \n  return maxLength;\n}"
          }
        ],
        hard: [
          {
            title: "Regular Expression Matching",
            description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*'.",
            example: "Input: s = \"aa\", p = \"a*\"\nOutput: true\nExplanation: '*' means zero or more of the preceding element, 'a'.",
            hint: "Use dynamic programming to handle the complex matching logic.",
            solution: "function isMatch(s, p) {\n  const dp = Array(s.length + 1).fill().map(() => Array(p.length + 1).fill(false));\n  dp[0][0] = true;\n  \n  for (let j = 2; j <= p.length; j++) {\n    if (p[j-1] === '*') {\n      dp[0][j] = dp[0][j-2];\n    }\n  }\n  \n  for (let i = 1; i <= s.length; i++) {\n    for (let j = 1; j <= p.length; j++) {\n      if (p[j-1] === s[i-1] || p[j-1] === '.') {\n        dp[i][j] = dp[i-1][j-1];\n      } else if (p[j-1] === '*') {\n        dp[i][j] = dp[i][j-2];\n        if (p[j-2] === s[i-1] || p[j-2] === '.') {\n          dp[i][j] = dp[i][j] || dp[i-1][j];\n        }\n      }\n    }\n  }\n  \n  return dp[s.length][p.length];\n}"
          }
        ]
      },
      graphs: {
        easy: [
          {
            title: "Number of Islands",
            description: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
            example: "Input: grid = [\n  [\"1\",\"1\",\"1\",\"1\",\"0\"],\n  [\"1\",\"1\",\"0\",\"1\",\"0\"],\n  [\"1\",\"1\",\"0\",\"0\",\"0\"],\n  [\"0\",\"0\",\"0\",\"0\",\"0\"]\n]\nOutput: 1",
            hint: "Use DFS to explore each island and mark visited cells.",
            solution: "function numIslands(grid) {\n  if (!grid || grid.length === 0) return 0;\n  \n  const rows = grid.length;\n  const cols = grid[0].length;\n  let islands = 0;\n  \n  function dfs(r, c) {\n    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {\n      return;\n    }\n    \n    grid[r][c] = '0';\n    dfs(r + 1, c);\n    dfs(r - 1, c);\n    dfs(r, c + 1);\n    dfs(r, c - 1);\n  }\n  \n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      if (grid[r][c] === '1') {\n        islands++;\n        dfs(r, c);\n      }\n    }\n  }\n  \n  return islands;\n}"
          }
        ],
        medium: [
          {
            title: "Course Schedule",
            description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.",
            example: "Input: numCourses = 2, prerequisites = [[1,0]]\nOutput: true\nExplanation: There are a total of 2 courses to take. To take course 1 you should have finished course 0.",
            hint: "Use topological sort to detect cycles in the dependency graph.",
            solution: "function canFinish(numCourses, prerequisites) {\n  const graph = Array(numCourses).fill().map(() => []);\n  const inDegree = Array(numCourses).fill(0);\n  \n  for (let [course, prereq] of prerequisites) {\n    graph[prereq].push(course);\n    inDegree[course]++;\n  }\n  \n  const queue = [];\n  for (let i = 0; i < numCourses; i++) {\n    if (inDegree[i] === 0) {\n      queue.push(i);\n    }\n  }\n  \n  let completed = 0;\n  while (queue.length > 0) {\n    const course = queue.shift();\n    completed++;\n    \n    for (let nextCourse of graph[course]) {\n      inDegree[nextCourse]--;\n      if (inDegree[nextCourse] === 0) {\n        queue.push(nextCourse);\n      }\n    }\n  }\n  \n  return completed === numCourses;\n}"
          }
        ],
        hard: [
          {
            title: "Word Ladder",
            description: "A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words such that: Only one letter can be changed at a time, and each transformed word must exist in the word list.",
            example: "Input: beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]\nOutput: 5\nExplanation: One shortest transformation sequence is \"hit\" -> \"hot\" -> \"dot\" -> \"dog\" -> \"cog\".",
            hint: "Use BFS to find the shortest path in the word graph.",
            solution: "function ladderLength(beginWord, endWord, wordList) {\n  const wordSet = new Set(wordList);\n  if (!wordSet.has(endWord)) return 0;\n  \n  const queue = [beginWord];\n  let level = 1;\n  \n  while (queue.length > 0) {\n    const size = queue.length;\n    \n    for (let i = 0; i < size; i++) {\n      const word = queue.shift();\n      \n      if (word === endWord) return level;\n      \n      for (let j = 0; j < word.length; j++) {\n        for (let c = 'a'.charCodeAt(0); c <= 'z'.charCodeAt(0); c++) {\n          const newWord = word.substring(0, j) + String.fromCharCode(c) + word.substring(j + 1);\n          \n          if (wordSet.has(newWord)) {\n            queue.push(newWord);\n            wordSet.delete(newWord);\n          }\n        }\n      }\n    }\n    \n    level++;\n  }\n  \n  return 0;\n}"
          }
        ]
      },
      "dynamic-programming": {
        easy: [
          {
            title: "Climbing Stairs",
            description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
            example: "Input: n = 3\nOutput: 3\nExplanation: There are three ways to climb to the top.\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step",
            hint: "This is a classic Fibonacci sequence problem.",
            solution: "function climbStairs(n) {\n  if (n <= 2) return n;\n  \n  let prev2 = 1;\n  let prev1 = 2;\n  \n  for (let i = 3; i <= n; i++) {\n    const current = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = current;\n  }\n  \n  return prev1;\n}"
          }
        ],
        medium: [
          {
            title: "House Robber",
            description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected and will automatically contact the police if two adjacent houses were broken into on the same night.",
            example: "Input: nums = [2,7,9,3,1]\nOutput: 12\nExplanation: Rob house 1 (money = 2), rob house 3 (money = 9), rob house 5 (money = 1). Total amount you can rob = 2 + 9 + 1 = 12.",
            hint: "Use dynamic programming to decide whether to rob the current house or not.",
            solution: "function rob(nums) {\n  if (nums.length === 0) return 0;\n  if (nums.length === 1) return nums[0];\n  \n  let prev2 = nums[0];\n  let prev1 = Math.max(nums[0], nums[1]);\n  \n  for (let i = 2; i < nums.length; i++) {\n    const current = Math.max(prev1, prev2 + nums[i]);\n    prev2 = prev1;\n    prev1 = current;\n  }\n  \n  return prev1;\n}"
          }
        ],
        hard: [
          {
            title: "Edit Distance",
            description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You have the following three operations permitted on a word: Insert a character, Delete a character, Replace a character.",
            example: "Input: word1 = \"horse\", word2 = \"ros\"\nOutput: 3\nExplanation: horse -> rorse (replace 'h' with 'r'), rorse -> rose (remove 'r'), rose -> ros (remove 'e').",
            hint: "Use a 2D DP table where dp[i][j] represents the minimum operations to convert word1[0...i] to word2[0...j].",
            solution: "function minDistance(word1, word2) {\n  const m = word1.length;\n  const n = word2.length;\n  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));\n  \n  for (let i = 0; i <= m; i++) {\n    for (let j = 0; j <= n; j++) {\n      if (i === 0) {\n        dp[i][j] = j;\n      } else if (j === 0) {\n        dp[i][j] = i;\n      } else if (word1[i-1] === word2[j-1]) {\n        dp[i][j] = dp[i-1][j-1];\n      } else {\n        dp[i][1][j-1], dp[i-1][j], dp[i-1][j-1]) + 1;\n      }\n    }\n  }\n  \n  return dp[m][n];\n}"
          }
        ]
      },
      trees: {
        easy: [
          {
            title: "Maximum Depth of Binary Tree",
            description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
            example: "Input: root = [3,9,20,null,null,15,7]\nOutput: 3",
            hint: "Use recursion to find the maximum depth of left and right subtrees.",
            solution: "function maxDepth(root) {\n  if (!root) return 0;\n  \n  const leftDepth = maxDepth(root.left);\n  const rightDepth = maxDepth(root.right);\n  \n  return Math.max(leftDepth, rightDepth) + 1;\n}"
          }
        ],
        medium: [
          {
            title: "Validate Binary Search Tree",
            description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
            example: "Input: root = [2,1,3]\nOutput: true",
            hint: "Use recursion with min and max bounds to validate each node.",
            solution: "function isValidBST(root) {\n  function validate(node, min, max) {\n    if (!node) return true;\n    \n    if (node.val <= min || node.val >= max) {\n      return false;\n    }\n    \n    return validate(node.left, min, node.val) && validate(node.right, node.val, max);\n  }\n  \n  return validate(root, -Infinity, Infinity);\n}"
          }
        ],
        hard: [
          {
            title: "Serialize and Deserialize Binary Tree",
            description: "Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work.",
            example: "Input: root = [1,2,3,null,null,4,5]\nOutput: [1,2,3,null,null,4,5]",
            hint: "Use preorder traversal with null markers to serialize the tree.",
            solution: "function serialize(root) {\n  const result = [];\n  \n  function preorder(node) {\n    if (!node) {\n      result.push('null');\n      return;\n    }\n    \n    result.push(node.val.toString());\n    preorder(node.left);\n    preorder(node.right);\n  }\n  \n  preorder(root);\n  return result.join(',');\n}\n\nfunction deserialize(data) {\n  const values = data.split(',');\n  let index = 0;\n  \n  function build() {\n    if (values[index] === 'null') {\n      index++;\n      return null;\n    }\n    \n    const node = new TreeNode(parseInt(values[index++]));\n    node.left = build();\n    node.right = build();\n    \n    return node;\n  }\n  \n  return build();\n}"
          }
        ]
      }
    };
  }

  initializeEventListeners() {
    const form = document.getElementById('demoForm');
    const showHintBtn = document.getElementById('showHint');
    const showSolutionBtn = document.getElementById('showSolution');
    const newQuestionBtn = document.getElementById('newQuestion');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.generateQuestion();
    });

    showHintBtn.addEventListener('click', () => this.showHint());
    showSolutionBtn.addEventListener('click', () => this.showSolution());
    newQuestionBtn.addEventListener('click', () => this.generateQuestion());
  }

  generateQuestion() {
    const topic = document.getElementById('topic').value;
    const difficulty = document.getElementById('difficulty').value;
    
    const topicQuestions = this.questions[topic];
    if (!topicQuestions || !topicQuestions[difficulty]) {
      alert('No questions available for this combination.');
      return;
    }

    const questions = topicQuestions[difficulty];
    const randomIndex = Math.floor(Math.random() * questions.length);
    this.currentQuestion = questions[randomIndex];

    this.displayQuestion();
    this.hideHintsAndSolutions();
  }

  displayQuestion() {
    if (!this.currentQuestion) return;

    document.getElementById('questionTitle').textContent = this.currentQuestion.title;
    document.getElementById('questionDescription').textContent = this.currentQuestion.description;
    document.getElementById('questionExample').textContent = this.currentQuestion.example;
    
    // Style the topic and difficulty badges with JavaScript
    const topicBadge = document.getElementById('questionTopic');
    const difficultyBadge = document.getElementById('questionDifficulty');
    
    topicBadge.textContent = document.getElementById('topic').selectedOptions[0].text;
    difficultyBadge.textContent = document.getElementById('difficulty').selectedOptions[0].text;
    
    // Apply dynamic styling
    this.styleBadge(topicBadge, '#1a73e8', '#e3ecfd');
    this.styleBadge(difficultyBadge, this.getDifficultyColor(), this.getDifficultyBgColor());

    document.getElementById('questionDisplay').style.display = 'block';
    
    // Smooth scroll to question
    document.getElementById('questionDisplay').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
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
    const difficulty = document.getElementById('difficulty').value;
    const colors = {
      easy: '#16a34a',
      medium: '#ea580c', 
      hard: '#dc2626'
    };
    return colors[difficulty] || '#1a73e8';
  }

  getDifficultyBgColor() {
    const difficulty = document.getElementById('difficulty').value;
    const colors = {
      easy: '#dcfce7',
      medium: '#fed7aa',
      hard: '#fecaca'
    };
    return colors[difficulty] || '#e3ecfd';
  }

  showHint() {
    if (!this.currentQuestion) return;
    
    document.getElementById('hintText').textContent = this.currentQuestion.hint;
    document.getElementById('hintDisplay').style.display = 'block';
    
    // Animate the hint appearance
    this.animateElement(document.getElementById('hintDisplay'));
  }

  showSolution() {
    if (!this.currentQuestion) return;
    
    document.getElementById('solutionText').textContent = this.currentQuestion.solution;
    document.getElementById('solutionDisplay').style.display = 'block';
    
    // Animate the solution appearance
    this.animateElement(document.getElementById('solutionDisplay'));
  }

  hideHintsAndSolutions() {
    document.getElementById('hintDisplay').style.display = 'none';
    document.getElementById('solutionDisplay').style.display = 'none';
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
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new AIInterviewerDemo();
});
