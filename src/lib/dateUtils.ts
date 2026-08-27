// Format ISO date strings into Thai friendly formats
const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export function formatThaiDate(isoString?: string | null, includeTime: boolean = true): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    
    const day = date.getDate();
    const month = THAI_MONTHS_SHORT[date.getMonth()];
    const year = date.getFullYear() + 543; // Buddhist Era
    
    if (!includeTime) {
      return `${day} ${month} ${year}`;
    }
    
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
  } catch (e) {
    return "-";
  }
}

export function formatThaiDateFull(isoString?: string | null): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    const day = date.getDate();
    const month = THAI_MONTHS_FULL[date.getMonth()];
    const year = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
  } catch (e) {
    return "-";
  }
}

// Get deadline status description (e.g. "เลยกำหนดส่ง 2 วัน" or "เหลือเวลาอีก 5 ชม.")
export function getDeadlineRelative(deadlineIso: string): {
  isPast: boolean;
  diffText: string;
  diffMinutes: number;
  urgency: "urgent" | "warning" | "normal" | "past";
} {
  const now = Date.now();
  const deadline = new Date(deadlineIso).getTime();
  const diffMs = deadline - now;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours) % 24;
    const text = absDays > 0 
      ? `เลยกำหนดส่ง ${absDays} วัน ${absHours > 0 ? `${absHours} ชม.` : ''}`
      : `เลยกำหนดส่ง ${Math.abs(diffHours)} ชม.`;
    return { isPast: true, diffText: text, diffMinutes, urgency: "past" };
  }

  if (diffHours < 6) {
    return {
      isPast: false,
      diffText: `เหลือเวลา ${diffHours > 0 ? `${diffHours} ชม. ` : ''}${diffMinutes % 60} นาที`,
      diffMinutes,
      urgency: "urgent"
    };
  }

  if (diffDays < 2) {
    return {
      isPast: false,
      diffText: `เหลือเวลา ${diffHours} ชม.`,
      diffMinutes,
      urgency: "warning"
    };
  }

  return {
    isPast: false,
    diffText: `เหลืออีก ${diffDays} วัน`,
    diffMinutes,
    urgency: "normal"
  };
}

// Determine if submission is on-time or late given deadline & submission date
export function calculateSubmissionTiming(
  deadlineIso: string,
  submittedAtIso?: string
): "on_time" | "late" {
  if (!submittedAtIso) return "on_time";
  const deadline = new Date(deadlineIso).getTime();
  const submitted = new Date(submittedAtIso).getTime();
  return submitted <= deadline ? "on_time" : "late";
}
