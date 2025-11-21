import React, { useState } from 'react';
import { showToast } from './Toast';
import './UserMenu.css';

const UserMenu = ({ user, onLogout, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(null);

  const deactivateAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Deactivating account with token:', token);
      
      const response = await fetch('http://localhost:3001/api/user/deactivate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Deactivate response:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        showToast('Account deactivated successfully', 'success');
        onLogout();
      } else {
        showToast(data.message || 'Failed to deactivate account', 'error');
      }
    } catch (error) {
      console.error('Deactivate error:', error);
      showToast('Error deactivating account', 'error');
    }
    setShowConfirm(null);
  };

  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Account deleted successfully', 'success');
        onLogout();
      } else {
        showToast(data.message || 'Failed to delete account', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Error deleting account', 'error');
    }
    setShowConfirm(null);
  };

  return (
    <div className="user-menu-overlay" onClick={onClose}>
      <div className="user-menu" onClick={(e) => e.stopPropagation()}>
        <div className="user-info">
          <h3>👤 {user.username || user.email}</h3>
          <p>{user.email}</p>
          <span className={`role-badge ${user.role}`}>{user.role}</span>
        </div>
        
        <div className="menu-actions">
          <button 
            className="menu-btn deactivate-btn"
            onClick={() => setShowConfirm('deactivate')}
          >
            🚫 Deactivate Account
          </button>
          
          <button 
            className="menu-btn delete-btn"
            onClick={() => setShowConfirm('delete')}
          >
            🗑️ Delete Account
          </button>
        </div>

        {showConfirm && (
          <div className="confirm-dialog">
            <h4>⚠️ Confirm Action</h4>
            <p>
              {showConfirm === 'deactivate' 
                ? 'Are you sure you want to deactivate your account? You can reactivate it within 30 days by logging in. After 30 days, the account will be permanently deactivated.'
                : 'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.'
              }
            </p>
            <div className="confirm-actions">
              <button 
                className="confirm-btn"
                onClick={showConfirm === 'deactivate' ? deactivateAccount : deleteAccount}
              >
                Yes, {showConfirm === 'deactivate' ? 'Deactivate' : 'Delete'}
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;