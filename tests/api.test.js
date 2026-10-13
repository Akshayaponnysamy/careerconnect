const request = require('supertest');
const app = require('../src/app');
const store = require('../src/store');

beforeEach(() => store.reset());

describe('Health & stats', () => {
  test('GET /api/health returns UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });
  test('GET /api/stats returns counts', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body.jobs).toBe(5);
    expect(res.body.applications).toBe(12);
  });
});

describe('Jobs', () => {
  test('lists all jobs', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });
  test('searches by keyword', async () => {
    const res = await request(app).get('/api/jobs?q=docker');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toMatch(/DevOps/);
  });
  test('filters by type and location', async () => {
    const res = await request(app).get('/api/jobs?type=Internship&location=remote');
    expect(res.body).toHaveLength(1);
  });
  test('gets a single job', async () => {
    const res = await request(app).get('/api/jobs/2');
    expect(res.body.company).toBe('Kovai Systems');
  });
  test('returns 404 for unknown job', async () => {
    const res = await request(app).get('/api/jobs/999');
    expect(res.status).toBe(404);
  });
  test('creates a job', async () => {
    const res = await request(app).post('/api/jobs').send({
      title: 'SRE', company: 'Acme', location: 'Pune', type: 'Full-time',
      description: 'Keep the lights on and automate everything.', skills: ['Linux']
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(6);
  });
  test('rejects invalid job', async () => {
    const res = await request(app).post('/api/jobs').send({ title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe('Applications', () => {
  const valid = { jobId: 1, name: 'Asha K', email: 'asha@example.com', coverLetter: 'Hello' };
  test('submits an application', async () => {
    const res = await request(app).post('/api/applications').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Submitted');
  });
  test('prevents duplicate applications', async () => {
    await request(app).post('/api/applications').send(valid);
    const res = await request(app).post('/api/applications').send(valid);
    expect(res.status).toBe(409);
  });
  test('rejects bad email', async () => {
    const res = await request(app).post('/api/applications').send({ ...valid, email: 'nope' });
    expect(res.status).toBe(400);
  });
  test('404 when job missing', async () => {
    const res = await request(app).post('/api/applications').send({ ...valid, jobId: 99 });
    expect(res.status).toBe(404);
  });
  test('lists applications by email', async () => {
    await request(app).post('/api/applications').send(valid);
    const res = await request(app).get('/api/applications?email=ASHA@example.com');
    expect(res.body).toHaveLength(1);
  });
  test('requires email to list', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(400);
  });
});

describe('Dashboard & pipeline', () => {
  test('GET /api/dashboard returns kpis and funnel', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.kpis.openRoles).toBe(5);
    expect(res.body.funnel).toHaveLength(5);
    expect(res.body.daily).toHaveLength(7);
    const total = res.body.funnel.reduce((n, f) => n + f.count, 0) + res.body.rejected;
    expect(total).toBe(res.body.kpis.applications);
  });
  test('GET /api/pipeline lists all applications', async () => {
    const res = await request(app).get('/api/pipeline');
    expect(res.body).toHaveLength(12);
  });
  test('moves an application to a new stage', async () => {
    const res = await request(app).patch('/api/applications/4/status').send({ status: 'Interview' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Interview');
  });
  test('rejects an invalid stage', async () => {
    const res = await request(app).patch('/api/applications/4/status').send({ status: 'Nope' });
    expect(res.status).toBe(400);
  });
  test('404 for unknown application', async () => {
    const res = await request(app).patch('/api/applications/999/status').send({ status: 'Hired' });
    expect(res.status).toBe(404);
  });
  test('jobs include applicant counts', async () => {
    const res = await request(app).get('/api/jobs/1');
    expect(res.body.applicants).toBe(3);
  });
});
