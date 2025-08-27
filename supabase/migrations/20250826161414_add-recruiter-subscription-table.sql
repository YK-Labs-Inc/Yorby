
  create table "public"."recruiting_subscriptions" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "stripe_customer_id" text not null
      );


alter table "public"."recruiting_subscriptions" enable row level security;

CREATE UNIQUE INDEX recruiting_subscriptions_pkey ON public.recruiting_subscriptions USING btree (id);

CREATE UNIQUE INDEX recruiting_subscriptions_stripe_customer_id_key ON public.recruiting_subscriptions USING btree (stripe_customer_id);

alter table "public"."recruiting_subscriptions" add constraint "recruiting_subscriptions_pkey" PRIMARY KEY using index "recruiting_subscriptions_pkey";

alter table "public"."recruiting_subscriptions" add constraint "recruiting_subscriptions_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."recruiting_subscriptions" validate constraint "recruiting_subscriptions_id_fkey";

alter table "public"."recruiting_subscriptions" add constraint "recruiting_subscriptions_stripe_customer_id_key" UNIQUE using index "recruiting_subscriptions_stripe_customer_id_key";

grant delete on table "public"."recruiting_subscriptions" to "anon";

grant insert on table "public"."recruiting_subscriptions" to "anon";

grant references on table "public"."recruiting_subscriptions" to "anon";

grant select on table "public"."recruiting_subscriptions" to "anon";

grant trigger on table "public"."recruiting_subscriptions" to "anon";

grant truncate on table "public"."recruiting_subscriptions" to "anon";

grant update on table "public"."recruiting_subscriptions" to "anon";

grant delete on table "public"."recruiting_subscriptions" to "authenticated";

grant insert on table "public"."recruiting_subscriptions" to "authenticated";

grant references on table "public"."recruiting_subscriptions" to "authenticated";

grant select on table "public"."recruiting_subscriptions" to "authenticated";

grant trigger on table "public"."recruiting_subscriptions" to "authenticated";

grant truncate on table "public"."recruiting_subscriptions" to "authenticated";

grant update on table "public"."recruiting_subscriptions" to "authenticated";

grant delete on table "public"."recruiting_subscriptions" to "service_role";

grant insert on table "public"."recruiting_subscriptions" to "service_role";

grant references on table "public"."recruiting_subscriptions" to "service_role";

grant select on table "public"."recruiting_subscriptions" to "service_role";

grant trigger on table "public"."recruiting_subscriptions" to "service_role";

grant truncate on table "public"."recruiting_subscriptions" to "service_role";

grant update on table "public"."recruiting_subscriptions" to "service_role";


  create policy "Enable all for users based on user_id"
  on "public"."recruiting_subscriptions"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));



