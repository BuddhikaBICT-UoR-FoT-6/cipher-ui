import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onClose }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const toggleUserStatus = (userId, currentStatus) => {
    updateUser(userId, { is_active: !currentStatus, role: 'user' });
  };

  const toggleUserRole = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUser(userId, { role: newRole, is_active: true });
  };

  if (loading) {
    return (
      <div className="admin-overlay">
        <div className="admin-dashboard">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <div className="admin-dashboard">
        <div className="admin-header">
          <h2>🛡️ Admin Dashboard</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <h3>👥 Total Users</h3>
            <div className="stat-number">{stats.totalUsers || 0}</div>
          </div>
          <div className="stat-card">
            <h3>🔐 Custom Ciphers</h3>
            <div className="stat-number">{stats.totalCiphers || 0}</div>
          </div>
          <div className="stat-card">
            <h3>📈 Active Users (7d)</h3>
            <div className="stat-number">{stats.activeUsers || 0}</div>
          </div>
        </div>

        <div className="users-section">
          <h3>User Management</h3>
          <div className="users-table">
            <div className="table-header">
              <div>User</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Ciphers</div>
              <div>Joined</div>
              <div>Actions</div>
            </div>
            
            {users.map(user => (
              <div key={user.id} className="table-row">
                <div className="user-info">
                  <strong>{user.username || 'N/A'}</strong>
                </div>
                <div className="user-email">{user.email}</div>
                <div className={`user-role ${user.role}`}>
                  {user.role}
                </div>
                <div className={`user-status ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </div>
                <div className="cipher-count">{user.cipher_count}</div>
                <div className="join-date">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="user-actions">
                  <button
                    onClick={() => toggleUserRole(user.id, user.role)}
                    className={`role-btn ${user.role === 'admin' ? 'demote' : 'promote'}`}
                    title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  >
                    {user.role === 'admin' ? '👤' : '👑'}
                  </button>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    className={`status-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                    title={user.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {user.is_active ? '🚫' : '✅'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="delete-btn"
                    title="Delete User"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;