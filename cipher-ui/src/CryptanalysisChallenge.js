/**
 * Cryptanalysis Challenge (20-step run).
 *
 * Major logic:
 * - Loads challenges from the backend, then creates a deterministic 20-step run order
 * - Persists progress per-user in localStorage so runs can resume after refresh/logout
 * - Tracks attempts/timing; applies wrong-attempt rules (offer lower difficulty, then reveal)
 * - Reports attempts to the backend for scoring/badges
 */

import React, { useEffect, useMemo, useState } from 'react';
import { showToast } from './Toast';
import { apiUrl } from './apiBase';
import './CryptanalysisChallenge.css';

// Convert difficulty labels into an ordering value (used for run order).
const difficultyRank = (difficulty) => {
  switch ((difficulty || '').toLowerCase()) {
    case 'easy':
      return 1;
    case 'medium':
      return 2;
    case 'hard':
      return 3;
    default:
      return 2;
  }
};

// Build the default run order (max 20 unique steps), easy -> hard.
const buildDefaultOrderIds = (challengeList) => {
  const list = Array.isArray(challengeList) ? [...challengeList] : [];
  list.sort((a, b) => {
    const dr = difficultyRank(a?.difficulty) - difficultyRank(b?.difficulty);
    if (dr !== 0) return dr;
    const pr = (Number(a?.points) || 0) - (Number(b?.points) || 0);
    if (pr !== 0) return pr;
    return (Number(a?.id) || 0) - (Number(b?.id) || 0);
  });
  // A "run" is 20 unique steps max.
  return list.map((c) => c.id).slice(0, 20);
};

// Per-user storage keys so different users don't overwrite each other's run state.
const getGameStorageKey = (userId) => (userId ? `cryptanalysisGame:v1:${userId}` : null);
const getGameHistoryKey = (userId) => (userId ? `cryptanalysisGameHistory:v1:${userId}` : null);

// Defensive parse (avoids throwing if localStorage is corrupted).
const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// Lightweight hints by cipher family (doesn't leak the answer).
const algorithmHint = (cipherType) => {
  switch ((cipherType || '').toLowerCase()) {
    case 'caesar':
      return 'Try shifting letters by a constant amount (frequency helps).';
    case 'rot13':
      return 'ROT13 is Caesar with shift 13 — apply it once to decode.';
    case 'atbash':
      return 'Atbash mirrors the alphabet: A↔Z, B↔Y, etc.';
    case 'vigenere':
      return 'Vigenère uses a repeating key; look for a likely keyword.';
    case 'railfence':
    case 'rail_fence':
      return 'Rail Fence is a zig‑zag transposition; try different rail counts.';
    default:
      return 'Look for patterns, repeated letters, and likely plaintext words.';
  }
};

// Standardize outcome toasts for consistent UX.
const normalizeOutcomeToast = (outcome, points) => {
  if (outcome === 'correct') {
    const cheers = ['Brilliant!', 'Nice work!', 'Great decode!', 'Cipher cracked!'];
    const msg = cheers[Math.floor(Math.random() * cheers.length)];
    return { message: points ? `${msg} +${points} points.` : msg, type: 'success' };
  }
  if (outcome === 'skipped') return { message: 'Skipped — you can try another one.', type: 'warning' };
  if (outcome === 'revealed') return { message: 'Answer revealed — counted as a fail.', type: 'warning' };
  return { message: 'Not quite — try again!', type: 'warning' };
};

