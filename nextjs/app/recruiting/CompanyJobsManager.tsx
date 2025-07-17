"use client";

import { useState } from "react";
import { Plus, Briefcase, Users, Clock, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { CreateJobDialog } from "./CreateJobDialog";
import { Tables } from "@/utils/supabase/database.types";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

type Job = Tables<"custom_jobs"> & {
  company_job_candidates?: { count: number }[];
};

interface CompanyJobsManagerProps {
  companyId: string;
  jobs: Job[];
}

export function CompanyJobsManager({
  companyId,
  jobs,
}: CompanyJobsManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const t = useTranslations("companyJobsManager");

  const getCandidateCount = (job: Job) => {
    return job.company_job_candidates?.[0]?.count || 0;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t("title")}</h2>
            <p className="text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createJobListing")}
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("noJobsYet.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {t("noJobsYet.description")}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createJobListing")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{job.job_title}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {t("jobCard.posted")}{" "}
                          {formatDistanceToNow(new Date(job.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <Badge
                          variant={
                            job.status === "unlocked" ? "default" : "secondary"
                          }
                        >
                          {job.status === "unlocked" ? t("jobCard.status.active") : t("jobCard.status.draft")}
                        </Badge>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/recruiting/companies/${companyId}/jobs/${job.id}/edit`}
                          >
                            {t("actions.editJob")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/recruiting/companies/${companyId}/jobs/${job.id}?view=questions`}
                          >
                            {t("actions.manageQuestions")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          {t("actions.archiveJob")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.job_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {job.job_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{t("jobCard.candidates", { count: getCandidateCount(job) })}</span>
                    </div>
                    <Link
                      href={`/recruiting/companies/${companyId}/jobs/${job.id}`}
                    >
                      <Button variant="outline" size="sm">
                        {t("jobCard.viewDetails")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateJobDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        companyId={companyId}
      />
    </>
  );
}
