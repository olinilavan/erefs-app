-- eRefs.ai Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('jobseeker', 'employer')),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  headline VARCHAR(255),
  require_work_email BOOLEAN DEFAULT false,
  reminder_days INT DEFAULT 7,
  wants_custom_questions BOOLEAN DEFAULT false,
  subscription_plan VARCHAR(20) DEFAULT 'beta',
  subscription_started_at TIMESTAMP DEFAULT NOW(),
  terms_accepted_at TIMESTAMP,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requester_role VARCHAR(20) NOT NULL,
  candidate_name VARCHAR(255),
  candidate_email VARCHAR(255),
  job_id UUID REFERENCES jobs(id),
  target_role VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referrers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_request_id UUID REFERENCES referral_requests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token UUID DEFAULT uuid_generate_v4(),
  token_expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES referrers(id) ON DELETE CASCADE,
  question_number INT NOT NULL CHECK (question_number BETWEEN 1 AND 10),
  answer_text TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID UNIQUE REFERENCES referrers(id) ON DELETE CASCADE,
  llm_output_json JSONB,
  share_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW()
);
