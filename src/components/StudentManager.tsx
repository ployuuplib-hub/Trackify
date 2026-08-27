import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  FileText, 
  GraduationCap, 
  Phone,
  UploadCloud,
  CheckCircle2
} from "lucide-react";
import { Student, ALL_CLASSES, GradeLevel, RoomNumber } from "../types";
import { studentService } from "../services/db";

interface StudentManagerProps {
  students: Student[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  selectedClassId,
  setSelectedClassId
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single student form state
  const [studentCode, setStudentCode] = useState("");
  const [studentNumber, setStudentNumber] = useState<number>(1);
  const [prefix, setPrefix] = useState<Student["prefix"]>("ด.ช.");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [targetClass, setTargetClass] = useState<string>("M1-1");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Bulk add text
  const [bulkText, setBulkText] = useState("");
  const [bulkClassId, setBulkClassId] = useState("M1-1");
  const [bulkStartNumber, setBulkStartNumber] = useState(1);

  // Active filtered students
  const filteredStudents = students.filter((s) => {
    if (selectedClassId !== "ALL" && s.classId !== selectedClassId) return false;
    const fullName = `${s.prefix}${s.firstName} ${s.lastName}`;
    return (
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.includes(searchQuery) ||
      s.studentNumber.toString() === searchQuery
    );
  });

  const resetSingleForm = () => {
    setStudentCode("");
    setStudentNumber(1);
    setPrefix("ด.ช.");
    setFirstName("");
    setLastName("");
    setTargetClass(selectedClassId === "ALL" ? "M1-1" : selectedClassId);
    setPhone("");
    setNotes("");
    setEditingStudent(null);
  };

  const handleOpenAddModal = () => {
    resetSingleForm();
    // Auto calculate next student number for the selected room
    const currentClass = selectedClassId === "ALL" ? "M1-1" : selectedClassId;
    const inClass = students.filter((s) => s.classId === currentClass);
    const maxNum = inClass.reduce((max, s) => Math.max(max, s.studentNumber), 0);
    setStudentNumber(maxNum + 1);
    
    const clsObj = ALL_CLASSES.find((c) => c.id === currentClass);
    const gradeDigit = clsObj ? clsObj.grade.replace("ม.", "") : "1";
    const roomNum = clsObj ? clsObj.room : "1";
    setStudentCode(`67${gradeDigit}${roomNum}${(maxNum + 1).toString().padStart(2, "0")}`);
    
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setStudentCode(stu.studentCode);
    setStudentNumber(stu.studentNumber);
    setPrefix(stu.prefix);
    setFirstName(stu.firstName);
    setLastName(stu.lastName);
    setTargetClass(stu.classId);
    setPhone(stu.phone || "");
    setNotes(stu.notes || "");
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !studentCode.trim()) return;

    setIsSaving(true);
    try {
      const clsObj = ALL_CLASSES.find((c) => c.id === targetClass) || ALL_CLASSES[0];
      
      const payload: Omit<Student, "id"> = {
        studentCode: studentCode.trim(),
        studentNumber: Number(studentNumber),
        prefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        classId: clsObj.id,
        grade: clsObj.grade,
        room: clsObj.room,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined
      };

      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, payload);
      } else {
        await studentService.addStudent(payload);
      }

