const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = ['#2A3BE0', '#7A5AF8', '#0E9F77', '#E39B00', '#D6336C', '#0B7285'];
const COLOR = { Submitted: '#8A92B8', Screening: '#2A3BE0', Interview: '#7A5AF8', Offer: '#E39B00', Hired: '#0E9F77' };
const colorFor = name => COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];
const state = { q: '', type: '', location: '' };
let allJobs = [];

async function api(path, opts = {}) {
  const init = { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json' } };
  if (opts.body) init.body = JSON.stringify(opts.body);
  const res = await fetch('/api' + path, init);
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors && data.errors.join(', ')) || data.error || 'Something went wrong');
  return data;
}
function ago(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.className = 'show';
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ''), 3200);
}
const avatar = name => `<div class="av" style="background:${colorFor(name)}" aria-hidden="true">${esc(name[0])}</div>`;

/* ---- Jobs ---- */
async function loadJobs() {
  const p = new URLSearchParams();
  Object.entries(state).forEach(([k, v]) => v && p.set(k, v));
  const jobs = await api('/jobs?' + p);
  $('#jobCount').textContent = `${jobs.length} role${jobs.length === 1 ? '' : 's'}${state.q ? ` matching “${state.q}”` : ''}${state.location ? ` in ${state.location}` : ''}`;
  $('#jobGrid').innerHTML = jobs.length ? jobs.map(j => `
    <article class="job">
      <div class="job-top">${avatar(j.company)}<div><h3>${esc(j.title)}</h3><div class="co">${esc(j.company)}</div></div></div>
      <div class="tags"><span class="tag type">${esc(j.type)}</span><span class="tag">${esc(j.location)}</span>${j.skills.slice(0, 3).map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
      <p class="desc">${esc(j.description)}</p>
      <div class="job-foot"><div><b>${esc(j.salary)}</b><small>${j.applicants} applied · ${ago(j.postedAt)}</small></div>
      <button class="btn" data-apply="${j.id}">Apply now</button></div>
    </article>`).join('')
    : '<p class="none">No roles match your search. Clear a filter or try a different skill.</p>';
  document.querySelectorAll('[data-apply]').forEach(b => b.addEventListener('click', () => openApply(Number(b.dataset.apply), b)));
  const types = ['', 'Full-time', 'Part-time', 'Internship', 'Contract'];
  $('#typeChips').innerHTML = types.map(t => `<button data-type="${t}" aria-pressed="${state.type === t}">${t || 'All'}</button>`).join('');
  document.querySelectorAll('#typeChips button').forEach(b => b.addEventListener('click', () => { state.type = b.dataset.type; $('#htype').value = state.type; loadJobs(); }));
}

/* ---- Apply dialog ---- */
function openApply(id, trigger) {
  const j = allJobs.find(x => x.id === id);
  const dlg = $('#applyDialog');
  dlg.innerHTML = `
    <div class="dlg-top"><div><h2 id="dlgTitle">${esc(j.title)}</h2><div class="muted">${esc(j.company)}</div></div>
      <button class="x" id="dlgClose" aria-label="Close">×</button></div>
    <div class="dlg-meta"><span class="tag type">${esc(j.type)}</span><span class="tag">${esc(j.location)}</span><span class="tag">${esc(j.salary)}</span></div>
    <form id="applyForm" novalidate>
      <label>Full name<input name="name" autocomplete="name" required></label>
      <label>Email address<input name="email" type="email" autocomplete="email" required></label>
      <label>Cover note (optional)<textarea name="coverLetter" rows="3"></textarea></label>
      <p class="err" id="applyErr" role="alert"></p>
      <button class="btn" type="submit">Submit application</button>
    </form>`;
  dlg.showModal();
  $('#dlgClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => trigger && trigger.focus(), { once: true });
  $('#applyForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await api('/applications', { method: 'POST', body: { jobId: id, name: f.get('name'), email: f.get('email'), coverLetter: f.get('coverLetter') } });
      $('#trackEmail').value = f.get('email');
      dlg.close(); toast('Application sent. Check your status under How it works.');
      refreshNumbers(); loadJobs();
    } catch (err) { $('#applyErr').textContent = err.message; }
  });
}

