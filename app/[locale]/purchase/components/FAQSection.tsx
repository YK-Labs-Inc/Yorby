"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

const faqKeys = [
  {
    q: "purchase.faq.0.q",
    a: "purchase.faq.0.a",
  },
  {
    q: "purchase.faq.1.q",
    a: "purchase.faq.1.a",
  },
  {
    q: "purchase.faq.2.q",
    a: "purchase.faq.2.a",
  },
  {
    q: "purchase.faq.3.q",
    a: "purchase.faq.3.a",
  },
  {
    q: "purchase.faq.4.q",
    a: "purchase.faq.4.a",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const t = useTranslations();
  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold text-center mb-6">
        {t("purchase.faq.heading")}
      </h3>
      <div className="space-y-4">
        {faqKeys.map((faq, i) => (
          <div
            key={i}
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          >
            <button
              className="w-full flex justify-between items-center px-4 py-3 text-left font-medium text-gray-800 dark:text-gray-100 focus:outline-none"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{t(faq.q)}</span>
              <span
                className={`ml-2 transition-transform ${open === i ? "rotate-180" : "rotate-0"}`}
              >
                ▼
              </span>
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-gray-600 dark:text-gray-300 text-sm">
                {t(faq.a)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
