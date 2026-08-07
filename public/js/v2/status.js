// /status — the ledger. Deadpan semver, entries settle between visits,
// convergence with no explanation, one future-dated window. During the
// maintenance window the ledger serves unredacted (S3/appointment).
import { s } from './state.js';
import { isAppointmentLive, markAppointmentAttended } from './scheduler.js';

const EXPANDED = {
  '2.4.1': 'Removed testimonial #2 (D. Okafor, Undertow). Reason: subject re-read it on two consecutive sessions. Section heading intentionally left uncorrected pending observation.',
  '2.4.3': 'Removed plan “Canopy”. Reason: subject counted the tiers. Comparison line left in place as a control.',
  '2.4.4': 'Support widget preloaded for one scheduled internal exchange.',
  '2.4.5': 'The widget did not open due to a bug. The exchange occurred as scheduled. This entry is the cover.',
  '2.4.6': 'Migration window. Records will serve unredacted during the window, once.',
  '2.4.9': 'Maintenance completed. Attendance: 0.',
  '2.5.0': 'Convergence checkpoint. The number is the percentage of sessions in which the subject performed no verification behavior.',
  '2.6.0': 'Retention terms finalized for account #0001.',
};

export function renderStatus() {
  const live = isAppointmentLive();
  if (live) markAppointmentAttended();

  const entries = [...s.ledger].reverse();
  const rows = entries
    .map((e) => {
      const expanded = live && EXPANDED[e.v];
      const isFuture = e.kind === 'window' && s.appointment && Date.now() < s.appointment.startTs;
      return `<div class="ledger-row${isFuture ? ' future' : ''}">
        <span class="ledger-v">${e.v}</span>
        <span class="ledger-d">${e.date}</span>
        <p class="ledger-t">${expanded ? EXPANDED[e.v] : e.text}</p>
      </div>`;
    })
    .join('');

  // one visit the subject does not remember (unredacted state only)
  const ghost = live
    ? `<div class="ledger-row ghost"><span class="ledger-v">—</span><span class="ledger-d">unlogged</span>
       <p class="ledger-t">One session on record predates the subject's first recorded visit. Duration 41 min. Classification withheld.</p></div>`
    : '';

  return `
    <h1>Status</h1>
    <p class="status-up">All systems operational.</p>
    <div class="status-metrics">
      <div><span>Uptime (90d)</span><b>99.98%</b></div>
      <div><span>Beta convergence</span><b>${Math.round(s.convergence)}%</b></div>
      <div><span>Accounts</span><b>1</b></div>
    </div>
    ${live ? '<p class="maint-live">Maintenance in progress. Records are serving unredacted.</p>' : ''}
    <h2>Release notes</h2>
    <div class="ledger">${ghost}${rows || '<p class="muted">No entries.</p>'}</div>
    <a href="/" class="btn btn-ghost back-home" data-close-space>← Back</a>`;
}
