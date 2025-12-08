import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionService, statsService } from '../services/apiService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, sessionsData] = await Promise.all([
        statsService.getUserStats(user?.id),
        sessionService.getUserSessions(user?.id),
      ]);
      setStats(statsData);
      setSessions(sessionsData.slice(0, 5)); // Latest 5 sessions
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h1>Welcome back, {user?.firstName}!</h1>
              <p className="subtitle">Track your progress and continue practicing</p>
            </div>
          </div>
        </section>

        <section className="container">
          <div className="admin-stats">
            <div className="stat-card">
              <h3>Total Solved</h3>
              <div className="stat-value">{stats?.totalSolved || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Accuracy</h3>
              <div className="stat-value">{stats?.accuracy || 0}%</div>
            </div>
            <div className="stat-card">
              <h3>Current Streak</h3>
              <div className="stat-value">{stats?.streak || 0} days</div>
            </div>
            <div className="stat-card">
              <h3>Time Spent</h3>
              <div className="stat-value">{stats?.timeSpent || 0}h</div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Recent Sessions</h2>
            {sessions.length === 0 ? (
              <div className="empty-state">
                <p>No practice sessions yet</p>
                <Link to="/practice" className="btn btn-primary">
                  Start Practicing
                </Link>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Difficulty</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td>{session.topic}</td>
                        <td>
                          <span className={`badge ${session.difficulty}`}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td>{session.score}%</td>
                        <td>{new Date(session.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="cta-section" style={{ marginTop: '3rem' }}>
            <Link to="/practice" className="btn btn-primary btn-lg">
              Start New Practice Session
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Dashboard;
