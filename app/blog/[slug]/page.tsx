import { createSupabaseServerClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Tables } from "@/utils/supabase/database.types";
import ScrollProgressBar from "../../components/ScrollProgressBar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://perfectinterview.ai";
  const posts = await fetch(`${baseUrl}/api/demo-jobs`).then((res) =>
    res.json()
  );

  return posts.data.map((post: Tables<"demo_jobs">) => ({
    slug: post.slug,
  }));
}

type DemoJobWithQuestions = Tables<"demo_jobs"> & {
  demo_job_questions: Tables<"demo_job_questions">[];
};

async function getDemoJobBySlug(
  slug: string
): Promise<DemoJobWithQuestions | null> {
  const supabase = await createSupabaseServerClient();
  const { data: demoJob, error } = await supabase
    .from("demo_jobs")
    .select(
      `
      *,
      demo_job_questions (
        id,
        question,
        answer_guidelines,
        good_answers
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !demoJob) {
    return null;
  }

  return demoJob as DemoJobWithQuestions;
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const demoJob = await getDemoJobBySlug(slug);

  if (!demoJob) {
    notFound();
  }

  const title = demoJob.company_name
    ? `${demoJob.company_name} ${demoJob.job_title} Practice Interview Questions`
    : `${demoJob.job_title} Practice Interview Questions`;

  const description = demoJob.company_name
    ? `Here are some practice interview questions for ${demoJob.job_title} job interview at ${demoJob.company_name}.`
    : `Here are some practice interview questions for ${demoJob.job_title} job interview.`;

  return (
    <div className="min-h-screen bg-white">
      <ScrollProgressBar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-gray-50 to-white border-b overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-900/[0.02] -z-1" />
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              {title}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Table of Contents
                </h2>
                <nav className="space-y-1">
                  {demoJob.demo_job_questions
                    ?.slice(0, 3)
                    .map((question, index) => (
                      <a
                        key={question.id}
                        href={`#question-${index + 1}`}
                        className="group flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-gray-50 rounded-md hover:text-gray-900 transition-all duration-150"
                      >
                        <span className="mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="line-clamp-2">
                          Practice Question {index + 1}
                        </span>
                      </a>
                    ))}
                </nav>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Link
                    href={`/clone-demo-job/${demoJob.id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-black shadow-sm transition-all duration-150 text-center"
                  >
                    Practice These Interview Questions
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="mt-8 lg:mt-0">
            <div className="space-y-20">
              {demoJob.demo_job_questions
                ?.slice(0, 3)
                .map((question, index) => (
                  <article
                    key={question.id}
                    id={`question-${index + 1}`}
                    className="prose prose-gray max-w-none scroll-mt-8 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                  >
                    <div className="flex items-start gap-4 mb-8">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mt-0">
                        {question.question}
                      </h2>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 text-gray-900 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Answer Guidelines
                      </h3>
                      <p className="text-gray-600 leading-relaxed m-0">
                        {question.answer_guidelines}
                      </p>
                    </div>

                    {question.good_answers &&
                      question.good_answers.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                            <svg
                              className="w-5 h-5 text-gray-900 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Examples of Good Answers
                          </h3>
                          <div className="space-y-4">
                            {question.good_answers.map((answer, idx) => (
                              <div
                                key={idx}
                                className="bg-white border border-gray-200 rounded-lg p-6 relative pl-12 hover:shadow-md transition-shadow duration-200"
                              >
                                <span className="absolute left-4 top-6 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                                  {idx + 1}
                                </span>
                                <p className="text-gray-600 leading-relaxed m-0">
                                  {answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </article>
                ))}
            </div>

            {/* Bottom CTA Section */}
            <div className="mt-20 py-16 border-t border-gray-100">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                  Ready to ace your next interview?
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Use Perfect Interview to help you crush your next interview
                  and get the job offer.
                </p>
                <Link href="/?utm_source=blog">
                  <Button size="lg" className="bg-black hover:bg-gray-900">
                    Try Perfect Interview
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile CTA Section */}
            <div className="mt-16 pt-8 border-t lg:hidden">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Ready to Practice?
                </h2>
                <p className="text-gray-600 mb-6">
                  Try our AI-powered mock interviews for instant feedback on
                  your answers.
                </p>
                <Link href={`/clone-demo-job/${demoJob.id}`}>
                  <Button size="lg" className="bg-black hover:bg-gray-900">
                    Start Practice Interview
                  </Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const demoJob = await getDemoJobBySlug(params.slug);

  if (!demoJob) {
    return {
      title: "Not Found",
      description: "The page you're looking for doesn't exist.",
    };
  }

  const title = demoJob.company_name
    ? `${demoJob.company_name} ${demoJob.job_title} Practice Interview Questions`
    : `${demoJob.job_title} Practice Interview Questions`;

  const description = demoJob.company_name
    ? `Prepare for your ${demoJob.job_title} interview at ${demoJob.company_name} with our practice questions and example answers.`
    : `Prepare for your ${demoJob.job_title} interview with our practice questions and example answers.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
