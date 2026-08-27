import React, { useState } from "react";
import { Download, Printer, FileSpreadsheet, X, CheckCircle2, Clock, AlertOctagon } from "lucide-react";
import { Student, Assignment, Submission, ALL_CLASSES } from "../types";
import { formatThaiDate } from "../lib/dateUtils";
import { getEffectiveStatus } from "../lib/statusHelpers";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  assignments: Assignment[];
  submissions: Record<string, Submission>;
  selectedClassId: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  students,
  assignments,
  submissions,
  selectedClassId
}) => {
  const [targetClass, setTargetClass] = useState(selectedClassId === "ALL" ? "M1-1" : selectedClassId);

  if (!isOpen) return null;

  const currentClassObj = ALL_CLASSES.find((c) => c.id === targetClass) || ALL_CLASSES[0];
  const classStudents = students.filter((s) => s.classId === targetClass);
  const classAssignments = assignments.filter((a) =>
    a.targetClassIds.includes("ALL") || a.targetClassIds.includes(targetClass)
  );

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = [
      "เลขที่",
      "รหัสประจำตัว",
      "คำนำหน้า",
      "ชื่อ",
      "นามสกุล",
      "ห้อง",
      ...classAssignments.map((a) => `"${a.title} (${a.subject})"`),
      "ส่งครบ (ชิ้น)",
      "ค้างส่ง (ชิ้น)",
      "ร้อยละความครบถ้วน"
    ];

    const rows = classStudents.map((stu) => {
      let completed = 0;
      let missing = 0;

      const assignmentCells = classAssignments.map((a) => {
        const sub = submissions[`${a.id}_${stu.id}`];
        const status = getEffectiveStatus(sub?.status, a.deadline);
        if (status === "on_time") {
          completed++;
          return `"ส่งทันเวลา (${sub?.score !== undefined ? sub.score : '-'})"`;
        } else if (status === "late") {
          completed++;
          return `"ส่งช้า (${sub?.score !== undefined ? sub.score : '-'})"`;
        } else {
          missing++;
          return `"ยังไม่ส่ง"`;
        }
      });

      const rate = classAssignments.length > 0
        ? Math.round((completed / classAssignments.length) * 100)
        : 0;

      return [
        stu.studentNumber,
        `"${stu.studentCode}"`,
        `"${stu.prefix}"`,
        `"${stu.firstName}"`,
        `"${stu.lastName}"`,
        `"${stu.grade}/${stu.room}"`,
        ...assignmentCells,
        completed,
        missing,
        `"${rate}%"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานเช็คงาน_${currentClassObj.shortName.replace("/", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0c0e12] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl p-6 my-6 space-y-4 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-lg text-white">
              รายงานสรุปการส่งงานรายห้องเรียน
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Switcher in Modal */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">เลือกห้อง:</span>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold outline-none focus:border-cyan-500"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.shortName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Printable Report View */}
        <div className="border border-slate-800 rounded-xl p-4 overflow-x-auto print:border-none print:p-0 bg-slate-900/40">
          <div className="text-center mb-4">
            <h2 className="text-base font-bold text-white">
              แบบบันทึกการส่งงานและการบ้านนักเรียน
            </h2>
            <p className="text-xs text-slate-400">
              {currentClassObj.name} ({currentClassObj.shortName}) • จำนวนนักเรียน {classStudents.length} คน • จำนวนการบ้าน {classAssignments.length} ชิ้น
            </p>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-slate-800">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="border border-slate-800 p-2 w-10 text-center">เลขที่</th>
                <th className="border border-slate-800 p-2 w-20">รหัส</th>
                <th className="border border-slate-800 p-2">ชื่อ - นามสกุล</th>
                {classAssignments.map((a) => (
                  <th key={a.id} className="border border-slate-800 p-2 text-center max-w-[100px] truncate text-cyan-300" title={a.title}>
                    {a.title}
                  </th>
                ))}
                <th className="border border-slate-800 p-2 text-center w-14 text-emerald-400">ครบ</th>
                <th className="border border-slate-800 p-2 text-center w-14 text-rose-400">ค้าง</th>
                <th className="border border-slate-800 p-2 text-center w-14 text-cyan-400">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {classStudents.map((stu) => {
                let completed = 0;
                let missing = 0;

                return (
                  <tr key={stu.id} className="hover:bg-slate-800/40">
                    <td className="border border-slate-800 p-2 text-center font-bold text-slate-300">
                      {stu.studentNumber}
                    </td>
                    <td className="border border-slate-800 p-2 font-mono text-slate-400">
                      {stu.studentCode}
                    </td>
                    <td className="border border-slate-800 p-2 font-medium text-slate-200">
                      {stu.prefix}{stu.firstName} {stu.lastName}
                    </td>

                    {classAssignments.map((a) => {
                      const sub = submissions[`${a.id}_${stu.id}`];
                      const status = getEffectiveStatus(sub?.status, a.deadline);

                      if (status === "on_time") completed++;
                      else if (status === "late") completed++;
                      else missing++;

                      return (
                        <td key={a.id} className="border border-slate-800 p-2 text-center">
                          {status === "on_time" ? (
                            <span className="text-emerald-400 font-bold">✓ ทัน</span>
                          ) : status === "late" ? (
                            <span className="text-amber-400 font-bold">⏱ ช้า</span>
                          ) : (
                            <span className="text-rose-400 font-bold">✗ ค้าง</span>
                          )}
                          {sub?.score !== undefined && (
                            <span className="text-[10px] text-slate-400 block">({sub.score}ค.)</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="border border-slate-800 p-2 text-center font-bold text-emerald-400">
                      {completed}
                    </td>
                    <td className="border border-slate-800 p-2 text-center font-bold text-rose-400">
                      {missing}
                    </td>
                    <td className="border border-slate-800 p-2 text-center font-bold text-cyan-400">
                      {classAssignments.length > 0 ? Math.round((completed / classAssignments.length) * 100) : 0}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
