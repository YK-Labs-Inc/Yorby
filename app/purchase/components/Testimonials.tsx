import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

const testimonialKeys = [
  {
    name: "purchase.testimonials.0.name",
    title: "purchase.testimonials.0.title",
    company: "purchase.testimonials.0.company",
    quote: "purchase.testimonials.0.quote",
  },
  {
    name: "purchase.testimonials.1.name",
    title: "purchase.testimonials.1.title",
    company: "purchase.testimonials.1.company",
    quote: "purchase.testimonials.1.quote",
  },
  {
    name: "purchase.testimonials.2.name",
    title: "purchase.testimonials.2.title",
    company: "purchase.testimonials.2.company",
    quote: "purchase.testimonials.2.quote",
  },
  {
    name: "purchase.testimonials.3.name",
    title: "purchase.testimonials.3.title",
    company: "purchase.testimonials.3.company",
    quote: "purchase.testimonials.3.quote",
  },
];

export default function Testimonials() {
  const t = useTranslations();
  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-center mb-6">
        {t("purchase.testimonials.heading")}
      </h3>
      <div className="grid md:grid-cols-2 gap-8">
        {testimonialKeys.map((tk, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-lg">{t(tk.name)}</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                {t(tk.title)} @ {t(tk.company)}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  className="w-4 h-4 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <blockquote className="text-gray-700 dark:text-gray-200 italic">
              “{t(tk.quote)}”
            </blockquote>
          </div>
        ))}
      </div>
    </div>
  );
}
