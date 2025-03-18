import { createSupabaseServerClient } from "@/utils/supabase/server";
import { MetadataRoute } from "next";

const PAGE_SIZE = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://perfectinterview.ai";

  try {
    const allDemoJobs = await fetchAllDemoJobs();
    const allSampleResumes = await fetchAllSampleResumes();

    // Create sitemap entries
    const blogEntries = allDemoJobs.map((job) => ({
      url: `${baseUrl}/blog/${job.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const sampleResumesEntries = allSampleResumes.map((resume) => ({
      url: `${baseUrl}/en/sample-resumes/${resume.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Add other important pages
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
    ];

    return [...staticPages, ...blogEntries, ...sampleResumesEntries];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return [];
  }
}

const fetchAllDemoJobs = async () => {
  const supabase = await createSupabaseServerClient();

  // First, get the total count
  const { count, error: countError } = await supabase
    .from("demo_jobs")
    .select("*", { count: "exact", head: true });

  if (countError || !count) {
    console.error("Error getting count:", countError);
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
      console.error(`Error fetching page ${page + 1}:`, error);
      return [];
    }

    allDemoJobs.push(...demoJobs);
  }

  return allDemoJobs;
};

const fetchAllSampleResumes = async () => {
  const supabase = await createSupabaseServerClient();

  // First, get the total count
  const { count, error: countError } = await supabase
    .from("resume_metadata")
    .select("*", { count: "exact", head: true });

  if (countError || !count) {
    console.error("Error getting count:", countError);
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
      console.error(`Error fetching page ${page + 1}:`, error);
      return [];
    }

    allSampleResumes.push(...sampleResumes);
  }

  return allSampleResumes;
};
