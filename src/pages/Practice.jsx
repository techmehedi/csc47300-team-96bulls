import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionService, questionService } from '../services/apiService';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Practice = () => {
  const { user } = useAuth();
  const [sessionConfig, setSessionConfig] = useState({
    topic: '',
    difficulty: '',
    timeLimit: 30,
  });
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState('');

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setSessionConfig((prev) => ({ ...prev, [name]: value }));
  };

  const startSession = async (e) => {
    e.preventDefault();
    
    try {
      // Fetch questions
      const questionsData = await questionService.getAllQuestions({
        topic: sessionConfig.topic,
        difficulty: sessionConfig.difficulty,
        limit: 5,
      });
      
      // Create session
      const session = await sessionService.createSession({
        userId: user?.id,
        ...sessionConfig,
        questions: questionsData.map(q => q.id),
      });
      
      setQuestions(questionsData);
      setCurrentSession(session);
      setSessionStarted(true);
      setCode(questionsData[0]?.solution || '');
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Using demo mode.');
      // Demo mode
      setSessionStarted(true);
      setQuestions([{
        id: 'demo-1',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: sessionConfig.difficulty,
        topic: sessionConfig.topic,
      }]);
    }
  };

  const submitCode = async () => {
    if (!currentSession) return;
    
    try {
      await sessionService.updateSession(currentSession.id, {
        status: 'completed',
        results: [{ questionId: questions[currentQuestionIndex].id, code }],
      });
      alert('Code submitted!');
    } catch (error) {
      console.error('Error submitting code:', error);
    }
  };

  if (!sessionStarted) {
    return (
      <>
        <Header />
        <main>
          <section className="hero">
            <div className="container">
              <div className="hero-content">
                <h1>Practice Session</h1>
                <p className="subtitle">Configure your practice settings</p>
              </div>
            </div>
          </section>

          <section className="container">
            <div className="auth-container">
              <div className="auth-card">
                <form onSubmit={startSession} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="topic">Topic</label>
                    <select
                      id="topic"
                      name="topic"
                      value={sessionConfig.topic}
                      onChange={handleConfigChange}
                      required
                    >
                      <option value="">Select a topic</option>
                      <option value="arrays">Arrays</option>
                      <option value="strings">Strings</option>
                      <option value="graphs">Graphs</option>
                      <option value="trees">Trees</option>
                      <option value="dynamic-programming">Dynamic Programming</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="difficulty">Difficulty</label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      value={sessionConfig.difficulty}
                      onChange={handleConfigChange}
                      required
                    >
                      <option value="">Select difficulty</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="timeLimit">Time Limit (minutes)</label>
                    <input
                      type="number"
                      id="timeLimit"
                      name="timeLimit"
                      value={sessionConfig.timeLimit}
                      onChange={handleConfigChange}
                      min="10"
                      max="120"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    Start Practice Session
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <Header />
      <main>
        <section className="container" style={{ marginTop: '100px' }}>
          <div className="practice-container">
            <div className="question-panel">
              <h2>{currentQuestion?.title}</h2>
              <span className={`badge ${currentQuestion?.difficulty}`}>
                {currentQuestion?.difficulty}
              </span>
              <p>{currentQuestion?.description}</p>
            </div>

            <div className="code-panel">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your solution here..."
                rows="20"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
              />
              <div className="form-actions">
                <button onClick={submitCode} className="btn btn-primary">
                  Submit Solution
                </button>
                <button
                  onClick={() => setSessionStarted(false)}
                  className="btn btn-secondary"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Practice;
