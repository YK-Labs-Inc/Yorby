import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Tables } from "@/utils/supabase/database.types";

const PAGE_SIZE = 500;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // First, get the total count
    const { count, error: countError } = await supabase
      .from("demo_jobs")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting count:", countError);
      return NextResponse.json(
        { error: "Failed to fetch demo jobs" },
        { status: 500 }
      );
    }

    if (!count) {
      return NextResponse.json({ data: [] });
    }

    // Calculate number of pages needed
    const totalPages = Math.ceil(count / PAGE_SIZE);
    const allDemoJobs: Tables<"demo_jobs">[] = [];

    // Fetch all pages
    for (let page = 0; page < totalPages; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: demoJobs, error } = await supabase
        .from("demo_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error(`Error fetching page ${page + 1}:`, error);
        return NextResponse.json(
          { error: "Failed to fetch demo jobs" },
          { status: 500 }
        );
      }

      allDemoJobs.push(...demoJobs);
    }

    return NextResponse.json({
      data: allDemoJobs,
      totalCount: count,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
