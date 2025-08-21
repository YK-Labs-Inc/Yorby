-- Create the candidate_job_alignment_details table
create table "public"."candidate_job_alignment_details" (
    "id" uuid not null default gen_random_uuid(),
    "candidate_id" uuid not null,
    "alignment_score" integer not null,
    "matched_requirements" text[] null,
    "missing_requirements" text[] null,
    "exceeded_requirements" text[] null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Add primary key constraint
alter table "public"."candidate_job_alignment_details" 
    add constraint "candidate_job_alignment_details_pkey" primary key ("id");

-- Add check constraint for alignment_score
alter table "public"."candidate_job_alignment_details"
    add constraint "candidate_job_alignment_details_alignment_score_check" 
    check (alignment_score >= 0 and alignment_score <= 100);

-- Add unique constraint for candidate_id
alter table "public"."candidate_job_alignment_details" 
    add constraint "candidate_job_alignment_details_candidate_id_key" unique ("candidate_id");

-- Add foreign key constraint to company_job_candidates
alter table "public"."candidate_job_alignment_details" 
    add constraint "candidate_job_alignment_details_candidate_id_fkey" 
    foreign key ("candidate_id") 
    references "public"."company_job_candidates"("id") 
    on delete cascade;

-- Create index for candidate_id
create index "idx_candidate_job_alignment_candidate" 
    on "public"."candidate_job_alignment_details" ("candidate_id");

-- Grant permissions to authenticated users
grant select on table "public"."candidate_job_alignment_details" to authenticated;
grant insert on table "public"."candidate_job_alignment_details" to authenticated;
grant update on table "public"."candidate_job_alignment_details" to authenticated;
grant delete on table "public"."candidate_job_alignment_details" to authenticated;

-- Grant permissions to anon users
grant select on table "public"."candidate_job_alignment_details" to anon;
grant insert on table "public"."candidate_job_alignment_details" to anon;
grant update on table "public"."candidate_job_alignment_details" to anon;
grant delete on table "public"."candidate_job_alignment_details" to anon;

-- Grant permissions to service_role
grant select on table "public"."candidate_job_alignment_details" to service_role;
grant insert on table "public"."candidate_job_alignment_details" to service_role;
grant update on table "public"."candidate_job_alignment_details" to service_role;
grant delete on table "public"."candidate_job_alignment_details" to service_role;

-- Create RLS policies

-- Enable RLS
alter table "public"."candidate_job_alignment_details" enable row level security;

-- Policy for company members to view candidate job alignment details
create policy "Company members can view candidate_job_alignment_details"
    on "public"."candidate_job_alignment_details"
    as permissive
    for select
    to authenticated
    using (
        exists (
            select 1
            from company_job_candidates cjc
            join company_members cm on cjc.company_id = cm.company_id
            where cjc.id = candidate_job_alignment_details.candidate_id
            and cm.user_id = auth.uid()
        )
    );

-- Policy for service role to manage candidate job alignment details
create policy "Service role can manage candidate_job_alignment_details"
    on "public"."candidate_job_alignment_details"
    as permissive
    for all
    to service_role
    using (true)
    with check (true);

-- Policy for users to manage their own candidate job alignment details
create policy "user_all_access"
    on "public"."candidate_job_alignment_details"
    as permissive
    for all
    to authenticated
    using (
        exists (
            select 1
            from company_job_candidates
            where company_job_candidates.id = candidate_job_alignment_details.candidate_id
            and company_job_candidates.candidate_user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from company_job_candidates
            where company_job_candidates.id = candidate_job_alignment_details.candidate_id
            and company_job_candidates.candidate_user_id = auth.uid()
        )
    );