"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Student } from "./page";
import { useRouter } from "next/navigation";

const StudentListEntry = ({ student }: { student: Student }) => {
  const router = useRouter();
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
    </TableRow>
  );
};

export default StudentListEntry;
