/**
 * Course-player domain types — ported verbatim from the legacy
 * wplms-custom-course-player plugin so the headless player consumes the same
 * WPLMS-built payloads (course status, unit content, quiz, assignment, reviews).
 */

// ─── Course / curriculum ──────────────────────────────────────────────────────

export enum PlayerItemType {
  Section = "section",
  Unit = "unit",
  Quiz = "quiz",
}

export interface IPlayerUnit {
  key: number;
  id: number;
  type: PlayerItemType;
  title: string;
  duration: number;
  unit_type: string;
  content: string;
  status: number;
  icon: string;
  meta: unknown[];
  highlighted?: boolean;
}

export interface IPlayerCourse {
  course_id: number;
  course_title: string;
  current_unit_key: number;
  courseitems: IPlayerUnit[];
  lock: number;
  assignment_locking: number;
  assignment_lock_wait_for_instructor_approval: number;
  disablescrollprogress: boolean;
  course_status: string;
  instructions: string;
  progress: string;
}

export interface IUnitItemMeta {
  access: number;
  comments: string;
  video: string;
  pratice_questions: string;
  assignments: unknown[];
  attachments: { url: string; name: string }[];
  link: string;
}

export interface IUnitItem {
  title: string;
  instructor_id: string;
  duration: number;
  content: string;
  meta: IUnitItemMeta;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface IQuizQuestion {
  type: string;
  explanation: string;
  original_content: string;
  content: string;
  options: string[];
  correct?: string;
  id: number;
  marks: string;
  user_marks: number;
  status: number;
  show_hint: boolean;
  auto: number;
  show_correct_answer: number;
  flagged: boolean;
  key: string;
  raw?: unknown;
  correct_indexes?: number[];
  marked?: string;
  marked_answer?: string;
  attempted?: boolean;
}

export interface IQuizMeta {
  access: number;
  status: number;
  marks: number;
  max: number;
  questions: IQuizQuestion[];
  auto: number;
  retakes: number;
  completion_message: string;
  duration: number;
}

export interface IQuiz {
  id: string;
  title: string;
  content: string;
  start: boolean;
  check_answer: number;
  start_time: number;
  end_time: number;
  show_results: boolean;
  meta: IQuizMeta;
  partial_marking: number;
  negative_marking: number;
  negative_marks: number;
  question_number: string;
  quiz_passing_score: number;
  show_advance_stats: number;
  quiz_type: string;
  non_logged_in_quiz: boolean;
  remaining: number;
  expiry: string;
  submitted?: boolean;
  retakes?: number;
  drip_message?: string;
  drip_time?: number;
  tags_data?: Array<{ label: string; value: number }>;
}

/** Server response after grading a submission (parity payload). */
export interface IQuizSubmitResult {
  status: boolean;
  message: string;
  progress: number;
  completion_message: string;
  next_unit: number | null;
  ext_flag: boolean;
  continue: number;
  correct_data: Record<string, number>;
  tags_data: Array<{ label: string; value: number }>;
  tags: unknown[];
  retakes: number;
}

export type QuizAnswers = Record<string, number>;

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface IAssignment {
  id: string;
  title: string;
  total_marks: number;
  duration: number;
  content: string;
  start: number;
  type: "upload" | "text" | "url";
  message: string;
  marks: number;
  flag: number;
  remaining?: number;
  attachment_url?: string;
  start_time: number;
  end_time: number;
  attachment_urls: { url: string; name: string }[];
  already_submitted: number;
  comment_content: string;
  permit_mime: string[];
  permit_size: number;
  permit_extension: string[];
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface IReviewMember {
  id: number;
  name: string;
  avatar: string;
  sub: string;
}

export interface ICourseReview {
  id: number;
  title: string;
  content: string;
  rating: number;
  member: IReviewMember;
  date: string;
}

export interface IMyReview {
  comment_ID?: string;
  review?: string;
  title?: string;
  rating?: string;
}
