import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (two levels up from backend/routes/)
const projectRoot = path.resolve(__dirname, '../..');

// Get questions by topic and difficulty
router.get('/', async (req, res) => {
  try {
    const { topic, difficulty, limit = 10 } = req.query;
    
    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'Topic and difficulty are required' });
    }
    
    let allQuestions = [];
    
    // Try to fetch from free APIs first (optional enhancement)
    // For now, we'll use local files but with better structure
    
    // Load NeetCode questions
    const neetcodePath = path.join(projectRoot, 'frontend/data/neetcode-75.json');
    const dataStructuresPath = path.join(projectRoot, 'frontend/data/data-structures.json');
    
    try {
      // Load NeetCode questions
      const neetcodeData = JSON.parse(await fs.readFile(neetcodePath, 'utf8'));
      allQuestions = neetcodeData.questions || [];
    } catch (error) {
      console.warn('Could not load neetcode-75.json:', error.message);
    }
    
    try {
      // Load data-structures.json questions
      const dataStructures = JSON.parse(await fs.readFile(dataStructuresPath, 'utf8'));
      const standardQuestions = dataStructures.questions?.sampleData || [];
      allQuestions = [...allQuestions, ...standardQuestions];
    } catch (error) {
      console.warn('Could not load data-structures.json:', error.message);
    }
    
    // If no local questions, try to generate from common patterns
    if (allQuestions.length === 0) {
      allQuestions = generateDefaultQuestions(topic, difficulty);
    }
    
    // Filter by topic and difficulty
    let filteredQuestions = allQuestions.filter(q => 
      q.topic === topic && q.difficulty === difficulty
    );
    
    // If still no questions, try fuzzy matching
    if (filteredQuestions.length === 0) {
      filteredQuestions = allQuestions.filter(q => 
        q.difficulty === difficulty && (
          q.topic.includes(topic) || topic.includes(q.topic)
        )
      );
    }
    
    // Shuffle array
    filteredQuestions = shuffleArray(filteredQuestions);
    
    // Limit results
    const questions = filteredQuestions.slice(0, parseInt(limit));
    
    res.json(questions);
  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function generateDefaultQuestions(topic, difficulty) {
  // Fallback questions if no local data
  const commonQuestions = [
    {
      id: 'default-001',
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'easy',
      topic: 'arrays',
      examples: [{
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      }],
      hints: ['Use a hash map', 'Store complement values'],
      solution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}'
    }
  ];
  
  return commonQuestions.filter(q => q.topic === topic && q.difficulty === difficulty);
}

// Get a specific question by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Load questions from both files
    const neetcodePath = path.join(projectRoot, 'neetcode-75.json');
    const dataStructuresPath = path.join(projectRoot, 'data-structures.json');
    
    let allQuestions = [];
    
    try {
      const neetcodeData = JSON.parse(await fs.readFile(neetcodePath, 'utf8'));
      allQuestions = neetcodeData.questions || [];
    } catch (error) {
      console.warn('Could not load neetcode-75.json:', error.message);
    }
    
    try {
      const dataStructures = JSON.parse(await fs.readFile(dataStructuresPath, 'utf8'));
      const standardQuestions = dataStructures.questions?.sampleData || [];
      allQuestions = [...allQuestions, ...standardQuestions];
    } catch (error) {
      console.warn('Could not load data-structures.json:', error.message);
    }
    
    const question = allQuestions.find(q => q.id === id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error in GET /api/questions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available topics
router.get('/meta/topics', async (req, res) => {
  try {
    const topics = [
      { value: 'arrays', label: 'Arrays' },
      { value: 'strings', label: 'Strings' },
      { value: 'graphs', label: 'Graphs' },
      { value: 'dynamic-programming', label: 'Dynamic Programming' },
      { value: 'trees', label: 'Trees' }
    ];
    
    res.json(topics);
  } catch (error) {
    console.error('Error in GET /api/questions/meta/topics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default router;

