import React, { useEffect, useMemo, useState } from 'react';
import './CipherHistory.css';

const formatWhen = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
};

const preview = (value, max = 140) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
};

const CipherHistory = ({ user, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      if (!user || !token) {
        setLoading(false);
        setEntries([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:3001/api/history', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load history');
        if (!isMounted) return;
        setEntries(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!isMounted) return;
        setEntries([]);
        setError(e?.message || 'Failed to load history');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [user, token]);

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>📜 Cipher History</h2>
          <button className="history-close" onClick={onClose} aria-label="Close history">
            ×
          </button>
        </div>

        {loading ? (
          <div className="history-state">Loading history…</div>
        ) : error ? (
          <div className="history-state history-state--error">{error}</div>
        ) : entries.length === 0 ? (
          <div className="history-state">No history found.</div>
        ) : (
          <div className="history-list" aria-label="Cipher history list">
            {entries.map((entry) => {
              const when = formatWhen(entry?.created_at);
              const cipherType = entry?.cipher_type || 'unknown';
              const operation = entry?.operation || '';
              const inputLength = entry?.input_length;
              const executionTime = entry?.execution_time;
              const inputText = preview(entry?.input_text);
              const outputText = preview(entry?.output_text);
              const config = entry?.cipher_config;

              return (
                <div key={entry?.id ?? `${cipherType}-${when}`} className="history-item">
                  <div className="history-item-top">
                    <div className="history-title">
                      <strong>{cipherType}</strong>{operation ? ` — ${operation}` : ''}
                    </div>
                    <div className="history-meta">{when}</div>
                  </div>

                  <div className="history-details">
                    {Number.isFinite(Number(inputLength)) && (
                      <div>Input length: <strong>{Number(inputLength)}</strong></div>
                    )}
                    {Number.isFinite(Number(executionTime)) && (
                      <div>Execution: <strong>{Number(executionTime).toFixed(2)} ms</strong></div>
                    )}
                  </div>

                  {inputText && (
                    <div className="history-text">
                      <div className="history-label">Input</div>
                      <div className="history-mono">{inputText}</div>
                    </div>
                  )}

                  {outputText && (
                    <div className="history-text">
                      <div className="history-label">Output</div>
                      <div className="history-mono">{outputText}</div>
                    </div>
                  )}

                  {config && (
                    <details className="history-config">
                      <summary>Config</summary>
                      <pre className="history-pre">{JSON.stringify(config, null, 2)}</pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CipherHistory;
