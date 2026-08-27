import React, { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertOctagon, 
  Search, 
  Filter, 
  CheckCheck, 
  Edit3, 
  FileText, 
  Save, 
  ExternalLink,
  Users,
  Award,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Student, Assignment, Submission, SubmissionStatus, ALL_CLASSES } from "../types";
import { STATUS_CONFIG, getEffectiveStatus } from "../lib/statusHelpers";
import { formatThaiDate, getDeadlineRelative, calculateSubmissionTiming } from "../lib/dateUtils";
import { submissionService } from "../services/db";
import confetti from "canvas-confetti";

interface SubmissionMatrixProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Record<string, Submission>;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedAssignmentId: string;
  setSelectedAssignmentId: (id: string) => void;
}

export const SubmissionMatrix: React.FC<SubmissionMatrixProps> = ({
  students,
  assignments,
  submissions,
  selectedClassId,
  setSelectedClassId,
  selectedAssignmentId,
  setSelectedAssignmentId
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "on_time" | "late" | "missing">("all");
  const [editingSubmission, setEditingSubmission] = useState<{
    student: Student;
    assignment: Assignment;
    currentSub?: Submission;
    score: number | string;
    feedback: string;
    submittedAt: string;
    status: SubmissionStatus;
  } | null>(null);

  const [savingBatch, setSavingBatch] = useState(false);

  // Active assignment
  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];
  
  // Filter available assignments for the selected class (or show all)
  const availableAssignments = assignments.filter((a) => {
    if (selectedClassId === "ALL") return true;
    return a.targetClassIds.includes("ALL") || a.targetClassIds.includes(selectedClassId);
  });

  // Filter students for the selected class
  const classStudents = students.filter((s) => {
    if (selectedClassId === "ALL") return true;
    return s.classId === selectedClassId;
  });

  // Filter by search query
  const filteredStudents = classStudents.filter((s) => {
    const fullName = `${s.prefix}${s.firstName} ${s.lastName}`;
    const matchesSearch = 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.includes(searchQuery) ||
      s.studentNumber.toString() === searchQuery;

    if (!matchesSearch) return false;
    if (!currentAssignment) return true;

    const sub = submissions[`${currentAssignment.id}_${s.id}`];
    const effStatus = getEffectiveStatus(sub?.status, currentAssignment.deadline);

    if (statusFilter === "all") return true;
    if (statusFilter === "submitted") return effStatus === "on_time" || effStatus === "late";
    if (statusFilter === "on_time") return effStatus === "on_time";
    if (statusFilter === "late") return effStatus === "late";
    if (statusFilter === "missing") return effStatus === "missing";

    return true;
  });

  // Handle single student quick status change
  const handleQuickStatus = async (student: Student, newStatus: SubmissionStatus) => {
    if (!currentAssignment) return;
    
    let submittedAt: string | undefined = undefined;
    if (newStatus === "on_time") {
      // Set to current time or before deadline
      const deadlineTime = new Date(currentAssignment.deadline).getTime();
      const now = Date.now();
      submittedAt = new Date(Math.min(now, deadlineTime - 60000)).toISOString();
    } else if (newStatus === "late") {
      // Set to current time or after deadline
      const deadlineTime = new Date(currentAssignment.deadline).getTime();
      submittedAt = new Date(Math.max(Date.now(), deadlineTime + 3600000)).toISOString();
    }

    try {
      await submissionService.setSubmission(currentAssignment.id, student.id, {
        status: newStatus,
        submittedAt: newStatus === "missing" ? undefined : (submittedAt || new Date().toISOString()),
        checkedBy: "Admin / ครูประจำวิชา"
      });

      if (newStatus === "on_time") {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.85 }
        });
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // Batch action: mark all filtered students as on-time
  const handleBatchMarkOnTime = async () => {
    if (!currentAssignment || filteredStudents.length === 0) return;
    setSavingBatch(true);
    try {
      const items = filteredStudents.map((stu) => ({
        assignmentId: currentAssignment.id,
        studentId: stu.id,
        status: "on_time" as SubmissionStatus,
        submittedAt: new Date().toISOString(),
        score: currentAssignment.maxScore,
        feedback: "ส่งงานครบถ้วนตรงเวลา"
      }));
      await submissionService.batchSetSubmissions(items);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (e) {
      console.error("Batch update failed:", e);
    } finally {
      setSavingBatch(false);
    }
  };

  // Batch action: mark missing
  const handleBatchMarkMissing = async () => {
    if (!currentAssignment || filteredStudents.length === 0) return;
    setSavingBatch(true);
    try {
      const items = filteredStudents.map((stu) => ({
        assignmentId: currentAssignment.id,
        studentId: stu.id,
        status: "missing" as SubmissionStatus,
        feedback: "ยังไม่ส่งงาน"
      }));
      await submissionService.batchSetSubmissions(items);
    } catch (e) {
      console.error("Batch update failed:", e);
    } finally {
      setSavingBatch(false);
    }
  };

  // Save detailed grading modal
  const handleSaveModalGrading = async () => {
    if (!editingSubmission) return;
    try {
      await submissionService.setSubmission(
        editingSubmission.assignment.id,
        editingSubmission.student.id,
        {
          status: editingSubmission.status,
          score: editingSubmission.score !== "" ? Number(editingSubmission.score) : undefined,
          feedback: editingSubmission.feedback,
          submittedAt: editingSubmission.submittedAt || new Date().toISOString(),
          checkedBy: "Admin / ครูประจำวิชา"
        }
      );
      setEditingSubmission(null);
    } catch (e) {
      console.error("Failed to save grading:", e);
    }
  };

  // Calculate current assignment stats
  let assignOnTime = 0;
  let assignLate = 0;
  let assignMissing = 0;
  let assignPending = 0;

  classStudents.forEach((stu) => {
    if (!currentAssignment) return;
    const sub = submissions[`${currentAssignment.id}_${stu.id}`];
    const effStatus = getEffectiveStatus(sub?.status, currentAssignment.deadline);
    if (effStatus === "on_time") assignOnTime++;
    else if (effStatus === "late") assignLate++;
    else if (effStatus === "missing") assignMissing++;
    else assignPending++;
  });

  const assignTotalSubmitted = assignOnTime + assignLate;
  const assignPercent = classStudents.length > 0
    ? Math.round((assignTotalSubmitted / classStudents.length) * 100)
    : 0;

  const deadlineRel = currentAssignment ? getDeadlineRelative(currentAssignment.deadline) : null;

  return (
    <div className="space-y-6">
      {/* Top Filter & Selector Bar */}
      <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Classroom Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              เลือกระดับชั้น/ห้อง:
            </span>
            <select
              id="grading-class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 text-white rounded-xl px-3.5 py-2 text-sm font-semibold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
            >
              <option value="ALL">ทุกห้องเรียน (ม.1/1 - ม.6/2)</option>
              {ALL_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.shortName})
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Selector */}
          <div className="flex flex-wrap items-center gap-2 flex-1 lg:max-w-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              เลือกชิ้นงาน:
            </span>
            <select
              id="grading-assignment-select"
              value={selectedAssignmentId || currentAssignment?.id || ""}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full sm:w-auto flex-1 bg-slate-900/90 border border-slate-700/80 text-white rounded-xl px-3.5 py-2 text-sm font-semibold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
            >
              {availableAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.subject}] {a.title} (กำหนด: {formatThaiDate(a.deadline, false)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Assignment Info Banner */}
        {currentAssignment && (
          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 text-xs font-bold">
                  {currentAssignment.subject} {currentAssignment.subjectCode && `(${currentAssignment.subjectCode})`}
                </span>
                <h2 className="font-bold text-white text-base">
                  {currentAssignment.title}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                  เต็ม {currentAssignment.maxScore} คะแนน
                </span>
              </div>
              {currentAssignment.description && (
                <p className="text-xs text-slate-400">
                  {currentAssignment.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">กำหนดส่ง:</span>
                <span className="font-semibold text-slate-200">
                  {formatThaiDate(currentAssignment.deadline)}
                </span>
                {deadlineRel && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    deadlineRel.isPast 
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {deadlineRel.diffText}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Summary Pill Counters */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-center px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-[11px] text-emerald-400 block font-medium">ส่งทันเวลา</span>
                <span className="text-sm font-bold text-emerald-300">{assignOnTime}</span>
              </div>
              <div className="text-center px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-[11px] text-amber-400 block font-medium">ส่งช้า</span>
                <span className="text-sm font-bold text-amber-300">{assignLate}</span>
              </div>
              <div className="text-center px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <span className="text-[11px] text-rose-400 block font-medium">ค้างส่ง</span>
                <span className="text-sm font-bold text-rose-300">{assignMissing}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Controls & Search Filter Bar */}
      <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-student-grading"
              type="text"
              placeholder="ค้นหาชื่อ, เลขที่, รหัสนักเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl text-xs border border-slate-800">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "all" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ทั้งหมด ({classStudents.length})
            </button>
            <button
              onClick={() => setStatusFilter("on_time")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "on_time" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ทันเวลา ({assignOnTime})
            </button>
            <button
              onClick={() => setStatusFilter("late")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "late" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ส่งช้า ({assignLate})
            </button>
            <button
              onClick={() => setStatusFilter("missing")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === "missing" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ค้างส่ง ({assignMissing})
            </button>
          </div>
        </div>

        {/* Batch Quick Operations */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            id="batch-mark-all-ontime-btn"
            onClick={handleBatchMarkOnTime}
            disabled={savingBatch || !currentAssignment}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(5,150,105,0.3)] transition-all disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span>เช็คทุกคนทันเวลา</span>
          </button>
          <button
            id="batch-mark-all-missing-btn"
            onClick={handleBatchMarkMissing}
            disabled={savingBatch || !currentAssignment}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>เช็คค้างส่ง</span>
          </button>
        </div>
      </div>

      {/* Main Checklist / Table */}
      <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">เลขที่</th>
                <th className="py-3.5 px-4 w-28">รหัสนักเรียน</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-3 w-20 text-center">ห้อง</th>
                <th className="py-3.5 px-4 w-44">สถานะการส่งงาน</th>
                <th className="py-3.5 px-4 w-48 text-center">เปลี่ยนสถานะด่วน</th>
                <th className="py-3.5 px-4 w-28 text-center">คะแนน</th>
                <th className="py-3.5 px-4 w-24 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const subKey = currentAssignment ? `${currentAssignment.id}_${student.id}` : "";
                  const sub = submissions[subKey];
                  const effStatus = currentAssignment 
                    ? getEffectiveStatus(sub?.status, currentAssignment.deadline)
                    : "pending";
                  const config = STATUS_CONFIG[effStatus];

                  return (
                    <tr 
                      key={student.id} 
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Number */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                        {student.studentNumber}
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        {student.studentCode}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {student.prefix}{student.firstName} {student.lastName}
                        </div>
                        {sub?.feedback && (
                          <div className="text-xs text-slate-400 italic truncate max-w-xs">
                            💬 {sub.feedback}
                          </div>
                        )}
                      </td>

                      {/* Room */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700/50">
                          {student.grade}/{student.room}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeBg} ${config.borderColor}`}>
                            <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                            {config.shortLabel}
                          </span>
                        </div>
                        {sub?.submittedAt && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {formatThaiDate(sub.submittedAt)}
                          </span>
                        )}
                      </td>

                      {/* Quick Toggle Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
                          <button
                            id={`quick-ontime-${student.id}`}
                            onClick={() => handleQuickStatus(student, "on_time")}
                            title="ส่งทันเวลา"
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              effStatus === "on_time"
                                ? "bg-emerald-600 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]"
                                : "text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ทันเวลา</span>
                          </button>

                          <button
                            id={`quick-late-${student.id}`}
                            onClick={() => handleQuickStatus(student, "late")}
                            title="ส่งช้ากว่ากำหนด"
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              effStatus === "late"
                                ? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                                : "text-amber-400 hover:bg-amber-500/10"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ส่งช้า</span>
                          </button>

                          <button
                            id={`quick-missing-${student.id}`}
                            onClick={() => handleQuickStatus(student, "missing")}
                            title="ยังไม่ส่ง / ค้างส่ง"
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              effStatus === "missing"
                                ? "bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.4)]"
                                : "text-rose-400 hover:bg-rose-500/10"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ค้างส่ง</span>
                          </button>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center">
                        {sub?.score !== undefined ? (
                          <span className="font-bold text-sm text-cyan-400">
                            {sub.score} <span className="text-xs text-slate-500">/{currentAssignment?.maxScore}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>

                      {/* Edit / More details */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`edit-grade-btn-${student.id}`}
                          onClick={() => {
                            if (!currentAssignment) return;
                            setEditingSubmission({
                              student,
                              assignment: currentAssignment,
                              currentSub: sub,
                              score: sub?.score !== undefined ? sub.score : "",
                              feedback: sub?.feedback || "",
                              submittedAt: sub?.submittedAt || new Date().toISOString(),
                              status: effStatus
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="บันทึกคะแนนและข้อความตรวจงาน"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Grading & Feedback Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">
                  บันทึกผลการตรวจงาน
                </h3>
                <p className="text-xs text-slate-400">
                  {editingSubmission.student.prefix}{editingSubmission.student.firstName} {editingSubmission.student.lastName} ({editingSubmission.student.grade}/{editingSubmission.student.room} เลขที่ {editingSubmission.student.studentNumber})
                </p>
              </div>
              <button
                onClick={() => setEditingSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Status Radio Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  สถานะการส่งงาน
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSubmission({ ...editingSubmission, status: "on_time" })}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      editingSubmission.status === "on_time"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(5,150,105,0.2)]"
                        : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ส่งทันเวลา (On Time)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingSubmission({ ...editingSubmission, status: "late" })}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      editingSubmission.status === "late"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>ส่งช้ากว่ากำหนด (Late)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingSubmission({ ...editingSubmission, status: "missing" })}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      editingSubmission.status === "missing"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.2)]"
                        : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>ยังไม่ส่ง / ค้างส่ง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingSubmission({ ...editingSubmission, status: "exempt" })}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      editingSubmission.status === "exempt"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                        : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-center text-[10px] leading-4 font-bold">✓</span>
                    <span>ได้รับการยกเว้น</span>
                  </button>
                </div>
              </div>

              {/* Score Input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  คะแนนที่ได้รับ (คะแนนเต็ม {editingSubmission.assignment.maxScore})
                </label>
                <input
                  id="modal-score-input"
                  type="number"
                  min="0"
                  max={editingSubmission.assignment.maxScore}
                  step="0.5"
                  value={editingSubmission.score}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, score: e.target.value })}
                  placeholder={`0 - ${editingSubmission.assignment.maxScore}`}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Feedback text */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  ข้อเสนอแนะ / ความเห็นของครู
                </label>
                <textarea
                  id="modal-feedback-input"
                  rows={3}
                  value={editingSubmission.feedback}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, feedback: e.target.value })}
                  placeholder="เช่น ผลงานเรียบร้อยดีมาก, แก้ไขข้อ 3 แล้วส่งใหม่..."
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSubmission(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                id="modal-save-grade-btn"
                type="button"
                onClick={handleSaveModalGrading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] flex items-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกผล</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
