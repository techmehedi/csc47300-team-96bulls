import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, sessionService } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';

const UserDetails = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      const [userData, sessionsData] = await Promise.all([
        userService.getUserById(userId),
        sessionService.getUserSessions(userId),
      ]);
      setUser(userData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading user details:', error);
      // Demo data
      setUser({
        id: userId,
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@example.com',
        createdAt: new Date().toISOString(),
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return <div>User not found</div>;

  return (
    <>
      <Header />
      <main>
        <section className="admin-container" style={{ marginTop: '100px' }}>
          <div className="admin-header">
            <div>
              <Link to="/admin/users" className="btn-link">
                <i className="fa-solid fa-arrow-left"></i> Back to Users
              </Link>
              <h1 style={{ marginTop: '1rem' }}>
                {user.firstName} {user.lastName}
              </h1>
              {user.deleted && (
                <div className="deleted-indicator">
                  <i className="fa-solid fa-trash"></i>
                  This user has been deleted
                </div>
              )}
            </div>
          </div>

          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Information
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Practice History
            </button>
            <button
              className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Statistics
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="detail-grid">
              <div className="detail-item">
                <label>User ID</label>
                <div className="value">{user.id}</div>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <div className="value">{user.email}</div>
              </div>
              <div className="detail-item">
                <label>First Name</label>
                <div className="value">{user.firstName}</div>
              </div>
              <div className="detail-item">
                <label>Last Name</label>
                <div className="value">{user.lastName}</div>
              </div>
              <div className="detail-item">
                <label>Role</label>
                <div className="value">
                  <span className={`badge ${user.role || 'user'}`}>
                    {user.role || 'user'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <label>Member Since</label>
                <div className="value">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="data-table">
              <h3>Practice Sessions ({sessions.length})</h3>
              {sessions.length === 0 ? (
                <p>No practice sessions yet</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Topic</th>
                      <th>Difficulty</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td>
                          <Link to={`/admin/sessions/${session.id}`}>
                            {session.id.slice(0, 8)}...
                          </Link>
                        </td>
                        <td>{session.topic}</td>
                        <td>
                          <span className={`badge ${session.difficulty}`}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td>{session.score || 0}%</td>
                        <td>
                          <span className={`badge ${session.status}`}>
                            {session.status}
                          </span>
                        </td>
                        <td>{new Date(session.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Link
                            to={`/admin/sessions/${session.id}`}
                            className="btn-icon"
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="admin-stats">
              <div className="stat-card">
                <h3>Total Sessions</h3>
                <div className="stat-value">{sessions.length}</div>
              </div>
              <div className="stat-card">
                <h3>Completed</h3>
                <div className="stat-value">
                  {sessions.filter((s) => s.status === 'completed').length}
                </div>
              </div>
              <div className="stat-card">
                <h3>Average Score</h3>
                <div className="stat-value">
                  {sessions.length > 0
                    ? Math.round(
                        sessions.reduce((acc, s) => acc + (s.score || 0), 0) / sessions.length
                      )
                    : 0}
                  %
                </div>
              </div>
              <div className="stat-card">
                <h3>Active</h3>
                <div className="stat-value">
                  {sessions.filter((s) => s.status === 'active').length}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default UserDetails;
