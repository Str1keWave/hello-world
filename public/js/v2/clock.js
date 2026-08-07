// L2 + L4: visits are resumes; the arc runs on min(visits, days).
import { T } from './tunables.js';
import { s, save, sessionData, setSessionData, localDayString } from './state.js';

// Returns { isNewVisit, isFirstEver, sameDayReturn } and updates state.
export function accountVisit() {
  const now = Date.now();
  const sess = sessionData();
  const gap = s.lastSeen ? now - s.lastSeen : Infinity;
  const today = localDayString(now);

  const isFirstEver = s.visits === 0;
  let isNewVisit = false;
  let sameDayReturn = false;

  if (!sess) {
    // fresh load (no session storage): new visit if gap qualifies or first
    if (isFirstEver || gap >= T.resumeGapMs) {
      isNewVisit = true;
    } else if (s.days.includes(today) && !s.sameDaySettleUsed && T.firstSameDayReturnSettles && gap > 20 * 60 * 1000) {
      // P1 amendment: first same-day return (20min+ away) claims one settlement
      isNewVisit = true;
      sameDayReturn = true;
    }
  } else if (gap >= T.resumeGapMs) {
    // same-tab return after a real absence: sessionStorage survived the
    // detour (phone URL-bar navigation), but the session is stale
    isNewVisit = true;
  }

  if (isNewVisit) {
    s.visits += 1;
    if (!s.days.includes(today)) {
      s.days.push(today);
      s.sameDaySettleUsed = false;
    } else if (sameDayReturn) {
      s.sameDaySettleUsed = true;
    }
    if (!s.firstSeen) s.firstSeen = now;
    // roll investigation window
    s.investigation.lastVisitScore = s.investigation.thisVisitScore;
    const wasInvestigative = s.investigation.lastVisitScore >= T.investigation.streakThreshold;
    s.investigation.streak = wasInvestigative ? s.investigation.streak + 1 : 0;
    if (s.investigation.streak >= T.investigation.streakVisits) s.investigation.everStreak = true;
    s.investigation.thisVisitScore = 0;
  }

  setSessionData({ started: sess?.started || now });
  s.lastSeen = now;
  save();
  return { isNewVisit, isFirstEver, sameDayReturn };
}

// Mid-session visibility resume after a long gap also counts (L2).
export function mountResumeWatcher(onVisit) {
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
    } else if (hiddenAt && Date.now() - hiddenAt >= T.resumeGapMs) {
      const r = accountVisit();
      // force: a 6h+ hidden gap is a resume-visit even with live session storage
      if (!r.isNewVisit) {
        s.visits += 1;
        const today = localDayString(Date.now());
        if (!s.days.includes(today)) s.days.push(today);
        save();
      }
      onVisit();
    }
  });
}

export function daysSinceFirst() {
  if (!s.firstSeen) return 0;
  return Math.floor((Date.now() - s.firstSeen) / T.dayMs);
}
