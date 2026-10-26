import type { Assessment, AssessmentAttempt, EvidenceType, StudentSkill } from './types'

/**
 * Sample assessments. Each is five multiple-choice questions scored entirely in the browser — no LLM, no API.
 *
 * A five-question check is a small sample of knowledge on one topic. It is evidence that a student answered these
 * questions correctly on one occasion; it is not a measure of real-world proficiency or of overall ability.
 */
export const ASSESSMENTS: Assessment[] = [
  {
    id: 'a-javascript',
    skillId: 'javascript',
    title: 'JavaScript fundamentals',
    description: 'Scope, equality, closures, async ordering and array methods.',
    passMark: 60,
    questions: [
      {
        id: 'js-1',
        prompt: 'What does this log?',
        code: "console.log(typeof null)",
        options: ['"null"', '"object"', '"undefined"', '"number"'],
        correctIndex: 1,
        explanation: 'typeof null is "object" — a long-standing quirk of the language kept for compatibility.',
      },
      {
        id: 'js-2',
        prompt: 'Which comparison is true?',
        options: ['0 === "0"', 'null === undefined', 'NaN === NaN', 'null == undefined'],
        correctIndex: 3,
        explanation: 'Loose equality treats null and undefined as equal to each other. NaN is never equal to anything, itself included.',
      },
      {
        id: 'js-3',
        prompt: 'What does this log?',
        code: "const fns = []\nfor (let i = 0; i < 3; i++) fns.push(() => i)\nconsole.log(fns.map(f => f()))",
        options: ['[3, 3, 3]', '[0, 1, 2]', '[undefined, undefined, undefined]', 'It throws'],
        correctIndex: 1,
        explanation: 'let creates a fresh binding per loop iteration, so each closure captures its own i.',
      },
      {
        id: 'js-4',
        prompt: 'In what order are the letters logged?',
        code: "console.log('A')\nsetTimeout(() => console.log('B'), 0)\nPromise.resolve().then(() => console.log('C'))\nconsole.log('D')",
        options: ['A B C D', 'A D B C', 'A D C B', 'A C D B'],
        correctIndex: 2,
        explanation: 'Synchronous code runs first (A, D), then microtasks such as promise callbacks (C), then timers (B).',
      },
      {
        id: 'js-5',
        prompt: 'What is the value of the expression?',
        code: "[1, 2, 3, 4].filter(n => n % 2).map(n => n * 10)",
        options: ['[20, 40]', '[10, 30]', '[10, 20, 30, 40]', '[1, 3]'],
        correctIndex: 1,
        explanation: 'n % 2 is truthy for odd numbers, so filter keeps 1 and 3, which map turns into 10 and 30.',
      },
    ],
  },
  {
    id: 'a-sql',
    skillId: 'sql',
    title: 'SQL foundations',
    description: 'Filtering, joins, aggregation and NULL handling.',
    passMark: 60,
    questions: [
      {
        id: 'sql-1',
        prompt: 'Which clause filters groups after aggregation?',
        options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
        correctIndex: 1,
        explanation: 'WHERE filters rows before grouping; HAVING filters the groups produced by GROUP BY.',
      },
      {
        id: 'sql-2',
        prompt: 'A LEFT JOIN from students to submissions returns…',
        options: [
          'Only students with at least one submission',
          'Every student, with NULL submission columns where none exist',
          'Every submission, with NULL student columns where none exist',
          'The Cartesian product of both tables',
        ],
        correctIndex: 1,
        explanation: 'A LEFT JOIN keeps every row from the left table and fills unmatched right-hand columns with NULL.',
      },
      {
        id: 'sql-3',
        prompt: 'Which condition finds rows where email is missing?',
        options: ["email = NULL", "email == ''", 'email IS NULL', 'NOT email'],
        correctIndex: 2,
        explanation: 'Comparisons with NULL are unknown, never true, so NULL has to be tested with IS NULL.',
      },
      {
        id: 'sql-4',
        prompt: 'COUNT(column) differs from COUNT(*) because it…',
        options: ['Counts distinct values only', 'Ignores NULLs in that column', 'Is always faster', 'Counts groups, not rows'],
        correctIndex: 1,
        explanation: 'COUNT(*) counts rows; COUNT(column) counts rows where that column is not NULL.',
      },
      {
        id: 'sql-5',
        prompt: 'What does this return?',
        code: "SELECT dept, AVG(score)\nFROM results\nGROUP BY dept\nORDER BY AVG(score) DESC\nLIMIT 1",
        options: [
          'The single highest score',
          'The department with the highest average score',
          'Every department sorted by average score',
          'An error: AVG cannot appear in ORDER BY',
        ],
        correctIndex: 1,
        explanation: 'Rows are grouped per department, ordered by their average, and LIMIT 1 keeps the top group.',
      },
    ],
  },
  {
    id: 'a-python',
    skillId: 'python',
    title: 'Python foundations',
    description: 'Data structures, mutability, comprehensions and functions.',
    passMark: 60,
    questions: [
      {
        id: 'py-1',
        prompt: 'What is printed?',
        code: "a = [1, 2]\nb = a\nb.append(3)\nprint(a)",
        options: ['[1, 2]', '[1, 2, 3]', '[3]', 'An error'],
        correctIndex: 1,
        explanation: 'b = a binds a second name to the same list, so appending through b changes a too.',
      },
      {
        id: 'py-2',
        prompt: 'Which type can be used as a dictionary key?',
        options: ['list', 'dict', 'tuple of ints', 'set'],
        correctIndex: 2,
        explanation: 'Keys must be hashable. Tuples of immutable values are; lists, dicts and sets are not.',
      },
      {
        id: 'py-3',
        prompt: 'What does this evaluate to?',
        code: "[x * x for x in range(5) if x % 2 == 0]",
        options: ['[0, 4, 16]', '[1, 9]', '[0, 1, 4, 9, 16]', '[4, 16]'],
        correctIndex: 0,
        explanation: 'range(5) is 0–4; the even values 0, 2 and 4 are squared.',
      },
      {
        id: 'py-4',
        prompt: 'Why is a mutable default argument risky?',
        code: "def add(item, items=[]):\n    items.append(item)\n    return items",
        options: [
          'It raises a SyntaxError',
          'The default list is created once and shared between calls',
          'Lists cannot be default values',
          'append returns None so the function always returns None',
        ],
        correctIndex: 1,
        explanation: 'Default values are evaluated once at definition time, so every call that omits items shares one list.',
      },
      {
        id: 'py-5',
        prompt: 'What does len({"a": 1, "b": 2, "a": 3}) return?',
        options: ['3', '2', '1', 'An error'],
        correctIndex: 1,
        explanation: 'A repeated key overwrites the earlier one, so the dict has two keys.',
      },
    ],
  },
]

