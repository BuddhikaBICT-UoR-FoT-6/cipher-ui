import React, { useState, useEffect } from 'react';
import { showConfirmToast, showToast } from './Toast';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onClose }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    emailFrom: '',
    hasSmtpPass: false,
  });
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchEmailSettings();
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

  const addUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        setNewUser({ username: '', email: '', password: '', role: 'user' });
        setShowAddUser(false);
        fetchUsers();
        fetchStats();
        showToast('User added successfully!', 'success');
      } else {
        showToast('Failed to add user', 'error');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      showToast('Error adding user', 'error');
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/email-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmailSettings((prev) => ({
          ...prev,
          ...data,
          smtpPass: '',
        }));
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setSavingEmailSettings(true);
      const token = localStorage.getItem('token');
      const payload = {
        enabled: emailSettings.enabled,
        provider: emailSettings.provider,
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpSecure: emailSettings.smtpSecure,
        smtpUser: emailSettings.smtpUser,
        smtpPass: emailSettings.smtpPass,
        emailFrom: emailSettings.emailFrom,
      };

      const response = await fetch('http://localhost:3001/api/admin/email-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Email settings saved!', 'success');
        await fetchEmailSettings();
      } else {
        const body = await response.json().catch(() => ({}));
        showToast(body.message || 'Failed to save email settings', 'error');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      showToast('Error saving email settings', 'error');
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const toggleUserRole = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUser(userId, { role: newRole, is_active: true });
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
        showToast('User updated successfully!', 'success');
      } else {
        showToast('Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Error updating user', 'error');
    }
  };

  const performDeleteUser = async (userId) => {
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
        fetchStats();
        showToast('User deleted successfully!', 'success');
      } else {
        showToast('Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Error deleting user', 'error');
    }
  };

  const deleteUser = (userId) => {
    showConfirmToast({
      message: 'Are you sure you want to delete this user?',
      type: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => performDeleteUser(userId),
    });
  };

  const toggleUserStatus = (userId, currentStatus) => {
    updateUser(userId, { is_active: !currentStatus, role: 'user' });
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
          <div className="section-header">
            <h3>Email Settings</h3>
          </div>
          <div style={{ padding: '10px 0' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={!!emailSettings.enabled}
                onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
              />{' '}
              Enable emails (OTPs + login/security notifications)
            </label>

            <div style={{ display: 'grid', gap: 8 }}>
              <select
                value={emailSettings.provider}
                onChange={(e) => setEmailSettings({ ...emailSettings, provider: e.target.value })}
              >
                <option value="smtp">SMTP (Gmail recommended)</option>
                <option value="ethereal">Ethereal (safe dev inbox)</option>
              </select>

              <input
                type="text"
                placeholder="SMTP Host (e.g. smtp.gmail.com)"
                value={emailSettings.smtpHost || ''}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                disabled={emailSettings.provider !== 'smtp'}
              />
              <input
                type="number"
                placeholder="SMTP Port (e.g. 587)"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: Number(e.target.value) })}
                disabled={emailSettings.provider !== 'smtp'}
              />
              <label style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={!!emailSettings.smtpSecure}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
                  disabled={emailSettings.provider !== 'smtp'}
                />{' '}
                SMTP Secure (usually false for port 587)
              </label>
              <input
                type="email"
                placeholder="SMTP User (sender email)"
                value={emailSettings.smtpUser || ''}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                disabled={emailSettings.provider !== 'smtp'}
              />
              <input
                type="password"
                placeholder={emailSettings.hasSmtpPass ? 'SMTP Password (leave blank to keep current)' : 'SMTP Password (Gmail App Password)'}
                value={emailSettings.smtpPass}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                disabled={emailSettings.provider !== 'smtp'}
              />
              <input
                type="text"
                placeholder="From Address (optional)"
                value={emailSettings.emailFrom || ''}
                onChange={(e) => setEmailSettings({ ...emailSettings, emailFrom: e.target.value })}
                disabled={emailSettings.provider !== 'smtp'}
              />

              <button
                className="add-user-btn"
                onClick={saveEmailSettings}
                disabled={savingEmailSettings}
              >
                {savingEmailSettings ? 'Saving…' : 'Save Email Settings'}
              </button>
            </div>
          </div>
        </div>

        <div className="users-section">
          <div className="section-header">
            <h3>User Management</h3>
            <button 
              className="add-user-btn"
              onClick={() => setShowAddUser(true)}
            >
              ➕ Add User
            </button>
          </div>
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

        {showAddUser && (
          <div className="add-user-modal">
            <div className="modal-content">
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowAddUser(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h3>Add New User</h3>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div className="modal-actions">
                <button onClick={addUser} className="save-btn">Save</button>
                <button onClick={() => setShowAddUser(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;