"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Student } from "./page";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const StudentListEntry = ({ student }: { student: Student }) => {
  const router = useRouter();
  
  const formatLastSignIn = (lastSignInAt: string | null | undefined) => {
    if (!lastSignInAt) return "Never";
    
    try {
      const date = new Date(lastSignInAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };
  
  return (
    <TableRow
      className="hover:cursor-pointer hover:bg-gray-50"
      key={student.id}
      onClick={() =>
        router.push(`/dashboard/coach-admin/students/${student.id}`)
      }
    >
      <TableCell>{student.email}</TableCell>
      <TableCell>{student.full_name}</TableCell>
      <TableCell>{formatLastSignIn(student.last_sign_in_at)}</TableCell>
    </TableRow>
  );
};

export default StudentListEntry;
