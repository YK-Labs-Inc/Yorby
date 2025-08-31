drop policy "Enable all for users based on user_id" on "public"."recruiting_subscriptions";

alter table "public"."recruiting_subscriptions" drop constraint "recruiting_subscriptions_id_fkey";

alter table "public"."recruiting_subscriptions" drop constraint "recruiting_subscriptions_stripe_customer_id_key";

alter table "public"."recruiting_subscriptions" drop constraint "recruiting_subscriptions_pkey";

drop index if exists "public"."recruiting_subscriptions_stripe_customer_id_key";

drop index if exists "public"."recruiting_subscriptions_pkey";

alter table "public"."recruiting_subscriptions" drop column "id";

alter table "public"."recruiting_subscriptions" add column "company_id" uuid not null;

CREATE UNIQUE INDEX recruiting_subscriptions_company_id_key ON public.recruiting_subscriptions USING btree (company_id);

CREATE UNIQUE INDEX recruiting_subscriptions_pkey ON public.recruiting_subscriptions USING btree (company_id);

alter table "public"."recruiting_subscriptions" add constraint "recruiting_subscriptions_pkey" PRIMARY KEY using index "recruiting_subscriptions_pkey";

alter table "public"."recruiting_subscriptions" add constraint "recruiting_subscriptions_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."recruiting_subscriptions" validate constraint "recruiting_subscriptions_company_id_fkey";

alter table "public"."recruiting_subscriptions" add constraint "recruiting_subscriptions_company_id_key" UNIQUE using index "recruiting_subscriptions_company_id_key";


