import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sessionService } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const SessionManagement = () => {
  const { adminRole } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [showDeleted]);

  const loadSessions = async () => {
    try {
      const data = await sessionService.getAllSessions({ includeDeleted: showDeleted });
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (adminRole !== 'admin2') {
      alert('Only Admin 2 can delete sessions');
      return;
    }

    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await sessionService.deleteSession(sessionId);
      loadSessions();
    } catch (error) {
      alert('Error deleting session: ' + error.message);
    }
  };

  const handleRestore = async (sessionId) => {
    if (adminRole !== 'admin2') {
      alert('Only Admin 2 can restore sessions');
      return;
    }

    try {
      await sessionService.restoreSession(sessionId);
      loadSessions();
    } catch (error) {
      alert('Error restoring session: ' + error.message);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = !filterTopic || session.topic === filterTopic;
    const matchesDifficulty = !filterDifficulty || session.difficulty === filterDifficulty;
    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header />
      <main>
        <section className="admin-container" style={{ marginTop: '100px' }}>
          <div className="admin-header">
            <h1>Session Management</h1>
          </div>

          <div className="search-filter-bar">
            <input
              type="text"
              placeholder="Search sessions..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
            >
              <option value="">All Topics</option>
              <option value="arrays">Arrays</option>
              <option value="strings">Strings</option>
              <option value="graphs">Graphs</option>
              <option value="trees">Trees</option>
              <option value="dynamic-programming">Dynamic Programming</option>
            </select>
            <select
              className="filter-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {adminRole === 'admin2' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                />
                Show Deleted
              </label>
            )}
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>User</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id} style={{ opacity: session.deleted ? 0.6 : 1 }}>
                    <td>
                      <Link to={`/admin/sessions/${session.id}`}>
                        {session.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td>
                      <Link to={`/admin/users/${session.userId}`}>
                        {session.userId?.slice(0, 8)}...
                      </Link>
                    </td>
                    <td>{session.topic}</td>
                    <td>
                      <span className={`badge ${session.difficulty}`}>
                        {session.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${session.status}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>{session.score || 0}%</td>
                    <td>{new Date(session.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/admin/sessions/${session.id}`}
                          className="btn-icon"
                          title="View Details"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </Link>
                        {adminRole === 'admin2' &&
                          (session.deleted ? (
                            <button
                              onClick={() => handleRestore(session.id)}
                              className="btn-icon"
                              title="Restore"
                            >
                              <i className="fa-solid fa-undo"></i>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="btn-icon delete"
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default SessionManagement;
