import type {
  Achievement, ActivityEvent, AssessmentAttempt, CandidateReview, CandidateShortlist, Company, DemoState,
  EducationRecord, EmployerNote, EvidenceType, Job, JobSkillRequirement, Project, ProjectEvidence, ProjectSkill,
  Skill, SkillSnapshot, Student, StudentSkill, University, VerificationRecord, VerifierKind,
} from './types'
import { CALIBRATION, CALIBRATION_DATE } from './calibration'
import type { RoleFamily } from './live-jobs'

/**
 * Fictional SYRKA Campus demo dataset. No real student, university or employer is represented.
 *
 * createSeedState() is pure and deterministic: ids are derived from the order records are declared in, so calling
 * it any number of times yields an identical dataset and resetting never creates duplicates.
 */

// Bump when the seed changes shape or content, so browsers holding an older copy start again from this seed.
export const SCHEMA_VERSION = 2
export const PRIMARY_STUDENT_ID = 's-aarav'
export const PRIMARY_COMPANY_ID = 'c-northstar'

const SKILLS: Skill[] = [
  { id: 'javascript', name: 'JavaScript', category: 'programming', aliases: ['js', 'ecmascript'] },
  { id: 'typescript', name: 'TypeScript', category: 'programming', aliases: ['ts'] },
  { id: 'python', name: 'Python', category: 'programming', aliases: ['py'] },
  { id: 'java', name: 'Java', category: 'programming' },
  { id: 'git', name: 'Git', category: 'programming', aliases: ['version control'] },
  { id: 'golang', name: 'Go', category: 'programming', aliases: ['golang'] },
  { id: 'cpp', name: 'C++', category: 'programming', aliases: ['c plus plus'] },
  { id: 'kotlin', name: 'Kotlin', category: 'programming' },
  { id: 'react', name: 'React', category: 'frontend', aliases: ['reactjs', 'react.js'] },
  { id: 'nextjs', name: 'Next.js', category: 'frontend', aliases: ['next', 'next js'] },
  { id: 'html-css', name: 'HTML & CSS', category: 'frontend', aliases: ['html', 'css', 'html/css'] },
  { id: 'frontend-testing', name: 'Frontend testing', category: 'frontend', aliases: ['jest', 'testing library'] },
  { id: 'nodejs', name: 'Node.js', category: 'backend', aliases: ['node', 'node js'] },
  { id: 'fastapi', name: 'FastAPI', category: 'backend' },
  { id: 'api-development', name: 'API development', category: 'backend', aliases: ['rest', 'rest api', 'apis'] },
  { id: 'websockets', name: 'WebSockets', category: 'backend', aliases: ['websocket', 'socket.io'] },
  { id: 'docker', name: 'Docker', category: 'backend', aliases: ['containers'] },
  { id: 'system-design', name: 'System design', category: 'backend', aliases: ['architecture'] },
  { id: 'cloud-platforms', name: 'Cloud platforms', category: 'backend', aliases: ['aws', 'gcp', 'azure', 'cloud'] },
  { id: 'kubernetes', name: 'Kubernetes', category: 'backend', aliases: ['k8s'] },
  { id: 'software-testing', name: 'Software testing', category: 'backend', aliases: ['test automation', 'unit testing'] },
  { id: 'kafka', name: 'Kafka', category: 'backend' },
  { id: 'sql', name: 'SQL', category: 'data_ai', aliases: ['postgres', 'postgresql', 'mysql'] },
  { id: 'data-visualization', name: 'Data visualization', category: 'data_ai', aliases: ['data viz', 'dataviz', 'visualisation'] },
  { id: 'pandas', name: 'pandas', category: 'data_ai' },
  { id: 'spark', name: 'Spark', category: 'data_ai', aliases: ['pyspark', 'apache spark'] },
  { id: 'excel', name: 'Excel', category: 'data_ai', aliases: ['spreadsheets'] },
  { id: 'statistics', name: 'Statistics', category: 'data_ai', aliases: ['stats'] },
  { id: 'machine-learning', name: 'Machine learning', category: 'data_ai', aliases: ['ml'] },
  { id: 'model-evaluation', name: 'Model evaluation', category: 'data_ai' },
  { id: 'nlp', name: 'NLP', category: 'data_ai', aliases: ['natural language processing'] },
  { id: 'problem-solving', name: 'Problem solving', category: 'analytical' },
  { id: 'quantitative-reasoning', name: 'Quantitative reasoning', category: 'analytical' },
  { id: 'communication', name: 'Communication', category: 'communication' },
  { id: 'technical-writing', name: 'Technical writing', category: 'communication', aliases: ['documentation'] },
  { id: 'teamwork', name: 'Teamwork', category: 'collaboration', aliases: ['collaboration'] },
  { id: 'leadership', name: 'Leadership', category: 'leadership' },
  { id: 'figma', name: 'Figma', category: 'design' },
  { id: 'interaction-design', name: 'Interaction design', category: 'design', aliases: ['ixd', 'ux design'] },
  { id: 'user-research', name: 'User research', category: 'design', aliases: ['ux research'] },
  { id: 'prototyping', name: 'Prototyping', category: 'design' },
  { id: 'edtech', name: 'Education technology', category: 'domain', aliases: ['edtech'] },
  { id: 'fintech', name: 'Financial services', category: 'domain', aliases: ['fintech'] },
  { id: 'health-data', name: 'Health data', category: 'domain', aliases: ['healthcare analytics'] },
]

const UNIVERSITIES: University[] = [
  { id: 'u-dit', name: 'Demo Institute of Technology', city: 'Chandigarh' },
  { id: 'u-northfield', name: 'Northfield University', city: 'Pune' },
  { id: 'u-riverside', name: 'Riverside College of Engineering', city: 'Bengaluru' },
  { id: 'u-lakeview', name: 'Lakeview Institute of Science', city: 'Hyderabad' },
  { id: 'u-eastgate', name: 'Eastgate University', city: 'Kolkata' },
]

const COMPANIES: Company[] = [
  { id: PRIMARY_COMPANY_ID, name: 'Northstar Technologies', industry: 'Software', location: 'Bengaluru', about: 'Builds workflow software for logistics and operations teams.' },
  { id: 'c-lumen', name: 'Lumen Analytics', industry: 'Data and analytics', location: 'Pune', about: 'Analytics consultancy working with retail and public-sector clients.' },
  { id: 'c-quillstack', name: 'Quillstack', industry: 'Education technology', location: 'Remote', about: 'Makes classroom tools for teachers in secondary schools.' },
  { id: 'c-arcadia', name: 'Arcadia Health Labs', industry: 'Health technology', location: 'Hyderabad', about: 'Applies language models to clinical documentation.' },
  { id: 'c-brightpath', name: 'Brightpath Financial', industry: 'Financial services', location: 'Mumbai', about: 'Payments infrastructure for small businesses.' },
]

