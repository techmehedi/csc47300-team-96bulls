import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { statsService } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsService.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      // Demo data for when backend is not ready
      setStats({
        totalUsers: 0,
        totalSessions: 0,
        totalQuestions: 75,
        activeUsers: 0,
      });
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
              <h1>Admin Dashboard</h1>
              <p className="subtitle">
                Welcome, {admin?.email} 
                <span className={`badge ${admin?.role}`} style={{ marginLeft: '1rem' }}>
                  {admin?.role === 'admin2' ? 'Admin Level 2' : 'Admin Level 1'}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="admin-container">
          <div className="admin-stats">
            <div className="stat-card">
              <h3>Total Users</h3>
              <div className="stat-value">{stats?.totalUsers || 0}</div>
              <Link to="/admin/users" className="stat-link">View All →</Link>
            </div>
            <div className="stat-card">
              <h3>Total Sessions</h3>
              <div className="stat-value">{stats?.totalSessions || 0}</div>
              <Link to="/admin/sessions" className="stat-link">View All →</Link>
            </div>
            <div className="stat-card">
              <h3>Questions</h3>
              <div className="stat-value">{stats?.totalQuestions || 75}</div>
              <Link to="/admin/questions" className="stat-link">Manage →</Link>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <div className="stat-value">{stats?.activeUsers || 0}</div>
            </div>
          </div>

          <div className="admin-actions">
            <h2>Quick Actions</h2>
            <div className="feature-grid">
              <Link to="/admin/users" className="feature-card">
                <i className="fa-solid fa-users"></i>
                <h3>Manage Users</h3>
                <p>View, edit, and manage user accounts</p>
              </Link>
              <Link to="/admin/sessions" className="feature-card">
                <i className="fa-solid fa-calendar"></i>
                <h3>Manage Sessions</h3>
                <p>Monitor and manage practice sessions</p>
              </Link>
              <Link to="/admin/questions" className="feature-card">
                <i className="fa-solid fa-question-circle"></i>
                <h3>Manage Questions</h3>
                <p>Add, edit, and remove questions</p>
              </Link>
              {admin?.role === 'admin2' && (
                <div className="feature-card" style={{ background: '#f8d7da' }}>
                  <i className="fa-solid fa-user-shield"></i>
                  <h3>Admin 2 Privileges</h3>
                  <p>Full CRUD access + User management</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AdminDashboard;
