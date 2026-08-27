import React, { useState } from "react";
import { 
  Plus, 
  BookOpen, 
  Clock, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle, 
  Save, 
  Layers, 
  Users,
  Search,
  Filter,
  Check
} from "lucide-react";
import { Assignment, ALL_CLASSES, GradeLevel, Student, Submission } from "../types";
import { formatThaiDate, getDeadlineRelative } from "../lib/dateUtils";
import { assignmentService } from "../services/db";

interface AssignmentManagerProps {
  assignments: Assignment[];
  students: Student[];
  submissions: Record<string, Submission>;
  onNavigateToGrading: (assignmentId: string) => void;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  assignments,
  students,
  submissions,
  onNavigateToGrading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
  );
  const [targetClassIds, setTargetClassIds] = useState<string[]>(["M1-1"]);
  const [maxScore, setMaxScore] = useState<number>(10);
  const [category, setCategory] = useState<Assignment["category"]>("การบ้าน");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common subjects preset
  const COMMON_SUBJECTS = [
    "คณิตศาสตร์พื้นฐาน",
    "วิทยาศาสตร์และเทคโนโลยี",
    "ภาษาไทย",
    "ภาษาอังกฤษหลัก",
    "สังคมศึกษาและภูมิศาสตร์",
    "ประวัติศาสตร์",
    "วิทยาการคำนวณ",
    "สุขศึกษาและพลศึกษา",
    "ศิลปะและดนตรี",
    "การงานอาชีพ"
  ];

  const resetForm = () => {
    setTitle("");
    setSubject("คณิตศาสตร์พื้นฐาน");
    setSubjectCode("");
    setDescription("");
    setDeadline(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16));
    setTargetClassIds(["M1-1"]);
    setMaxScore(10);
    setCategory("การบ้าน");
    setEditingId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (a: Assignment) => {
    setEditingId(a.id);
    setTitle(a.title);
    setSubject(a.subject);
    setSubjectCode(a.subjectCode || "");
    setDescription(a.description || "");
    try {
      setDeadline(new Date(a.deadline).toISOString().slice(0, 16));
    } catch {
      setDeadline(new Date().toISOString().slice(0, 16));
    }
    setTargetClassIds(a.targetClassIds);
    setMaxScore(a.maxScore);
    setCategory(a.category || "การบ้าน");
    setIsModalOpen(true);
  };

  const handleToggleClass = (classId: string) => {
    if (classId === "ALL") {
      if (targetClassIds.includes("ALL")) {
        setTargetClassIds([]);
      } else {
        setTargetClassIds(["ALL"]);
      }
      return;
    }

    let updated = targetClassIds.filter((id) => id !== "ALL");
    if (updated.includes(classId)) {
      updated = updated.filter((id) => id !== classId);
    } else {
      updated.push(classId);
    }
    setTargetClassIds(updated.length === 0 ? ["ALL"] : updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;

    setIsSubmitting(true);
    try {
      const assignmentData = {
        title: title.trim(),
        subject: subject.trim(),
        subjectCode: subjectCode.trim() || undefined,
        description: description.trim() || undefined,
        deadline: new Date(deadline).toISOString(),
        targetClassIds: targetClassIds.length > 0 ? targetClassIds : ["ALL"],
        maxScore: Number(maxScore) || 10,
        category: category || "การบ้าน",
        createdAt: new Date().toISOString()
      };

      if (editingId) {
        await assignmentService.updateAssignment(editingId, assignmentData);
      } else {
        await assignmentService.addAssignment(assignmentData);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบการบ้าน "${title}" ?\n(ข้อมูลการตรวจงานทั้งหมดของงานนี้จะถูกลบด้วย)`)) {
      try {
        await assignmentService.deleteAssignment(id);
      } catch (e) {
        console.error("Failed to delete assignment:", e);
      }
    }
  };

  // Filtered assignments
  const subjectsList = Array.from(new Set(assignments.map((a) => a.subject)));
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = subjectFilter === "all" || a.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>จัดการงานและการบ้าน</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            สร้าง สั่งงาน กำหนดเดดไลน์ และเลือกระดับชั้นห้องเรียนเป้าหมาย (ม.1 ถึง ม.6 รวม 12 ห้อง)
          </p>
        </div>

        <button
          id="btn-create-new-assignment"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm shadow-[0_0_20px_rgba(8,145,178,0.4)] flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สั่งการบ้านใหม่</span>
        </button>
      </div>

      {/* Search & Subject Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่องาน, รายวิชา, คำสั่งงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          >
            <option value="all">ทุกรายวิชา ({assignments.length})</option>
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment Cards Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3 shadow-xl backdrop-blur-md">
          <BookOpen className="w-12 h-12 mx-auto stroke-1 text-slate-600" />
          <p className="text-sm font-medium">ไม่พบรายการการบ้านตามเงื่อนไขที่ค้นหา</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-xs font-semibold"
          >
            + สั่งการบ้านชิ้นแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assign) => {
            const deadlineInfo = getDeadlineRelative(assign.deadline);
            const targetStudents = students.filter((s) =>
              assign.targetClassIds.includes("ALL") || assign.targetClassIds.includes(s.classId)
            );

            let onTimeCount = 0;
            let lateCount = 0;
            let missingCount = 0;

            targetStudents.forEach((stu) => {
              const sub = submissions[`${assign.id}_${stu.id}`];
              if (sub?.status === "on_time") onTimeCount++;
              else if (sub?.status === "late") lateCount++;
              else if (sub?.status === "missing") missingCount++;
              else {
                if (deadlineInfo.isPast) missingCount++;
              }
            });

            const submittedCount = onTimeCount + lateCount;
            const completionPercent = targetStudents.length > 0
              ? Math.round((submittedCount / targetStudents.length) * 100)
              : 0;

            return (
              <div
                key={assign.id}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xs flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all group"
              >
                <div className="space-y-3">
                  {/* Subject Tag & Category */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-bold">
                      {assign.subject}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50 font-medium">
                      {assign.category || "การบ้าน"} • {assign.maxScore} คะแนน
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-base text-white line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {assign.title}
                    </h3>
                    {assign.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {assign.description}
                      </p>
                    )}
                  </div>

                  {/* Deadline & Target Rooms */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> กำหนดส่ง:
                      </span>
                      <span className={`font-semibold ${deadlineInfo.isPast ? "text-rose-400" : "text-slate-200"}`}>
                        {formatThaiDate(assign.deadline, false)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" /> มอบหมาย:
                      </span>
                      <span className="font-medium text-slate-300">
                        {assign.targetClassIds.includes("ALL") ? "ทุกห้อง (12 ห้อง)" : assign.targetClassIds.join(", ")}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">ส่งงานแล้ว</span>
                      <span className="text-white">
                        {submittedCount}/{targetStudents.length} คน ({completionPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          completionPercent >= 80 ? "bg-emerald-400" : "bg-gradient-to-r from-cyan-500 to-blue-500"
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-400">
                      <span className="text-emerald-400 font-medium">{onTimeCount} ทันเวลา</span>
                      <span className="text-amber-400 font-medium">{lateCount} ส่งช้า</span>
                      <span className="text-rose-400 font-medium">{missingCount} ค้างส่ง</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800">
                  <button
                    id={`btn-grade-${assign.id}`}
                    onClick={() => onNavigateToGrading(assign.id)}
                    className="flex-1 py-2 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ตรวจงานชิ้นนี้</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(assign)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="แก้ไขการบ้าน"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(assign.id, assign.title)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="ลบการบ้าน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c0e12] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>{editingId ? "แก้ไขข้อมูลการบ้าน" : "สั่งงาน / การบ้านใหม่"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ชื่องาน / แบบฝึกหัด *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น แบบฝึกหัดที่ 2.1: เรื่องการแยกตัวประกอบ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Subject & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    รายวิชา *
                  </label>
                  <input
                    type="text"
                    required
                    list="subjects-list"
                    placeholder="เช่น คณิตศาสตร์พื้นฐาน"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <datalist id="subjects-list">
                    {COMMON_SUBJECTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    รหัสวิชา (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ค21101, ว32101"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Category & Max Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ประเภทงาน
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="การบ้าน">การบ้าน</option>
                    <option value="ใบงาน">ใบงาน</option>
                    <option value="รายงาน/โครงงาน">รายงาน/โครงงาน</option>
                    <option value="ชิ้นงานสร้างสรรค์">ชิ้นงานสร้างสรรค์</option>
                    <option value="แบบทดสอบย่อย">แบบทดสอบย่อย</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    คะแนนเต็ม
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  กำหนดส่ง (วันและเวลาที่เดดไลน์) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Target Class Selection (12 Rooms) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    มอบหมายให้ห้องเรียน (ม.1 ถึง ม.6)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleClass("ALL")}
                    className="text-xs text-cyan-400 font-semibold hover:underline"
                  >
                    {targetClassIds.includes("ALL") ? "ยกเลิกเลือกทั้งหมด" : "เลือกทุกห้องเรียน (12 ห้อง)"}
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  {ALL_CLASSES.map((cls) => {
                    const isSelected = targetClassIds.includes("ALL") || targetClassIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleToggleClass(cls.id)}
                        className={`p-2 rounded-lg text-xs font-bold transition-all border text-center ${
                          isSelected
                            ? "bg-cyan-600 text-white border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.4)]"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {cls.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  คำอธิบาย / รายละเอียดคำสั่งงาน
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น ทำลงในสมุดวิชาคณิตศาสตร์ แสดงวิธีทำข้อ 1-5 อย่างละเอียด..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-save-assignment-modal"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? "บันทึกการแก้ไข" : "สร้างการบ้าน"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
