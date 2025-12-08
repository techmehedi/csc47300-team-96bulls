import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const UserManagement = () => {
  const { admin, adminRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [showDeleted]);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers({ includeDeleted: showDeleted });
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Demo mode
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser({
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (adminRole !== 'admin2') {
      alert('Only Admin 2 can delete users');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      loadUsers();
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    }
  };

  const handleRestore = async (userId) => {
    if (adminRole !== 'admin2') {
      alert('Only Admin 2 can restore users');
      return;
    }

    try {
      await userService.restoreUser(userId);
      loadUsers();
    } catch (error) {
      alert('Error restoring user: ' + error.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser.id) {
        await userService.updateUser(editingUser.id, editingUser);
      } else {
        await userService.createUser(editingUser);
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      alert('Error saving user: ' + error.message);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header />
      <main>
        <section className="admin-container" style={{ marginTop: '100px' }}>
          <div className="admin-header">
            <h1>User Management</h1>
            <button onClick={handleCreate} className="btn btn-primary">
              <i className="fa-solid fa-plus"></i> Create User
            </button>
          </div>

          <div className="search-filter-bar">
            <input
              type="text"
              placeholder="Search users..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {adminRole === 'admin2' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                />
                Show Deleted Users
              </label>
            )}
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ opacity: user.deleted ? 0.6 : 1 }}>
                    <td>
                      <Link to={`/admin/users/${user.id}`}>
                        {user.firstName} {user.lastName}
                      </Link>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role || 'user'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      {user.deleted ? (
                        <span className="badge" style={{ background: '#f8d7da', color: '#721c24' }}>
                          Deleted
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#d4edda', color: '#155724' }}>
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/admin/users/${user.id}`} className="btn-icon" title="View Details">
                          <i className="fa-solid fa-eye"></i>
                        </Link>
                        {!user.deleted && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="btn-icon"
                            title="Edit"
                          >
                            <i className="fa-solid fa-edit"></i>
                          </button>
                        )}
                        {adminRole === 'admin2' && (
                          user.deleted ? (
                            <button
                              onClick={() => handleRestore(user.id)}
                              className="btn-icon"
                              title="Restore"
                            >
                              <i className="fa-solid fa-undo"></i>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="btn-icon delete"
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingUser.id ? 'Edit User' : 'Create User'}</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, lastName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    required
                  />
                </div>
                {adminRole === 'admin2' && (
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={editingUser.role || 'user'}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin1">Admin 1</option>
                      <option value="admin2">Admin 2</option>
                    </select>
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default UserManagement;
