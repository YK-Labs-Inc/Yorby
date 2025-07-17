import { Building2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export function RecruitingDashboardSkeleton() {
  const t = useTranslations("recruiting");
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">
            {t("dashboard.description")}
          </p>
        </div>
        
        <div className="grid gap-6">
          {/* Create Company Card - Static */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("companyDashboard.createCard.title")}</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {t("companyDashboard.createCard.description")}
              </p>
              <div className="h-10 w-[156px] bg-primary rounded-md flex items-center justify-center">
                <Plus className="mr-2 h-4 w-4 text-primary-foreground" />
                <span className="text-primary-foreground font-medium">{t("companyDashboard.createCard.button")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Skeleton Companies */}
          <h2 className="text-xl font-semibold">{t("companyDashboard.yourCompanies")}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}