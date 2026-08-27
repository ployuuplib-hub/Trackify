export type GradeLevel = "ม.1" | "ม.2" | "ม.3" | "ม.4" | "ม.5" | "ม.6";
export type RoomNumber = "1" | "2";

export interface ClassRoom {
  id: string; // e.g. "M1-1"
  grade: GradeLevel;
  room: RoomNumber;
  name: string; // e.g. "มัธยมศึกษาปีที่ 1/1"
  shortName: string; // e.g. "ม.1/1"
}

export const ALL_CLASSES: ClassRoom[] = [
  { id: "M1-1", grade: "ม.1", room: "1", name: "มัธยมศึกษาปีที่ 1/1", shortName: "ม.1/1" },
  { id: "M1-2", grade: "ม.1", room: "2", name: "มัธยมศึกษาปีที่ 1/2", shortName: "ม.1/2" },
  { id: "M2-1", grade: "ม.2", room: "1", name: "มัธยมศึกษาปีที่ 2/1", shortName: "ม.2/1" },
  { id: "M2-2", grade: "ม.2", room: "2", name: "มัธยมศึกษาปีที่ 2/2", shortName: "ม.2/2" },
  { id: "M3-1", grade: "ม.3", room: "1", name: "มัธยมศึกษาปีที่ 3/1", shortName: "ม.3/1" },
  { id: "M3-2", grade: "ม.3", room: "2", name: "มัธยมศึกษาปีที่ 3/2", shortName: "ม.3/2" },
  { id: "M4-1", grade: "ม.4", room: "1", name: "มัธยมศึกษาปีที่ 4/1", shortName: "ม.4/1" },
  { id: "M4-2", grade: "ม.4", room: "2", name: "มัธยมศึกษาปีที่ 4/2", shortName: "ม.4/2" },
  { id: "M5-1", grade: "ม.5", room: "1", name: "มัธยมศึกษาปีที่ 5/1", shortName: "ม.5/1" },
  { id: "M5-2", grade: "ม.5", room: "2", name: "มัธยมศึกษาปีที่ 5/2", shortName: "ม.5/2" },
  { id: "M6-1", grade: "ม.6", room: "1", name: "มัธยมศึกษาปีที่ 6/1", shortName: "ม.6/1" },
  { id: "M6-2", grade: "ม.6", room: "2", name: "มัธยมศึกษาปีที่ 6/2", shortName: "ม.6/2" },
];

export interface Student {
  id: string; // Document ID
  studentCode: string; // รหัสประจำตัวนักเรียน เช่น "670101"
  studentNumber: number; // เลขที่ เช่น 1
  prefix: "ด.ช." | "ด.หญิง" | "นาย" | "น.ส.";
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  classId: string; // "M1-1", etc.
  grade: GradeLevel;
  room: RoomNumber;
  gender?: "male" | "female";
  phone?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SubmissionStatus = 
  | "on_time"        // ส่งทันเวลา (เขียว)
  | "late"           // ส่งช้ากว่ากำหนด (ส้ม/เหลือง)
  | "missing"        // ยังไม่ส่ง / เลยกำหนดแล้วยังไม่ส่ง (แดง)
  | "pending"        // ยังไม่ส่ง (ยังไม่ถึงกำหนด)
  | "exempt";        // ได้รับการยกเว้น (เทา)

export interface Assignment {
  id: string; // Document ID
  title: string; // ชื่องาน / แบบฝึกหัด
  subject: string; // วิชา เช่น "คณิตศาสตร์พื้นฐาน", "ภาษาไทย", "วิทยาศาสตร์"
  subjectCode?: string; // รหัสวิชา เช่น "ค21101"
  description?: string; // คำอธิบายรายละเอียดงาน
  deadline: string; // วันที่และเวลากำหนดส่ง ISO string e.g. "2026-08-30T16:30:00"
  targetClassIds: string[]; // ห้องที่ได้รับมอบหมาย e.g. ["M1-1", "M1-2"] หรือ ["ALL"]
  maxScore: number; // คะแนนเต็ม
  category?: "ใบงาน" | "การบ้าน" | "รายงาน/โครงงาน" | "ชิ้นงานสร้างสรรค์" | "แบบทดสอบย่อย" | "อื่นๆ";
  attachmentUrl?: string; // ไฟล์แนบ / ลิงก์
  createdAt: string;
  updatedAt?: string;
}

export interface Submission {
  id: string; // Document ID (usually `${assignmentId}_${studentId}`)
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt?: string; // วันเวลาที่ส่งงานจริง ISO string
  score?: number; // คะแนนที่ได้
  feedback?: string; // ความเห็น / บันทึกของครู
  submissionLink?: string; // ลิงก์งานที่ส่ง (ถ้ามี)
  checkedBy?: string; // ชื่อครูผู้ตรวจ
  updatedAt: string;
}

export interface ClassStatistics {
  classId: string;
  totalStudents: number;
  totalAssignments: number;
  totalExpectedSubmissions: number;
  submittedOnTime: number;
  submittedLate: number;
  missing: number;
  pending: number;
  completionRate: number; // 0 - 100%
  onTimeRate: number; // 0 - 100%
}
