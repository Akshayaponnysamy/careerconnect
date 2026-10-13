# CareerConnect – Online Job Recruitment Platform

A full-stack DevOps lab project: Node.js/Express REST API + responsive web frontend, with version control (Git), CI/CD (Jenkins), containers (Docker) and configuration management (Ansible).

**Features:** recruiter dashboard (hiring pipeline, KPIs, charts), jobs table with filters, drag-free pipeline board to move candidates between stages, post a job with live preview, and a candidate portal to track applications.

```
careerconnect/
├── public/            Frontend: index.html (public site), dashboard.html (recruiter)
├── src/               Backend (app.js, server.js, store.js, validators.js)
├── tests/             Automated tests (Jest + Supertest)  -> Week 11
├── Dockerfile         Multi-stage image                   -> Weeks 7-10
├── docker-compose.yml
├── Jenkinsfile        CI/CD pipeline                      -> Weeks 4-6, 11
├── ansible/           Playbook + inventory                -> Weeks 12-14
├── scripts/           Helper scripts
└── docs/WEEKLY_GUIDE.md   Git Bash commands for every lab week
```

Public site: `http://localhost:3000` · Recruiter dashboard: `http://localhost:3000/dashboard`

## Run locally
```bash
npm install
npm test
npm start            # http://localhost:3000
```

## Run with Docker
```bash
docker build -t careerconnect:latest .
docker run -d --name careerconnect -p 3000:3000 careerconnect:latest
```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Health check |
| GET | /api/jobs?q=&type=&location= | Search / filter jobs |
| GET | /api/jobs/:id | Job details |
| POST | /api/jobs | Post a job |
| POST | /api/applications | Apply for a job |
| GET | /api/applications?email= | Applications of a candidate |
| GET | /api/stats | Counts |
| GET | /api/dashboard | KPIs, funnel, charts data |
| GET | /api/pipeline | All applications |
| PATCH | /api/applications/:id/status | Move a candidate to another stage |

See **docs/WEEKLY_GUIDE.md** for the step-by-step commands per lab week.
