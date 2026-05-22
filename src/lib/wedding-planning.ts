import type { LeadStatus, NoteType, ConsultationStatus, WeddingStatus, VendorStatus, TaskStatus, RSVPStatus } from "@prisma/client";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONSULTATION_BOOKED: "Consultation Booked",
  PROPOSAL_SENT: "Proposal Sent",
  BOOKED: "Booked",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  LOST: "Lost",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "CONSULTATION_BOOKED",
  "PROPOSAL_SENT",
  "BOOKED",
  "ACTIVE",
  "COMPLETED",
  "LOST",
];

export const LEAD_STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  NEW: { bg: "bg-brand-pink-100", text: "text-brand-pink-700", border: "border-brand-pink-500" },
  CONTACTED: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-500" },
  CONSULTATION_BOOKED: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-500" },
  PROPOSAL_SENT: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-500" },
  BOOKED: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-500" },
  ACTIVE: { bg: "bg-brand-orange-100", text: "text-brand-orange-700", border: "border-brand-orange-500" },
  COMPLETED: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-400" },
  LOST: { bg: "bg-red-50", text: "text-red-600", border: "border-red-400" },
};

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  NOTE: "Note",
  CALL: "Phone Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  SMS: "Text Message",
};

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

export const WEDDING_STATUS_LABELS: Record<WeddingStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Wedding Week",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  CONSIDERING: "Considering",
  CONTACTED: "Contacted",
  PROPOSAL: "Proposal Received",
  BOOKED: "Booked",
  PAID: "Paid",
  DECLINED: "Declined",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  SKIPPED: "Skipped",
};

export const RSVP_STATUS_LABELS: Record<RSVPStatus, string> = {
  PENDING: "Pending",
  YES: "Attending",
  NO: "Declined",
  MAYBE: "Maybe",
};

export const VENDOR_CATEGORIES = [
  "Venue",
  "Photographer",
  "Videographer",
  "Florist",
  "Caterer",
  "Bakery",
  "DJ / Band",
  "Officiant",
  "Hair & Makeup",
  "Transportation",
  "Stationery",
  "Rentals",
  "Decor & Design",
  "Other",
];

export const BUDGET_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Flowers",
  "Music",
  "Attire",
  "Rentals",
  "Decor",
  "Cake & Desserts",
  "Stationery",
  "Transportation",
  "Officiant",
  "Hair & Makeup",
  "Gifts & Favors",
  "Other",
];

export interface MilestoneTemplate {
  key: string;
  label: string;
  monthsBefore: number;
  tasks: { title: string; category: string }[];
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    key: "12_MONTHS",
    label: "12+ Months Out",
    monthsBefore: 12,
    tasks: [
      { title: "Set wedding date & budget", category: "Planning" },
      { title: "Draft guest list (rough count)", category: "Guests" },
      { title: "Book ceremony & reception venue", category: "Venue" },
      { title: "Hire wedding planner / coordinator", category: "Planning" },
    ],
  },
  {
    key: "9_MONTHS",
    label: "9 Months Out",
    monthsBefore: 9,
    tasks: [
      { title: "Book photographer & videographer", category: "Photography" },
      { title: "Book caterer", category: "Catering" },
      { title: "Choose wedding party", category: "Planning" },
      { title: "Send save-the-dates", category: "Stationery" },
    ],
  },
  {
    key: "6_MONTHS",
    label: "6 Months Out",
    monthsBefore: 6,
    tasks: [
      { title: "Book florist", category: "Flowers" },
      { title: "Book DJ or band", category: "Music" },
      { title: "Book officiant", category: "Officiant" },
      { title: "Order wedding dress", category: "Attire" },
      { title: "Plan honeymoon", category: "Planning" },
    ],
  },
  {
    key: "3_MONTHS",
    label: "3 Months Out",
    monthsBefore: 3,
    tasks: [
      { title: "Send invitations", category: "Stationery" },
      { title: "Finalize menu & cake", category: "Catering" },
      { title: "Book hair & makeup trial", category: "Hair & Makeup" },
      { title: "Buy wedding bands", category: "Attire" },
      { title: "Order rentals (linens, tables, etc.)", category: "Rentals" },
    ],
  },
  {
    key: "1_MONTH",
    label: "1 Month Out",
    monthsBefore: 1,
    tasks: [
      { title: "Final dress fitting", category: "Attire" },
      { title: "Confirm final guest count", category: "Guests" },
      { title: "Create seating chart", category: "Guests" },
      { title: "Apply for marriage license", category: "Planning" },
      { title: "Final venue walk-through", category: "Venue" },
    ],
  },
  {
    key: "WEDDING_WEEK",
    label: "Wedding Week",
    monthsBefore: 0,
    tasks: [
      { title: "Rehearsal dinner", category: "Planning" },
      { title: "Pick up wedding attire", category: "Attire" },
      { title: "Deliver final payments to vendors", category: "Planning" },
      { title: "Pack honeymoon bags", category: "Planning" },
    ],
  },
];
