-- Create custom_job_knowledge_base table
create table "public"."custom_job_knowledge_base" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "custom_job_id" uuid not null,
    "knowledge_base" text not null
);

-- Enable RLS
alter table "public"."custom_job_knowledge_base" enable row level security;

-- Add primary key
CREATE UNIQUE INDEX custom_job_knowledge_base_pkey ON public.custom_job_knowledge_base USING btree (id);
alter table "public"."custom_job_knowledge_base" add constraint "custom_job_knowledge_base_pkey" PRIMARY KEY using index "custom_job_knowledge_base_pkey";

-- Add unique constraint on custom_job_id (one knowledge base per job)
CREATE UNIQUE INDEX custom_job_knowledge_base_custom_job_id_key ON public.custom_job_knowledge_base USING btree (custom_job_id);
alter table "public"."custom_job_knowledge_base" add constraint "custom_job_knowledge_base_custom_job_id_key" UNIQUE using index "custom_job_knowledge_base_custom_job_id_key";

-- Add foreign key constraint
alter table "public"."custom_job_knowledge_base" add constraint "custom_job_knowledge_base_custom_job_id_fkey" FOREIGN KEY (custom_job_id) REFERENCES custom_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."custom_job_knowledge_base" validate constraint "custom_job_knowledge_base_custom_job_id_fkey";

-- Grant permissions to anon
grant delete on table "public"."custom_job_knowledge_base" to "anon";
grant insert on table "public"."custom_job_knowledge_base" to "anon";
grant references on table "public"."custom_job_knowledge_base" to "anon";
grant select on table "public"."custom_job_knowledge_base" to "anon";
grant trigger on table "public"."custom_job_knowledge_base" to "anon";
grant truncate on table "public"."custom_job_knowledge_base" to "anon";
grant update on table "public"."custom_job_knowledge_base" to "anon";

-- Grant permissions to authenticated
grant delete on table "public"."custom_job_knowledge_base" to "authenticated";
grant insert on table "public"."custom_job_knowledge_base" to "authenticated";
grant references on table "public"."custom_job_knowledge_base" to "authenticated";
grant select on table "public"."custom_job_knowledge_base" to "authenticated";
grant trigger on table "public"."custom_job_knowledge_base" to "authenticated";
grant truncate on table "public"."custom_job_knowledge_base" to "authenticated";
grant update on table "public"."custom_job_knowledge_base" to "authenticated";

-- Grant permissions to service_role
grant delete on table "public"."custom_job_knowledge_base" to "service_role";
grant insert on table "public"."custom_job_knowledge_base" to "service_role";
grant references on table "public"."custom_job_knowledge_base" to "service_role";
grant select on table "public"."custom_job_knowledge_base" to "service_role";
grant trigger on table "public"."custom_job_knowledge_base" to "service_role";
grant truncate on table "public"."custom_job_knowledge_base" to "service_role";
grant update on table "public"."custom_job_knowledge_base" to "service_role";

-- RLS Policies

-- Policy 1: Coaches can manage knowledge bases for their own custom jobs
CREATE POLICY "Coaches can manage knowledge bases for their custom jobs"
ON custom_job_knowledge_base
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM custom_jobs cj
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cj.id = custom_job_knowledge_base.custom_job_id
        AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM custom_jobs cj
        JOIN coaches c ON cj.coach_id = c.id
        WHERE cj.id = custom_job_knowledge_base.custom_job_id
        AND c.user_id = auth.uid()
    )
);

-- Policy 2: Enrolled students can read knowledge bases for jobs they're enrolled in
CREATE POLICY "Enrolled students can read knowledge bases"
ON custom_job_knowledge_base
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM custom_job_enrollments cje
        WHERE cje.custom_job_id = custom_job_knowledge_base.custom_job_id
        AND cje.user_id = auth.uid()
    )
);