/* ---- Status tracker ---- */
$('#trackForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#trackEmail').value.trim(), out = $('#trackOut');
  if (!email) return;
  try {
    const apps = await api('/applications?email=' + encodeURIComponent(email));
    out.innerHTML = apps.length ? apps.map(a => `<div class="trk"><div><strong>${esc(a.jobTitle)}</strong><div class="muted">${esc(a.company)} · applied ${ago(a.appliedAt)}</div></div><span class="pill ${a.status}">${a.status}</span></div>`).join('')
      : '<div class="trk">No applications found for this email yet.</div>';
  } catch (err) { out.innerHTML = `<div class="trk">${esc(err.message)}</div>`; }
});

/* ---- Hero search ---- */
const sync = () => { state.q = $('#hq').value.trim(); state.location = $('#hloc').value; state.type = $('#htype').value; loadJobs(); };
let timer; $('#hq').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(sync, 250); });
$('#hloc').addEventListener('change', sync); $('#htype').addEventListener('change', sync);
$('#heroSearch').addEventListener('submit', e => { e.preventDefault(); sync(); $('#jobs').scrollIntoView({ behavior: 'smooth' }); });
document.querySelectorAll('.popular button').forEach(b => b.addEventListener('click', () => { $('#hq').value = b.dataset.q; sync(); $('#jobs').scrollIntoView({ behavior: 'smooth' }); }));

/* ---- Static-ish sections ---- */
async function refreshNumbers() {
  const [s, d] = await Promise.all([api('/stats'), api('/dashboard')]);
  $('#numbers').innerHTML = `<div><dt>Open roles</dt><dd>${s.jobs}</dd></div><div><dt>Companies hiring</dt><dd>${s.companies}</dd></div><div><dt>Applications sent</dt><dd>${s.applications}</dd></div>`;
  $('#heroOpen').textContent = s.jobs;
  const max = f => Math.max(f.count, 0.7);
  $('#band').innerHTML = d.funnel.map(f => `<div class="seg" style="flex:${max(f)};background:${COLOR[f.stage]}" title="${f.stage}">${f.count}</div>`).join('');
  $('#bandLegend').innerHTML = d.funnel.map(f => `<div style="flex:${max(f)}">${f.stage}</div>`).join('');
}

async function init() {
  allJobs = await api('/jobs');
  $('#hloc').innerHTML = '<option value="">Anywhere</option>' + [...new Set(allJobs.map(j => j.location))].sort().map(l => `<option>${esc(l)}</option>`).join('');
  const skills = {};
  allJobs.forEach(j => j.skills.forEach(s => (skills[s] = (skills[s] || 0) + 1)));
  $('#skillCloud').innerHTML = Object.entries(skills).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([s, n]) => `<button data-skill="${esc(s)}">${esc(s)}<small>${n} role${n > 1 ? 's' : ''}</small></button>`).join('');
  document.querySelectorAll('[data-skill]').forEach(b => b.addEventListener('click', () => { $('#hq').value = b.dataset.skill; sync(); $('#jobs').scrollIntoView({ behavior: 'smooth' }); }));
  const companies = {};
  allJobs.forEach(j => (companies[j.company] = (companies[j.company] || 0) + 1));
  $('#companies').innerHTML = Object.entries(companies).map(([c, n]) => `<li>${avatar(c)}<div>${esc(c)}<small>${n} open role${n > 1 ? 's' : ''}</small></div></li>`).join('');
  await Promise.all([refreshNumbers(), loadJobs()]);
}
init().catch(e => { $('#jobCount').textContent = e.message; });
