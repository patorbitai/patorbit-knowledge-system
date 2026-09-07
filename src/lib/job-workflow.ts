/**
 * Job Workflow Utilities — Phase 4
 *
 * Pure derived functions for follow-up state, next action, and needs attention.
 * These functions are deterministic and accept an explicit reference date
 * to avoid timezone issues and enable testable logic.
 */

/* ── Types ──────────────────────────────────────────────────────────────── */

export type FollowUpState = "overdue" | "today" | "upcoming" | "none";

export type NextAction =
  | "review_and_prepare"
  | "submit_application"
  | "follow_up"
  | "wait_for_response"
  | "prepare_for_interview"
  | "review_offer"
  | "closed";

export interface JobApplicationLike {
  status: string;
  followUpDate: string | null;
}

/* ── Date Helpers ───────────────────────────────────────────────────────── */

/**
 * Normalize a date string or Date to a calendar date string (YYYY-MM-DD)
 * in the user's local timezone. This avoids UTC/day-shift issues.
 */
export function toLocalDateString(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date at midnight local time.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Add days to a local date string and return YYYY-MM-DD.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

/* ── Follow-up State ────────────────────────────────────────────────────── */

/**
 * Determine the follow-up state for an application.
 *
 * @param application - The job application (needs status and followUpDate)
 * @param today - Reference date (YYYY-MM-DD) for deterministic calculations
 * @returns FollowUpState
 */
export function getFollowUpState(
  application: JobApplicationLike,
  today: string
): FollowUpState {
  // Terminal states don't have follow-up concerns
  if (application.status === "offer" || application.status === "rejected") {
    return "none";
  }

  // No follow-up date set
  if (!application.followUpDate) {
    return "none";
  }

  const followUpDate = toLocalDateString(application.followUpDate);
  const todayNormalized = toLocalDateString(today);

  if (followUpDate < todayNormalized) {
    return "overdue";
  }
  if (followUpDate === todayNormalized) {
    return "today";
  }
  return "upcoming";
}

/**
 * Get a human-readable label for the follow-up state.
 */
export function getFollowUpLabel(state: FollowUpState, followUpDate?: string | null): string {
  switch (state) {
    case "overdue":
      return "Follow-up overdue";
    case "today":
      return "Follow up today";
    case "upcoming":
      return `Follow up: ${followUpDate ? new Date(followUpDate).toLocaleDateString() : ""}`;
    case "none":
      return "";
  }
}

/* ── Next Action ────────────────────────────────────────────────────────── */

/**
 * Derive the next action for an application based on its current state.
 *
 * @param application - The job application
 * @param today - Reference date (YYYY-MM-DD) for deterministic calculations
 * @returns NextAction
 */
export function getNextAction(
  application: JobApplicationLike,
  today: string
): NextAction {
  switch (application.status) {
    case "saved":
      return "review_and_prepare";
    case "ready_to_apply":
      return "submit_application";
    case "applied": {
      const followUpState = getFollowUpState(application, today);
      if (followUpState === "overdue" || followUpState === "today") {
        return "follow_up";
      }
      return "wait_for_response";
    }
    case "interview":
      return "prepare_for_interview";
    case "offer":
      return "review_offer";
    case "rejected":
      return "closed";
    default:
      return "wait_for_response";
  }
}

/**
 * Get a human-readable label for the next action.
 */
export function getNextActionLabel(action: NextAction): string {
  switch (action) {
    case "review_and_prepare":
      return "Review job and prepare application";
    case "submit_application":
      return "Submit application";
    case "follow_up":
      return "Follow up";
    case "wait_for_response":
      return "Wait for response";
    case "prepare_for_interview":
      return "Prepare for interview";
    case "review_offer":
      return "Review offer details";
    case "closed":
      return "Closed";
  }
}

/**
 * Get a color class for the next action badge.
 */
export function getNextActionColor(action: NextAction): string {
  switch (action) {
    case "follow_up":
      return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "submit_application":
      return "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "prepare_for_interview":
      return "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400";
    case "review_offer":
      return "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400";
    case "closed":
      return "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-400";
    default:
      return "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400";
  }
}

/* ── Needs Attention ────────────────────────────────────────────────────── */

/**
 * Determine if an application needs attention.
 *
 * @param application - The job application
 * @param today - Reference date (YYYY-MM-DD) for deterministic calculations
 * @returns true if the application needs attention
 */
export function isNeedsAttention(
  application: JobApplicationLike,
  today: string
): boolean {
  // Terminal states don't need attention
  if (application.status === "offer" || application.status === "rejected") {
    return "offer" === application.status ? false : false;
  }

  // Interview status always needs attention
  if (application.status === "interview") {
    return true;
  }

  // Check follow-up state
  const followUpState = getFollowUpState(application, today);
  return followUpState === "overdue" || followUpState === "today";
}

/* ── Summary Metrics ────────────────────────────────────────────────────── */

export interface JobSummaryMetrics {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  followUpsDue: number;
}

/**
 * Calculate summary metrics from a list of applications.
 *
 * @param applications - Array of job applications
 * @param today - Reference date (YYYY-MM-DD) for deterministic calculations
 * @returns JobSummaryMetrics
 */
export function calculateSummaryMetrics(
  applications: JobApplicationLike[],
  today: string
): JobSummaryMetrics {
  let followUpsDue = 0;

  for (const app of applications) {
    const followUpState = getFollowUpState(app, today);
    if (followUpState === "overdue" || followUpState === "today") {
      followUpsDue++;
    }
  }

  return {
    total: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer").length,
    followUpsDue,
  };
}