const VISIBLE_ALL = { education: true, projects: true, achievements: true, assessments: true }

// ── Builder ───────────────────────────────────────────────────────────────────────────────────────────────────────

const STAMP = '2026-09-01T09:00:00.000Z'

interface SkillSpec {
  skill: string
  p: number
  ev: EvidenceType
  /** For verified claims: who verified it. Required for assessment/institution/employer evidence. */
  by?: { kind: VerifierKind; name: string; note: string; at?: string; attemptId?: string }
  /** For project-demonstrated claims: the project whose faculty review verifies it, or 'pending'. */
  review?: 'pending' | { projectKey: string }
  assessed?: string
}

interface ProjectSpec {
  key: string
  name: string
  summary: string
  problem: string
  implementation: string
  contribution: string
  role: Project['role']
  completedAt: string
  skills: string[]
  evidence?: Omit<ProjectEvidence, 'id' | 'projectId'>[]
  review?: { status: 'verified'; by: string; at: string; note: string } | { status: 'pending' } | { status: 'unverified' }
}

interface StudentSpec {
  id: string
  name: string
  universityId: string
  degree: string
  graduationYear: number
  location: string
  preferredRole: string
  bio: string
  careerInterests: string[]
  visible: boolean
  cgpa: number
  highlights: string[]
  skills: SkillSpec[]
  projects: ProjectSpec[]
  achievements?: Omit<Achievement, 'id' | 'studentId'>[]
}

