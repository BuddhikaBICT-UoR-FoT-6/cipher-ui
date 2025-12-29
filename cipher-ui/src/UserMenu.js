import React, { useEffect, useMemo, useState } from 'react';
import { showToast } from './Toast';
import './UserMenu.css';

const UserMenu = ({ user, onLogout, onShowHistory, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(null);
  const [actionOtpSent, setActionOtpSent] = useState(false);
  const [actionOtp, setActionOtp] = useState('');
  const [actionOtpLoading, setActionOtpLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileStats, setProfileStats] = useState(null);
  const [profileBadges, setProfileBadges] = useState([]);
  const [profileBadgeAssets, setProfileBadgeAssets] = useState([]);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch('http://localhost:3001/api/me/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load profile');
        if (!isMounted) return;

        setProfileStats(data?.stats || null);
        setProfileBadges(Array.isArray(data?.badges) ? data.badges : []);
        setProfileBadgeAssets(Array.isArray(data?.badgeAssets) ? data.badgeAssets : []);
      } catch {
        if (!isMounted) return;
        setProfileStats(null);
        setProfileBadges([]);
        setProfileBadgeAssets([]);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    if (user && token) {
      fetchProfile();
    } else {
      setProfileLoading(false);
      setProfileStats(null);
      setProfileBadges([]);
      setProfileBadgeAssets([]);
    }

    return () => {
      isMounted = false;
    };
  }, [user, token]);

  useEffect(() => {
    setActionOtpSent(false);
    setActionOtp('');
    setActionOtpLoading(false);
  }, [showConfirm]);

  const hasBadge = (badge) => profileBadges.some((b) => (b?.badge || '').toLowerCase() === badge);

  const badgeAssetMap = useMemo(() => {
    const map = new Map();
    for (const asset of profileBadgeAssets) {
      const badge = (asset?.badge || '').toLowerCase();
      if (badge && asset?.url_path) map.set(badge, asset.url_path);
    }
    return map;
  }, [profileBadgeAssets]);

  const requestActionOtp = async (action) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('You must be logged in', 'error');
        return;
      }

      setActionOtpLoading(true);
      const endpoint = action === 'deactivate'
        ? 'http://localhost:3001/api/user/deactivate/request-otp'
        : 'http://localhost:3001/api/user/delete/request-otp';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setActionOtpSent(true);
        showToast('OTP sent to your email', 'success');
      } else {
        showToast(data.message || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      showToast('Error sending OTP', 'error');
    } finally {
      setActionOtpLoading(false);
    }
  };

  const deactivateAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('You must be logged in', 'error');
        return;
      }

      const otpValue = String(actionOtp || '').trim();
      if (!otpValue) {
        showToast('OTP is required', 'error');
        return;
      }

      const response = await fetch('http://localhost:3001/api/user/deactivate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: otpValue })
      });

      const data = await response.json();

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
      if (!token) {
        showToast('You must be logged in', 'error');
        return;
      }

      const otpValue = String(actionOtp || '').trim();
      if (!otpValue) {
        showToast('OTP is required', 'error');
        return;
      }

      const response = await fetch('http://localhost:3001/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: otpValue })
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
          <div style={{ padding: '10px 0' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>🏅 Profile</h4>
            {profileLoading ? (
              <p style={{ margin: 0, opacity: 0.85 }}>Loading stats…</p>
            ) : (
              <>
                <p style={{ margin: '0 0 6px 0' }}>
                  Challenges completed: <strong>{profileStats?.challenges_completed ?? 0}</strong>
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                  Total points: <strong>{profileStats?.total_points ?? 0}</strong>
                </p>

                <div>
                  <p style={{ margin: '0 0 6px 0' }}>
                    Badges:
                  </p>
                  <div className="badge-row" aria-label="Badges">
                    {[
                      { badge: 'bronze', label: 'Bronze', title: 'Bronze (3 completed)' },
                      { badge: 'silver', label: 'Silver', title: 'Silver (6 completed)' },
                      { badge: 'gold', label: 'Gold', title: 'Gold (11 completed)' },
                      { badge: 'diamond', label: 'Diamond', title: 'Diamond (solve final/hardest challenge)' },
                    ].map(({ badge, label, title }) => {
                      const src = badgeAssetMap.get(badge);
                      const earned = hasBadge(badge);
                      const alt = `${label} badge`;

                      return (
                        <div key={badge} className="badge-item" title={title}>
                          {src ? (
                            <img
                              className={`badge-img ${earned ? '' : 'badge-img--locked'}`}
                              src={`http://localhost:3001${src}`}
                              alt={alt}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className={`badge-img badge-img--placeholder ${earned ? '' : 'badge-img--locked'}`}
                              aria-label={alt}
                            />
                          )}
                          <span className="badge-label">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="menu-actions">
          <button
            className="menu-btn history-btn"
            onClick={() => {
              if (onShowHistory) onShowHistory();
            }}
          >
            📜 Cipher History
          </button>

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

            {!actionOtpSent ? (
              <div style={{ margin: '10px 0' }}>
                <button
                  className="confirm-btn"
                  onClick={() => requestActionOtp(showConfirm)}
                  disabled={actionOtpLoading}
                >
                  {actionOtpLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="form-group" style={{ margin: '10px 0' }}>
                <label>OTP:</label>
                <input
                  type="text"
                  value={actionOtp}
                  onChange={(e) => setActionOtp(e.target.value)}
                  placeholder="Enter OTP"
                  inputMode="numeric"
                />
              </div>
            )}

            <div className="confirm-actions">
              <button 
                className="confirm-btn"
                onClick={showConfirm === 'deactivate' ? deactivateAccount : deleteAccount}
                disabled={!actionOtpSent || !String(actionOtp || '').trim()}
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