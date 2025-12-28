import React, { useState, useEffect } from 'react';
import './SavedMessages.css';

const SavedMessages = ({ user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock messages for now
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