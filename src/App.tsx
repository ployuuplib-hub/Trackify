import React, { useState, useEffect } from "react";
import { 
  Student, 
  Assignment, 
  Submission, 
  ALL_CLASSES 
} from "./types";
import { 
  studentService, 
  assignmentService, 
  submissionService, 
  seedInitialDatabaseIfEmpty, 
  resetAndSeedCompleteData 
} from "./services/db";
import { Navbar } from "./components/Navbar";
import { DashboardStats } from "./components/DashboardStats";
import { SubmissionMatrix } from "./components/SubmissionMatrix";
import { AssignmentManager } from "./components/AssignmentManager";
import { StudentManager } from "./components/StudentManager";
import { StudentPortal } from "./components/StudentPortal";
import { ExportReportModal } from "./components/ExportReportModal";
import { 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw,
  Database,
  CloudCheck
} from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"dashboard" | "grading" | "assignments" | "students" | "student-portal">("dashboard");
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    let unsubscribeStudents: () => void = () => {};
    let unsubscribeAssignments: () => void = () => {};
    let unsubscribeSubmissions: () => void = () => {};

    const initData = async () => {
      try {
        // First check and seed if database is completely empty
        await seedInitialDatabaseIfEmpty();
      } catch (e) {
        console.warn("Initial seed check note:", e);
      } finally {
        setIsLoading(false);
      }

      unsubscribeStudents = studentService.subscribe((data) => {
        setStudents(data);
      });

      unsubscribeAssignments = assignmentService.subscribe((data) => {
        setAssignments(data);
        if (data.length > 0 && !selectedAssignmentId) {
          setSelectedAssignmentId(data[0].id);
        }
      });

      unsubscribeSubmissions = submissionService.subscribe((data) => {
        setSubmissions(data);
      });
    };

    initData();

    return () => {
      unsubscribeStudents();
      unsubscribeAssignments();
      unsubscribeSubmissions();
    };
  }, []);

  // Reset & Re-seed full demo data (M.1 to M.6)
  const handleConfirmResetData = async () => {
    setIsSeeding(true);
    setShowResetConfirmModal(false);
    try {
      await resetAndSeedCompleteData();
    } catch (e) {
      console.error("Reset data error:", e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectClassFromDashboard = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentTab("grading");
  };

  const handleNavigateToGrading = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setCurrentTab("grading");
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-300 flex flex-col font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background light aura */}
      <div className="fixed inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-blue-600/5 pointer-events-none z-0" />

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        isSeeding={isSeeding}
        onResetData={() => setShowResetConfirmModal(true)}
        studentCount={students.length}
        assignmentCount={assignments.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
            <p className="text-sm font-semibold text-slate-400">
              กำลังเชื่อมต่อฐานข้อมูล Trackify (Firebase)...
            </p>
          </div>
        ) : (
          <>
            {currentTab === "dashboard" && (
              <DashboardStats
                students={students}
                assignments={assignments}
                submissions={submissions}
                onSelectClass={handleSelectClassFromDashboard}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === "grading" && (
              <SubmissionMatrix
                students={students}
                assignments={assignments}
                submissions={submissions}
                selectedClassId={selectedClassId}
                setSelectedClassId={setSelectedClassId}
                selectedAssignmentId={selectedAssignmentId}
                setSelectedAssignmentId={setSelectedAssignmentId}
              />
            )}

            {currentTab === "assignments" && (
              <AssignmentManager
                assignments={assignments}
                students={students}
                submissions={submissions}
                onNavigateToGrading={handleNavigateToGrading}
              />
            )}

            {currentTab === "students" && (
              <StudentManager
                students={students}
                selectedClassId={selectedClassId}
                setSelectedClassId={setSelectedClassId}
              />
            )}

            {currentTab === "student-portal" && (
              <StudentPortal
                students={students}
                assignments={assignments}
                submissions={submissions}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for Exporting Reports */}
      {currentTab !== "student-portal" && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            id="floating-export-report-btn"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-3 bg-[#0c0e12] border border-cyan-500/40 text-cyan-300 rounded-2xl font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:border-cyan-400 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>ออกรายงาน Excel/พิมพ์</span>
          </button>
        </div>
      )}

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={students}
        assignments={assignments}
        submissions={submissions}
        selectedClassId={selectedClassId}
      />

      {/* Reset Data Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-cyan-400">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-bold text-base text-white">
                สร้าง / รีเซ็ตข้อมูลตัวอย่าง ม.1 - ม.6
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              ระบบจะสร้างข้อมูลนักเรียนตัวอย่างครบทั้ง 12 ห้องเรียน (ม.1/1 ถึง ม.6/2) พร้อมรายการการบ้านตัวอย่างและการจำลองการส่งงาน เพื่อให้ทดสอบระบบได้ทันที
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                id="confirm-reset-seed-btn"
                type="button"
                onClick={handleConfirmResetData}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all"
              >
                ยืนยันการสร้างข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-[#0c0e12]/60 backdrop-blur-md text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Trackify</span>
            <span className="text-slate-400">• ระบบเช็คงานนักเรียน ม.1 - ม.6 (12 ห้องเรียน)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Firebase Database: Live Sync
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
