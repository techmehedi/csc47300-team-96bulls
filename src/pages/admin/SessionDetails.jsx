import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sessionService } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';

const SessionDetails = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  const loadSessionDetails = async () => {
    try {
      const data = await sessionService.getSessionById(sessionId);
      setSession(data);
    } catch (error) {
      console.error('Error loading session details:', error);
      // Demo data
      setSession({
        id: sessionId,
        userId: 'demo-user-id',
        topic: 'arrays',
        difficulty: 'medium',
        status: 'completed',
        score: 85,
        timeLimit: 30,
        totalTime: 25,
        questions: [],
        results: [],
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!session) return <div>Session not found</div>;

  return (
    <>
      <Header />
      <main>
        <section className="admin-container" style={{ marginTop: '100px' }}>
          <div className="admin-header">
            <div>
              <Link to="/admin/sessions" className="btn-link">
                <i className="fa-solid fa-arrow-left"></i> Back to Sessions
              </Link>
              <h1 style={{ marginTop: '1rem' }}>Session Details</h1>
              {session.deleted && (
                <div className="deleted-indicator">
                  <i className="fa-solid fa-trash"></i>
                  This session has been deleted
                </div>
              )}
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <label>Session ID</label>
              <div className="value">{session.id}</div>
            </div>
            <div className="detail-item">
              <label>User</label>
              <div className="value">
                <Link to={`/admin/users/${session.userId}`}>
                  {session.userId}
                </Link>
              </div>
            </div>
            <div className="detail-item">
              <label>Topic</label>
              <div className="value">{session.topic}</div>
            </div>
            <div className="detail-item">
              <label>Difficulty</label>
              <div className="value">
                <span className={`badge ${session.difficulty}`}>
                  {session.difficulty}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <div className="value">
                <span className={`badge ${session.status}`}>
                  {session.status}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <label>Score</label>
              <div className="value">{session.score || 0}%</div>
            </div>
            <div className="detail-item">
              <label>Time Limit</label>
              <div className="value">{session.timeLimit} minutes</div>
            </div>
            <div className="detail-item">
              <label>Time Spent</label>
              <div className="value">{session.totalTime || 0} minutes</div>
            </div>
            <div className="detail-item">
              <label>Created At</label>
              <div className="value">
                {new Date(session.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="detail-item">
              <label>Questions</label>
              <div className="value">{session.questions?.length || 0}</div>
            </div>
          </div>

          {session.results && session.results.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Results</h3>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Question ID</th>
                      <th>Status</th>
                      <th>Time Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.results.map((result, index) => (
                      <tr key={index}>
                        <td>{result.questionId}</td>
                        <td>
                          <span
                            className={`badge ${result.correct ? 'completed' : 'easy'}`}
                          >
                            {result.correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </td>
                        <td>{result.timeSpent || 0} seconds</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default SessionDetails;
