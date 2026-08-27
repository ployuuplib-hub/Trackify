import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Users, BookOpen, Sparkles, RefreshCw, Shield, GraduationCap, Database } from "lucide-react";
import { ALL_CLASSES } from "../types";

interface NavbarProps {
  currentTab: "dashboard" | "grading" | "assignments" | "students" | "student-portal";
  setCurrentTab: (tab: "dashboard" | "grading" | "assignments" | "students" | "student-portal") => void;
  selectedClassId: string; // "ALL" or "M1-1", etc.
  setSelectedClassId: (classId: string) => void;
  isSeeding: boolean;
  onResetData: () => void;
  studentCount: number;
  assignmentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedClassId,
  setSelectedClassId,
  isSeeding,
  onResetData,
  studentCount,
  assignmentCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c0e12]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white">
                  Trackify
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                  ม.1 - ม.6 (12 ห้อง)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                <span>Firebase: Firebest-DB</span>
                <span className="text-slate-600">•</span>
                <span>ระบบเช็คงานนักเรียน</span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/80 p-1 rounded-xl">
            <button
              id="nav-tab-dashboard"
              onClick={() => setCurrentTab("dashboard")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === "dashboard"
                  ? "bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              ภาพรวมสถิติ
            </button>
            <button
              id="nav-tab-grading"
              onClick={() => setCurrentTab("grading")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === "grading"
                  ? "bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ตรวจเช็คงาน</span>
            </button>
            <button
              id="nav-tab-assignments"
              onClick={() => setCurrentTab("assignments")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === "assignments"
                  ? "bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>จัดการการบ้าน</span>
            </button>
            <button
              id="nav-tab-students"
              onClick={() => setCurrentTab("students")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === "students"
                  ? "bg-slate-800/90 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>รายชื่อนักเรียน</span>
            </button>
          </nav>

          {/* Student Portal Switch & Actions */}
          <div className="flex items-center gap-2.5">
            <button
              id="nav-student-portal-btn"
              onClick={() => setCurrentTab(currentTab === "student-portal" ? "dashboard" : "student-portal")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                currentTab === "student-portal"
                  ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "bg-slate-900/80 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{currentTab === "student-portal" ? "กลับหน้าแอดมิน" : "มุมมองนักเรียน"}</span>
            </button>

            {/* Reset / Sample Data Seeder */}
            <button
              id="reset-demo-data-btn"
              onClick={onResetData}
              disabled={isSeeding}
              title="สร้าง / รีเซ็ตข้อมูลตัวอย่าง ม.1-ม.6 (12 ห้อง)"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800/80 transition-colors border border-slate-800"
            >
              <RefreshCw className={`w-4 h-4 ${isSeeding ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-800/80">
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === "dashboard" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400"
            }`}
          >
            ภาพรวม
          </button>
          <button
            onClick={() => setCurrentTab("grading")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === "grading" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400"
            }`}
          >
            ตรวจงาน
          </button>
          <button
            onClick={() => setCurrentTab("assignments")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === "assignments" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400"
            }`}
          >
            การบ้าน
          </button>
          <button
            onClick={() => setCurrentTab("students")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === "students" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400"
            }`}
          >
            นักเรียน
          </button>
        </div>
      </div>
    </header>
  );
};