const CryptanalysisChallenge = ({ user, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [orderIds, setOrderIds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);
  const [failedIds, setFailedIds] = useState([]);
  const [pointsThisRun, setPointsThisRun] = useState(0);
  const [runOver, setRunOver] = useState(false);
  const [roundOver, setRoundOver] = useState(false);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [challengeStartedAtMs, setChallengeStartedAtMs] = useState(null);
  const [wrongAttemptsThisChallenge, setWrongAttemptsThisChallenge] = useState(0);
  const [loweredDifficultyMode, setLoweredDifficultyMode] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [prompt, setPrompt] = useState(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  const challengesById = useMemo(() => {
    const map = new Map();
    (Array.isArray(challenges) ? challenges : []).forEach((c) => {
      if (c && c.id != null) map.set(c.id, c);
    });
    return map;
  }, [challenges]);

  const storageKey = useMemo(() => getGameStorageKey(user?.id), [user?.id]);
  const historyKey = useMemo(() => getGameHistoryKey(user?.id), [user?.id]);

  const resolvedIds = useMemo(() => {
    const set = new Set();
    completedIds.forEach((id) => set.add(id));
    failedIds.forEach((id) => set.add(id));
    return Array.from(set);
  }, [completedIds, failedIds]);

  useEffect(() => {
    let isMounted = true;

    const fetchChallenges = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const res = await fetch(apiUrl('/api/challenges'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load challenges');
        }

        const data = await res.json();
        if (!isMounted) return;

        const list = Array.isArray(data) ? data : [];
        setChallenges(list);

        const saved = storageKey ? safeParseJson(localStorage.getItem(storageKey)) : null;
        const idsInApi = new Set(list.map((c) => c.id));
        const hasValidSavedOrder =
          saved &&
          Array.isArray(saved.orderIds) &&
          saved.orderIds.length > 0 &&
          saved.orderIds.every((id) => idsInApi.has(id));

        const nextOrderIds = hasValidSavedOrder ? saved.orderIds : buildDefaultOrderIds(list);
        const nextCompletedIds =
          saved && Array.isArray(saved.completedIds)
            ? saved.completedIds.filter((id) => idsInApi.has(id))
            : [];
        const nextFailedIds =
          saved && Array.isArray(saved.failedIds)
            ? saved.failedIds.filter((id) => idsInApi.has(id))
            : [];

        const rawIndex = saved && Number.isFinite(Number(saved.activeIndex)) ? parseInt(saved.activeIndex, 10) : 0;
        const clampedIndex = Math.min(Math.max(rawIndex, 0), Math.max(nextOrderIds.length - 1, 0));

        setOrderIds(nextOrderIds);
        setCompletedIds(nextCompletedIds);
        setFailedIds(nextFailedIds);
        setPointsThisRun(saved && Number.isFinite(Number(saved.pointsThisRun)) ? Number(saved.pointsThisRun) : 0);
        setRunOver(false);
        setRoundOver(false);
        setResult(null);
        setAnswer('');
        setWrongAttemptsThisChallenge(
          saved && Number.isFinite(Number(saved.wrongAttemptsThisChallenge))
            ? Number(saved.wrongAttemptsThisChallenge)
            : 0
        );
        setLoweredDifficultyMode(!!(saved && saved.loweredDifficultyMode));
        setRevealedAnswer(saved?.revealedAnswer || null);

        // If the saved active challenge is already completed, advance to the next incomplete one.
        const advanceToNextUnresolved = (startIndex) => {
          const resolved = new Set([...nextCompletedIds, ...nextFailedIds]);
          for (let i = 0; i < nextOrderIds.length; i++) {
            const idx = (startIndex + i) % nextOrderIds.length;
            if (!resolved.has(nextOrderIds[idx])) return idx;
          }
          return startIndex;
        };

        const nextIndex = advanceToNextUnresolved(clampedIndex);
        setActiveIndex(nextIndex);
        setChallengeStartedAtMs(Date.now());
      } catch (e) {
        if (!isMounted) return;
        showToast('Failed to load cryptanalysis challenges.', 'error');
        setChallenges([]);
        setOrderIds([]);
        setCompletedIds([]);
        setFailedIds([]);
        setPointsThisRun(0);
        setRunOver(false);
        setRoundOver(false);
        setChallengeStartedAtMs(null);
        setWrongAttemptsThisChallenge(0);
        setLoweredDifficultyMode(false);
        setRevealedAnswer(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChallenges();

    return () => {
      isMounted = false;
    };
  }, [user, token, storageKey]);

  // Persist game progress for resume-after-logout.
  useEffect(() => {
    if (!storageKey) return;
    if (!orderIds.length) return;

    const payload = {
      version: 1,
      orderIds,
      activeIndex,
      completedIds,
      failedIds,
      pointsThisRun,
      challengeStartedAtMs,
      wrongAttemptsThisChallenge,
      loweredDifficultyMode,
      revealedAnswer,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [
    storageKey,
    orderIds,
    activeIndex,
    completedIds,
    failedIds,
    pointsThisRun,
    challengeStartedAtMs,
    wrongAttemptsThisChallenge,
    loweredDifficultyMode,
    revealedAnswer,
  ]);

  const activeId = orderIds[activeIndex];
  const active = activeId != null ? challengesById.get(activeId) : null;

  const totalCount = orderIds.length;
  const completedCount = completedIds.length;
  const failedCount = failedIds.length;
  const resolvedCount = resolvedIds.length;

  const appendHistory = (entry) => {
    if (!historyKey) return;
    const existing = safeParseJson(localStorage.getItem(historyKey));
    const list = Array.isArray(existing) ? existing : [];
    const next = [...list, entry].slice(-50);
    localStorage.setItem(historyKey, JSON.stringify(next));
  };

  const markRunOverIfFinished = (nextCompletedIds, nextFailedIds) => {
    const resolved = new Set([...(nextCompletedIds || []), ...(nextFailedIds || [])]);
    if (orderIds.length > 0 && resolved.size >= orderIds.length) {
      setRunOver(true);
      setRoundOver(true);
      return true;
    }
    return false;
  };

  const findNextUnresolvedIndex = (startIndex) => {
    const resolved = new Set(resolvedIds);
    for (let i = 1; i <= orderIds.length; i++) {
      const idx = (startIndex + i) % orderIds.length;
      const id = orderIds[idx];
      if (!resolved.has(id)) return idx;
    }
    return startIndex;
  };

  const resetPrompt = () => setPrompt(null);

  const applyLowerDifficulty = () => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/challenges/generate-easy'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to generate easy challenge');
        const newChallenge = data?.challenge;
        if (!newChallenge?.id) throw new Error('Invalid challenge returned');

        // Replace the current step with the new easy challenge (keeps run length constant).
        setChallenges((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some((c) => c?.id === newChallenge.id);
          return exists ? list : [newChallenge, ...list];
        });

        setOrderIds((prev) => {
          const ids = Array.isArray(prev) ? [...prev] : [];
          if (!ids.length) return ids;
          ids[activeIndex] = newChallenge.id;
          // Ensure uniqueness in run order.
          const seen = new Set();
          const unique = [];
          for (const id of ids) {
            if (seen.has(id)) continue;
            seen.add(id);
            unique.push(id);
          }
          return unique.slice(0, 20);
        });

        setLoweredDifficultyMode(true);
        setChallengeStartedAtMs(Date.now());
        setAnswer('');
        setResult(null);
        setWrongAttemptsThisChallenge(0);
        setRevealedAnswer(null);
        setRoundOver(false);
        resetPrompt();
        showToast('Difficulty lowered — new easy challenge generated!', 'success');
      } catch {
        setPrompt({
          kind: 'reveal',
          message: 'Could not generate an easier challenge. Want to reveal the answer? (Counts as fail)',
        });
      }
    })();
  };

  const applyRevealAnswer = async () => {
    try {
      const solution = await revealActiveAnswer();
      setRevealedAnswer(solution);
      setResult({
        correct: false,
        message: 'Answer revealed.',
        pointsEarned: 0,
        outcome: 'revealed',
      });

      setFailedIds((prevFailed) => {
        const nextFailed = prevFailed.includes(active.id) ? prevFailed : [...prevFailed, active.id];
        markRunOverIfFinished(completedIds, nextFailed);
        endRound('revealed', { pointsEarned: 0, revealedAnswer: solution });
        return nextFailed;
      });
      resetPrompt();
    } catch {
      showToast('Failed to reveal answer.', 'error');
    }
  };

  const startNewGame = () => {
    const nextOrderIds = buildDefaultOrderIds(challenges);
    setOrderIds(nextOrderIds);
    setActiveIndex(0);
    setCompletedIds([]);
    setFailedIds([]);
    setPointsThisRun(0);
    setResult(null);
    setAnswer('');
    setRunOver(false);
    setRoundOver(false);
    setChallengeStartedAtMs(Date.now());
    setWrongAttemptsThisChallenge(0);
    setLoweredDifficultyMode(false);
    setRevealedAnswer(null);
    resetPrompt();
  };

  const startNextChallenge = () => {
    if (!orderIds.length) return;
    const nextIdx = findNextUnresolvedIndex(activeIndex);
    setActiveIndex(nextIdx);
    setChallengeStartedAtMs(Date.now());
    setAnswer('');
    setResult(null);
    setRoundOver(false);
    setWrongAttemptsThisChallenge(0);
    setLoweredDifficultyMode(false);
    setRevealedAnswer(null);
    resetPrompt();
  };

  const endRound = (outcome, extra = {}) => {
    const startedAt = typeof challengeStartedAtMs === 'number' ? challengeStartedAtMs : Date.now();
    appendHistory({
      challengeId: active?.id,
      title: active?.title,
      cipher_type: active?.cipher_type,
      difficulty: active?.difficulty,
      outcome,
      pointsEarned: Number(extra?.pointsEarned) || 0,
      wrongAttemptsThisChallenge,
      loweredDifficultyMode,
      revealedAnswer: extra?.revealedAnswer || null,
      startedAt,
      endedAt: Date.now(),
    });

    const toast = normalizeOutcomeToast(outcome, Number(extra?.pointsEarned) || 0);
    showToast(toast.message, toast.type);
    setRoundOver(true);
  };

  const skipChallenge = () => {
    if (!active) return;
    if (runOver) return;

    setFailedIds((prev) => {
      const next = prev.includes(active.id) ? prev : [...prev, active.id];
      setResult({ correct: false, message: 'Skipped.', pointsEarned: 0, outcome: 'skipped' });
      markRunOverIfFinished(completedIds, next);
      endRound('skipped', { pointsEarned: 0 });
      return next;
    });
  };

  const revealActiveAnswer = async () => {
    if (!active) return null;
    const res = await fetch(apiUrl(`/api/challenges/${active.id}/reveal`), {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to reveal answer');
    return data?.solution || null;
  };

  const submitAttempt = async () => {
    if (!active) return;
    if (runOver) return;
    if (roundOver) return;
    const trimmed = answer.trim();
    if (!trimmed) {
      showToast('Enter your decrypted answer first.', 'warning');
      return;
    }

    setSubmitting(true);
    setResult(null);

    const startedAt = typeof challengeStartedAtMs === 'number' ? challengeStartedAtMs : Date.now();
    const timeTakenSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

    try {
      const res = await fetch(apiUrl('/api/challenges/attempt'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ challengeId: active.id, answer: trimmed, timeTakenSeconds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Attempt failed');
      }

      setResult({
        correct: !!data.correct,
        message: data.message || (data.correct ? 'Correct!' : 'Incorrect.'),
        pointsEarned: data.pointsEarned || 0,
      });

      if (data.correct) {
        const earned = Number(data.pointsEarned) || 0;
        setPointsThisRun((prev) => prev + earned);

        setCompletedIds((prev) => {
          const next = prev.includes(active.id) ? prev : [...prev, active.id];
          markRunOverIfFinished(next, failedIds);
          return next;
        });

        endRound('correct', { pointsEarned: earned });
      } else {
        setWrongAttemptsThisChallenge((prev) => {
          const next = prev + 1;
          // After 3 wrong attempts, show an in-app prompt.
          if (next >= 3) {
            if (!loweredDifficultyMode) {
              setPrompt({
                kind: 'lower',
                message: 'Tried 3 times. Want a less difficult challenge?',
              });
            } else {
              setPrompt({
                kind: 'reveal',
                message: 'Still stuck after 3 tries. Reveal the answer? (Counts as fail)',
              });
            }
          }

          return next;
        });
      }
    } catch (e) {
      showToast('Failed to submit attempt.', 'error');
      setResult({ correct: false, message: 'Failed to submit attempt.', pointsEarned: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="cryptanalysis-overlay" onClick={onClose}>
      <div className="cryptanalysis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cryptanalysis-header">
          <h2>Cryptanalysis Challenge</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {prompt && !loading && !runOver && !roundOver && (
          <div className="challenge-toast" role="status" aria-label="Challenge prompt">
            <div className="challenge-toast__msg">{prompt.message}</div>
            <div className="challenge-toast__actions">
              {prompt.kind === 'lower' && (
                <button type="button" className="btn submit-btn" onClick={applyLowerDifficulty}>
                  Lower difficulty
                </button>
              )}
              {prompt.kind === 'reveal' && (
                <button type="button" className="btn submit-btn" onClick={applyRevealAnswer}>
                  Reveal answer
                </button>
              )}
              <button type="button" className="btn next-btn" onClick={resetPrompt}>
                Keep trying
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading challenges...</div>
        ) : challenges.length === 0 ? (
          <div className="empty-state">
            <p>No challenges available right now.</p>
          </div>
        ) : runOver ? (
          <div className="empty-state">
            <h3>✅ Run Complete</h3>
            <p>
              Solved {completedCount}/{totalCount} challenges this run.
            </p>
            <p>
              Failed/skipped: <strong>{failedCount}</strong>
            </p>
            <p>
              Total points earned this run: <strong>{pointsThisRun}</strong>
            </p>
            {result && (
              <div className={`result ${result.correct ? 'correct' : 'incorrect'}`} role="status" style={{ marginTop: 10 }}>
                <strong>{result.correct ? 'Final result' : 'Final result'}:</strong> {result.message}
                {result.correct && <span className="points"> (+{result.pointsEarned} pts)</span>}
              </div>
            )}
            <div className="actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn submit-btn" onClick={startNewGame}>
                Start New Run
              </button>
              <button type="button" className="btn next-btn" onClick={onClose}>
                Close
              </button>
            </div>
            <p style={{ marginTop: 10, opacity: 0.85 }}>
              Badges are awarded and shown in your profile.
            </p>
          </div>
        ) : roundOver ? (
          <div className="empty-state">
            <h3>📣 Challenge Result</h3>
            <p>
              Solved {completedCount}/{totalCount} • Failed/skipped {failedCount} • Remaining{' '}
              {Math.max(0, totalCount - resolvedCount)}
            </p>
            {result && (
              <div className={`result ${result.correct ? 'correct' : 'incorrect'}`} role="status" style={{ marginTop: 10 }}>
                <strong>{result.correct ? 'Correct' : 'Result'}:</strong> {result.message}
                {result.correct && <span className="points"> (+{result.pointsEarned} pts)</span>}
              </div>
            )}
            {revealedAnswer && (
              <div className="hint" style={{ marginTop: 10 }}>
                <strong>Revealed answer:</strong> {revealedAnswer}
              </div>
            )}
            <div className="actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn submit-btn"
                onClick={() => {
                  if (totalCount > 0 && resolvedCount >= totalCount) {
                    setRunOver(true);
                    return;
                  }
                  startNextChallenge();
                }}
              >
                Try Another Challenge
              </button>
              <button type="button" className="btn next-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="challenge-meta">
              <div className="meta-left">
                <strong>{active?.title}</strong>
                <div className="meta-sub">
                  <span className={`badge difficulty-${active?.difficulty}`}>{active?.difficulty}</span>
                  <span className="badge">{active?.cipher_type}</span>
                  <span className="badge">{active?.points} pts</span>
                  <span className="badge">Solved: {completedCount}/{totalCount}</span>
                  <span className="badge">Wrong tries: {wrongAttemptsThisChallenge}/3</span>
                </div>
              </div>
              <div className="meta-right">
                {activeIndex + 1}/{totalCount}
              </div>
            </div>

            <div className="challenge-body">
              <p className="challenge-desc">{active?.description}</p>

              <label className="label">Encrypted text</label>
              <pre className="ciphertext" aria-label="Encrypted text">
                {active?.encrypted_text}
              </pre>

              {active?.hint && (
                <div className="hint">
                  <strong>Hint:</strong> {active.hint}
                </div>
              )}

              <div className="hint" style={{ marginTop: active?.hint ? 8 : 0 }}>
                <strong>Algorithm hint:</strong> {algorithmHint(active?.cipher_type)}
              </div>

              <label className="label">Your decrypted answer</label>
              <textarea
                className="answer-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your best plaintext guess..."
                rows={3}
              />

              <div className="actions">
                <button
                  type="button"
                  className="btn submit-btn"
                  onClick={submitAttempt}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>

                <button type="button" className="btn next-btn" onClick={skipChallenge} disabled={submitting}>
                  Skip Challenge
                </button>
              </div>

              {result && (
                <div className={`result ${result.correct ? 'correct' : 'incorrect'}`} role="status">
                  <strong>{result.correct ? 'Correct' : 'Incorrect'}:</strong> {result.message}
                  {result.correct && <span className="points"> (+{result.pointsEarned} pts)</span>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CryptanalysisChallenge;