      setIsAddModalOpen(false);
      resetSingleForm();
    } catch (err) {
      console.error("Failed to save student:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (stu: Student) => {
    if (window.confirm(`คุณต้องการลบข้อมูลนักเรียน "${stu.prefix}${stu.firstName} ${stu.lastName}" ใช่หรือไม่?`)) {
      try {
        await studentService.deleteStudent(stu.id);
      } catch (err) {
        console.error("Failed to delete student:", err);
      }
    }
  };

  // Bulk import processor
  const handleProcessBulkAdd = async () => {
    if (!bulkText.trim()) return;
    setIsSaving(true);
    try {
      const lines = bulkText.split("\n").filter((l) => l.trim().length > 0);
      const clsObj = ALL_CLASSES.find((c) => c.id === bulkClassId) || ALL_CLASSES[0];
      const gradeDigit = clsObj.grade.replace("ม.", "");
      
      const newStudents: Omit<Student, "id">[] = [];

      lines.forEach((line, index) => {
        const num = Number(bulkStartNumber) + index;
        const parts = line.trim().split(/\s+/);
        
        let pref: Student["prefix"] = "ด.ช.";
        let first = parts[0] || "นักเรียน";
        let last = parts.slice(1).join(" ") || "นามสกุล";

        if (first.startsWith("ด.ช.")) {
          pref = "ด.ช.";
          first = first.replace("ด.ช.", "");
        } else if (first.startsWith("ด.ญ.") || first.startsWith("ด.หญิง")) {
          pref = "ด.หญิง";
          first = first.replace(/^ด\.ญ(ิง)?\./, "");
        } else if (first.startsWith("นาย")) {
          pref = "นาย";
          first = first.replace("นาย", "");
        } else if (first.startsWith("น.ส.") || first.startsWith("นางสาว")) {
          pref = "น.ส.";
          first = first.replace(/^น\.ส\.|นางสาว/, "");
        }

        const code = `67${gradeDigit}${clsObj.room}${num.toString().padStart(2, "0")}`;

        newStudents.push({
          studentCode: code,
          studentNumber: num,
          prefix: pref,
          firstName: first,
          lastName: last,
          classId: clsObj.id,
          grade: clsObj.grade,
          room: clsObj.room
        });
      });

      if (newStudents.length > 0) {
        await studentService.bulkAddStudents(newStudents);
      }

      setIsBulkModalOpen(false);
      setBulkText("");
    } catch (err) {
      console.error("Bulk add failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>จัดการรายชื่อนักเรียน (ม.1 - ม.6)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            เพิ่ม ลบ แก้ไข ข้อมูลนักเรียนทั้งหมด {students.length} คน ครบ 12 ห้องเรียน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-bulk-add-students"
            onClick={() => {
              setBulkClassId(selectedClassId === "ALL" ? "M1-1" : selectedClassId);
              setIsBulkModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>เพิ่มหลายคนพร้อมกัน</span>
          </button>

          <button
            id="btn-add-student"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-[0_0_20px_rgba(8,145,178,0.4)] flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มนักเรียนใหม่</span>
          </button>
        </div>
      </div>

      {/* Classroom Filter Pills Bar */}
      <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            เลือกระดับชั้นและห้องเรียน:
          </span>
          <span className="text-xs text-cyan-400 font-semibold">
            แสดง {filteredStudents.length} คน
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedClassId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedClassId === "ALL"
                ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            ทุกห้อง ({students.length})
          </button>

          {ALL_CLASSES.map((cls) => {
            const count = students.filter((s) => s.classId === cls.id).length;
            const isSelected = selectedClassId === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cls.shortName} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, นามสกุล, เลขที่, รหัสนักเรียน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Students Table List */}
      <div className="bg-[#0c0e12]/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">เลขที่</th>
                <th className="py-3.5 px-4 w-32">รหัสประจำตัว</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4 w-28 text-center">ระดับชั้น/ห้อง</th>
                <th className="py-3.5 px-4 w-36">เบอร์โทรศัพท์</th>
                <th className="py-3.5 px-4">หมายเหตุ</th>
                <th className="py-3.5 px-4 w-24 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    ไม่พบข้อมูลนักเรียน
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr
                    key={stu.id}
                    className="hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-bold text-slate-200">
                      {stu.studentNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-400">
                      {stu.studentCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {stu.prefix}{stu.firstName} {stu.lastName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 text-xs font-bold">
                        {stu.grade}/{stu.room}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {stu.phone || "-"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {stu.notes || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(stu)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="แก้ไขข้อมูลนักเรียน"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(stu)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="ลบนักเรียน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>{editingStudent ? "แก้ไขข้อมูลนักเรียน" : "เพิ่มนักเรียนใหม่"}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              {/* Classroom & Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ระดับชั้นและห้อง *
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    {ALL_CLASSES.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    เลขที่ *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Student Code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  รหัสประจำตัวนักเรียน *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 671101"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Prefix, Name, Surname */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    คำนำหน้า
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="ด.ช.">ด.ช.</option>
                    <option value="ด.หญิง">ด.หญิง</option>
                    <option value="นาย">นาย</option>
                    <option value="น.ส.">น.ส.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ชื่อ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อจริง"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="นามสกุล"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Phone & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    เบอร์โทรผู้ปกครอง/นักเรียน
                  </label>
                  <input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    placeholder="บันทึกเพิ่มเติม"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingStudent ? "บันทึกการแก้ไข" : "บันทึกนักเรียน"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0e12] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-cyan-400" />
                <span>เพิ่มรายชื่อนักเรียนแบบกลุ่ม (วางรายชื่อ)</span>
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ห้องเรียนปลายทาง
                  </label>
                  <select
                    value={bulkClassId}
                    onChange={(e) => setBulkClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    {ALL_CLASSES.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    เริ่มที่เลขที่
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkStartNumber}
                    onChange={(e) => setBulkStartNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  วางรายชื่อนักเรียน (1 บรรทัด ต่อ 1 คน)
                </label>
                <textarea
                  rows={8}
                  placeholder={`ด.ช. กิตติพงษ์ สุขเกษม\nด.ญ. กัญญาณัฐ รัตนมณี\nด.ช. ธนกร ทองประเสริฐ`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * สามารถคัดลอกจาก Excel หรือ Word มาวางได้ ระบบจะรันเลขที่และรหัสนักเรียนให้อัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleProcessBulkAdd}
                disabled={isSaving || !bulkText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>นำเข้ารายชื่อ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
