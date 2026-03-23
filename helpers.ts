import { jsPDF } from "jspdf";
import { UserData, KeyLog } from "../types";

export const generateUserPDF = (user: UserData) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("User Data Report", 10, 20);
  doc.setFontSize(12);
  doc.text(`Name: ${user.name}`, 10, 40);
  doc.text(`Role: ${user.role}`, 10, 50);
  doc.text(`ID Number: ${user.idNumber}`, 10, 60);
  doc.text(`Father's Name: ${user.fatherName}`, 10, 70);
  doc.text(`Mother's Name: ${user.motherName}`, 10, 80);
  doc.text(`Session: ${user.session}`, 10, 90);
  doc.text(`Department: ${user.department}`, 10, 100);
  doc.text(`Created At: ${new Date(user.createdAt).toLocaleString()}`, 10, 110);
  
  doc.save(`${user.role}_${user.idNumber}.pdf`);
};

export const generateKeyLogsPDF = (logs: KeyLog[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Key Management Logs", 10, 20);
  doc.setFontSize(10);
  
  let y = 40;
  logs.forEach((log, index) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${index + 1}. Role: ${log.userRole} | ID: ${log.userIdNumber} | Paski: ${log.paski} | Time: ${new Date(log.timestamp).toLocaleString()}`, 10, y);
    y += 10;
  });
  
  doc.save("key_management_logs.pdf");
};

export const generatePaski = (length: number = 12): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
