"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

export async function getCoachId(userId: string) {
    const logger = new Logger().with({ function: "getCoachId", userId });
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        logger.error("Error fetching coach ID:", error);
        await logger.flush();
        return null;
    }

    await logger.flush();

    return data.id;
}
