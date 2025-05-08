alter table "public"."coaches" add column "slug" text not null;

CREATE UNIQUE INDEX coaches_slug_key ON public.coaches USING btree (slug);

alter table "public"."coaches" add constraint "coaches_slug_key" UNIQUE using index "coaches_slug_key";


