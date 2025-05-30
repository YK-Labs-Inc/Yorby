"use client";

import { useTranslations } from "next-intl";

interface StudentActivityHeaderProps {
  name: string;
  role?: string;
  started: string;
}

const StudentActivityHeader = ({
  name,
  role,
  started,
}: StudentActivityHeaderProps) => {
  const t = useTranslations("coachAdminPortal.Header");
  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 gap-2 md:gap-0">
      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
        <div>
          <div className="text-xl font-semibold text-gray-900">{name}</div>
          <div className="text-sm text-gray-500 flex flex-row gap-2 items-center">
            {role && <span>{role}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center gap-6 mt-2 md:mt-0">
        <div className="flex items-center gap-1 text-gray-500">
          <div className="flex flex-col gap-0.5 items-start md:items-end">
            <div className="flex flex-row items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium text-gray-900 text-xs">
                {t("started")}
              </span>
            </div>
            <span className="ml-1 text-xs">{started}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentActivityHeader;