const STUDENTS: StudentSpec[] = [
  {
    id: PRIMARY_STUDENT_ID,
    name: 'Aarav Mehta',
    universityId: 'u-dit',
    degree: 'B.Tech Computer Science and Engineering',
    graduationYear: 2027,
    location: 'Chandigarh, India',
    preferredRole: 'Frontend Engineer',
    bio: 'Final-year CSE student who likes building interfaces that stay fast under real-time load. Most at home in React and TypeScript, currently getting better at backend and data work.',
    careerInterests: ['Frontend engineering', 'Developer tools', 'Real-time systems'],
    visible: true,
    cgpa: 8.4,
    highlights: ['Web Engineering (CS-341): A', 'Design and Analysis of Algorithms: A-', 'Database Systems: B+'],
    skills: [
      { skill: 'react', p: 91, ev: 'project_demonstrated', review: { projectKey: 'collab' } },
      { skill: 'typescript', p: 88, ev: 'institution_verified', by: { kind: 'institution', name: 'Demo Institute of Technology', note: 'CS-341 Web Engineering, final grade A' } },
      { skill: 'nextjs', p: 84, ev: 'project_demonstrated', review: 'pending' },
      { skill: 'javascript', p: 80, ev: 'self_reported' },
      { skill: 'python', p: 80, ev: 'assessment_verified', by: { kind: 'assessment', name: 'Python foundations (sample assessment)', note: '4 of 5 correct', at: '2026-09-18T10:20:00.000Z', attemptId: 'att-aarav-python' }, assessed: '2026-09-18T10:20:00.000Z' },
      { skill: 'sql', p: 76, ev: 'self_reported' },
      { skill: 'problem-solving', p: 87, ev: 'institution_verified', by: { kind: 'institution', name: 'Demo Institute of Technology', note: 'Design and Analysis of Algorithms, final grade A-' } },
      { skill: 'communication', p: 74, ev: 'self_reported' },
      { skill: 'system-design', p: 72, ev: 'project_demonstrated' },
      { skill: 'websockets', p: 78, ev: 'project_demonstrated', review: { projectKey: 'collab' } },
      { skill: 'fastapi', p: 70, ev: 'project_demonstrated', review: 'pending' },
      { skill: 'api-development', p: 74, ev: 'project_demonstrated', review: 'pending' },
      { skill: 'nlp', p: 64, ev: 'project_demonstrated', review: 'pending' },
      { skill: 'data-visualization', p: 70, ev: 'project_demonstrated' },
      { skill: 'html-css', p: 86, ev: 'self_reported' },
      { skill: 'git', p: 85, ev: 'self_reported' },
      { skill: 'teamwork', p: 82, ev: 'self_reported' },
    ],
    projects: [
      {
        key: 'resume', name: 'AI-Powered Resume Analyzer',
        summary: 'A tool that reads a CV and highlights skills, gaps and wording problems against a target role.',
        problem: 'Students at Demo Institute rarely get feedback on their CVs before placement season.',
        implementation: 'FastAPI service using spaCy for entity extraction and a rule-based skill dictionary; React front end with inline highlights.',
        contribution: 'Built the extraction pipeline and the API; paired on the React review screen.',
        role: 'Lead', completedAt: '2025-11-20', skills: ['python', 'nlp', 'fastapi', 'react'],
        evidence: [{ label: 'Source repository (demo)', url: 'https://demo.syrka.example/aarav/resume-analyzer', kind: 'repository' }],
        review: { status: 'pending' },
      },
      {
        key: 'collab', name: 'Real-Time Collaboration Dashboard',
        summary: 'A shared task board where edits from many users appear instantly, with presence and conflict handling.',
        problem: 'Student project teams lost work when several people edited the same planning document.',
        implementation: 'Next.js and TypeScript client, WebSocket server with operation batching, optimistic updates and server reconciliation.',
        contribution: 'Sole developer of the client and the sync protocol; designed the conflict-resolution rules.',
        role: 'Solo', completedAt: '2026-04-12', skills: ['typescript', 'react', 'nextjs', 'websockets', 'system-design'],
        evidence: [
          { label: 'Live demo (demo link)', url: 'https://demo.syrka.example/aarav/collab-board', kind: 'demo' },
          { label: 'Design write-up (demo)', url: 'https://demo.syrka.example/aarav/collab-board/report.pdf', kind: 'report' },
        ],
        review: { status: 'verified', by: 'Faculty reviewer, Dept. of CSE, Demo Institute of Technology', at: '2026-05-02T11:00:00.000Z', note: 'Reviewed source and live demo; confirmed sole authorship of client and sync layer.' },
      },
      {
        key: 'perf', name: 'Student Performance Analytics',
        summary: 'Dashboards that help a department see which modules students struggle with, term by term.',
        problem: 'Module results sat in spreadsheets no one could compare across terms.',
        implementation: 'SQL views over anonymised results, Python (pandas) for cleaning, charts rendered with a plotting library.',
        contribution: 'Wrote the SQL views and the cleaning scripts; a teammate built the charts.',
        role: 'Contributor', completedAt: '2026-08-30', skills: ['sql', 'python', 'data-visualization'],
        review: { status: 'unverified' },
      },
    ],
    achievements: [
      { title: 'Campus Code Sprint 2025 — Finalist', issuer: 'Demo Institute of Technology', date: '2025-03-15', kind: 'competition', description: '36-hour team build; finalist out of 48 teams with an offline-first attendance app.' },
      { title: 'Web Accessibility Foundations', issuer: 'Demo Learning Academy', date: '2026-01-10', kind: 'certificate', description: 'Short course on WCAG basics, keyboard navigation and screen-reader testing.' },
      { title: 'Coding Club workshop lead', issuer: 'DIT Coding Club', date: '2026-02-01', kind: 'extracurricular', description: 'Ran six weekend workshops on React for first-year students.' },
    ],
  },
  {
    id: 's-priya', name: 'Priya Nair', universityId: 'u-northfield', degree: 'B.Tech Information Technology', graduationYear: 2027,
    location: 'Pune, India', preferredRole: 'Data Analyst',
    bio: 'Enjoys turning messy operational data into decisions. Strongest in SQL and visual storytelling.',
    careerInterests: ['Analytics', 'Business intelligence'], visible: true, cgpa: 8.9,
    highlights: ['Data Warehousing: A', 'Probability and Statistics: A'],
    skills: [
      { skill: 'sql', p: 88, ev: 'assessment_verified', by: { kind: 'assessment', name: 'SQL foundations (sample assessment)', note: '5 of 5 correct', at: '2026-08-11T09:00:00.000Z' }, assessed: '2026-08-11T09:00:00.000Z' },
      { skill: 'python', p: 74, ev: 'institution_verified', by: { kind: 'institution', name: 'Northfield University', note: 'Programming for Data Science, grade A-' } },
      { skill: 'data-visualization', p: 82, ev: 'project_demonstrated', review: { projectKey: 'retail' } },
      { skill: 'statistics', p: 76, ev: 'institution_verified', by: { kind: 'institution', name: 'Northfield University', note: 'Probability and Statistics, grade A' } },
      { skill: 'pandas', p: 78, ev: 'project_demonstrated', review: { projectKey: 'retail' } },
      { skill: 'communication', p: 80, ev: 'self_reported' },
      { skill: 'problem-solving', p: 82, ev: 'self_reported' },
      { skill: 'excel', p: 85, ev: 'self_reported' },
    ],
    projects: [
      { key: 'retail'
, name: 'Retail Footfall Forecasting', summary: 'Weekly footfall forecasts and a store-manager dashboard for a fictional retail chain.', problem: 'Staff rosters ignored predictable weekly peaks.', implementation: 'SQL feature tables, pandas, seasonal models and an interactive dashboard.', contribution: 'Owned the data model and dashboard.', role: 'Lead', completedAt: '2026-05-20', skills: ['sql', 'pandas', 'data-visualization', 'statistics'], evidence: [{ label: 'Report (demo)', url: 'https://demo.syrka.example/priya/footfall', kind: 'report' }], review: { status: 'verified', by: 'Faculty reviewer, Northfield University', at: '2026-06-04T10:00:00.000Z', note: 'Reviewed model and dashboard.' } },
      { key: 'survey', name: 'Campus Transport Survey', summary: 'Analysis of 1,200 survey responses on student commuting.', problem: 'The transport office had raw responses but no summary.', implementation: 'Cleaning in pandas, charts and a written brief.', contribution: 'Analysis and brief.', role: 'Solo', completedAt: '2025-12-10', skills: ['python', 'data-visualization', 'communication'], review: { status: 'unverified' } },
    ],
  },
  {
    id: 's-rohan', name: 'Rohan Verma', universityId: 'u-riverside', degree: 'B.E. Computer Science', graduationYear: 2027,
    location: 'Bengaluru, India', preferredRole: 'Backend Engineer',
    bio: 'Backend-leaning developer who likes clean APIs and well-tested services.',
    careerInterests: ['Backend engineering', 'Distributed systems'], visible: true, cgpa: 7.6,
    highlights: ['Operating Systems: A', 'Computer Networks: B+'],
    skills: [
      { skill: 'python', p: 85, ev: 'assessment_verified', by: { kind: 'assessment', name: 'Python foundations (sample assessment)', note: '5 of 5 correct', at: '2026-07-22T09:00:00.000Z' }, assessed: '2026-07-22T09:00:00.000Z' },
      { skill: 'sql', p: 72, ev: 'self_reported' },
      { skill: 'api-development', p: 80, ev: 'project_demonstrated', review: { projectKey: 'ledger' } },
      { skill: 'fastapi', p: 78, ev: 'project_demonstrated', review: { projectKey: 'ledger' } },
      { skill: 'docker', p: 66, ev: 'self_reported' },
      { skill: 'system-design', p: 64, ev: 'self_reported' },
      { skill: 'nodejs', p: 60, ev: 'self_reported' },
      { skill: 'cloud-platforms', p: 62, ev: 'self_reported' },
    ],
    projects: [
      { key: 'ledger', name: 'Hostel Expense Ledger API', summary: 'A REST API for splitting shared hostel expenses.', problem: 'Shared costs were tracked in chat messages.', implementation: 'FastAPI, SQLite, token auth, 92% test coverage.', contribution: 'Sole developer.', role: 'Solo', completedAt: '2026-03-02', skills: ['python', 'fastapi', 'api-development', 'sql'], evidence: [{ label: 'Repository (demo)', url: 'https://demo.syrka.example/rohan/ledger-api', kind: 'repository' }], review: { status: 'verified', by: 'Faculty reviewer, Riverside College of Engineering', at: '2026-03-20T10:00:00.000Z', note: 'Code review and API walkthrough.' } },
    ],
  },
  {
    id: 's-meera', name: 'Meera Iyer', universityId: 'u-lakeview', degree: 'B.Des Interaction Design', graduationYear: 2027,
    location: 'Hyderabad, India', preferredRole: 'Product Designer',
    bio: 'Interaction designer with a research habit. Interned on a design-systems team last summer.',
    careerInterests: ['Product design', 'Design systems'], visible: true, cgpa: 8.1,
    highlights: ['Interaction Design Studio: A', 'Research Methods: A-'],
    skills: [
      { skill: 'figma', p: 90, ev: 'employer_verified', by: { kind: 'employer', name: 'Quillstack (internship supervisor)', note: 'Summer 2026 design internship' } },
      { skill: 'interaction-design', p: 84, ev: 'project_demonstrated', review: { projectKey: 'clinic' } },
      { skill: 'user-research', p: 78, ev: 'institution_verified', by: { kind: 'institution', name: 'Lakeview Institute of Science', note: 'Research Methods, grade A-' } },
      { skill: 'prototyping', p: 82, ev: 'project_demonstrated', review: { projectKey: 'clinic' } },
      { skill: 'communication', p: 85, ev: 'self_reported' },
      { skill: 'html-css', p: 55, ev: 'self_reported' },
    ],
    projects: [
      { key: 'clinic', name: 'Clinic Queue Redesign', summary: 'Redesigned the check-in flow of a fictional community clinic.', problem: 'Patients could not tell how long they would wait.', implementation: 'Contextual interviews, journey maps, Figma prototypes tested with 14 participants.', contribution: 'Led research and interaction design.', role: 'Lead', completedAt: '2026-04-28', skills: ['user-research', 'interaction-design', 'prototyping', 'figma'], evidence: [{ label: 'Case study (demo)', url: 'https://demo.syrka.example/meera/clinic-queue', kind: 'report' }], review: { status: 'verified', by: 'Studio faculty, Lakeview Institute of Science', at: '2026-05-10T10:00:00.000Z', note: 'Reviewed research artefacts and prototype.' } },
    ],
  },
  {
    id: 's-kabir', name: 'Kabir Singh', universityId: 'u-dit', degree: 'B.Tech CSE (Artificial Intelligence)', graduationYear: 2027,
    location: 'Chandigarh, India', preferredRole: 'AI/ML Engineer',
    bio: 'Interested in making models measurable: evaluation, error analysis and reproducible experiments.',
    careerInterests: ['Machine learning', 'Applied research'], visible: true, cgpa: 9.1,
    highlights: ['Machine Learning: A', 'Linear Algebra: A'],
    skills: [
      { skill: 'python', p: 90, ev: 'assessment_verified', by: { kind: 'assessment', name: 'Python foundations (sample assessment)', note: '5 of 5 correct', at: '2026-06-30T09:00:00.000Z' }, assessed: '2026-06-30T09:00:00.000Z' },
      { skill: 'machine-learning', p: 84, ev: 'institution_verified', by: { kind: 'institution', name: 'Demo Institute of Technology', note: 'Machine Learning, grade A' } },
      { skill: 'model-evaluation', p: 78, ev: 'project_demonstrated', review: { projectKey: 'eval' } },
      { skill: 'nlp', p: 74, ev: 'project_demonstrated', review: { projectKey: 'eval' } },
      { skill: 'sql', p: 62, ev: 'self_reported' },
      { skill: 'statistics', p: 80, ev: 'self_reported' },
      { skill: 'communication', p: 72, ev: 'self_reported' },
    ],
    projects: [
      { key: 'eval', name: 'Hindi–English Sentiment Benchmark', summary: 'An evaluation suite for sentiment models on code-mixed text.', problem: 'Public benchmarks ignore code-mixed language.', implementation: 'Labelled 4,000 synthetic sentences, built metrics and error-slice reports.', contribution: 'Dataset design and evaluation harness.', role: 'Lead', completedAt: '2026-05-15', skills: ['python', 'nlp', 'model-evaluation', 'machine-learning'], evidence: [{ label: 'Repository (demo)', url: 'https://demo.syrka.example/kabir/codemix-bench', kind: 'repository' }], review: { status: 'verified', by: 'Faculty reviewer, Demo Institute of Technology', at: '2026-06-01T10:00:00.000Z', note: 'Reviewed evaluation methodology.' } },
    ],
  },
  {
    id: 's-ananya', name: 'Ananya Rao', universityId: 'u-eastgate', degree: 'B.Sc Computer Science', graduationYear: 2028,
    location: 'Kolkata, India', preferredRole: 'Frontend Engineer',
    bio: 'Third-year student who builds small, careful web interfaces. Learning TypeScript now.',
    careerInterests: ['Frontend engineering', 'Accessibility'], visible: true, cgpa: 8.6,
    highlights: ['Web Technologies: A'],
    skills: [
      { skill: 'react', p: 78, ev: 'self_reported' },
      { skill: 'javascript', p: 80, ev: 'assessment_verified', by: { kind: 'assessment', name: 'JavaScript fundamentals (sample assessment)', note: '4 of 5 correct', at: '2026-09-02T09:00:00.000Z' }, assessed: '2026-09-02T09:00:00.000Z' },
      { skill: 'html-css', p: 85, ev: 'project_demonstrated' },
      { skill: 'typescript', p: 52, ev: 'self_reported' },
      { skill: 'figma', p: 60, ev: 'self_reported' },
    ],
    projects: [
      { key: 'a11y', name: 'Accessible Library Catalogue', summary: 'A keyboard- and screen-reader-friendly catalogue for a college library.', problem: 'The old catalogue could not be used without a mouse.', implementation: 'React, semantic HTML, automated accessibility checks.', contribution: 'Sole developer.', role: 'Solo', completedAt: '2026-07-01', skills: ['react', 'html-css', 'javascript'], review: { status: 'unverified' } },
    ],
  },
  {
    id: 's-dev', name: 'Dev Malhotra', universityId: 'u-riverside', degree: 'B.Tech Computer Science', graduationYear: 2027,
    location: 'Bengaluru, India', preferredRole: 'Full-stack Developer',
    bio: 'Full-stack developer; spent a summer shipping internal tools at a logistics start-up.',
    careerInterests: ['Full-stack engineering', 'Product engineering'], visible: true, cgpa: 7.9,
    highlights: ['Software Engineering: A-'],
    skills: [
      { skill: 'react', p: 84, ev: 'project_demonstrated', review: { projectKey: 'fleet' } },
      { skill: 'typescript', p: 80, ev: 'self_reported' },
      { skill: 'javascript', p: 84, ev: 'self_reported' },
      { skill: 'cloud-platforms', p: 58, ev: 'self_reported' },
      { skill: 'nextjs', p: 76,
 ev: 'project_demonstrated', review: { projectKey: 'fleet' } },
      { skill: 'nodejs', p: 82, ev: 'employer_verified', by: { kind: 'employer', name: 'Internship supervisor (demo company)', note: 'Summer 2026 engineering internship' } },
      { skill: 'api-development', p: 74, ev: 'project_demonstrated', review: { projectKey: 'fleet' } },
      { skill: 'sql', p: 66, ev: 'self_reported' },
      { skill: 'system-design', p: 70, ev: 'self_reported' },
      { skill: 'docker', p: 60, ev: 'self_reported' },
    ],
    projects: [
      { key: 'fleet', name: 'Fleet Dispatch Console', summary: 'A dispatcher console showing live vehicle status and job assignment.', problem: 'Dispatchers juggled three tools to assign a delivery.', implementation: 'Next.js front end, Node.js API, PostgreSQL.', contribution: 'Front end and API endpoints.', role: 'Contributor', completedAt: '2026-08-10', skills: ['react', 'nextjs', 'nodejs', 'api-development', 'sql'], evidence: [{ label: 'Walkthrough video (demo)', url: 'https://demo.syrka.example/dev/fleet-console', kind: 'video' }], review: { status: 'verified', by: 'Faculty reviewer, Riverside College of Engineering', at: '2026-09-01T10:00:00.000Z', note: 'Reviewed demo and contribution log.' } },
    ],
  },
  {
    id: 's-sara', name: 'Sara Khan', universityId: 'u-northfield', degree: 'B.Tech Computer Science', graduationYear: 2027,
    location: 'Pune, India', preferredRole: 'Data Analyst',
    bio: 'Student council lead moving into analytics. Early in building a portfolio.',
    careerInterests: ['Analytics', 'Product operations'], visible: true, cgpa: 8.0,
    highlights: [],
    skills: [
      { skill: 'sql', p: 70, ev: 'self_reported' },
      { skill: 'data-visualization', p: 65, ev: 'self_reported' },
      { skill: 'python', p: 58, ev: 'self_reported' },
      { skill: 'communication', p: 88, ev: 'self_reported' },
      { skill: 'leadership', p: 80, ev: 'self_reported' },
    ],
    projects: [],
  },
  {
    id: 's-arjun', name: 'Arjun Pillai', universityId: 'u-lakeview', degree: 'B.Tech Electronics and Communication', graduationYear: 2026,
    location: 'Hyderabad, India', preferredRole: 'Backend Engineer',
    bio: 'Recent graduate who moved from embedded systems into backend services.',
    careerInterests: ['Backend engineering'], visible: true, cgpa: 7.2,
    highlights: ['Data Structures: A'],
    skills: [
      { skill: 'java', p: 86, ev: 'institution_verified', by: { kind: 'institution', name: 'Lakeview Institute of Science', note: 'Object-Oriented Programming, grade A' } },
      { skill: 'sql', p: 78, ev: 'assessment_verified', by: { kind: 'assessment', name: 'SQL foundations (sample assessment)', note: '4 of 5 correct', at: '2026-05-14T09:00:00.000Z' }, assessed: '2026-05-14T09:00:00.000Z' },
      { skill: 'api-development', p: 68, ev: 'self_reported' },
      { skill: 'system-design', p: 72, ev: 'self_reported' },
      { skill: 'python', p: 50, ev: 'self_reported' },
    ],
    projects: [
      { key: 'iot', name: 'Sensor Telemetry Service', summary: 'A Java service collecting readings from lab sensors.', problem: 'Lab readings were copied by hand.', implementation: 'Spring Boot, MySQL, REST endpoints.', contribution: 'Sole developer.', role: 'Solo', completedAt: '2026-02-18', skills: ['java', 'sql', 'api-development'], review: { status: 'unverified' } },
    ],
  },
  {
    id: 's-isha', name: 'Isha Gupta', universityId: 'u-eastgate', degree: 'B.Tech Computer Science', graduationYear: 2027,
    location: 'Kolkata, India', preferredRole: 'AI/ML Engineer',
    bio: 'NLP enthusiast. Keeps her profile private while she finishes her thesis.',
    careerInterests: ['NLP', 'Research'], visible: false, cgpa: 8.7,
    highlights: ['Natural Language Processing: A'],
    skills: [
      { skill: 'python', p: 76, ev: 'self_reported' },
      { skill: 'machine-learning', p: 70, ev: 'self_reported' },
      { skill: 'nlp', p: 80, ev: 'project_demonstrated', review: { projectKey: 'summ' } },
      { skill: 'model-evaluation', p: 58, ev: 'self_reported' },
      { skill: 'technical-writing', p: 82, ev: 'self_reported' },
    ],
    projects: [
      { key: 'summ', name: 'Lecture Summariser', summary: 'Summarises recorded lectures into study notes.', problem: 'Students rewatch whole lectures to find one topic.', implementation: 'Speech-to-text plus an extractive summariser.', contribution: 'Sole developer.', role: 'Solo', completedAt: '2026-06-20', skills: ['python', 'nlp'], review: { status: 'verified', by: 'Faculty reviewer, Eastgate University', at: '2026-07-02T10:00:00.000Z', note: 'Reviewed output quality.' } },
    ],
  },
  {
    id: 's-neel', name: 'Neel Joshi', universityId: 'u-dit', degree: 'B.Tech Mechanical Engineering', graduationYear: 2027,
    location: 'Chandigarh, India', preferredRole: 'Data Analyst',
    bio: 'Mechanical engineer who found he likes the data more than the machines.',
    careerInterests: ['Operations analytics'], visible: true, cgpa: 7.8,
    highlights: ['Engineering Statistics: A'],
    skills: [
      { skill: 'python', p: 68, ev: 'self_reported' },
      { skill: 'statistics', p: 82, ev: 'institution_verified', by: { kind: 'institution', name: 'Demo Institute of Technology', note: 'Engineering Statistics, grade A' } },
      { skill: 'data-visualization', p: 74, ev: 'project_demonstrated' },
      { skill: 'sql', p: 55, ev: 'self_reported' },
      { skill: 'excel', p: 82, ev: 'self_reported' },
      { skill: 'quantitative-reasoning', p: 85, ev: 'institution_verified', by: { kind: 'institution', name: 'Demo Institute of Technology', note: 'Operations Research, grade A' } },
    ],
    projects: [
      { key: 'plant', name: 'Workshop Downtime Analysis', summary: 'Found the main causes of machine downtime in the college workshop.', problem: 'Downtime was logged but never analysed.', implementation: 'Python notebooks and Pareto charts.', contribution: 'Sole analyst.', role: 'Solo', completedAt: '2026-04-05', skills: ['python', 'statistics', 'data-visualization'], review: { status: 'pending' } },
    ],
  },
  {
    id: 's-tanvi', name: 'Tanvi Desai', universityId: 'u-riverside', degree: 'B.Des Communication Design', graduationYear: 2028,
    location: 'Bengaluru, India', preferredRole: 'Product Designer',
    bio: 'Visual designer moving into product work.',
    careerInterests: ['Product design', 'Branding'], visible: true, cgpa: 8.3,
    highlights: [],
    skills: [
      { skill: 'figma', p: 76, ev: 'self_reported' },
      { skill: 'user-research', p: 70, ev: 'project_demonstrated' },
      { skill: 'interaction-design', p: 62, ev: 'self_reported' },
      { skill: 'prototyping', p: 74, ev: 'self_reported' },
    ],
    projects: [
      { key: 'cafe', name: 'Campus Café Ordering App', summary: 'Concept app for pre-ordering at the campus café.', problem: 'Long queues at lunch.', implementation: 'Survey of 60 students, Figma prototype.', contribution: 'Research and visual design.', role: 'Lead', completedAt: '2026-03-12', skills: ['user-research', 'figma'], review: { status: 'unverified' } },
    ],
  },
  {
    id: 's-farhan', name: 'Farhan Ali', universityId: 'u-northfield', degree: 'B.Tech Computer Science', graduationYear: 2028,
    location: 'Pune, India', preferredRole: 'Frontend Engineer',
    bio: 'Building a first portfolio of web projects.',
    careerInterests: ['Frontend engineering'], visible: true, cgpa: 6.9,
    highlights: [],
    skills: [
      { skill: 'react', p: 70, ev: 'self_reported' },
      { skill: 'javascript', p: 74, ev: 'self_reported' },
      { skill: 'html-css', p: 80, ev: 'self_reported' },
    ],
    projects: [],
  },
  {
    id: 's-zoya', name: 'Zoya Sheikh', universityId: 'u-lakeview', degree: 'B.Tech Computer Science', graduationYear: 2027,
    location: 'Hyderabad, India', preferredRole: 'Platform Engineer',
    bio: 'Platform-minded engineer. Profile currently private.',
    careerInterests: ['Platform engineering', 'Payments'], visible: false, cgpa: 8.2,
    highlights: [],
    skills: [
      { skill: 'typescript', p: 82, ev: 'self_reported' },
      { skill: 'nodejs', p: 78, ev: 'self_reported' },
      { skill: 'system-design', p: 75, ev: 'self_reported' },
      { skill: 'sql', p: 70, ev: 'self_reported' },
    ],
    projects: [],
  },
]

