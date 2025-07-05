"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Program {
  id: string;
  job_title: string;
  questionsCount: number;
  mockInterviewsCount: number;
}

interface JobSelectorProps {
  programs: Program[];
  selectedProgram?: Program;
  onSelect: (jobId: string) => void;
}

export default function JobSelector({
  programs,
  selectedProgram,
  onSelect,
}: JobSelectorProps) {
  return (
    <Select
      value={selectedProgram?.id}
      onValueChange={onSelect}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a program">
          {selectedProgram?.job_title || "Select a program"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {programs.map((program) => (
          <SelectItem key={program.id} value={program.id}>
            <div className="flex items-center justify-between w-full">
              <span className="truncate mr-2">{program.job_title}</span>
              <span className="text-xs text-gray-500">
                {program.questionsCount} questions
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}