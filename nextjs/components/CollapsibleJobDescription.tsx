"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleJobDescriptionProps {
  description: string;
  truncateLength?: number;
}

export function CollapsibleJobDescription({
  description,
  truncateLength = 100,
}: CollapsibleJobDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shouldTruncate = description.length > truncateLength;
  const truncatedDescription = shouldTruncate 
    ? description.slice(0, truncateLength) + "..."
    : description;

  if (!shouldTruncate) {
    return (
      <div className="text-gray-700 whitespace-pre-wrap">{description}</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-gray-700 whitespace-pre-wrap">
        {isOpen ? description : truncatedDescription}
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        {isOpen ? "Show less" : "Show more"}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
