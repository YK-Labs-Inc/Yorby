"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  id: number;
  isOpen: boolean;
}

export default function FAQ() {
  const t = useTranslations("faq");
  const [openItems, setOpenItems] = useState<FAQItem[]>([]);

  const toggleItem = (id: number) => {
    if (openItems.find((item) => item.id === id)) {
      setOpenItems(openItems.filter((item) => item.id !== id));
    } else {
      setOpenItems([...openItems, { id, isOpen: true }]);
    }
  };

  const isItemOpen = (id: number) => openItems.some((item) => item.id === id);

  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
        {t("title")}
      </h2>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((id) => (
          <div
            key={id}
            className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
              onClick={() => toggleItem(id)}
            >
              <span className="font-medium text-lg">{t(`q${id}`)}</span>
              <ChevronDown
                className={`w-5 h-5 transition-transform text-gray-500 dark:text-gray-400 ${
                  isItemOpen(id) ? "transform rotate-180" : ""
                }`}
              />
            </button>
            {isItemOpen(id) && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                <p className="text-gray-600 dark:text-gray-300">
                  {t(`a${id}`)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