export function getAssessment(id: string): Assessment | undefined {
  return ASSESSMENTS.find(a => a.id === id)
}

export function assessmentForSkill(skillId: string): Assessment | undefined {
  return ASSESSMENTS.find(a => a.skillId === skillId)
}

export interface AttemptResult {
  correct: number
  total: number
  score: number
  passed: boolean
  /** Per-question: whether the given answer was right. Unanswered questions count as wrong. */
  marks: boolean[]
}

/** Scores an attempt from the submitted answers. `answers[i]` is the chosen option index, or -1 for none. */
export function scoreAttempt(assessment: Assessment, answers: number[]): AttemptResult {
  const marks = assessment.questions.map((q, i) => answers[i] === q.correctIndex)
  const correct = marks.filter(Boolean).length
  const total = assessment.questions.length
  const score = total === 0 ? 0 : Math.round((correct / total) * 100)
  return { correct, total, score, passed: score >= assessment.passMark, marks }
}

/** Evidence types an assessment never overrides: they come from a stronger, external source. */
const EXTERNAL_EVIDENCE: EvidenceType[] = ['institution_verified', 'employer_verified']

/**
 * The documented mapping from an assessment attempt to the skill it covers.
 *
 * 1. The skill's displayed proficiency becomes the attempt score (correct ÷ total × 100), passed or not, so the
 *    profile reflects the most recent measurement rather than an untested self-rating. The self-rating is kept.
 * 2. A passing attempt (score ≥ passMark) makes the claim assessment-verified, backed by a verification record.
 * 3. A failing attempt leaves the evidence type as it was and the claim unverified.
 * 4. Institution- and employer-verified claims are never changed by a sample assessment: the attempt is recorded,
 *    but the external verification and its proficiency stand.
 */
export function applyAttemptToSkill(
  skill: StudentSkill,
  attempt: Pick<AssessmentAttempt, 'score' | 'passed' | 'completedAt'>,
  verificationId: string | undefined,
): StudentSkill {
  if (EXTERNAL_EVIDENCE.includes(skill.evidenceType)) return { ...skill, lastAssessedAt: attempt.completedAt }
  const base: StudentSkill = {
    ...skill,
    selfRating: skill.selfRating ?? (skill.evidenceType === 'self_reported' ? skill.proficiency : undefined),
    proficiency: attempt.score,
    lastAssessedAt: attempt.completedAt,
    updatedAt: attempt.completedAt,
  }
  if (attempt.passed && verificationId) {
    return { ...base, evidenceType: 'assessment_verified', verificationStatus: 'verified', verificationId }
  }
  if (skill.evidenceType === 'assessment_verified') {
    // A failed retake withdraws the previous assessment verification rather than leaving a stale badge.
    return { ...base, evidenceType: 'self_reported', verificationStatus: 'unverified', verificationId: undefined }
  }
  return base
}

/** Plain-language description of the mapping, shown after an attempt. */
export const ASSESSMENT_MAPPING_NOTE =
  'Your displayed proficiency for this skill becomes your latest score (correct answers ÷ questions × 100). ' +
  'A score at or above the pass mark marks the skill assessment-verified; a lower score keeps it unverified. ' +
  'Institution- or employer-verified skills are not changed by a sample assessment.'
