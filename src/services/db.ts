import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Student, Assignment, Submission, SubmissionStatus } from "../types";
import { generateInitialStudents, SAMPLE_ASSIGNMENTS } from "./seedData";

const STUDENTS_COLLECTION = "students";
const ASSIGNMENTS_COLLECTION = "assignments";
const SUBMISSIONS_COLLECTION = "submissions";

// Local storage backup keys for resilient fallback
const LS_STUDENTS = "trackify_students_cache";
const LS_ASSIGNMENTS = "trackify_assignments_cache";
const LS_SUBMISSIONS = "trackify_submissions_cache";

export const studentService = {
  // Subscribe to all students
  subscribe(callback: (students: Student[]) => void) {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION));
      return onSnapshot(q, (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Student);
        });
        // Sort by Grade, Room, Student Number
        list.sort((a, b) => {
          if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
          if (a.room !== b.room) return a.room.localeCompare(b.room);
          return a.studentNumber - b.studentNumber;
        });
        localStorage.setItem(LS_STUDENTS, JSON.stringify(list));
        callback(list);
      }, (error) => {
        console.warn("Firestore students subscription fallback to cache:", error);
        const cached = localStorage.getItem(LS_STUDENTS);
        if (cached) {
          try { callback(JSON.parse(cached)); } catch(e) {}
        }
      });
    } catch (e) {
      console.warn("Error setting up student listener:", e);
      return () => {};
    }
  },

  async addStudent(data: Omit<Student, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<void> {
    const docRef = doc(db, STUDENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteStudent(id: string): Promise<void> {
    const docRef = doc(db, STUDENTS_COLLECTION, id);
    await deleteDoc(docRef);
    
    // Also clean up submissions for this student
    try {
      const subQuery = query(collection(db, SUBMISSIONS_COLLECTION), where("studentId", "==", id));
      const snap = await getDocs(subQuery);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error("Failed to delete student submissions:", e);
    }
  },

  // Bulk add multiple students (e.g. from Excel/text or initial seed)
  async bulkAddStudents(students: Omit<Student, "id">[]): Promise<void> {
    const batch = writeBatch(db);
    students.forEach((stu) => {
      const newDocRef = doc(collection(db, STUDENTS_COLLECTION));
      batch.set(newDocRef, {
        ...stu,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    await batch.commit();
  }
};

export const assignmentService = {
  subscribe(callback: (assignments: Assignment[]) => void) {
    try {
      const q = query(collection(db, ASSIGNMENTS_COLLECTION));
      return onSnapshot(q, (snapshot) => {
        const list: Assignment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Assignment);
        });
        // Sort by deadline descending
        list.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
        localStorage.setItem(LS_ASSIGNMENTS, JSON.stringify(list));
        callback(list);
      }, (error) => {
        console.warn("Firestore assignments subscription error:", error);
        const cached = localStorage.getItem(LS_ASSIGNMENTS);
        if (cached) {
          try { callback(JSON.parse(cached)); } catch(e) {}
        }
      });
    } catch (e) {
      console.warn("Error setting up assignment listener:", e);
      return () => {};
    }
  },

  async addAssignment(data: Omit<Assignment, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<void> {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteAssignment(id: string): Promise<void> {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, id);
    await deleteDoc(docRef);

    // Delete associated submissions
    try {
      const subQuery = query(collection(db, SUBMISSIONS_COLLECTION), where("assignmentId", "==", id));
      const snap = await getDocs(subQuery);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error("Failed to delete assignment submissions:", e);
    }
  }
};

export const submissionService = {
  subscribe(callback: (submissions: Record<string, Submission>) => void) {
    try {
      const q = query(collection(db, SUBMISSIONS_COLLECTION));
      return onSnapshot(q, (snapshot) => {
        const map: Record<string, Submission> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Submission;
          const sub: Submission = { id: docSnap.id, ...data };
          // key by `${assignmentId}_${studentId}`
          map[`${sub.assignmentId}_${sub.studentId}`] = sub;
        });
        localStorage.setItem(LS_SUBMISSIONS, JSON.stringify(map));
        callback(map);
      }, (error) => {
        console.warn("Firestore submissions subscription error:", error);
        const cached = localStorage.getItem(LS_SUBMISSIONS);
        if (cached) {
          try { callback(JSON.parse(cached)); } catch(e) {}
        }
      });
    } catch (e) {
      console.warn("Error setting up submission listener:", e);
      return () => {};
    }
  },

  async setSubmission(
    assignmentId: string,
    studentId: string,
    data: {
      status: SubmissionStatus;
      submittedAt?: string;
      score?: number;
      feedback?: string;
      submissionLink?: string;
      checkedBy?: string;
    }
  ): Promise<void> {
    const customDocId = `${assignmentId}_${studentId}`;
    const docRef = doc(db, SUBMISSIONS_COLLECTION, customDocId);
    
    await setDoc(docRef, {
      id: customDocId,
      assignmentId,
      studentId,
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  async batchSetSubmissions(
    items: Array<{
      assignmentId: string;
      studentId: string;
      status: SubmissionStatus;
      score?: number;
      submittedAt?: string;
      feedback?: string;
    }>
  ): Promise<void> {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const customDocId = `${item.assignmentId}_${item.studentId}`;
      const docRef = doc(db, SUBMISSIONS_COLLECTION, customDocId);
      batch.set(docRef, {
        id: customDocId,
        ...item,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
  }
};

// Seed initial data to Firestore
export async function seedInitialDatabaseIfEmpty(): Promise<{ studentsAdded: number; assignmentsAdded: number }> {
  try {
    const stuSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    let studentsAdded = 0;
    let assignmentsAdded = 0;

    if (stuSnap.empty) {
      const sampleStudents = generateInitialStudents();
      await studentService.bulkAddStudents(sampleStudents);
      studentsAdded = sampleStudents.length;
    }

    const assignSnap = await getDocs(collection(db, ASSIGNMENTS_COLLECTION));
    if (assignSnap.empty) {
      for (const a of SAMPLE_ASSIGNMENTS) {
        await assignmentService.addAssignment(a);
        assignmentsAdded++;
      }
    }

    return { studentsAdded, assignmentsAdded };
  } catch (error) {
    console.error("Error seeding initial database:", error);
    throw error;
  }
}

// Reset and regenerate full demo data for M.1 to M.6
export async function resetAndSeedCompleteData(): Promise<void> {
  const batch = writeBatch(db);
  
  // Get all existing
  const [stuSnap, assignSnap, subSnap] = await Promise.all([
    getDocs(collection(db, STUDENTS_COLLECTION)),
    getDocs(collection(db, ASSIGNMENTS_COLLECTION)),
    getDocs(collection(db, SUBMISSIONS_COLLECTION))
  ]);

  stuSnap.forEach((d) => batch.delete(d.ref));
  assignSnap.forEach((d) => batch.delete(d.ref));
  subSnap.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  // Re-seed students
  const sampleStudents = generateInitialStudents();
  await studentService.bulkAddStudents(sampleStudents);

  // Re-seed assignments
  const createdAssignmentIds: string[] = [];
  for (const a of SAMPLE_ASSIGNMENTS) {
    const id = await assignmentService.addAssignment(a);
    createdAssignmentIds.push(id);
  }

  // Generate some realistic sample submissions
  // Let's re-fetch student docs to get their Firestore IDs
  const newStudentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
  const createdStudents: Student[] = [];
  newStudentsSnap.forEach((d) => createdStudents.push({ id: d.id, ...d.data() } as Student));

  const newAssignSnap = await getDocs(collection(db, ASSIGNMENTS_COLLECTION));
  const createdAssignments: Assignment[] = [];
  newAssignSnap.forEach((d) => createdAssignments.push({ id: d.id, ...d.data() } as Assignment));

  const subItems: Array<{
    assignmentId: string;
    studentId: string;
    status: SubmissionStatus;
    score?: number;
    submittedAt?: string;
    feedback?: string;
  }> = [];

  createdAssignments.forEach((assignment) => {
    const targetStudents = createdStudents.filter((s) => 
      assignment.targetClassIds.includes("ALL") || assignment.targetClassIds.includes(s.classId)
    );

    const deadlineTime = new Date(assignment.deadline).getTime();
    const isPastDeadline = deadlineTime < Date.now();

    targetStudents.forEach((student, index) => {
      // Simulate realistic statuses
      if (index % 4 === 0) {
        // On time
        subItems.push({
          assignmentId: assignment.id,
          studentId: student.id,
          status: "on_time",
          score: Math.round(assignment.maxScore * 0.9),
          submittedAt: new Date(deadlineTime - 86400000).toISOString(),
          feedback: "ผลงานดี เรียบร้อย ถูกต้องตามโจทย์"
        });
      } else if (index % 4 === 1) {
        // Submitted late or on-time
        if (isPastDeadline) {
          subItems.push({
            assignmentId: assignment.id,
            studentId: student.id,
            status: "late",
            score: Math.round(assignment.maxScore * 0.75),
            submittedAt: new Date(deadlineTime + 86400000).toISOString(),
            feedback: "ส่งช้ากว่ากำหนด 1 วัน หักคะแนนความตรงต่อเวลาเล็กน้อย"
          });
        } else {
          subItems.push({
            assignmentId: assignment.id,
            studentId: student.id,
            status: "on_time",
            score: Math.round(assignment.maxScore * 0.85),
            submittedAt: new Date().toISOString(),
            feedback: "ตรวจแล้ว สมบูรณ์"
          });
        }
      } else if (index % 4 === 2) {
        // Missing (if past deadline) or pending (if in future)
        if (isPastDeadline) {
          subItems.push({
            assignmentId: assignment.id,
            studentId: student.id,
            status: "missing",
            feedback: "ยังไม่ส่งงาน เกินกำหนดแล้ว กรุณาติดต่อครูผู้สอน"
          });
        } else {
          // Still pending
        }
      }
    });
  });

  if (subItems.length > 0) {
    await submissionService.batchSetSubmissions(subItems);
  }
}
