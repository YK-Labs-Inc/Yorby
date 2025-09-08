drop policy "All company members ALL access" on "public"."recruiting_subscriptions";


  create table "public"."recruiting_subscriptions_metered_usage" (
    "company_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "count" numeric not null
      );


alter table "public"."recruiting_subscriptions_metered_usage" enable row level security;

CREATE UNIQUE INDEX recruiting_subscriptions_metered_usage_pkey ON public.recruiting_subscriptions_metered_usage USING btree (company_id);

alter table "public"."recruiting_subscriptions_metered_usage" add constraint "recruiting_subscriptions_metered_usage_pkey" PRIMARY KEY using index "recruiting_subscriptions_metered_usage_pkey";

alter table "public"."recruiting_subscriptions_metered_usage" add constraint "recruiting_subscriptions_metered_usage_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."recruiting_subscriptions_metered_usage" validate constraint "recruiting_subscriptions_metered_usage_company_id_fkey";

grant delete on table "public"."recruiting_subscriptions_metered_usage" to "anon";

grant insert on table "public"."recruiting_subscriptions_metered_usage" to "anon";

grant references on table "public"."recruiting_subscriptions_metered_usage" to "anon";

grant select on table "public"."recruiting_subscriptions_metered_usage" to "anon";

grant trigger on table "public"."recruiting_subscriptions_metered_usage" to "anon";

grant truncate on table "public"."recruiting_subscriptions_metered_usage" to "anon";

grant update on table "public"."recruiting_subscriptions_metered_usage" to "anon";

grant delete on table "public"."recruiting_subscriptions_metered_usage" to "authenticated";

grant insert on table "public"."recruiting_subscriptions_metered_usage" to "authenticated";

grant references on table "public"."recruiting_subscriptions_metered_usage" to "authenticated";

grant select on table "public"."recruiting_subscriptions_metered_usage" to "authenticated";

grant trigger on table "public"."recruiting_subscriptions_metered_usage" to "authenticated";

grant truncate on table "public"."recruiting_subscriptions_metered_usage" to "authenticated";

grant update on table "public"."recruiting_subscriptions_metered_usage" to "authenticated";

grant delete on table "public"."recruiting_subscriptions_metered_usage" to "service_role";

grant insert on table "public"."recruiting_subscriptions_metered_usage" to "service_role";

grant references on table "public"."recruiting_subscriptions_metered_usage" to "service_role";

grant select on table "public"."recruiting_subscriptions_metered_usage" to "service_role";

grant trigger on table "public"."recruiting_subscriptions_metered_usage" to "service_role";

grant truncate on table "public"."recruiting_subscriptions_metered_usage" to "service_role";

grant update on table "public"."recruiting_subscriptions_metered_usage" to "service_role";


