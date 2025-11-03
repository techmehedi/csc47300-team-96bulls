import express from 'express';

const router = express.Router();

// Piston API endpoint (free code execution API)
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

// Execute code using Piston API
router.post('/', async (req, res) => {
  try {
    const { code, language = 'javascript', stdin = '' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Execute code using Piston API
    const response = await fetch(PISTON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: language,
        version: '*', // Use latest version
        files: [{
          content: code
        }],
        stdin: stdin,
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
        memory_limit: -1
      })
    });

    if (!response.ok) {
      throw new Error(`Execution API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle Piston API response
    if (data.run) {
      res.json({
        success: true,
        output: data.run.stdout || '',
        stderr: data.run.stderr || '',
        error: data.run.code !== 0 ? `Exit code: ${data.run.code}` : null,
        executionTime: data.run.output ? 'N/A' : null
      });
    } else {
      throw new Error('Invalid response from execution API');
    }

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Code execution failed',
      output: null,
      stderr: error.message
    });
  }
});

export default router;

