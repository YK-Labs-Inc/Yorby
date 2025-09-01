import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { ReferralCodeSection } from "./referral-code-section";
import { getTranslations } from "next-intl/server";
import { posthog } from "@/utils/tracking/serverUtils";
import { redirect } from "next/navigation";
import { User } from "@supabase/supabase-js";

const fetchReferralCode = async (user: User) => {
  const logger = new Logger().with({
    page: "ReferralsPage",
    action: "fetchReferralCode",
    userId: user.id,
  });
  const supabase = await createSupabaseServerClient();
  const { data: referralCode, error } = await supabase
    .from("referral_codes")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logger.error("Error fetching referral:", { error });
    await logger.flush();
    return null;
  }

  if (referralCode) {
    return referralCode.id;
  }

  const { data: newReferralCode, error: newReferralCodeError } = await supabase
    .from("referral_codes")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (newReferralCodeError) {
    logger.error("Error creating referral code:", {
      error: newReferralCodeError,
    });
    await logger.flush();
    return null;
  }

  return newReferralCode.id;
};

export default async function ReferralsPage() {
  const t = await getTranslations("referrals.page");
  let logger = new Logger().with({ page: "ReferralsPage" });
  const user = await getServerUser();

  if (!user) {
    redirect("/sign-in");
  }

  let supabase = await createSupabaseServerClient();

  const isMemoriesEnabled = Boolean(
    await posthog.isFeatureEnabled("enable-memories", user.id)
  );

  if (!isMemoriesEnabled) {
    redirect("/onboarding");
  }

  if (!user) {
    logger.info("User not found");
    await logger.flush();
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">{t("signInRequired")}</p>
      </div>
    );
  }

  const referralCode = await fetchReferralCode(user);

  if (!referralCode) {
    logger.error("Error fetching referral code");
    await logger.flush();
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">{t("error")}</p>
      </div>
    );
  }

  logger = logger.with({ userId: user.id });

  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referral_code_id", referralCode)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching referrals:", { error });
    await logger.flush();
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">{t("error")}</p>
      </div>
    );
  }

  const referralsWithReferrerEmail = (
    await Promise.all(
      referrals.map(async (referral) => {
        const supabaseAdmin = await createAdminClient();
        const { data: referrerData, error: referrerError } =
          await supabaseAdmin.auth.admin.getUserById(referral.id);
        if (referrerError) {
          logger.error("Error fetching referrer data:", {
            error: referrerError,
          });
          await logger.flush();
          return null;
        }
        return {
          ...referral,
          referrer_email: referrerData?.user?.email,
        };
      })
    )
  ).filter((referral) => referral !== null);

  const referralCount = referrals?.length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <ReferralCodeSection
        referralCount={referralCount}
        referralCode={referralCode}
      />

      {/* Referrals Table or Empty State */}
      {!referrals || referrals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("emptyState.title")}
            </h3>
            <p className="text-gray-600 mb-6">{t("emptyState.description")}</p>
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t("emptyState.steps.share")}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t("emptyState.steps.signup")}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t("emptyState.steps.reward")}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("table.referredUser")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("table.dateReferred")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {referralsWithReferrerEmail.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.referrer_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
