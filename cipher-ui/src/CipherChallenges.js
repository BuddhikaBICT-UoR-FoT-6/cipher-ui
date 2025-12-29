/**
 * Cipher Challenges overlay.
 *
 * Note: this component currently uses mock data for the list view.
 * The interactive 20-step mode is implemented in CryptanalysisChallenge.
 */

import React, { useState, useEffect } from 'react';
import './CipherChallenges.css';

const CipherChallenges = ({ user, onClose }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock challenges for now.
    // If/when this view is wired to the backend, replace this with a fetch call.
    setChallenges([
      {
        id: 1,
        title: 'Caesar Cipher - Easy',
        description: 'Decrypt this Caesar cipher with shift 3',
        encrypted_text: 'WKLV LV D VHFUHW PHVVDJH',
        difficulty: 'easy',
        points: 10
      }
    ]);
    setLoading(false);
  }, []);

  if (loading) return <div className="loading">Loading challenges...</div>;

  return (
    <div className="challenges-overlay">
      <div className="challenges-modal">
        <div className="challenges-header">
          <h2>🧩 Cipher Challenges</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="challenges-list">
          {challenges.map(challenge => (
            <div key={challenge.id} className="challenge-card">
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CipherChallenges;