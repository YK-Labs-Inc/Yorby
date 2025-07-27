"use client";

import { useState } from "react";
import { Plus, Briefcase, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { CreateJobDialog } from "./CreateJobDialog";
import { Tables } from "@/utils/supabase/database.types";
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
  const t = useTranslations("apply.recruiting.companyJobsManager");

  const getCandidateCount = (job: Job) => {
    return job.company_job_candidates?.[0]?.count || 0;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t("title")}</h2>
            <p className="text-muted-foreground">{t("subtitle")}</p>
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
          <div className="border rounded-lg">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">
                      {t("table.jobTitle")}
                    </TableHead>
                    <TableHead className="w-[30%]">
                      {t("table.description")}
                    </TableHead>
                    <TableHead className="w-[15%]">
                      {t("table.candidates")}
                    </TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/recruiting/companies/${companyId}/jobs/${job.id}`}
                          className="hover:underline"
                        >
                          {job.job_title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {job.job_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {job.job_description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{getCandidateCount(job)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive">
                              {t("actions.archiveJob")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
