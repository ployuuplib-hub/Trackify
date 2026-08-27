import { SubmissionStatus } from "../types";

export interface StatusConfig {
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  description: string;
}

export const STATUS_CONFIG: Record<SubmissionStatus, StatusConfig> = {
  on_time: {
    label: "ส่งแล้ว (ทันเวลา)",
    shortLabel: "ทันเวลา",
    badgeBg: "bg-emerald-500/10 text-emerald-400",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    dotColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    description: "ส่งงานเรียบร้อยภายในระยะเวลาที่กำหนด"
  },
  late: {
    label: "ส่งแล้ว (ช้ากว่ากำหนด)",
    shortLabel: "ส่งช้า",
    badgeBg: "bg-amber-500/10 text-amber-400",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/20",
    dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    description: "ส่งงานแล้วแต่เกินกำหนดเวลาส่ง"
  },
  missing: {
    label: "ยังไม่ส่ง (เกินกำหนด)",
    shortLabel: "ค้างส่ง",
    badgeBg: "bg-rose-500/10 text-rose-400",
    badgeText: "text-rose-400",
    borderColor: "border-rose-500/20",
    dotColor: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
    description: "เลยกำหนดส่งแล้วและยังไม่ได้รับชิ้นงาน"
  },
  pending: {
    label: "รอส่งงาน",
    shortLabel: "รอส่ง",
    badgeBg: "bg-slate-800/60 text-slate-400",
    badgeText: "text-slate-400",
    borderColor: "border-slate-700/60",
    dotColor: "bg-slate-500",
    description: "ยังไม่ถึงกำหนดส่งและยังไม่ได้ส่งงาน"
  },
  exempt: {
    label: "ได้รับการยกเว้น",
    shortLabel: "ยกเว้น",
    badgeBg: "bg-cyan-500/10 text-cyan-400",
    badgeText: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    dotColor: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]",
    description: "ได้รับอนุญาตยกเว้นการส่งงานนี้เป็นกรณีพิเศษ"
  }
};

export function getEffectiveStatus(
  status: SubmissionStatus | undefined,
  deadlineIso: string
): SubmissionStatus {
  if (status && status !== "pending") {
    return status;
  }
  // Check if deadline has passed
  const isPast = new Date(deadlineIso).getTime() < Date.now();
  return isPast ? "missing" : "pending";
}
