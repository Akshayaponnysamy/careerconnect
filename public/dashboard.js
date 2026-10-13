/* CareerConnect dashboard */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STAGES = ['Submitted', 'Screening', 'Interview', 'Offer', 'Hired'];
const ALL_STAGES = [...STAGES, 'Rejected'];
const COLOR = { Submitted: 'var(--s-submitted)', Screening: 'var(--s-screening)', Interview: 'var(--s-interview)', Offer: 'var(--s-offer)', Hired: 'var(--s-hired)', Rejected: 'var(--s-rejected)' };
const TITLES = { overview: 'Overview', jobs: 'Jobs', pipeline: 'Pipeline board', post: 'Post a job', mine: 'My applications' };

const state = { view: 'overview', q: '', type: '', location: '', email: '' };

async function api(path, opts = {}) {
  const init = { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json' } };
  if (opts.body) init.body = JSON.stringify(opts.body);
  const res = await fetch('/api' + path, init);
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors && data.errors.join(', ')) || data.error || 'Something went wrong');
  return data;
}

function toast(message, isError = false) {
  const t = $('#toast');
  t.textContent = message;
  t.className = 'show' + (isError ? ' err' : '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.className = ''), 3200);
}

function ago(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/* ---------- Navigation ---------- */
function go(view) {
  state.view = view;
  $$('.nav').forEach(b => {
    const on = b.dataset.view === view;
    b.classList.toggle('is-active', on);
    on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
  });
  $('#title').textContent = TITLES[view];
  closeDrawer();
  const render = { overview: renderOverview, jobs: renderJobs, pipeline: renderPipeline, post: renderPost, mine: renderMine }[view];
  render().catch(e => { $('#view').innerHTML = `<p class="empty">${esc(e.message)}</p>`; });
}
$$('.nav').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
$('#quickPost').addEventListener('click', () => go('post'));
let searchTimer;
$('#globalSearch').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value.trim(); go('jobs'); $('#globalSearch').focus(); }, 300);
});

