import OnboardingV2 from "./OnboardingV2";
import { getProducts } from "@/app/[locale]/purchase/actions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingV2Page() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { products } = await getProducts(user.id);

  return <OnboardingV2 products={JSON.parse(JSON.stringify(products))} />;
}
