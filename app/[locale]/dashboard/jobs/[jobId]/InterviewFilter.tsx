"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface InterviewFilterProps {
  jobId: string;
  currentFilter: "all" | "complete" | "in_progress" | null;
}

export default function InterviewFilter({
  jobId,
  currentFilter,
}: InterviewFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") as string | null;

  const handleValueChange = (value: string) => {
    router.push(
      `/dashboard/jobs/${jobId}?filter=${value}${view ? `&view=${view}` : ""}`
    );
  };

  return (
    <Select
      defaultValue={currentFilter || "all"}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter interviews" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="complete">Completed</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
      </SelectContent>
    </Select>
  );
}
