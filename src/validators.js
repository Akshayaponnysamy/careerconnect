const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract'];
const STAGES = ['Submitted', 'Screening', 'Interview', 'Offer', 'Hired'];
const STATUSES = [...STAGES, 'Rejected'];

function validateJob(body = {}) {
  const errors = [];
  if (!body.title || body.title.trim().length < 3) errors.push('title must be at least 3 characters');
  if (!body.company || !body.company.trim()) errors.push('company is required');
  if (!body.location || !body.location.trim()) errors.push('location is required');
  if (!JOB_TYPES.includes(body.type)) errors.push(`type must be one of: ${JOB_TYPES.join(', ')}`);
  if (!body.description || body.description.trim().length < 10) errors.push('description must be at least 10 characters');
  return errors;
}

function validateApplication(body = {}) {
  const errors = [];
  if (!Number.isInteger(body.jobId)) errors.push('jobId must be an integer');
  if (!body.name || body.name.trim().length < 2) errors.push('name must be at least 2 characters');
  if (!body.email || !EMAIL_RE.test(body.email)) errors.push('a valid email is required');
  return errors;
}

module.exports = { validateJob, validateApplication, JOB_TYPES, STAGES, STATUSES, EMAIL_RE };
