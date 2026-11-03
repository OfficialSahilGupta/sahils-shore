// ============================================================================
// Sahil's Shore: Career Hub Type Definitions
// Resumes, Bullet Bank, Applications Kanban, STAR Stories, Company Notes, Stats
// ============================================================================

export type ApplicationStage = "wishlist" | "applied" | "interview" | "offer" | "rejected";

export interface ApplicationContact {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string | null;
  stage: ApplicationStage;
  applied_at: string | null;
  salary_range: string | null;
  salary_min_paise: number | null;
  salary_max_paise: number | null;
  job_url: string | null;
  source: string | null;
  resume_id: string | null;
  contacts: ApplicationContact[];
  notes: string | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
  resume?: Resume | null;
}

export interface CreateApplicationInput {
  company: string;
  role: string;
  location?: string | null;
  stage?: ApplicationStage;
  applied_at?: string | null;
  salary_min_paise?: number | null;
  salary_max_paise?: number | null;
  salary_range?: string | null;
  job_url?: string | null;
  source?: string | null;
  resume_id?: string | null;
  contacts?: ApplicationContact[];
  notes?: string | null;
  next_follow_up?: string | null;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  version_label: string;
  target_role: string | null;
  file_url: string | null;
  drive_file_id: string | null;
  content: Record<string, unknown>;
  is_primary: boolean;
  notes: string | null;
  file_size: number;
  uploaded_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateResumeInput {
  title: string;
  version_label: string;
  target_role?: string | null;
  file_url?: string | null;
  drive_file_id?: string | null;
  is_primary?: boolean;
  notes?: string | null;
  file_size?: number;
  uploaded_date?: string;
}

export interface BulletPoint {
  id: string;
  user_id: string;
  content: string;
  category: string | null;
  skills: string[];
  project: string | null;
  role: string | null;
  metrics: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBulletInput {
  content: string;
  category?: string | null;
  skills?: string[];
  project?: string | null;
  role?: string | null;
  metrics?: string | null;
}

export interface BulletAnalysis {
  hasActionVerb: boolean;
  actionVerb?: string;
  hasMetric: boolean;
  metricsFound: string[];
  wordCount: number;
  strength: "strong" | "good" | "needs-work";
  suggestions: string[];
}

export interface InterviewStory {
  id: string;
  user_id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  skills: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateStoryInput {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  skills?: string[];
  tags?: string[];
}

export interface PrepChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface CompanyNote {
  id: string;
  user_id: string;
  company: string;
  culture: string | null;
  tech_stack: string[];
  interview_process: string | null;
  questions_asked: string[];
  prep_checklist: PrepChecklistItem[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyNoteInput {
  company: string;
  culture?: string | null;
  tech_stack?: string[];
  interview_process?: string | null;
  questions_asked?: string[];
  prep_checklist?: PrepChecklistItem[];
  notes?: string | null;
}

export interface FollowUpSummary {
  overdue: Application[];
  today: Application[];
  upcoming: Application[];
}

export interface CareerWeeklyStats {
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  totalApplications: number;
  responseRatePct: number;
  activeInterviews: number;
  offersCount: number;
  funnel: {
    stage: ApplicationStage;
    label: string;
    count: number;
    pct: number;
  }[];
}
