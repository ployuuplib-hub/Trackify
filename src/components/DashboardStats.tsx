import React from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import { Student, Assignment, Submission, ALL_CLASSES, GradeLevel } from "../types";
import { formatThaiDate, getDeadlineRelative } from "../lib/dateUtils";

interface DashboardStatsProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Record<string, Submission>;
  onSelectClass: (classId: string) => void;
  onNavigateTab: (tab: "grading" | "assignments" | "students") => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  students,
  assignments,
  submissions,
  onSelectClass,
  onNavigateTab
}) => {
  // Aggregate calculations
  const totalStudents = students.length;
  const totalAssignments = assignments.length;

  let totalExpectedSubmissions = 0;
  let totalOnTime = 0;
  let totalLate = 0;
  let totalMissing = 0;
  let totalPending = 0;

  const classMetrics: Record<string, {
    total: number;
    submitted: number;
    onTime: number;
    late: number;
    missing: number;
    studentCount: number;
  }> = {};

  ALL_CLASSES.forEach((c) => {
    const count = students.filter((s) => s.classId === c.id).length;
    classMetrics[c.id] = {
      total: 0,
      submitted: 0,
      onTime: 0,
      late: 0,
      missing: 0,
      studentCount: count
    };
  });

  assignments.forEach((assign) => {
    const isPastDeadline = new Date(assign.deadline).getTime() < Date.now();
    const targetStudents = students.filter((s) => 
      assign.targetClassIds.includes("ALL") || assign.targetClassIds.includes(s.classId)
    );

    targetStudents.forEach((stu) => {
      totalExpectedSubmissions++;
      const metrics = classMetrics[stu.classId];
      if (metrics) metrics.total++;

      const subKey = `${assign.id}_${stu.id}`;
      const sub = submissions[subKey];

      if (sub) {
        if (sub.status === "on_time") {
          totalOnTime++;
          if (metrics) { metrics.submitted++; metrics.onTime++; }
        } else if (sub.status === "late") {
          totalLate++;
          if (metrics) { metrics.submitted++; metrics.late++; }
        } else if (sub.status === "missing") {
          totalMissing++;
          if (metrics) metrics.missing++;
        } else if (sub.status === "exempt") {
          // treat as neutral
        } else {
          // pending status recorded
          if (isPastDeadline) {
            totalMissing++;
            if (metrics) metrics.missing++;
          } else {
            totalPending++;
          }
        }
      } else {
        // No submission record yet
        if (isPastDeadline) {
          totalMissing++;
          if (metrics) metrics.missing++;
        } else {
          totalPending++;
        }
      }
    });
  });

  const totalSubmitted = totalOnTime + totalLate;
  const overallCompletionRate = totalExpectedSubmissions > 0
    ? Math.round((totalSubmitted / totalExpectedSubmissions) * 100)
    : 0;

  const onTimePercentage = totalSubmitted > 0
    ? Math.round((totalOnTime / totalSubmitted) * 100)
    : 0;

  // Grade level groupings (ม.1 to ม.6)
  const grades: GradeLevel[] = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

  return (
    <div className="space-y-6">
      {/* Top Welcome / Action Banner */}
      <div className="bg-[#0c0e12]/90 border border-slate-800/80 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Overview & Analytics
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ระบบเช็คงานนักเรียน Trackify
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              ติดตามการส่งงานของนักเรียน มัธยมศึกษาปีที่ 1 ถึง 6 (12 ห้องเรียน) พร้อมวิเคราะห์ความตรงต่อเวลาและการค้างส่งงานแบบเรียลไทม์
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-goto-grading-btn"
              onClick={() => onNavigateTab("grading")}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>เริ่มตรวจเช็คงาน</span>
            </button>
            <button
              id="dashboard-new-assign-btn"
              onClick={() => onNavigateTab("assignments")}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors border border-slate-700/60 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>สั่งการบ้านใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Completion */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-xs">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>อัตราส่งงานรวม</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
            <span>{overallCompletionRate}%</span>
            <span className="text-xs font-normal text-slate-500">
              ({totalSubmitted}/{totalExpectedSubmissions} ชิ้น)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
              style={{ width: `${overallCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2: On Time */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-xs">
          <div className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>ส่งทันเวลา (ON-TIME)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
            <span className="text-emerald-400">{totalOnTime}</span>
            <span className="text-xs font-normal text-slate-500">
              / {onTimePercentage}% ของที่ส่ง
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            ส่งตรงตามกำหนดเวลาที่ครูตั้งไว้
          </p>
        </div>

        {/* Metric 3: Late */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-xs">
          <div className="text-amber-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>ส่งช้ากว่ากำหนด (LATE)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
            <span className="text-amber-400">{totalLate}</span>
            <span className="text-xs font-normal text-slate-500">
              ชิ้นงาน
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            ส่งงานแล้วแต่เกินเดดไลน์ที่กำหนด
          </p>
        </div>

        {/* Metric 4: Missing / Incomplete */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-xs">
          <div className="text-rose-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>ยังไม่ส่ง / ค้างส่ง (MISSING)</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
            <span className="text-rose-400">{totalMissing}</span>
            <span className="text-xs font-normal text-slate-500">
              ชิ้นงานค้าง
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            {totalPending > 0 ? `(มีอีก ${totalPending} ชิ้นยังไม่ถึงกำหนดส่ง)` : "ไม่มีงานรอส่ง"}
          </p>
        </div>
      </div>

      {/* 12 Classrooms Grid: M.1/1 to M.6/2 */}
      <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>สรุปสถานะรายห้องเรียน (ม.1 ถึง ม.6 รวม 12 ห้อง)</span>
            </h2>
            <p className="text-xs text-slate-400">
              คลิกที่ห้องเรียนเพื่อไปยังหน้าตรวจเช็คงานของห้องนั้นทันที
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ALL_CLASSES.map((cls) => {
            const metric = classMetrics[cls.id] || { total: 0, submitted: 0, onTime: 0, late: 0, missing: 0, studentCount: 0 };
            const rate = metric.total > 0 ? Math.round((metric.submitted / metric.total) * 100) : 0;

            return (
              <button
                key={cls.id}
                id={`class-card-${cls.id}`}
                onClick={() => onSelectClass(cls.id)}
                className="text-left p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-800/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {cls.shortName}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {metric.studentCount} คน
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">ส่งครบ</span>
                  <span className="font-semibold text-slate-200 text-xs">{rate}%</span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full ${
                      rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-emerald-400 font-medium">{metric.onTime} ทัน</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-medium">{metric.late} ช้า</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400 font-medium">{metric.missing} ค้าง</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Assignments List & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignments Overview */}
        <div className="lg:col-span-2 bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                งานและการบ้านล่าสุด
              </h2>
              <p className="text-xs text-slate-400">
                รายการชิ้นงานที่กำลังเปิดรับส่งและกำหนดเดดไลน์
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("assignments")}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              ดูทั้งหมด ({assignments.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              ยังไม่มีรายการการบ้านในระบบ
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {assignments.slice(0, 5).map((assign) => {
                const deadlineInfo = getDeadlineRelative(assign.deadline);
                const targetStudents = students.filter((s) =>
                  assign.targetClassIds.includes("ALL") || assign.targetClassIds.includes(s.classId)
                );
                
                let subCount = 0;
                targetStudents.forEach((stu) => {
                  const s = submissions[`${assign.id}_${stu.id}`];
                  if (s && (s.status === "on_time" || s.status === "late")) subCount++;
                });

                const percent = targetStudents.length > 0
                  ? Math.round((subCount / targetStudents.length) * 100)
                  : 0;

                return (
                  <div key={assign.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-medium">
                          {assign.subject}
                        </span>
                        <span className="font-semibold text-sm text-white">
                          {assign.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>
                          ห้อง: {assign.targetClassIds.includes("ALL") ? "ทุกห้อง (ม.1-ม.6)" : assign.targetClassIds.join(", ")}
                        </span>
                        <span>•</span>
                        <span className={deadlineInfo.isPast ? "text-rose-400 font-medium" : "text-amber-400"}>
                          กำหนดส่ง: {formatThaiDate(assign.deadline)} ({deadlineInfo.diffText})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center self-end">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-200">
                          {subCount}/{targetStudents.length} คน
                        </span>
                        <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${percent === 100 ? "bg-emerald-400" : "bg-cyan-500"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigateTab("grading")}
                        className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        title="ตรวจงานชิ้นนี้"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Guide & Admin Tips */}
        <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-md">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400" />
            <span>แนวทางเช็คงาน Trackify</span>
          </h3>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] mt-1.5 shrink-0" />
              <div>
                <strong className="text-white font-semibold">ส่งทันเวลา (On-time):</strong> นักเรียนส่งงานก่อนหรือตรงเวลาเดดไลน์ที่กำหนด
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] mt-1.5 shrink-0" />
              <div>
                <strong className="text-white font-semibold">ส่งช้า (Late):</strong> ส่งงานหลังเวลาเดดไลน์ ระบบคำนวณและบันทึกเวลาจริง
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)] mt-1.5 shrink-0" />
              <div>
                <strong className="text-white font-semibold">ค้างส่ง (Missing):</strong> เลยกำหนดส่งแล้วแต่ยังไม่มีการส่งชิ้นงาน
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            * ข้อมูลทั้งหมดเชื่อมต่อกับ Firebase บันทึกแบบเรียลไทม์ แอดมินสามารถเพิ่ม-ลบ-แก้ไขนักเรียนและการบ้านได้ทุกระดับชั้น
          </div>
        </div>
      </div>
    </div>
  );
};
