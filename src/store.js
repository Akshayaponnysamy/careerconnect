// In-memory data store (replace with MongoDB/MySQL for production)
const DAY = 86400000;
const ago = n => new Date(Date.now() - n * DAY).toISOString();

const jobs = [
  { id: 1, title: 'Junior DevOps Engineer', company: 'CloudNest Technologies', location: 'Coimbatore', type: 'Full-time', salary: '₹5–8 LPA', skills: ['Git', 'Docker', 'Jenkins'], description: 'Maintain CI/CD pipelines and containerised services for our SaaS products.', postedAt: '2026-09-28' },
  { id: 2, title: 'Java Backend Developer', company: 'Kovai Systems', location: 'Coimbatore', type: 'Full-time', salary: '₹6–10 LPA', skills: ['Java', 'Spring Boot', 'MySQL'], description: 'Build REST APIs for logistics software used across South India.', postedAt: '2026-09-30' },
  { id: 3, title: 'Frontend Intern', company: 'PixelForge Studio', location: 'Remote', type: 'Internship', salary: '₹15k / month', skills: ['HTML', 'CSS', 'JavaScript'], description: 'Work with designers to ship responsive interfaces.', postedAt: '2026-10-02' },
  { id: 4, title: 'QA Automation Engineer', company: 'TestWorks India', location: 'Chennai', type: 'Full-time', salary: '₹4–7 LPA', skills: ['Selenium', 'Jest', 'CI'], description: 'Write automated regression suites that run on every commit.', postedAt: '2026-10-05' },
  { id: 5, title: 'Cloud Support Associate', company: 'Skyline Infra', location: 'Bengaluru', type: 'Contract', salary: '₹30k / month', skills: ['Linux', 'AWS', 'Ansible'], description: 'Monitor infrastructure and automate server configuration.', postedAt: '2026-10-08' }
];

// [jobId, name, email, status, daysAgo]
const SEED = [
  [1, 'Meera Subramanian', 'meera.s@example.com', 'Interview', 2],
  [1, 'Karthik Raja', 'karthik.r@example.com', 'Screening', 1],
  [1, 'Divya Lakshmi', 'divya.l@example.com', 'Offer', 6],
  [2, 'Arun Prakash', 'arun.p@example.com', 'Submitted', 0],
  [2, 'Sneha Iyer', 'sneha.i@example.com', 'Screening', 3],
  [2, 'Rohit Menon', 'rohit.m@example.com', 'Rejected', 5],
  [3, 'Nisha Fernando', 'nisha.f@example.com', 'Hired', 6],
  [3, 'Vikram Singh', 'vikram.s@example.com', 'Submitted', 1],
  [4, 'Pooja Nair', 'pooja.n@example.com', 'Interview', 4],
  [4, 'Imran Sheikh', 'imran.s@example.com', 'Submitted', 0],
  [5, 'Lavanya G', 'lavanya.g@example.com', 'Screening', 2],
  [5, 'Dinesh Kumar', 'dinesh.k@example.com', 'Submitted', 3]
];

function seedApplications() {
  return SEED.map(([jobId, name, email, status, d], i) => {
    const job = jobs.find(j => j.id === jobId);
    return { id: i + 1, jobId, jobTitle: job.title, company: job.company, name, email,
      coverLetter: '', status, appliedAt: ago(d), updatedAt: ago(d) };
  });
}

const applications = seedApplications();
let nextJobId = 6;
let nextAppId = applications.length + 1;

module.exports = {
  jobs,
  applications,
  newJobId: () => nextJobId++,
  newAppId: () => nextAppId++,
  reset() {
    jobs.length = 5;
    applications.length = 0;
    applications.push(...seedApplications());
    nextJobId = 6;
    nextAppId = applications.length + 1;
  }
};