interface JobSpec extends Omit<Job, 'evidencePolicy' | 'status' | 'calibration'> {
  /** Hand-written requirements, used only when the job has no calibration or too few postings back it. */
  required: [string, number][]
  preferred: [string, number][]
  evidencePolicy?: Job['evidencePolicy']
  /** Derive requirements from real postings in these role families, at these [required, preferred] levels. */
  calibrate?: { families: RoleFamily[]; levels: [number, number]; maxRequired?: number }
}

/** Fewest postings a calibration needs before it replaces the hand-written requirements. */
export const MIN_CALIBRATION_POSTINGS = 8

/**
 * Turns real-posting skill shares into job requirements, mechanically: up to `maxRequired` (default 3) skills that
 * appear in at least half of the postings become required; the next up to 3 skills that appear in at least 30%
 * become preferred. Shares from several families are pooled, weighted by their number of postings. Returns null
 * when fewer than MIN_CALIBRATION_POSTINGS postings back the families, so thin samples never set requirements.
 */
export function deriveRequirements(families: RoleFamily[], maxRequired = 3) {
  const present = families.map(f => CALIBRATION[f]).filter(c => c !== undefined)
  const postings = present.reduce((t, c) => t + c.postings, 0)
  if (postings < MIN_CALIBRATION_POSTINGS) return null
  const pooled = new Map<string, number>()
  for (const c of present) for (const k of c.skills) pooled.set(k.skillId, (pooled.get(k.skillId) ?? 0) + k.share * c.postings)
  const ranked = [...pooled.entries()].map(([skillId, n]) => ({ skillId, share: n / postings })).sort((a, b) => b.share - a.share || a.skillId.localeCompare(b.skillId))
  const required = ranked.filter(r => r.share >= 0.5).slice(0, maxRequired)
  const preferred = ranked.filter(r => !required.includes(r) && r.share >= 0.3).slice(0, 3)
  // Company counts cannot be pooled (one company can post in several families), so they are kept for one family only.
  return { required, preferred, postings, companies: present.length === 1 ? present[0].companies : undefined }
}

