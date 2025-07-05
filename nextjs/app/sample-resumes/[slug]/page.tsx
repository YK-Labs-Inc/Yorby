import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ResumeDataType } from "../../dashboard/resumes/components/ResumeBuilder";
import SampleResume from "./SampleResume";
import ScrollProgressBar from "@/app/components/ScrollProgressBar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

type ResumeMetadata = {
  id: string;
  slug: string;
  resumes: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    resume_sections: any[];
    created_at: string;
    updated_at: string;
    user_id: string;
    title: string;
    summary: string | null;
  };
  important_skills?: string[];
  important_work_experience?: string[];
};

export default async function SamplesResumesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase
    .from("resume_metadata")
    .select(
      `*,
      resumes(
        *, 
        resume_sections(
          *, 
          resume_list_items(*), 
          resume_detail_items(
            *,
            resume_item_descriptions(*)
          )
        )
      )
      `
    )
    .eq("slug", slug)
    .single()) as { data: ResumeMetadata | null; error: any };

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.resumes) {
    notFound();
  }

  const resume = data.resumes;

  const resumeData: ResumeDataType = {
    id: resume.id,
    name: resume.name || "Sample Resume",
    email: resume.email || "sample@example.com",
    phone: resume.phone || "(123) 456-7890",
    location: resume.location || "San Francisco, CA",
    resume_sections: resume.resume_sections.sort((a, b) => {
      if (a.title.toLowerCase().includes("education")) return -1;
      if (b.title.toLowerCase().includes("education")) return 1;
      return a.display_order - b.display_order;
    }),
    created_at: resume.created_at,
    updated_at: resume.updated_at,
    user_id: resume.user_id,
    title: resume.title || "Sample Resume",
    summary: resume.summary,
    locked_status: "locked",
  };

  const title = `${resumeData.title} Sample Resume`;
  const description = `Here is a sample resume for the ${resumeData.title} job. Feel free to use it as a template to create your own professional resume.`;

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-16">
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

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    How To Format Your Resume
                  </h2>
                  <nav className="space-y-1">
                    {[
                      ...(data.important_skills?.length
                        ? [
                            {
                              title: "Important Skills",
                              id: "important-skills",
                            },
                          ]
                        : []),
                      ...(data.important_work_experience?.length
                        ? [
                            {
                              title: "Important Work Experience",
                              id: "important-work-experience",
                            },
                          ]
                        : []),
                      {
                        title: "How To Format A Resume",
                        id: "format",
                      },
                      {
                        title: "Resume Length Guidelines",
                        id: "length",
                      },
                      {
                        title: "Work Experience Format",
                        id: "work-experience",
                      },
                      {
                        title: "Skills Section Format",
                        id: "skills",
                      },
                    ].map((section, index) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="group flex items-center py-2 px-3 text-sm text-gray-600 hover:bg-gray-50 rounded-md hover:text-gray-900 transition-all duration-150"
                      >
                        <span className="mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="line-clamp-2">{section.title}</span>
                      </a>
                    ))}
                  </nav>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <Link href="/chat-to-resume?utm_source=sample_resumes_sidebar">
                      <Button
                        size="lg"
                        className="w-full bg-black hover:bg-gray-900"
                      >
                        Create Your Resume
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm w-full">
                <SampleResume resumeData={resumeData} resumeId={resume.id} />
              </div>
              {/* Bottom CTA Section */}
              <div className="mt-20 py-16 border-t border-gray-100">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                    Ready To Create Your Own Resume?
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Use Perfect Interview to help you create a professional
                    resume that gets you hired.
                  </p>
                  <Link href="/chat-to-resume?utm_source=sample_resumes_bottom">
                    <Button size="lg" className="bg-black hover:bg-gray-900">
                      Create Your Resume
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Resume Analysis Section */}
              <div className="space-y-12">
                {/* Important Skills Section */}
                {(data.important_skills?.length ?? 0) > 0 && (
                  <section
                    id="important-skills"
                    className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                  >
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      Important Skills for {resumeData.title}
                    </h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      {(data.important_skills ?? []).map(
                        (skill: string, idx: number) => (
                          <li key={idx}>{skill}</li>
                        )
                      )}
                    </ul>
                  </section>
                )}

                {/* Important Work Experience Section */}
                {(data.important_work_experience?.length ?? 0) > 0 && (
                  <section
                    id="important-work-experience"
                    className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                  >
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      Important Work Experience for {resumeData.title}
                    </h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      {(data.important_work_experience ?? []).map(
                        (exp: string, idx: number) => (
                          <li key={idx}>{exp}</li>
                        )
                      )}
                    </ul>
                  </section>
                )}
                {/* Clean, Simple Formatting */}
                <section
                  id="format"
                  className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                >
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    How To Format A {resumeData.title} Resume
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    This resume uses a clear, professional layout that's easy to
                    scan. It may seem a bit boring, but that's totally fine. At
                    the end of the day it is not how your resume looks that will
                    get you the job, but rather the content of your resume that
                    will.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    The resume is easy to read and understand, and it is
                    designed to be scanned quickly by the recruiter. The
                    information is formatted in a way that is easy to read and
                    understand, and everything is formatted in reverse
                    chronological order, showcasing the most recent experience
                    first.
                  </p>
                </section>

                <section
                  id="length"
                  className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                >
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    How Long Should A {resumeData.title} Resume Be?
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    In general, a resume should be maximum 1 page long. This is
                    for any job, including a {resumeData.title} job.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Remember, like we mentioned earlier, recruiters only look at
                    your resume for a few seconds before making a decision, so
                    avoid making it overly long as it will just be skipped over.
                  </p>
                </section>

                {/* Relevant Work Experience With Impact */}
                <section
                  id="work-experience"
                  className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                >
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    How Should You Format Your Work Experience In Your{" "}
                    {resumeData.title} Resume?
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    When writing down your previous work experience, the most
                    important you can do is to demonstrate the impact of your
                    work.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    It's one thing to just talk about what you did at your
                    previous jobs, but it's another to show the impact of your
                    work. For example, if you were able to save the company
                    money, or increase sales, or improve customer satisfaction,
                    you should mention that. And, for some extra bonus points,
                    if you can attach a number to the impact of your work (e.g.
                    saved the company $50,000/year), that's even better.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    In general, try to follow the format of "I did X which led
                    to Y, causing Z impact."
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    An example of this would be:
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    "I implemented a new system that reduced the time it took to
                    process orders by 20%, saving the company 2 hours per day."
                  </p>
                </section>

                {/* Relevant Skills */}
                <section
                  id="skills"
                  className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
                >
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    How Should You Format Your Skills In Your {resumeData.title}
                    Resume?
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Another important section to include in your resume is the
                    relevant skills you have for the role.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    In the case of the {resumeData.title} job, you can see the
                    dedicated skills section and you can also see that it
                    includes both soft skills as well as hard skills.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    The skills are listed out in a bulleted list with the
                    beginning having some type of category for those skills.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    For example, in the skill section, one of the skills is{" "}
                    <span className="font-bold">
                      {
                        resumeData.resume_sections.find(
                          (section) => section.title === "Skills"
                        )?.resume_list_items[0].content
                      }
                    </span>
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    The category for this skill is{" "}
                    <span className="font-bold">
                      {
                        resumeData.resume_sections
                          .find((section) => section.title === "Skills")
                          ?.resume_list_items[0].content.split(":")[0]
                      }
                    </span>
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    And then the skills for that relevant category is{" "}
                    <span className="font-bold">
                      {
                        resumeData.resume_sections
                          .find((section) => section.title === "Skills")
                          ?.resume_list_items[0].content.split(":")[1]
                      }
                    </span>
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    This is a great way to show that you have the skills needed
                    for the role and that is really all you need to do in terms
                    of the formatting — it's one of the easiest sections to
                    format that also has some of the highest impact on your
                    resume.
                  </p>
                </section>
              </div>

              {/* Mobile CTA Section */}
              <div className="mt-16 pt-8 border-t lg:hidden">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Ready To Create Your Own Resume?
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Use Perfect Interview to help you create a professional
                    resume that gets you hired.
                  </p>
                  <Link href="/chat-to-resume?utm_source=sample_resumes_mobile">
                    <Button size="lg" className="bg-black hover:bg-gray-900">
                      Create Your Resume
                    </Button>
                  </Link>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase
    .from("resume_metadata")
    .select(
      `*,
      resumes(
        title
      )
      `
    )
    .eq("slug", slug)
    .single()) as { data: ResumeMetadata | null; error: any };

  if (error || !data?.resumes) {
    return {
      title: "Not Found",
      description: "The page you're looking for doesn't exist.",
    };
  }

  const title = `${data.resumes.title} Sample Resume`;
  const description = `View a sample ${data.resumes.title} resume to help you create your own professional resume.`;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://perfectinterview.ai";
  const ogImageUrl = `${baseUrl}/api/og/sample-resume?title=${encodeURIComponent(title)}&jobTitle=${encodeURIComponent(data.resumes.title)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
