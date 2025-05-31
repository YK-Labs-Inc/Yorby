"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LockedJobComponent from "./LockedJobComponent";
import { CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMultiTenant } from "@/app/context/MultiTenantContext";

interface Question {
  id: string;
  question: string;
  custom_job_question_submissions: any[];
  question_type: "ai_generated" | "user_generated";
  created_at: string;
}

interface PracticeQuestionsProps {
  jobId: string;
  questions: Question[];
  isLocked: boolean;
  userCredits: number;
  currentPage: number;
  numFreeQuestions?: number;
  sortOrder: "asc" | "desc";
  showAnswered: boolean;
  showUnanswered: boolean;
  showAIGenerated: boolean;
  showUserGenerated: boolean;
  onToggleAnswered?: () => void;
  onToggleUnanswered?: () => void;
  onToggleAIGenerated?: () => void;
  onToggleUserGenerated?: () => void;
  onSortOrderChange?: (value: "asc" | "desc") => void;
  isMultiTenantExperience: boolean;
}

export default function PracticeQuestions({
  jobId,
  questions,
  isLocked,
  userCredits,
  currentPage,
  numFreeQuestions = 1,
  sortOrder,
  showAnswered,
  showUnanswered,
  showAIGenerated,
  showUserGenerated,
  onToggleAnswered,
  onToggleUnanswered,
  onToggleAIGenerated,
  onToggleUserGenerated,
  onSortOrderChange,
  isMultiTenantExperience,
}: PracticeQuestionsProps) {
  // Local state for dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localAnswered, setLocalAnswered] = useState(showAnswered);
  const [localUnanswered, setLocalUnanswered] = useState(showUnanswered);
  const [localAIGenerated, setLocalAIGenerated] = useState(showAIGenerated);
  const [localUserGenerated, setLocalUserGenerated] =
    useState(showUserGenerated);
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { baseUrl } = useMultiTenant();

  const t = useTranslations("practiceQuestions.filters");

  // Sync local state with props when filters change externally
  useEffect(() => {
    setLocalAnswered(showAnswered);
    setLocalUnanswered(showUnanswered);
    setLocalAIGenerated(showAIGenerated);
    setLocalUserGenerated(showUserGenerated);
    setLocalSortOrder(sortOrder);
  }, [
    showAnswered,
    showUnanswered,
    showAIGenerated,
    showUserGenerated,
    sortOrder,
  ]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleApply = () => {
    if (localAnswered !== showAnswered) onToggleAnswered?.();
    if (localUnanswered !== showUnanswered) onToggleUnanswered?.();
    if (localAIGenerated !== showAIGenerated) onToggleAIGenerated?.();
    if (localUserGenerated !== showUserGenerated) onToggleUserGenerated?.();
    if (localSortOrder !== sortOrder) onSortOrderChange?.(localSortOrder);
    setDropdownOpen(false);
  };

  // Filter logic
  let filteredQuestions = questions;
  if (!showAnswered || !showUnanswered) {
    filteredQuestions = filteredQuestions.filter((q) => {
      const answered = q.custom_job_question_submissions?.length > 0;
      return (showAnswered && answered) || (showUnanswered && !answered);
    });
  }
  if (!showAIGenerated || !showUserGenerated) {
    filteredQuestions = filteredQuestions.filter((q) => {
      return (
        (showAIGenerated && q.question_type === "ai_generated") ||
        (showUserGenerated && q.question_type === "user_generated")
      );
    });
  }
  // Sort logic
  filteredQuestions = filteredQuestions.sort((a, b) => {
    if (sortOrder === "asc") {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  // Pagination logic should use filteredQuestions:
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  const freeQuestions = isLocked
    ? filteredQuestions.slice(0, numFreeQuestions)
    : [];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Filter Dropdown */}
      <div className="flex justify-start mb-2">
        <div className="relative" ref={dropdownRef}>
          <button
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded shadow border text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setDropdownOpen((open) => !open)}
            type="button"
          >
            {t("button")}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 p-4 flex flex-col gap-2">
              <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {t("title")}
              </div>
              <div className="flex flex-col gap-1 mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localAnswered}
                    onChange={() => setLocalAnswered((v) => !v)}
                  />
                  <span>{t("answered")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localUnanswered}
                    onChange={() => setLocalUnanswered((v) => !v)}
                  />
                  <span>{t("unanswered")}</span>
                </label>
                {!isMultiTenantExperience && (
                  <>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localAIGenerated}
                        onChange={() => setLocalAIGenerated((v) => !v)}
                      />
                      <span>{t("aiGenerated")}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localUserGenerated}
                        onChange={() => setLocalUserGenerated((v) => !v)}
                      />
                      <span>{t("userGenerated")}</span>
                    </label>
                  </>
                )}
              </div>
              {!isMultiTenantExperience && (
                <>
                  <div className="font-semibold text-gray-800 dark:text-gray-100 mt-2 mb-1">
                    {t("sortBy")}
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={localSortOrder === "desc"}
                      onChange={() => setLocalSortOrder("desc")}
                    />
                    <span>{t("newestFirst")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={localSortOrder === "asc"}
                      onChange={() => setLocalSortOrder("asc")}
                    />
                    <span>{t("oldestFirst")}</span>
                  </label>
                </>
              )}
              <button
                className="mt-4 w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded hover:bg-primary/90"
                onClick={handleApply}
                type="button"
              >
                {t("apply")}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Empty state or questions list */}
      {filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {t("emptyState.title")}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            {t("emptyState.description")}
          </div>
        </div>
      ) : (
        <>
          {isLocked ? (
            <>
              {freeQuestions.map((question, index) => (
                <Link
                  key={question.id}
                  href={`/dashboard/jobs/${jobId}/questions/${question.id}`}
                  className={`rounded p-4 transition-colors flex items-center gap-3
                    ${
                      index % 2 === 0
                        ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/20 dark:hover:bg-gray-800/30"
                        : "bg-white hover:bg-gray-100 dark:bg-gray-800/10 dark:hover:bg-gray-800/20"
                    }`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">
                    {question.question}
                  </span>
                  {question.custom_job_question_submissions?.length > 0 && (
                    <CheckCircle className="ml-auto h-5 w-5 text-green-500 dark:text-green-400" />
                  )}
                </Link>
              ))}
              <LockedJobComponent
                jobId={jobId}
                userCredits={userCredits}
                view="practice"
              />
            </>
          ) : (
            <>
              {currentQuestions.map((question, index) => (
                <Link
                  key={question.id}
                  href={`${pathname}/questions/${question.id}`}
                  className={`rounded p-4 transition-colors flex items-center gap-3
                    ${
                      index % 2 === 0
                        ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/20 dark:hover:bg-gray-800/30"
                        : "bg-white hover:bg-gray-100 dark:bg-gray-800/10 dark:hover:bg-gray-800/20"
                    }`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {(startIndex + index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">
                    {question.question}
                  </span>
                  {question.custom_job_question_submissions?.length > 0 && (
                    <CheckCircle className="ml-auto h-5 w-5 text-green-500 dark:text-green-400" />
                  )}
                </Link>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Link
                        key={page}
                        href={`${baseUrl}/${jobId}?view=practice&page=${page}`}
                        className={`px-4 py-2 rounded ${
                          currentPage === page
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/20 dark:hover:bg-gray-800/30"
                        }`}
                      >
                        {page}
                      </Link>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