const JOBS: JobSpec[] = [
  {
    id: 'j-ns-frontend', companyId: PRIMARY_COMPANY_ID, title: 'Frontend Engineer', type: 'Full-time', location: 'Bengaluru', arrangement: 'Hybrid',
    description: 'Build the operator console our customers use all day: dense tables, live updates and keyboard-first workflows.',
    responsibilities: ['Ship features in a Next.js and TypeScript codebase', 'Work with design on interaction details', 'Keep the console fast with thousands of live rows'],
    experience: 'Graduating students and early-career engineers. Shipped project work matters more than years.', postedAt: '2026-09-20',
    calibrate: { families: ['frontend', 'fullstack'], levels: [75, 60] },
    required: [['react', 75], ['typescript', 75], ['nextjs', 70]], preferred: [['html-css', 70], ['system-design', 60], ['frontend-testing', 60]],
  },
  {
    id: 'j-ns-backend', companyId: PRIMARY_COMPANY_ID, title: 'Backend Engineer', type: 'Full-time', location: 'Bengaluru', arrangement: 'On-site',
    description: 'Design and run the APIs behind our routing and scheduling products.',
    responsibilities: ['Build and document Python services', 'Model data in SQL', 'Own on-call for services you build'],
    experience: 'Graduating students with backend project work.', postedAt: '2026-09-22',
    calibrate: { families: ['backend'], levels: [70, 60] },
    required: [['python', 70], ['sql', 70], ['api-development', 70]], preferred: [['docker', 60], ['system-design', 65]],
  },
  {
    id: 'j-ns-data', companyId: PRIMARY_COMPANY_ID, title: 'Data Analyst', type: 'Full-time', location: 'Bengaluru', arrangement: 'Hybrid',
    description: 'Help customers understand their operations data and help us decide what to build.',
    responsibilities: ['Write SQL against our warehouse', 'Build dashboards for customer success', 'Present findings to non-technical teams'],
    experience: 'Graduating students; analytics coursework or projects.', postedAt: '2026-09-25',
    calibrate: { families: ['data_analyst'], levels: [75, 65] },
    required: [['sql', 75], ['python', 65], ['data-visualization', 70]], preferred: [['statistics', 65], ['communication', 70]],
  },
  {
    id: 'j-ns-design', companyId: PRIMARY_COMPANY_ID, title: 'Product Designer', type: 'Full-time', location: 'Bengaluru', arrangement: 'Hybrid',
    description: 'Design workflows for operators who use our product for eight hours a day.',
    responsibilities: ['Run research with operators', 'Prototype and test flows', 'Contribute to the design system'],
    experience: 'A portfolio with research-led case studies.', postedAt: '2026-10-01',
    calibrate: { families: ['design'], levels: [75, 60] },
    required: [['figma', 75], ['interaction-design', 70], ['user-research', 65]], preferred: [['prototyping', 60], ['communication', 70]],
  },
  {
    id: 'j-ns-ml', companyId: PRIMARY_COMPANY_ID, title: 'AI/ML Engineer', type: 'Full-time', location: 'Bengaluru', arrangement: 'Hybrid',
    description: 'Build and evaluate the demand-forecasting models behind our scheduling engine.',
    responsibilities: ['Train and evaluate models', 'Build evaluation datasets', 'Work with backend engineers to deploy models'],
    experience: 'Graduating students with applied ML projects.', postedAt: '2026-10-03',
    calibrate: { families: ['ml'], levels: [80, 65] },
    required: [['python', 80], ['machine-learning', 75], ['model-evaluation', 70]], preferred: [['sql', 60], ['statistics', 65]],
  },
  {
    id: 'j-lumen-de', companyId: 'c-lumen', title: 'Junior Data Engineer', type: 'Full-time', location: 'Pune', arrangement: 'Hybrid',
    description: 'Build pipelines that feed client dashboards.',
    responsibilities: ['Write and test SQL transformations', 'Automate data loads in Python'],
    experience: 'Graduating students.', postedAt: '2026-09-15',
    calibrate: { families: ['data_engineer'], levels: [75, 60] },
    required: [['sql', 75], ['python', 70], ['pandas', 60]], preferred: [['docker', 50]],
  },
  {
    id: 'j-lumen-intern', companyId: 'c-lumen', title: 'Analytics Intern', type: 'Internship', location: 'Pune', arrangement: 'On-site',
    description: 'Six-month internship supporting client analytics projects.',
    responsibilities: ['Prepare data extracts', 'Build simple dashboards'],
    experience: 'Students in their final or pre-final year.', postedAt: '2026-10-05',
    calibrate: { families: ['data_analyst'], levels: [60, 55], maxRequired: 2 },
    required: [['sql', 60], ['data-visualization', 60]], preferred: [['communication', 65]],
    // Internship screening here relies on coursework, so project evidence is not part of the requirement.
    evidencePolicy: { projects: false, assessments: true },
  },
  {
    id: 'j-quill-fs', companyId: 'c-quillstack', title: 'Full-stack Developer Intern', type: 'Internship', location: 'Remote', arrangement: 'Remote',
    description: 'Build features for a classroom tool used by teachers.',
    responsibilities: ['Ship React features end to end', 'Write Node.js API endpoints'],
    experience: 'Students with at least one full-stack project.', postedAt: '2026-09-28',
    calibrate: { families: ['fullstack'], levels: [65, 55] },
    required: [['react', 65], ['nodejs', 65], ['api-development', 60]], preferred: [['typescript', 60], ['edtech', 50]],
  },
  {
    id: 'j-arcadia-nlp', companyId: 'c-arcadia', title: 'NLP Research Intern', type: 'Internship', location: 'Hyderabad', arrangement: 'Hybrid',
    description: 'Evaluate language models on clinical note summarisation.',
    responsibilities: ['Build evaluation sets', 'Run and analyse experiments'],
    experience: 'Students with NLP coursework or projects.', postedAt: '2026-10-08',
    calibrate: { families: ['ml'], levels: [70, 60] },
    required: [['python', 75], ['nlp', 70], ['machine-learning', 65]], preferred: [],
  },
  {
    id: 'j-bright-platform', companyId: 'c-brightpath', title: 'Software Engineer, Platform', type: 'Full-time', location: 'Mumbai', arrangement: 'Hybrid',
    description: 'Build the internal platform our payments services run on.',
    responsibilities: ['Build TypeScript services on Node.js', 'Design for reliability'],
    experience: 'Graduating students with systems projects.', postedAt: '2026-10-10',
    calibrate: { families: ['platform'], levels: [70, 60] },
    required: [['typescript', 70], ['nodejs', 70], ['system-design', 70]], preferred: [['sql', 65], ['fintech', 50]],
  },
]

