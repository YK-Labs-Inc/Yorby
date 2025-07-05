import { createSupabaseServerClient } from "@/utils/supabase/server";
import { MetadataRoute } from "next";
import { Logger } from "next-axiom";

const PAGE_SIZE = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const logger = new Logger().with({
    function: "sitemap",
  });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    "https://perfectinterview.ai";

  try {
    const allDemoJobs = await fetchAllDemoJobs();
    const allSampleResumes = await fetchAllSampleResumes();

    // Create sitemap entries
    const blogEntries: MetadataRoute.Sitemap = allDemoJobs.map((job) => ({
      url: `${baseUrl}/blog/${job.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const sampleResumesEntries: MetadataRoute.Sitemap = allSampleResumes.map(
      (resume) => ({
        url: `${baseUrl}/sample-resumes/${resume.slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );

    // Add other important pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/sample-resumes`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 0.8,
      },
    ];

    return [...staticPages, ...blogEntries, ...sampleResumesEntries];
  } catch (error) {
    logger.error("Error generating sitemap", { error });
    await logger.flush();
    return [];
  }
}

const fetchAllDemoJobs = async () => {
  const logger = new Logger().with({
    function: "fetchAllDemoJobs",
  });
  const supabase = await createSupabaseServerClient();

  // First, get the total count
  const { count, error: countError } = await supabase
    .from("demo_jobs")
    .select("*", { count: "exact", head: true });

  if (countError || !count) {
    logger.error("Error getting count", { error: countError });
    await logger.flush();
    return [];
  }

  // Calculate number of pages needed
  const totalPages = Math.ceil(count / PAGE_SIZE);
  const allDemoJobs = [];

  // Fetch all pages
  for (let page = 0; page < totalPages; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: demoJobs, error } = await supabase
      .from("demo_jobs")
      .select("id, slug")
      .range(from, to);

    if (error) {
      logger.error(`Error fetching page ${page + 1}`, { error });
      await logger.flush();
      return [];
    }

    allDemoJobs.push(...demoJobs);
  }

  return allDemoJobs;
};

const fetchAllSampleResumes = async () => {
  const logger = new Logger().with({
    function: "fetchAllSampleResumes",
  });
  const supabase = await createSupabaseServerClient();

  // First, get the total count
  const { count, error: countError } = await supabase
    .from("resume_metadata")
    .select("*", { count: "exact", head: true });

  if (countError || !count) {
    logger.error("Error getting count", { error: countError });
    await logger.flush();
    return [];
  }

  // Calculate number of pages needed
  const totalPages = Math.ceil(count / PAGE_SIZE);
  const allSampleResumes = [];

  // Fetch all pages
  for (let page = 0; page < totalPages; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: sampleResumes, error } = await supabase
      .from("resume_metadata")
      .select("slug")
      .range(from, to);

    if (error) {
      logger.error(`Error fetching page ${page + 1}`, { error });
      await logger.flush();
      return [];
    }

    allSampleResumes.push(...sampleResumes);
  }

  return allSampleResumes;
};
