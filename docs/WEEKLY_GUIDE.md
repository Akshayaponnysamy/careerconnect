# Weekly Lab Guide – CareerConnect (run in Git Bash)

Replace `YOUR_USERNAME`, `Your Name`, `you@example.com` with your own details.
Create an empty repository named **careerconnect** on GitHub first (no README).

---
## Week 1 – Install Git, local & remote repositories (CO1, CO3)
```bash
git --version
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

cd careerconnect                 # the unzipped project folder
git init
git add .
git commit -m "Initial commit: CareerConnect job recruitment platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/careerconnect.git
git remote -v
git push -u origin main
git log --oneline
git status
```

## Week 2 – Fetch and synchronize repositories (CO3)
```bash
# Simulate a teammate: clone a second copy
cd ..
git clone https://github.com/YOUR_USERNAME/careerconnect.git careerconnect-teammate
cd careerconnect-teammate
echo "# Contributors" > CONTRIBUTORS.md
git add . && git commit -m "Add contributors file" && git push

# Back in your original folder
cd ../careerconnect
git fetch origin
git log HEAD..origin/main --oneline     # see what is new
git diff main origin/main --stat
git pull origin main                    # fetch + merge
```

## Week 3 – Branching and merging (CO3)
```bash
git branch
git checkout -b feature/job-alerts
echo "<!-- job alerts coming soon -->" >> public/index.html
git add . && git commit -m "feat: placeholder for job alerts"

git checkout main
git merge feature/job-alerts
git branch -d feature/job-alerts

# Conflict practice
git checkout -b feature-a
sed -i 's/Find the job that fits/Find the role that fits/' public/index.html
git commit -am "Change headline (A)"
git checkout main
sed -i 's/Find the job that fits/Discover the job that fits/' public/index.html
git commit -am "Change headline (main)"
git merge feature-a        # CONFLICT -> open public/index.html, fix markers <<<<<<< ======= >>>>>>>
git add public/index.html
git commit -m "Resolve merge conflict in headline"
git push origin main
```

## Week 4 – Install Jenkins, build job, Git integration (CO2)
1. Install Java 17 and Jenkins (Windows installer from jenkins.io). Open `http://localhost:8080`, unlock with the initial admin password, install suggested plugins.
2. **Manage Jenkins → Tools → NodeJS installations**: add `node20` (install automatically). Install the *NodeJS* plugin if missing.
3. **New Item → Freestyle project** → name `careerconnect-build`.
4. **Source Code Management → Git**: `https://github.com/YOUR_USERNAME/careerconnect.git`, branch `*/main`.
5. **Build Steps → Execute shell** (Git Bash/sh): `npm install && npm test`
6. **Build Now** → check **Console Output**.
7. Optional: **Build Triggers → Poll SCM** `H/2 * * * *`.

## Weeks 5 & 6 – CI/CD pipeline in Jenkins, Part I and II (CO2)
Part I – pipeline with Build + Test:
1. **New Item → Pipeline** → `careerconnect-pipeline`.
2. **Pipeline → Definition: Pipeline script from SCM → Git** → repo URL, branch `*/main`, Script Path `Jenkinsfile`.
3. Build Now. The `Jenkinsfile` is already in the project root.

Part II – extend with Docker deploy + smoke test + triggers:
```bash
# make a change, push, and watch Jenkins build automatically
git checkout -b feature/pipeline-demo
echo "" >> README.md
git commit -am "Trigger pipeline"
git push origin feature/pipeline-demo
git checkout main && git merge feature/pipeline-demo && git push origin main
```
Configure GitHub webhook (`http://<jenkins-url>/github-webhook/`) or Poll SCM. The Jenkins user must be able to run docker (Linux: `sudo usermod -aG docker jenkins && sudo systemctl restart jenkins`).

## Week 7 – Install Docker, basic commands (CO4)
```bash
docker --version
docker run hello-world
docker pull node:20-alpine
docker images
docker ps -a
docker run -d --name test-nginx -p 8081:80 nginx
docker logs test-nginx
docker exec -it test-nginx sh        # type exit to leave
docker stop test-nginx && docker rm test-nginx
docker rmi nginx
```