// ── Assembly ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function createSeedState(): DemoState {
  let n = 0
  const id = (prefix: string) => `${prefix}-${(++n).toString(36).padStart(3, '0')}`

  const students: Student[] = []
  const education: EducationRecord[] = []
  const studentSkills: StudentSkill[] = []
  const verifications: VerificationRecord[] = []
  const attempts: AssessmentAttempt[] = []
  const projects: Project[] = []
  const projectSkills: ProjectSkill[] = []
  const projectEvidence: ProjectEvidence[] = []
  const achievements: Achievement[] = []

  for (const s of STUDENTS) {
    students.push({
      id: s.id, name: s.name, universityId: s.universityId, degree: s.degree, graduationYear: s.graduationYear,
      location: s.location, preferredRole: s.preferredRole, bio: s.bio, careerInterests: s.careerInterests,
      visibility: { employerVisible: s.visible, sections: { ...VISIBLE_ALL } },
      createdAt: STAMP, updatedAt: STAMP,
    })
    education.push({
      id: id('edu'), studentId: s.id, universityId: s.universityId, degree: s.degree,
      startYear: s.graduationYear - 4, graduationYear: s.graduationYear, cgpa: s.cgpa, cgpaScale: 10, highlights: s.highlights,
    })

    // Projects first, so project-review verification records exist before the skills that cite them.
    const projectIds: Record<string, string> = {}
    const projectReviewIds: Record<string, string> = {}
    for (const p of s.projects) {
      const pid = `${s.id}-${p.key}`.replace(/^s-/, 'p-')
      projectIds[p.key] = pid
      let verificationId: string | undefined
      if (p.review?.status === 'verified') {
        verificationId = id('ver')
        projectReviewIds[p.key] = verificationId
        verifications.push({ id: verificationId, studentId: s.id, projectId: pid, kind: 'faculty_review', verifierName: p.review.by, verifiedAt: p.review.at, note: p.review.note })
      }
      projects.push({
        id: pid, studentId: s.id, name: p.name, summary: p.summary, problem: p.problem, implementation: p.implementation,
        contribution: p.contribution, role: p.role, completedAt: p.completedAt,
        verificationStatus: p.review?.status ?? 'unverified', verificationId,
        createdAt: STAMP, updatedAt: STAMP,
      })
      for (const skillId of p.skills) projectSkills.push({ id: id('ps'), projectId: pid, skillId })
      for (const e of p.evidence ?? []) projectEvidence.push({ id: id('pe'), projectId: pid, ...e })
    }

    for (const k of s.skills) {
      const ssId = `${s.id}-${k.skill}`.replace(/^s-/, 'ss-')
      let verificationStatus: StudentSkill['verificationStatus'] = 'unverified'
      let verificationId: string | undefined
      if (k.by) {
        verificationId = id('ver')
        verificationStatus = 'verified'
        if (k.by.kind === 'assessment') {
          const attemptId = k.by.attemptId ?? id('att')
          const correct = Number(k.by.note.match(/^(\d)/)?.[1] ?? 0)
          attempts.push({
            id: attemptId, assessmentId: `a-${k.skill}`, studentId: s.id, answers: [], correct, total: 5,
            score: Math.round((correct / 5) * 100), passed: correct >= 3, completedAt: k.by.at ?? STAMP,
          })
          verifications.push({ id: verificationId, studentId: s.id, studentSkillId: ssId, kind: 'assessment', verifierName: k.by.name, verifiedAt: k.by.at ?? STAMP, note: k.by.note, attemptId })
        } else {
          verifications.push({ id: verificationId, studentId: s.id, studentSkillId: ssId, kind: k.by.kind, verifierName: k.by.name, verifiedAt: k.by.at ?? STAMP, note: k.by.note })
        }
      } else if (k.review === 'pending') {
        verificationStatus = 'pending'
      } else if (k.review) {
        // The skill is verified by the faculty review of the project it was demonstrated in.
        verificationId = projectReviewIds[k.review.projectKey]
        verificationStatus = verificationId ? 'verified' : 'unverified'
      }
      studentSkills.push({
        id: ssId, studentId: s.id, skillId: k.skill, proficiency: k.p,
        selfRating: k.ev === 'self_reported' ? k.p : undefined,
        evidenceType: k.ev, verificationStatus, verificationId, lastAssessedAt: k.assessed,
        createdAt: STAMP, updatedAt: STAMP,
      })
    }

    for (const a of s.achievements ?? []) achievements.push({ id: id('ach'), studentId: s.id, ...a })
  }

  const jobs: Job[] = []
  const jobRequirements: JobSkillRequirement[] = []
  for (const j of JOBS) {
    const { required, preferred, evidencePolicy, calibrate, ...job } = j
    const derived = calibrate ? deriveRequirements(calibrate.families, calibrate.maxRequired) : null
    const req: [string, number][] = derived && calibrate ? derived.required.map(r => [r.skillId, calibrate.levels[0]]) : required
    const pref: [string, number][] = derived && calibrate ? derived.preferred.map(r => [r.skillId, calibrate.levels[1]]) : preferred
    jobs.push({
      ...job, status: 'open', evidencePolicy: evidencePolicy ?? { projects: true, assessments: true },
      calibration: derived && calibrate ? { postings: derived.postings, companies: derived.companies, families: calibrate.families, date: CALIBRATION_DATE } : undefined,
    })
    for (const [skillId, min] of req) jobRequirements.push({ id: id('req'), jobId: j.id, skillId, kind: 'required', minProficiency: min })
    for (const [skillId, min] of pref) jobRequirements.push({ id: id('req'), jobId: j.id, skillId, kind: 'preferred', minProficiency: min })
  }

  const shortlists: CandidateShortlist[] = [
    { id: id('sl'), companyId: PRIMARY_COMPANY_ID, jobId: 'j-ns-frontend', studentId: 's-dev', createdAt: '2026-10-12T10:00:00.000Z' },
    { id: id('sl'), companyId: PRIMARY_COMPANY_ID, jobId: 'j-ns-data', studentId: 's-priya', createdAt: '2026-10-14T10:00:00.000Z' },
    { id: id('sl'), companyId: PRIMARY_COMPANY_ID, jobId: 'j-ns-ml', studentId: 's-kabir', createdAt: '2026-10-16T10:00:00.000Z' },
    { id: id('sl'), companyId: PRIMARY_COMPANY_ID, jobId: 'j-ns-design', studentId: 's-meera', createdAt: '2026-10-18T10:00:00.000Z' },
  ]
  const reviews: CandidateReview[] = ['s-dev', 's-priya', 's-kabir', 's-meera', 's-rohan', 's-ananya'].map((studentId, i) => ({
    id: id('rev'), companyId: PRIMARY_COMPANY_ID, studentId, reviewedAt: `2026-10-${String(10 + i).padStart(2, '0')}T09:30:00.000Z`,
  }))
  const notes: EmployerNote[] = [
    { id: id('note'), companyId: PRIMARY_COMPANY_ID, studentId: 's-dev', body: 'Strong live-data work in the dispatch console. Ask about testing practice.', createdAt: '2026-10-12T10:05:00.000Z' },
    { id: id('note'), companyId: PRIMARY_COMPANY_ID, studentId: 's-priya', body: 'SQL assessment 5/5 and a reviewed forecasting project. Good fit for customer analytics.', createdAt: '2026-10-14T10:05:00.000Z' },
  ]

  const activity: ActivityEvent[] = [
    { id: id('act'), kind: 'project_added', actor: 'student', studentId: PRIMARY_STUDENT_ID, message: 'Added the project “Student Performance Analytics”', createdAt: '2026-08-30T15:00:00.000Z' },
    { id: id('act'), kind: 'assessment_completed', actor: 'student', studentId: PRIMARY_STUDENT_ID, message: 'Completed “Python foundations” — 4 of 5 correct', createdAt: '2026-09-18T10:20:00.000Z' },
    { id: id('act'), kind: 'skill_updated', actor: 'student', studentId: PRIMARY_STUDENT_ID, message: 'Updated the self-rating for SQL', createdAt: '2026-10-02T12:00:00.000Z' },
    { id: id('act'), kind: 'job_viewed', actor: 'student', studentId: PRIMARY_STUDENT_ID, jobId: 'j-ns-frontend', message: 'Viewed “Frontend Engineer” at Northstar Technologies', createdAt: '2026-10-20T08:45:00.000Z' },
    ...reviews.map(r => ({ id: id('act'), kind: 'candidate_reviewed' as const, actor: 'employer' as const, companyId: PRIMARY_COMPANY_ID, studentId: r.studentId, message: `Reviewed ${STUDENTS.find(s => s.id === r.studentId)?.name}`, createdAt: r.reviewedAt })),
    ...shortlists.map(sl => ({ id: id('act'), kind: 'candidate_shortlisted' as const, actor: 'employer' as const, companyId: PRIMARY_COMPANY_ID, studentId: sl.studentId, jobId: sl.jobId, message: `Shortlisted ${STUDENTS.find(s => s.id === sl.studentId)?.name} for ${JOBS.find(j => j.id === sl.jobId)?.title}`, createdAt: sl.createdAt })),
  ]

  // Illustrative history for the primary student's capability chart. These points are not measurements.
  const HISTORY: Record<string, number[]> = { react: [72, 76, 80, 85, 88, 91], typescript: [61, 66, 72, 79, 84, 88], sql: [52, 55, 60, 66, 71, 76] }
  const MONTHS = ['2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']
  const skillHistory: SkillSnapshot[] = Object.entries(HISTORY).flatMap(([skillId, values]) =>
    values.map((proficiency, i) => ({ studentId: PRIMARY_STUDENT_ID, skillId, date: MONTHS[i], proficiency, illustrative: true })),
  )

  return {
    schemaVersion: SCHEMA_VERSION,
    universities: UNIVERSITIES.map(u => ({ ...u })),
    companies: COMPANIES.map(c => ({ ...c })),
    skills: SKILLS.map(s => ({ ...s, aliases: s.aliases ? [...s.aliases] : undefined })),
    students, education, studentSkills, verifications, attempts, projects, projectSkills, projectEvidence, achievements,
    jobs, jobRequirements, shortlists, reviews, notes,
    activity: activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    skillHistory,
  }
}
