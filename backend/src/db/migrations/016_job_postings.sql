-- Job postings: employers can list openings and optionally surface them on the
-- public "Open Roles" page. Viewing requires login (any role); only jobseekers can
-- apply. Applying is a deliberate disclosure — the employer sees the applicant's
-- real name/email/resume, same as a normal job application. The employer's own
-- personal contact info is never shown in the listing — only their company name.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_requirement VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  jobseeker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  resume_url TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (job_id, jobseeker_id)
);