## Week 8 – Containers from a Dockerfile (CO4)
```bash
cat Dockerfile
docker build -t careerconnect:1.0 .
docker images careerconnect
docker run -d --name careerconnect -p 3000:3000 careerconnect:1.0
docker ps
docker inspect --format='{{.State.Health.Status}}' careerconnect
curl http://localhost:3000/api/health
docker stop careerconnect && docker rm careerconnect
```

## Weeks 9 & 10 – Deploy and manage the web application on Docker (CO4)
```bash
# Part I – deploy
docker build -t careerconnect:latest .
docker run -d --name careerconnect --restart unless-stopped -p 3000:3000 careerconnect:latest
# open http://localhost:3000

# Part II – manage
docker logs -f careerconnect            # Ctrl+C to stop
docker stats --no-stream careerconnect
docker restart careerconnect
docker tag careerconnect:latest YOUR_DOCKERHUB_USER/careerconnect:1.0
docker login
docker push YOUR_DOCKERHUB_USER/careerconnect:1.0

# Docker Compose
docker compose up -d --build
docker compose ps
docker compose logs
docker compose down
```

## Week 11 – Continuous testing (CO2, CO5)
```bash
npm test                      # 15 automated tests + coverage report in coverage/
git checkout -b feature/more-tests
# add a test to tests/api.test.js, then:
git add . && git commit -m "test: add extra API test"
git push origin feature/more-tests
```
Jenkins runs the `Continuous Testing` stage on every push and publishes JUnit results (**Test Result Trend** graph). Break a test on purpose to see the build fail, then fix it.

## Week 12 – Ansible/Chef/Puppet/Salt, Part I (CO5, CO6)
Ansible runs on Linux/WSL2 (Ubuntu). In Git Bash open WSL: `wsl`.
```bash
sudo apt update && sudo apt install -y ansible
ansible --version
cd /mnt/c/path/to/careerconnect/ansible
ansible all -i inventory.ini -m ping
ansible-playbook -i inventory.ini playbook.yml --syntax-check
ansible-playbook -i inventory.ini playbook.yml --check      # dry run
```

## Week 13 – Configuration management, Part II – Mini automation task (CO5, CO6)
```bash
ansible-playbook -i inventory.ini playbook.yml -K     # installs Docker/Git/curl, deploys the app
curl http://localhost:3000/api/health
ansible-playbook -i inventory.ini playbook.yml        # run again: tasks show "ok" (idempotent)
```

## Week 14 – Integrated DevOps mini project (Git + Jenkins + Docker + Ansible) (CO2–CO6)
Flow: **push → Jenkins → test → Docker build → deploy → smoke test → Ansible configure**
```bash
git checkout -b feature/final-ui
# edit public/style.css (e.g. change --teal colour)
git add . && git commit -m "feat: update theme colour"
git push origin feature/final-ui
git checkout main && git merge feature/final-ui
git tag -a v1.0 -m "Release 1.0"
git push origin main --tags
```
Jenkins builds, tests, builds the image and redeploys automatically. Take screenshots of: GitHub commits, Jenkins stage view, `docker ps`, the running site, Ansible output.

## Week 15 – Record verification / Viva (all COs)
Quick demo script:
```bash
git log --oneline --graph --all
docker compose up -d --build && docker ps
curl http://localhost:3000/api/jobs
```
Be ready to explain: Git branching vs merging, CI vs CD, Dockerfile layers, multi-stage builds, healthcheck, Jenkinsfile stages, Ansible idempotency.

## Weeks 16–17 – Revision / Final record submission
```bash
git tag -a v1.1 -m "Final submission"
git push origin main --tags
docker compose down
```
Include in your record: commands, screenshots, outputs, GitHub URL, Jenkins pipeline view and Docker Hub link.

---
### Troubleshooting
- `docker: permission denied` → start Docker Desktop / add user to the docker group.
- Jenkins `npm: not found` → add the NodeJS plugin and the `node20` tool.
- Port 3000 busy → `docker run -p 3001:3000 ...`
- Git Bash line endings: `git config --global core.autocrlf true`
