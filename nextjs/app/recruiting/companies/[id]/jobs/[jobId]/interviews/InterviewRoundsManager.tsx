"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, GripVertical, MoreVertical, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { CreateJobInterviewPanel } from "./CreateJobInterviewPanel";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateInterviewOrder } from "./actions";
import { toast } from "sonner";
import Link from "next/link";

type JobInterview = Tables<"job_interviews"> & {
  job_interview_questions?: { count: number }[];
  candidate_job_interviews?: { count: number }[];
};

interface InterviewRoundsManagerProps {
  jobId: string;
  interviews: JobInterview[];
  companyId: string;
}

interface SortableRowProps {
  interview: JobInterview;
  getInterviewTypeColor: (type: string) => string;
  companyId: string;
  jobId: string;
}

function SortableRow({
  interview,
  getInterviewTypeColor,
  companyId,
  jobId,
  setPanelMode,
  setSelectedInterview,
  setShowCreatePanel,
}: SortableRowProps & {
  setPanelMode: (mode: "create" | "edit") => void;
  setSelectedInterview: (interview: JobInterview) => void;
  setShowCreatePanel: (show: boolean) => void;
}) {
  const t = useTranslations("apply.recruiting.interviewRoundsManager");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: interview.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "bg-muted/50" : ""}
    >
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <Link
          href={`/recruiting/companies/${companyId}/jobs/${jobId}/interviews/${interview.id}`}
          className="hover:underline"
        >
          {interview.name}
        </Link>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={getInterviewTypeColor(interview.interview_type)}
        >
          {t(`interviewType.${interview.interview_type}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setPanelMode("edit");
                setSelectedInterview(interview);
                setShowCreatePanel(true);
              }}
            >
              {t("actions.editRound")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function InterviewRoundsManager({
  jobId,
  interviews,
  companyId,
}: InterviewRoundsManagerProps) {
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [selectedInterview, setSelectedInterview] =
    useState<JobInterview | null>(null);
  const [sortedInterviews, setSortedInterviews] = useState(() =>
    [...interviews].sort((a, b) => a.order_index - b.order_index)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("apply.recruiting.interviewRoundsManager");

  // Update sortedInterviews when interviews prop changes
  useEffect(() => {
    setSortedInterviews(
      [...interviews].sort((a, b) => a.order_index - b.order_index)
    );
  }, [interviews]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getInterviewTypeColor = (type: string) => {
    switch (type) {
      case "general":
        return "bg-blue-100 text-blue-800";
      case "coding":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedInterviews.findIndex((i) => i.id === active.id);
      const newIndex = sortedInterviews.findIndex((i) => i.id === over.id);

      const newOrder = arrayMove(sortedInterviews, oldIndex, newIndex);
      setSortedInterviews(newOrder);

      // Update the order in the database
      startTransition(async () => {
        const interviewIds = newOrder.map((interview) => interview.id);
        const result = await updateInterviewOrder(jobId, interviewIds);

        if (result.error) {
          // Revert the order on error
          setSortedInterviews(sortedInterviews);
          toast.error(t("errors.updateOrderFailed"));
        } else {
          toast.success(t("success.orderUpdated"));
        }
      });
    }
  };

  const activeInterview = activeId
    ? sortedInterviews.find((i) => i.id === activeId)
    : null;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t("title")}</h2>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setPanelMode("create");
              setSelectedInterview(null);
              setShowCreatePanel(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("createInterviewRound")}
          </Button>
        </div>

        {sortedInterviews.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("noInterviews.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {t("noInterviews.description")}
              </p>
              <Button
                onClick={() => {
                  setPanelMode("create");
                  setSelectedInterview(null);
                  setShowCreatePanel(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("createInterviewRound")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg">
            <div className="max-h-[600px] overflow-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[5%]"></TableHead>
                      <TableHead className="w-[30%]">
                        {t("table.roundName")}
                      </TableHead>
                      <TableHead className="w-[20%]">
                        {t("table.type")}
                      </TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={sortedInterviews.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sortedInterviews.map((interview) => (
                        <SortableRow
                          key={interview.id}
                          interview={interview}
                          getInterviewTypeColor={getInterviewTypeColor}
                          companyId={companyId}
                          jobId={jobId}
                          setPanelMode={setPanelMode}
                          setSelectedInterview={setSelectedInterview}
                          setShowCreatePanel={setShowCreatePanel}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
                <DragOverlay>
                  {activeInterview ? (
                    <Table>
                      <TableBody>
                        <TableRow className="bg-background shadow-lg">
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell className="font-medium">
                            {activeInterview.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getInterviewTypeColor(
                                activeInterview.interview_type
                              )}
                            >
                              {t(
                                `interviewType.${activeInterview.interview_type}`
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
            {isPending && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                {t("updating")}...
              </div>
            )}
          </div>
        )}
      </div>

      <CreateJobInterviewPanel
        open={showCreatePanel}
        onOpenChange={setShowCreatePanel}
        jobId={jobId}
        currentInterviewsCount={sortedInterviews.length}
        mode={panelMode}
        interview={selectedInterview}
      />
    </>
  );
}
