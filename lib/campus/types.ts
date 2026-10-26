/**
 * SYRKA Campus demo data model.
 *
 * Every record here is fictional demonstration data. The model is normalised (records reference each other by id)
 * so the student portal, employer portal and admin view all read the same facts and the matching engine can be
 * shared between them.
 */

export type ID = string

export type SkillCategory =
  | 'programming'
  | 'frontend'
  | 'backend'
  | 'data_ai'
  | 'analytical'
  | 'communication'
  | 'collaboration'
  | 'leadership'
  | 'design'
  | 'domain'

/**
 * Where a skill claim comes from. These are not interchangeable and are never inferred from a proficiency number:
 * a claim only moves to a verified type when a VerificationRecord exists for it.
 */
export type EvidenceType =
  | 'self_reported'
  | 'assessment_verified'
  | 'project_demonstrated'
  | 'institution_verified'
  | 'employer_verified'

export type VerificationStatus = 'unverified' | 'pending' | 'verified'

export interface University {
  id: ID
  name: string
  city: string
}

export interface Company {
  id: ID
  name: string
  industry: string
  location: string
  about: string
}

export interface Skill {
  id: ID
  name: string
  category: SkillCategory
  /** Alternative spellings that should resolve to this skill when matching ("js" → JavaScript). */
  aliases?: string[]
}

export interface ProfileVisibility {
  /** When false the profile is excluded from every employer-facing query, not merely hidden in the UI. */
  employerVisible: boolean
  sections: {
    education: boolean
    projects: boolean
    achievements: boolean
    assessments: boolean
  }
}

export interface Student {
  id: ID
  name: string
  universityId: ID
  degree: string
  graduationYear: number
  location: string
  preferredRole: string
  bio: string
  careerInterests: string[]
  visibility: ProfileVisibility
  createdAt: string
  updatedAt: string
}

export interface EducationRecord {
  id: ID
  studentId: ID
  universityId: ID
  degree: string
  startYear: number
  graduationYear: number
  /** Shown on the profile only. Never used by the matching engine. */
  cgpa: number
  cgpaScale: number
  highlights: string[]
}

export interface StudentSkill {
  id: ID
  studentId: ID
  skillId: ID
  /** 0–100. For an assessed skill this follows the documented mapping in lib/campus/assessments.ts. */
  proficiency: number
  /** What the student said before any assessment. Kept so an assessment never silently erases the self-rating. */
  selfRating?: number
  evidenceType: EvidenceType
  verificationStatus: VerificationStatus
  /** Required whenever verificationStatus is 'verified'. */
  verificationId?: ID
  lastAssessedAt?: string
  createdAt: string
  updatedAt: string
}

export type VerifierKind = 'assessment' | 'institution' | 'employer' | 'faculty_review'

export interface VerificationRecord {
  id: ID
  studentId: ID
  /** The claim this record verifies: a skill, or a project (a faculty project review). */
  studentSkillId?: ID
  projectId?: ID
  kind: VerifierKind
  verifierName: string
  verifiedAt: string
  note: string
  /** Set when the record comes from an in-app assessment attempt. */
  attemptId?: ID
}

export interface AssessmentQuestion {
  id: ID
  prompt: string
  /** Optional code shown under the prompt. */
  code?: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Assessment {
  id: ID
  skillId: ID
  title: string
  description: string
  questions: AssessmentQuestion[]
  /** Percentage needed for the result to count as assessment evidence. */
  passMark: number
}

export interface AssessmentAttempt {
  id: ID
  assessmentId: ID
  studentId: ID
  answers: number[]
  correct: number
  total: number
  /** correct / total × 100, rounded. */
  score: number
  passed: boolean
  completedAt: string
}

export type ProjectRole = 'Solo' | 'Lead' | 'Contributor'

export interface Project {
  id: ID
  studentId: ID
  name: string
  summary: string
  problem: string
  implementation: string
  contribution: string
  role: ProjectRole
  completedAt: string
  /** 'verified' only when a faculty_review VerificationRecord exists for the project. */
  verificationStatus: VerificationStatus
  verificationId?: ID
  createdAt: string
  updatedAt: string
}

export interface ProjectSkill {
  id: ID
  projectId: ID
  skillId: ID
}

export interface ProjectEvidence {
  id: ID
  projectId: ID
  label: string
  /** Seeded links use the reserved .example domain so they can never point at a real site. */
  url: string
  kind: 'repository' | 'demo' | 'report' | 'video'
}

export interface Achievement {
  id: ID
  studentId: ID
  title: string
  issuer: string
  date: string
  kind: 'competition' | 'certificate' | 'extracurricular' | 'award'
  description: string
}

export type WorkArrangement = 'On-site' | 'Hybrid' | 'Remote'

export interface Job {
  id: ID
  companyId: ID
  title: string
  type: 'Full-time' | 'Internship'
  location: string
  arrangement: WorkArrangement
  description: string
  responsibilities: string[]
  experience: string
  postedAt: string
  status: 'open' | 'closed'
  /** Lets a job opt out of an evidence component; the engine then re-normalises the weights. */
  evidencePolicy: { projects: boolean; assessments: boolean }
  /** Set when the skill requirements were derived from real postings (lib/campus/calibration.ts). */
  calibration?: { postings: number; companies?: number; families: string[]; date: string }
}

export interface JobSkillRequirement {
  id: ID
  jobId: ID
  skillId: ID
  kind: 'required' | 'preferred'
  /** Proficiency (0–100) at which the requirement counts as fully met. */
  minProficiency: number
}

export interface CandidateShortlist {
  id: ID
  companyId: ID
  jobId: ID
  studentId: ID
  createdAt: string
}

export interface CandidateReview {
  id: ID
  companyId: ID
  studentId: ID
  reviewedAt: string
}

export interface EmployerNote {
  id: ID
  companyId: ID
  studentId: ID
  body: string
  createdAt: string
}

export type ActivityKind =
  | 'project_added'
  | 'project_updated'
  | 'project_deleted'
  | 'assessment_completed'
  | 'skill_added'
  | 'skill_updated'
  | 'job_viewed'
  | 'visibility_changed'
  | 'candidate_shortlisted'
  | 'candidate_unshortlisted'
  | 'candidate_reviewed'
  | 'note_added'
  | 'demo_reset'

export interface ActivityEvent {
  id: ID
  kind: ActivityKind
  actor: 'student' | 'employer' | 'system'
  studentId?: ID
  companyId?: ID
  jobId?: ID
  message: string
  createdAt: string
}

/** A dated proficiency snapshot. Seeded snapshots are illustrative history and are labelled as such in the UI. */
export interface SkillSnapshot {
  studentId: ID
  skillId: ID
  date: string
  proficiency: number
  illustrative: boolean
}

export interface DemoState {
  schemaVersion: number
  universities: University[]
  companies: Company[]
  skills: Skill[]
  students: Student[]
  education: EducationRecord[]
  studentSkills: StudentSkill[]
  verifications: VerificationRecord[]
  attempts: AssessmentAttempt[]
  projects: Project[]
  projectSkills: ProjectSkill[]
  projectEvidence: ProjectEvidence[]
  achievements: Achievement[]
  jobs: Job[]
  jobRequirements: JobSkillRequirement[]
  shortlists: CandidateShortlist[]
  reviews: CandidateReview[]
  notes: EmployerNote[]
  activity: ActivityEvent[]
  skillHistory: SkillSnapshot[]
}
