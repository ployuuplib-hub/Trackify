import React, { useState } from "react";
import { 
  GraduationCap, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  BookOpen, 
  Award, 
  Send, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";
import { Student, Assignment, Submission, ALL_CLASSES } from "../types";
import { STATUS_CONFIG, getEffectiveStatus } from "../lib/statusHelpers";
import { formatThaiDate, getDeadlineRelative } from "../lib/dateUtils";
import { submissionService } from "../services/db";
import confetti from "canvas-confetti";

interface StudentPortalProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Record<string, Submission>;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  assignments,
  submissions
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>("M1-1");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchStudentInput, setSearchStudentInput] = useState("");
  const [submittingLinkModal, setSubmittingLinkModal] = useState<{
    assignment: Assignment;
    student: Student;
    link: string;
    note: string;
  } | null>(null);

  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // If no student is explicitly selected, pick first in class
  const activeStudent = 
    students.find((s) => s.id === selectedStudentId) ||
    classStudents[0] ||
    students[0];

  // Get all assignments assigned to active student's class
  const studentAssignments = activeStudent
    ? assignments.filter((a) => a.targetClassIds.includes("ALL") || a.targetClassIds.includes(activeStudent.classId))
    : [];

  // Calculate statistics for this student
  let onTimeCount = 0;
  let lateCount = 0;
  let missingCount = 0;
  let pendingCount = 0;
  let totalScoreReceived = 0;
  let totalPossibleScore = 0;

  const completedList: { assignment: Assignment; submission?: Submission; status: any }[] = [];
  const pendingList: { assignment: Assignment; submission?: Submission; status: any }[] = [];

  studentAssignments.forEach((assign) => {
    const subKey = activeStudent ? `${assign.id}_${activeStudent.id}` : "";
    const sub = submissions[subKey];
    const effStatus = getEffectiveStatus(sub?.status, assign.deadline);

    if (effStatus === "on_time") {
      onTimeCount++;
      completedList.push({ assignment: assign, submission: sub, status: effStatus });
    } else if (effStatus === "late") {
      lateCount++;
      completedList.push({ assignment: assign, submission: sub, status: effStatus });
    } else if (effStatus === "missing") {
      missingCount++;
      pendingList.push({ assignment: assign, submission: sub, status: effStatus });
    } else {
      pendingCount++;
      pendingList.push({ assignment: assign, submission: sub, status: effStatus });
    }

    if (sub?.score !== undefined) {
      totalScoreReceived += sub.score;
      totalPossibleScore += assign.maxScore;
    }
  });

  const totalSubmitted = onTimeCount + lateCount;
  const completionPercent = studentAssignments.length > 0
    ? Math.round((totalSubmitted / studentAssignments.length) * 100)
    : 0;

  // Handle student submit online work link
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingLinkModal) return;

    try {
      const isPast = new Date(submittingLinkModal.assignment.deadline).getTime() < Date.now();
      const newStatus = isPast ? "late" : "on_time";

      await submissionService.setSubmission(
        submittingLinkModal.assignment.id,
        submittingLinkModal.student.id,
        {
          status: newStatus,
          submittedAt: new Date().toISOString(),
          submissionLink: submittingLinkModal.link,
          feedback: submittingLinkModal.note ? `นักเรียนบันทึก: ${submittingLinkModal.note}` : undefined,
          checkedBy: "ส่งผ่านระบบนักเรียน"
        }
      );

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      setSubmittingLinkModal(null);
    } catch (err) {
      console.error("Failed to submit work:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Selector Card */}
      <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              <span>ระบบตรวจสอบการส่งงานสำหรับนักเรียน / ผู้ปกครอง</span>
            </h2>
            <p className="text-xs text-slate-400">
              เลือกห้องเรียนและชื่อของตนเองเพื่อเช็คงานที่ส่งแล้วและงานที่ยังค้างส่ง
            </p>
          </div>
        </div>

        {/* Pick Room & Student */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              1. เลือกระดับชั้น/ห้องเรียน
            </label>
            <select
              id="student-portal-room-select"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const firstInNewClass = students.find((s) => s.classId === e.target.value);
                if (firstInNewClass) setSelectedStudentId(firstInNewClass.id);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.shortName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              2. เลือกชื่อนักเรียน (เลขที่)
            </label>
            <select
              id="student-portal-student-select"
              value={activeStudent?.id || ""}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
              {classStudents.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  เลขที่ {stu.studentNumber}: {stu.prefix}{stu.firstName} {stu.lastName} (รหัส {stu.studentCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeStudent && (
        <>
          {/* Student Status Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0c0e12] to-cyan-950/40 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  {activeStudent.grade}/{activeStudent.room} • เลขที่ {activeStudent.studentNumber}
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                  {activeStudent.prefix}{activeStudent.firstName} {activeStudent.lastName}
                </h1>
                <p className="text-xs text-slate-400">
                  รหัสประจำตัว: {activeStudent.studentCode} • มีงานที่ต้องส่งทั้งหมด {studentAssignments.length} ชิ้น
                </p>
              </div>

              {/* Progress Circle / Bar */}
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-800 flex items-center gap-4">
                <div className="text-center">
                  <span className="text-3xl font-black text-cyan-400">{completionPercent}%</span>
                  <span className="text-[11px] text-slate-400 block font-medium">ความครบถ้วน</span>
                </div>
                <div className="h-10 w-[1px] bg-slate-800" />
                <div className="text-xs space-y-1">
                  <div className="text-emerald-400 font-medium">✓ ส่งทันเวลา: {onTimeCount} ชิ้น</div>
                  <div className="text-amber-400 font-medium">⏱ ส่งช้า: {lateCount} ชิ้น</div>
                  <div className="text-rose-400 font-medium">✗ ค้างส่ง: {missingCount} ชิ้น</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending / Missing Works Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <span>งานที่ต้องส่ง / งานค้างส่ง ({pendingList.length})</span>
              </h3>
              {pendingList.length === 0 && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> ยอดเยี่ยม! ส่งงานครบทุกชิ้นแล้ว
                </span>
              )}
            </div>

            {pendingList.length === 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-2xl p-8 text-center text-emerald-300 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="font-bold text-sm">ไม่มีงานค้างส่งในขณะนี้</p>
                <p className="text-xs text-emerald-400">
                  คุณส่งงานที่มอบหมายครบทุกชิ้นแล้ว เยี่ยมมาก!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingList.map(({ assignment, submission, status }) => {
                  const deadlineInfo = getDeadlineRelative(assignment.deadline);
                  const config = STATUS_CONFIG[status];

                  return (
                    <div
                      key={assignment.id}
                      className="bg-slate-900/40 border border-rose-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-xs flex flex-col justify-between hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-bold">
                            {assignment.subject}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${config.badgeBg} ${config.borderColor}`}>
                            {config.label}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-base text-white">
                            {assignment.title}
                          </h4>
                          {assignment.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {assignment.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" /> กำหนดส่ง:
                          </span>
                          <span className={`font-bold ${deadlineInfo.isPast ? "text-rose-400" : "text-amber-400"}`}>
                            {formatThaiDate(assignment.deadline)} ({deadlineInfo.diffText})
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          คะแนนเต็ม: <strong className="text-slate-200">{assignment.maxScore}</strong>
                        </span>
                        <button
                          onClick={() => setSubmittingLinkModal({
                            assignment,
                            student: activeStudent,
                            link: "",
                            note: ""
                          })}
                          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>แจ้งส่งงาน / แนบลิงก์</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Works Section */}
          <div className="space-y-3 pt-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>งานที่ส่งเรียบร้อยแล้ว ({completedList.length})</span>
            </h3>

            {completedList.length === 0 ? (
              <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
                ยังไม่มีประวัติการส่งงานที่บันทึก
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedList.map(({ assignment, submission, status }) => {
                  const config = STATUS_CONFIG[status];

                  return (
                    <div
                      key={assignment.id}
                      className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-bold">
                          {assignment.subject}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${config.badgeBg} ${config.borderColor}`}>
                          {config.label}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {assignment.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          ส่งเมื่อ: {formatThaiDate(submission?.submittedAt)}
                        </span>
                      </div>

                      {/* Score & Feedback */}
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block">คะแนนที่ได้</span>
                          <span className="text-base font-bold text-cyan-400">
                            {submission?.score !== undefined ? `${submission.score} / ${assignment.maxScore}` : "รอตรวจคะแนน"}
                          </span>
                        </div>

                        {submission?.feedback && (
                          <div className="text-right max-w-[200px]">
                            <span className="text-[11px] text-slate-400 block">ความเห็นครู</span>
                            <span className="text-xs text-slate-200 font-medium truncate block">
                              {submission.feedback}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Student Submit Link Modal */}
      {submittingLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <span>แจ้งส่งงาน: {submittingLinkModal.assignment.title}</span>
              </h3>
              <button
                onClick={() => setSubmittingLinkModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ลิงก์ผลงาน (เช่น Google Drive, Canva, GitHub, รูปภาพ)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={submittingLinkModal.link}
                  onChange={(e) => setSubmittingLinkModal({ ...submittingLinkModal, link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ข้อความบันทึกถึงครูผู้สอน (ถ้ามี)
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น ส่งสมุดไว้ที่โต๊ะครูแล้วครับ / ทำเสร็จเรียบร้อยครับ"
                  value={submittingLinkModal.note}
                  onChange={(e) => setSubmittingLinkModal({ ...submittingLinkModal, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmittingLinkModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ยืนยันการส่งงาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
