/**
 * Saved Messages overlay.
 *
 * Major logic:
 * - Displays user saved/encrypted messages
 * - Currently placeholder/mock UI (no backend fetch wired in this component)
 */

import React, { useState, useEffect } from 'react';
import './SavedMessages.css';

const SavedMessages = ({ user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock messages for now.
    // If/when wired to the backend, fetch from /api/saved-messages.
    setMessages([]);
    setLoading(false);
  }, []);

  if (loading) return <div className="loading">Loading messages...</div>;

  return (
    <div className="messages-overlay">
      <div className="messages-modal">
        <div className="messages-header">
          <h2>💾 Saved Messages</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="no-messages">
          <p>No saved messages found.</p>
        </div>
      </div>
    </div>
  );
};

export default SavedMessages;