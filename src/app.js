const express = require('express');
const path = require('path');
const store = require('./store');
const { validateJob, validateApplication, STAGES, STATUSES } = require('./validators');

const withCount = j => ({ ...j, applicants: store.applications.filter(a => a.jobId === j.id).length });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

// Health check - used by Docker HEALTHCHECK, Jenkins smoke test and Ansible
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', service: 'careerconnect', uptime: process.uptime() });
});

// List / search / filter jobs
app.get('/api/jobs', (req, res) => {
  const { q, type, location } = req.query;
  let result = [...store.jobs];
  if (q) {
    const term = q.toLowerCase();
    result = result.filter(j =>
      [j.title, j.company, j.description, ...j.skills].join(' ').toLowerCase().includes(term));
  }
  if (type) result = result.filter(j => j.type === type);
  if (location) result = result.filter(j => j.location.toLowerCase() === location.toLowerCase());
  result.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  res.json(result.map(withCount));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = store.jobs.find(j => j.id === Number(req.params.id));
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(withCount(job));
});

// Employer posts a job
app.post('/api/jobs', (req, res) => {
  const errors = validateJob(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const b = req.body;
  const job = {
    id: store.newJobId(),
    title: b.title.trim(),
    company: b.company.trim(),
    location: b.location.trim(),
    type: b.type,
    salary: (b.salary || 'Not disclosed').trim(),
    skills: Array.isArray(b.skills) ? b.skills.map(s => String(s).trim()).filter(Boolean) : [],
    description: b.description.trim(),
    postedAt: new Date().toISOString().slice(0, 10)
  };
  store.jobs.push(job);
  res.status(201).json(withCount(job));
});

// Candidate applies for a job
app.post('/api/applications', (req, res) => {
  const errors = validateApplication(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const job = store.jobs.find(j => j.id === req.body.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const email = req.body.email.trim().toLowerCase();
  if (store.applications.some(a => a.jobId === job.id && a.email === email)) {
    return res.status(409).json({ error: 'You have already applied for this job' });
  }
  const application = {
    id: store.newAppId(),
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    name: req.body.name.trim(),
    email,
    coverLetter: (req.body.coverLetter || '').trim(),
    status: 'Submitted',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.applications.push(application);
  res.status(201).json(application);
});

// Candidate checks their applications
app.get('/api/applications', (req, res) => {
  const email = (req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'email query parameter is required' });
  res.json(store.applications.filter(a => a.email === email));
});

// Recruiter: all applications (pipeline board)
app.get('/api/pipeline', (req, res) => {
  res.json([...store.applications].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)));
});

// Recruiter: move an application to another stage
app.patch('/api/applications/:id/status', (req, res) => {
  const application = store.applications.find(a => a.id === Number(req.params.id));
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (!STATUSES.includes(req.body && req.body.status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }
  application.status = req.body.status;
  application.updatedAt = new Date().toISOString();
  res.json(application);
});

// Dashboard summary
app.get('/api/dashboard', (req, res) => {
  const apps = store.applications;
  const count = s => apps.filter(a => a.status === s).length;
  const funnel = STAGES.map(stage => ({ stage, count: count(stage) }));
  const reachedInterview = count('Interview') + count('Offer') + count('Hired');
  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    daily.push({ date, count: apps.filter(a => a.appliedAt.slice(0, 10) === date).length });
  }
  const types = {};
  store.jobs.forEach(j => { types[j.type] = (types[j.type] || 0) + 1; });
  res.json({
    kpis: {
      openRoles: store.jobs.length,
      applications: apps.length,
      interviewing: count('Interview'),
      hired: count('Hired'),
      interviewRate: apps.length ? Math.round((reachedInterview / apps.length) * 100) : 0
    },
    funnel,
    rejected: count('Rejected'),
    daily,
    byType: Object.entries(types).map(([type, n]) => ({ type, count: n })),
    recent: [...apps].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 6)
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    jobs: store.jobs.length,
    applications: store.applications.length,
    companies: new Set(store.jobs.map(j => j.company)).size
  });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = app;
