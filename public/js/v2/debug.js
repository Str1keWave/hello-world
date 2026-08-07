// QA overlay (?debug=1). Every inference the scheduler makes is visible
// here (P13). Test-only; carries clock-forward controls.
import { s, save, gateLevel, localDayString } from './state.js';

export function mountDebug() {
  // QA hook: exists ONLY under ?debug — the production console stays empty
  window.__loam2 = { s, save, gateLevel };
  const el = document.createElement('div');
  el.id = 'debug-overlay';
  el.innerHTML = `<div class="dbg-head">loam2://debug <button data-a="x">×</button></div>
    <pre class="dbg-body"></pre>
    <div class="dbg-actions">
      <button data-a="visit">+visit</button>
      <button data-a="day">+day</button>
      <button data-a="inv">+investigation</button>
      <button data-a="appt">appt→past</button>
      <button data-a="reset">RESET ALL</button>
    </div>`;
  document.body.appendChild(el);

  el.addEventListener('click', (e) => {
    const a = e.target?.dataset?.a;
    if (a === 'x') el.remove();
    if (a === 'visit') {
      s.visits += 1;
      save();
    }
    if (a === 'day') {
      s.days.push('dbg-' + (s.days.length + 1));
      if (s.appointment && !s.appointment.resolved) {
        s.appointment.startTs -= 86400000;
        s.appointment.endTs -= 86400000;
      }
      if (s.addressAt) s.addressAt -= 86400000 * 2;
      if (s.pricingLiveAt) s.pricingLiveAt -= 86400000 * 2;
      save();
    }
    if (a === 'inv') {
      s.investigation.lastVisitScore = 99;
      s.investigation.streak = 2;
      s.investigation.everStreak = true;
      save();
    }
    if (a === 'appt') {
      if (s.appointment) {
        s.appointment.endTs = Date.now() - 1000;
        save();
      }
    }
    if (a === 'reset') {
      try {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(';').forEach((c) => (document.cookie = c.split('=')[0].trim() + '=; max-age=0; path=/'));
        indexedDB.deleteDatabase('loam-log');
      } catch {}
      location.href = location.pathname;
    }
  });

  const body = el.querySelector('.dbg-body');
  setInterval(() => {
    body.textContent =
      `gate=${gateLevel()} visits=${s.visits} days=${s.days.length} today=${localDayString(Date.now())}\n` +
      `settled=[${s.settledLog.join(', ')}]\n` +
      `conv=${Math.round(s.convergence)} inv={last:${s.investigation.lastVisitScore} now:${s.investigation.thisVisitScore} streak:${s.investigation.streak} ever:${s.investigation.everStreak}}\n` +
      `removals=[${s.removals}] healed=[${s.healed || []}] pending=[${s.pendingHeal || []}] frozen=${s.frozen}\n` +
      `overheard=${s.overheardAt} appt=${s.appointment ? `${new Date(s.appointment.startTs).toISOString().slice(0, 10)} attended=${s.appointment.attended} resolved=${s.appointment.resolved}` : null}\n` +
      `exp=${s.experimentState} skipped=${s.experimentSkipped} addressAt=${s.addressAt ? 'yes' : 'no'} pricing=${s.pricingLiveAt ? 'live' : 'no'} retention=${s.retention}\n` +
      `ended=${s.ended ? 'yes' : 'no'} masked=${s.masked} imported=${s.imported} name=${s.name} deleted=${s.deletedText.length}\n` +
      `stale=${!!s.staleThisSession} repairs=${s.staleRepairs} betaLine=${s.betaLine} appSeen=${s.appSeen} twoTab=${s.twoTabSeen}`;
  }, 700);
}