/* ---------- Overview ---------- */
async function renderOverview() {
  const d = await api('/dashboard');
  const k = d.kpis;
  const inPlay = d.funnel.reduce((n, f) => n + f.count, 0);

  const band = d.funnel.map(f =>
    `<div class="seg" style="flex:${Math.max(f.count, 0.7)};background:${COLOR[f.stage]}" title="${f.stage}: ${f.count}">${f.count}</div>`).join('');
  const legend = d.funnel.map(f =>
    `<div style="flex:${Math.max(f.count, 0.7)}"><strong>${f.stage}</strong>${inPlay ? Math.round((f.count / inPlay) * 100) : 0}%</div>`).join('');

  const maxDay = Math.max(1, ...d.daily.map(x => x.count));
  const bars = d.daily.map((x, i) => {
    const h = Math.round((x.count / maxDay) * 100);
    const label = new Date(x.date + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
    return `<rect x="${i * 56 + 14}" y="${120 - h}" width="34" height="${h}" rx="5" fill="var(--blue)" opacity="${x.count ? 1 : .18}"/>
      <text class="val" x="${i * 56 + 31}" y="${112 - h}" text-anchor="middle">${x.count}</text>
      <text x="${i * 56 + 31}" y="142" text-anchor="middle">${label}</text>`;
  }).join('');
  const maxType = Math.max(1, ...d.byType.map(t => t.count));
  const types = d.byType.map(t => `<div class="hbar"><span>${esc(t.type)}</span><div class="track"><div class="fill" style="width:${(t.count / maxType) * 100}%"></div></div><b class="num">${t.count}</b></div>`).join('');
  const recent = d.recent.map(a => `<li><div><div class="who">${esc(a.name)}</div><div class="sub">${esc(a.jobTitle)} · ${ago(a.appliedAt)}</div></div><span class="pill ${a.status}">${a.status}</span></li>`).join('');

  $('#view').innerHTML = `
    <section class="band-wrap" aria-label="Hiring pipeline">
      <div class="band-head">
        <div><h2>Hiring pipeline</h2><p class="lead">${inPlay} candidates in play across ${k.openRoles} open roles</p></div>
        <button class="btn ghost" data-go="pipeline">Open pipeline board</button>
      </div>
      <div class="band" role="img" aria-label="Candidates per stage: ${d.funnel.map(f => f.stage + ' ' + f.count).join(', ')}">${band}</div>
      <div class="band-legend">${legend}</div>
      <p class="rej"><b>${d.rejected}</b> candidates were not taken forward.</p>
    </section>

    <dl class="kpis">
      <div class="kpi"><dt>Open roles</dt><dd class="num">${k.openRoles}</dd><small>across ${new Set(d.byType.map(t => t.type)).size} job types</small></div>
      <div class="kpi"><dt>Applications</dt><dd class="num">${k.applications}</dd><small>all time</small></div>
      <div class="kpi"><dt>Interviewing now</dt><dd class="num">${k.interviewing}</dd><small>${k.interviewRate}% reach interview</small></div>
      <div class="kpi"><dt>Hired</dt><dd class="num">${k.hired}</dd><small>positions filled</small></div>
    </dl>

    <div class="grid2">
      <section class="panel">
        <h2>Applications, last 7 days</h2>
        <p class="lead">New applications received each day</p>
        <svg class="chart" viewBox="0 0 400 150" width="100%" role="img" aria-label="Applications per day for the last 7 days">${bars}</svg>
        <h2 style="margin-top:18px">Open roles by type</h2>
        <p class="lead">Where your openings are concentrated</p>
        ${types}
      </section>
      <section class="panel">
        <h2>Latest applications</h2>
        <p class="lead">The newest people to apply</p>
        <ul class="act">${recent}</ul>
      </section>
    </div>`;
  $('[data-go]').addEventListener('click', e => go(e.currentTarget.dataset.go));
}

/* ---------- Jobs ---------- */
async function renderJobs() {
  const all = await api('/jobs');
  const locations = [...new Set(all.map(j => j.location))].sort();
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.type) p.set('type', state.type);
  if (state.location) p.set('location', state.location);
  const jobs = await api('/jobs?' + p);

  const types = ['', 'Full-time', 'Part-time', 'Internship', 'Contract'];
  $('#view').innerHTML = `
    <p class="lead" style="margin-bottom:16px">${jobs.length} role${jobs.length === 1 ? '' : 's'}${state.q ? ` matching “${esc(state.q)}”` : ''}</p>
    <div class="filters" role="group" aria-label="Filters">
      ${types.map(t => `<button class="chip" data-type="${t}" aria-pressed="${state.type === t}">${t || 'All types'}</button>`).join('')}
      <label class="sr" for="locSel">Location</label>
      <select id="locSel"><option value="">All locations</option>${locations.map(l => `<option ${state.location === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
    </div>
    <div class="tablewrap"><table>
      <thead><tr><th>Role</th><th>Location</th><th>Type</th><th>Salary</th><th>Applicants</th><th>Posted</th></tr></thead>
      <tbody>${jobs.length ? jobs.map(j => `
        <tr><td><button class="rolebtn" data-job="${j.id}"><strong>${esc(j.title)}</strong><span>${esc(j.company)}</span></button></td>
        <td>${esc(j.location)}</td><td>${esc(j.type)}</td><td>${esc(j.salary)}</td><td class="num">${j.applicants}</td><td>${esc(j.postedAt)}</td></tr>`).join('')
        : `<tr><td colspan="6" class="empty">No roles match these filters. Clear a filter or search for another skill.</td></tr>`}</tbody>
    </table></div>`;
  $$('.chip').forEach(c => c.addEventListener('click', () => { state.type = c.dataset.type; renderJobs(); }));
  $('#locSel').addEventListener('change', e => { state.location = e.target.value; renderJobs(); });
  $$('.rolebtn').forEach(b => b.addEventListener('click', () => openJob(Number(b.dataset.job), b)));
}

/* ---------- Drawer (job detail + apply) ---------- */
let lastFocus = null;
async function openJob(id, trigger) {
  const j = await api('/jobs/' + id);
  lastFocus = trigger || document.activeElement;
  $('#drawer').innerHTML = `
    <div class="drawer-top">
      <div><h2 id="drawerTitle">${esc(j.title)}</h2><p class="lead">${esc(j.company)}</p></div>
      <button class="x" id="closeDrawer" aria-label="Close details">×</button>
    </div>
    <dl class="facts">
      <div><dt>Location</dt><dd>${esc(j.location)}</dd></div>
      <div><dt>Type</dt><dd>${esc(j.type)}</dd></div>
      <div><dt>Salary</dt><dd>${esc(j.salary)}</dd></div>
      <div><dt>Applicants</dt><dd class="num">${j.applicants}</dd></div>
    </dl>
    <p>${esc(j.description)}</p>
    <div class="skills">${j.skills.map(s => `<span class="skill">${esc(s)}</span>`).join('')}</div>
    <h3>Apply for this role</h3>
    <form class="form" id="applyForm" novalidate>
      <label>Full name<input name="name" autocomplete="name" required></label>
      <label>Email address<input name="email" type="email" autocomplete="email" required></label>
      <label>Cover note (optional)<textarea name="coverLetter" rows="3"></textarea></label>
      <p class="msg" id="applyMsg" role="alert"></p>
      <button class="btn" type="submit">Submit application</button>
    </form>`;
  $('#drawer').hidden = false; $('#scrim').hidden = false;
  $('#closeDrawer').focus();
  $('#closeDrawer').addEventListener('click', closeDrawer);
  $('#applyForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await api('/applications', { method: 'POST', body: { jobId: id, name: f.get('name'), email: f.get('email'), coverLetter: f.get('coverLetter') } });
      state.email = f.get('email');
      toast('Application submitted. Track it under My applications.');
      closeDrawer(); go(state.view);
    } catch (err) { $('#applyMsg').textContent = err.message; }
  });
}
function closeDrawer() {
  if ($('#drawer').hidden) return;
  $('#drawer').hidden = true; $('#scrim').hidden = true;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
$('#scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

/* ---------- Pipeline board ---------- */
async function renderPipeline() {
  const apps = await api('/pipeline');
  $('#view').innerHTML = `<p class="lead" style="margin-bottom:16px">Change a candidate’s stage with the menu on each card. ${apps.length} applications in total.</p>
    <div class="board">${ALL_STAGES.map(stage => {
      const items = apps.filter(a => a.status === stage);
      return `<section class="col" aria-label="${stage}">
        <div class="col-head"><div><i style="background:${COLOR[stage]}"></i>${stage}</div><span>${items.length}</span></div>
        ${items.map(a => `<article class="card"><strong>${esc(a.name)}</strong>
          <div class="sub">${esc(a.jobTitle)}<br>Applied ${ago(a.appliedAt)}</div>
          <label class="sr" for="st${a.id}">Stage for ${esc(a.name)}</label>
          <select id="st${a.id}" data-id="${a.id}" data-name="${esc(a.name)}">${ALL_STAGES.map(s => `<option ${s === stage ? 'selected' : ''}>${s}</option>`).join('')}</select></article>`).join('')
          || '<p class="sub" style="padding:6px">No candidates at this stage.</p>'}
      </section>`;
    }).join('')}</div>`;
  $$('.card select').forEach(sel => sel.addEventListener('change', async () => {
    try {
      await api(`/applications/${sel.dataset.id}/status`, { method: 'PATCH', body: { status: sel.value } });
      toast(`${sel.dataset.name} moved to ${sel.value}`);
      renderPipeline();
    } catch (err) { toast(err.message, true); }
  }));
}

/* ---------- Post a job ---------- */
async function renderPost() {
  $('#view').innerHTML = `<div class="postgrid">
    <form class="form panel" id="postForm" novalidate>
      <label>Job title<input name="title" required></label>
      <label>Company<input name="company" required></label>
      <div class="row2">
        <label>Location<input name="location" required></label>
        <label>Job type<select name="type"><option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option></select></label>
      </div>
      <label>Salary<input name="salary" placeholder="e.g. ₹6–9 LPA"></label>
      <label>Skills, separated by commas<input name="skills" placeholder="Git, Docker, Jenkins"></label>
      <label>Description<textarea name="description" rows="5" required></textarea></label>
      <p class="msg" id="postMsg" role="alert"></p>
      <button class="btn" type="submit" style="justify-self:start">Publish job</button>
    </form>
    <aside class="panel preview" aria-label="Listing preview">
      <p class="tag">Preview of your listing</p>
      <h2 id="pvTitle">Job title</h2><p class="lead" id="pvCompany">Company</p>
      <p id="pvMeta" class="lead"></p><p id="pvDesc"></p><div class="skills" id="pvSkills"></div>
    </aside></div>`;
  const form = $('#postForm');
  const sync = () => {
    const f = Object.fromEntries(new FormData(form));
    $('#pvTitle').textContent = f.title || 'Job title';
    $('#pvCompany').textContent = f.company || 'Company';
    $('#pvMeta').textContent = [f.location, f.type, f.salary].filter(Boolean).join(' · ');
    $('#pvDesc').textContent = f.description || 'The description you write will appear here.';
    $('#pvSkills').innerHTML = (f.skills || '').split(',').map(s => s.trim()).filter(Boolean).map(s => `<span class="skill">${esc(s)}</span>`).join('');
  };
  form.addEventListener('input', sync); sync();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    f.skills = (f.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    try {
      const job = await api('/jobs', { method: 'POST', body: f });
      toast(`Published “${job.title}”`);
      state.q = ''; state.type = ''; state.location = ''; $('#globalSearch').value = '';
      go('jobs');
    } catch (err) { $('#postMsg').textContent = err.message; }
  });
}

/* ---------- Candidate: my applications ---------- */
async function renderMine() {
  $('#view').innerHTML = `
    <form class="mineform" id="mineForm" novalidate>
      <label class="sr" for="mineEmail">Your email</label>
      <input id="mineEmail" name="email" type="email" placeholder="Enter the email you applied with" value="${esc(state.email)}" required>
      <button class="btn" type="submit">Show my applications</button>
    </form>
    <p class="msg" id="mineMsg" role="alert"></p>
    <div id="mineList"></div>`;
  const load = async () => {
    const email = $('#mineEmail').value.trim();
    if (!email) return;
    state.email = email;
    try {
      const apps = await api('/applications?email=' + encodeURIComponent(email));
      $('#mineMsg').textContent = apps.length ? '' : 'No applications found for this email yet. Apply to a role from the Jobs page.';
      $('#mineList').innerHTML = apps.map(a => {
        const idx = STAGES.indexOf(a.status);
        const rejected = a.status === 'Rejected';
        return `<article class="track-card"><header><div><h3>${esc(a.jobTitle)}</h3><div class="lead">${esc(a.company)} · applied ${ago(a.appliedAt)}</div></div><span class="pill ${a.status}">${a.status}</span></header>
          <div class="steps" aria-label="Progress">${STAGES.map((s, i) => `<div class="step ${rejected ? (i === 0 ? 'bad' : '') : i < idx ? 'done' : i === idx ? 'done now' : ''}">${s}</div>`).join('')}</div></article>`;
      }).join('');
    } catch (err) { $('#mineMsg').textContent = err.message; $('#mineList').innerHTML = ''; }
  };
  $('#mineForm').addEventListener('submit', e => { e.preventDefault(); load(); });
  if (state.email) load();
}

/* ---------- Boot ---------- */
$('#clock').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
go('overview');
