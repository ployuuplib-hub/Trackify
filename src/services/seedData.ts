import { Student, Assignment, ALL_CLASSES, GradeLevel, RoomNumber } from "../types";

export const SAMPLE_ASSIGNMENTS: Omit<Assignment, "id">[] = [
  {
    title: "แบบฝึกหัดที่ 1.1: ระบบสมการเชิงเส้น",
    subject: "คณิตศาสตร์พื้นฐาน",
    subjectCode: "ค23101",
    description: "ทำแบบฝึกหัดท้ายบทที่ 1 ข้อ 1-10 ลงในสมุด แสดงวิธีทำอย่างละเอียด",
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days in future
    targetClassIds: ["M3-1", "M3-2"],
    maxScore: 10,
    category: "แบบฝึกหัด" as any,
    createdAt: new Date().toISOString()
  },
  {
    title: "รายงานการทดลอง: การแพร่และออสโมซิสของเซลล์พืช",
    subject: "วิทยาศาสตร์และเทคโนโลยี",
    subjectCode: "ว21101",
    description: "เขียนสรุปผลการทดลองพร้อมภาพวาดเซลล์สาหร่ายหางกระรอก",
    deadline: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago (passed deadline)
    targetClassIds: ["M1-1", "M1-2"],
    maxScore: 15,
    category: "รายงาน/โครงงาน",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    title: "เรียงความ: อนุรักษ์ภาษาและวรรณคดีไทย",
    subject: "ภาษาไทย",
    subjectCode: "ท22101",
    description: "ความยาวไม่น้อยกว่า 1 หน้ากระดาษ A4 ลายมือตัวบรรจงครึ่งบรรทัด",
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    targetClassIds: ["M2-1", "M2-2"],
    maxScore: 10,
    category: "ใบงาน",
    createdAt: new Date().toISOString()
  },
  {
    title: "Portfolio Project: ออกแบบเว็บส่วนตัวด้วย HTML/CSS",
    subject: "วิทยาการคำนวณ",
    subjectCode: "ว33101",
    description: "สร้างหน้าเว็บแนะนำตนเอง 3 หน้า พร้อมส่งลิงก์ GitHub หรือไฟล์ zip",
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    targetClassIds: ["M6-1", "M6-2"],
    maxScore: 20,
    category: "ชิ้นงานสร้างสรรค์",
    createdAt: new Date().toISOString()
  },
  {
    title: "Infographic: ปรากฏการณ์เรือนกระจกและการเปลี่ยนแปลงสภาพภูมิอากาศ",
    subject: "สังคมศึกษาและภูมิศาสตร์",
    subjectCode: "ส32101",
    description: "ออกแบบแผ่นพับหรือโปสเตอร์ดิจิทัลขนาด A4 อธิบายผลกระทบและแนวทางแก้ไข",
    deadline: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    targetClassIds: ["M5-1", "M5-2"],
    maxScore: 10,
    category: "ชิ้นงานสร้างสรรค์",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    title: "Vocabulary Essay: Global Environmental Issues",
    subject: "ภาษาอังกฤษหลัก",
    subjectCode: "อ31101",
    description: "Write a 200-word paragraph using at least 10 vocabulary words from Unit 3",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    targetClassIds: ["M4-1", "M4-2"],
    maxScore: 10,
    category: "การบ้าน",
    createdAt: new Date().toISOString()
  }
];

const THAI_FIRSTNAMES_MALE = [
  "กิตติพงษ์", "ณัฐวุฒิ", "ธนกร", "ปิยพัทธ์", "วรเมธ", "ศุภกิตติ์", "อัครเดช", "ชนาธิป", 
  "กฤษฎา", "ธีรภัทร", "พงศกร", "ภาณุพงศ์", "รัชชานนท์", "สิรภพ", "อนันตชัย", "จิรภัทร"
];

const THAI_FIRSTNAMES_FEMALE = [
  "กัญญาณัฐ", "จิราพร", "ชนิกานต์", "ณิชานันท์", "ธวัลรัตน์", "ปภาวรินทร์", "พิมลดา", "มนัสนันท์",
  "วริศรา", "ศิริพร", "สโรชา", "อรัญญา", "ชญาภา", "ธนภรณ์", "นภัสสร", "พรทิพย์"
];

const THAI_LASTNAMES = [
  "สุขเกษม", "รัตนมณี", "ทองประเสริฐ", "ศรีสมบูรณ์", "วงษ์สุวรรณ", "เจริญพร", "ตั้งเจริญ", "บุญมี",
  "สิริวัฒนา", "วิไลรัตน์", "ชูศักดิ์", "พงษ์สวัสดิ์", "ปรีชาชาญ", "เลิศวิลาส", "แสงสว่าง", "ใจมั่นคง"
];

export function generateInitialStudents(): Omit<Student, "id">[] {
  const students: Omit<Student, "id">[] = [];
  
  // Create 6-8 students per class for M.1/1 to M.6/2 (12 classes total)
  ALL_CLASSES.forEach((cls, classIndex) => {
    const studentCount = 6; // 6 students per room for clean demonstration (can add more anytime)
    
    for (let i = 1; i <= studentCount; i++) {
      const isMale = (i % 2 === 1);
      const isHighSchool = cls.grade === "ม.4" || cls.grade === "ม.5" || cls.grade === "ม.6";
      
      let prefix: Student["prefix"];
      let firstName: string;
      
      if (isHighSchool) {
        prefix = isMale ? "นาย" : "น.ส.";
      } else {
        prefix = isMale ? "ด.ช." : "ด.หญิง";
      }
      
      const namePool = isMale ? THAI_FIRSTNAMES_MALE : THAI_FIRSTNAMES_FEMALE;
      firstName = namePool[(classIndex * 3 + i) % namePool.length];
      const lastName = THAI_LASTNAMES[(classIndex * 2 + i) % THAI_LASTNAMES.length];
      
      // Student Code: Year 67 + grade digit + room digit + student number (2 digits)
      const gradeDigit = cls.grade.replace("ม.", "");
      const studentCode = `67${gradeDigit}${cls.room}${i.toString().padStart(2, "0")}`;
      
      students.push({
        studentCode,
        studentNumber: i,
        prefix,
        firstName,
        lastName,
        classId: cls.id,
        grade: cls.grade,
        room: cls.room,
        gender: isMale ? "male" : "female",
        createdAt: new Date().toISOString(),
      });
    }
  });
  
  return students;
}
