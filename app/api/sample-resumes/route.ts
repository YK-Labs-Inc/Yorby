import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("resumes")
      .select("*, resume_metadata(*)")
      .eq("user_id", "7823eb9a-62fc-4bbf-bd58-488f117c24e8");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch sample resumes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
