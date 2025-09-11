"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  GripVertical,
  Edit,
  Trash,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  ApplicationStage,
  StageFormData,
  createStage,
  updateStage,
  deleteStage,
  getStageCandidateCount,
  updateStageOrders,
} from "./actions";
import { toast } from "sonner";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface CompanyApplicationStagesManagerProps {
  companyId: string;
  initialStages: ApplicationStage[];
}

interface StageWithCandidateCount extends ApplicationStage {
  candidateCount?: number;
}

const DEFAULT_COLORS = [
  "#3B82F6", // Blue
  "#F59E0B", // Orange
  "#8B5CF6", // Purple
  "#059669", // Green
  "#047857", // Emerald
  "#F97316", // Orange red
  "#DC2626", // Red
  "#6B7280", // Gray
  "#EC4899", // Pink
  "#0891B2", // Cyan
];

// SWR fetcher for candidate counts
const fetchStageCandidateCounts = async (stageIds: string[]) => {
  const counts = await Promise.all(
    stageIds.map(async (stageId) => ({
      stageId,
      count: await getStageCandidateCount(stageId),
    }))
  );
  return counts.reduce(
    (acc, { stageId, count }) => {
      acc[stageId] = count;
      return acc;
    },
    {} as Record<string, number>
  );
};

export function CompanyApplicationStagesManager({
  companyId,
  initialStages,
}: CompanyApplicationStagesManagerProps) {
  const t = useTranslations("apply.recruiting.applicationStages");
  const [stages, setStages] = useState<ApplicationStage[]>(initialStages);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<ApplicationStage | null>(
    null
  );
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [stageToDelete, setStageToDelete] =
    useState<StageWithCandidateCount | null>(null);
  const [reassignToStageId, setReassignToStageId] = useState<string | null>(
    null
  );
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const { logError } = useAxiomLogging();

  // Use SWR to fetch candidate counts
  const stageIds = stages.map((s) => s.id);
  const swrKey =
    stageIds.length > 0 ? ["stage-counts", companyId, ...stageIds] : null;
  const { data: candidateCounts, mutate: mutateCandidateCounts } = useSWR(
    swrKey,
    () => fetchStageCandidateCounts(stageIds),
    {
      fallbackData: {},
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Combine stages with candidate counts
  const stagesWithCounts: StageWithCandidateCount[] = stages.map((stage) => ({
    ...stage,
    candidateCount: candidateCounts?.[stage.id] ?? 0,
  }));

  const handleCreateStage = async (stageData: Omit<StageFormData, "id">) => {
    try {
      const newStage = await createStage(companyId, stageData);
      setStages((prev) => [...prev, newStage]);
      await mutateCandidateCounts();
      setShowCreateDialog(false);
      toast.success(t("messages.stageCreated"));
    } catch (error) {
      toast.error(t("messages.createError"));
      logError("Error creating stage:", { error });
    }
  };

  const handleUpdateStage = async (stageData: StageFormData) => {
    if (!stageData.id) return;

    try {
      const updatedStage = await updateStage(companyId, stageData as any);
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === updatedStage.id ? updatedStage : stage
        )
      );
      await mutateCandidateCounts();
      setShowEditDialog(false);
      setEditingStage(null);
      toast.success(t("messages.stageUpdated"));
    } catch (error) {
      toast.error(t("messages.updateError"));
      logError("Error updating stage:", { error });
    }
  };

  const handleDeleteStage = async () => {
    if (!deleteStageId) return;

    try {
      await deleteStage(companyId, deleteStageId, reassignToStageId);
      setStages((prev) => prev.filter((stage) => stage.id !== deleteStageId));
      await mutateCandidateCounts();
      setDeleteStageId(null);
      setStageToDelete(null);
      setReassignToStageId(null);
      toast.success(t("messages.stageDeleted"));
    } catch (error) {
      toast.error(t("messages.deleteError"));
      logError("Error deleting stage:", { error });
    }
  };

  const handleDragStart = (e: React.DragEvent, stageId: string) => {
    setDraggedItem(stageId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const dragIndex = stages.findIndex((stage) => stage.id === draggedItem);
    if (dragIndex === dropIndex) return;

    const newStages = [...stages];
    const draggedStage = newStages[dragIndex];

    // Remove dragged item
    newStages.splice(dragIndex, 1);

    // Insert at new position
    newStages.splice(dropIndex, 0, draggedStage);

    // Update order indices
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      order_index: index + 1,
    }));

    setStages(updatedStages);
    setHasUnsavedChanges(true);
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const orderUpdates = stages.map((stage, index) => ({
        id: stage.id,
        order_index: index + 1,
      }));

      await updateStageOrders(companyId, orderUpdates);
      await mutateCandidateCounts();
      setHasUnsavedChanges(false);
      toast.success(t("messages.orderSaved"));
    } catch (error) {
      toast.error(t("messages.orderError"));
      logError("Error saving order:", { error });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = async (stage: StageWithCandidateCount) => {
    setStageToDelete(stage);
    setDeleteStageId(stage.id);
    // If this is the last stage, automatically set reassignment to null (no stage)
    if (stagesWithCounts.length <= 1) {
      setReassignToStageId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("manager.title")}</h2>
          <p className="text-muted-foreground">{t("manager.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              onClick={handleSaveOrder}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? t("manager.saving") : t("manager.saveOrder")}
            </Button>
          )}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("manager.createStage")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <StageFormDialog
                title={t("dialogs.create.title")}
                description={t("dialogs.create.description")}
                onSubmit={handleCreateStage}
                onCancel={() => setShowCreateDialog(false)}
                nextOrderIndex={
                  Math.max(...stages.map((s) => s.order_index), 0) + 1
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {stagesWithCounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("manager.noStages.title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {t("manager.noStages.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {stagesWithCounts.map((stage, index) => (
            <Card
              key={stage.id}
              className={cn(
                "transition-all duration-200",
                draggedItem === stage.id && "opacity-50"
              )}
              draggable
              onDragStart={(e) => handleDragStart(e, stage.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div
                      className="w-4 h-4 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: stage.color || "#6B7280" }}
                    />
                    <div>
                      <CardTitle className="text-lg">{stage.name}</CardTitle>
                      {stage.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {t("manager.candidateCount", {
                        count: stage.candidateCount || 0,
                      })}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingStage(stage);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(stage)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          {editingStage && (
            <StageFormDialog
              title={t("dialogs.edit.title")}
              description={t("dialogs.edit.description")}
              initialData={{
                id: editingStage.id,
                name: editingStage.name,
                description: editingStage.description || "",
                color: editingStage.color || "#6B7280",
                order_index: editingStage.order_index,
              }}
              onSubmit={handleUpdateStage}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingStage(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteStageId}
        onOpenChange={() => {
          setDeleteStageId(null);
          setStageToDelete(null);
          setReassignToStageId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {stagesWithCounts.length <= 1 &&
              stageToDelete?.candidateCount &&
              stageToDelete.candidateCount > 0
                ? t("dialogs.delete.lastStageWithCandidates", {
                    stageName: stageToDelete.name,
                    count: stageToDelete.candidateCount,
                  })
                : stagesWithCounts.length <= 1
                  ? t("dialogs.delete.lastStage", {
                      stageName: stageToDelete?.name,
                    })
                  : stageToDelete?.candidateCount &&
                      stageToDelete.candidateCount > 0
                    ? t("dialogs.delete.descriptionWithCandidates", {
                        stageName: stageToDelete.name,
                        count: stageToDelete.candidateCount,
                      })
                    : t("dialogs.delete.description", {
                        stageName: stageToDelete?.name,
                      })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Stage Selection for Candidate Reassignment */}
          {stageToDelete?.candidateCount &&
            stageToDelete.candidateCount > 0 &&
            stagesWithCounts.length > 1 && (
              <div className="py-4">
                <Label htmlFor="reassign-stage" className="text-sm font-medium">
                  {t("dialogs.delete.reassignTo")}
                </Label>
                <Select
                  value={reassignToStageId || ""}
                  onValueChange={(value) =>
                    setReassignToStageId(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue
                      placeholder={t("dialogs.delete.selectStage")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("dialogs.delete.noStage")}
                    </SelectItem>
                    {stagesWithCounts
                      .filter((stage) => stage.id !== deleteStageId)
                      .map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: stage.color || "#6B7280",
                              }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("dialogs.delete.reassignHelpText", {
                    count: stageToDelete.candidateCount,
                  })}
                </p>
              </div>
            )}

          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialogs.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStage}
              disabled={
                !!(
                  stageToDelete?.candidateCount &&
                  stageToDelete.candidateCount > 0 &&
                  stagesWithCounts.length > 1 &&
                  reassignToStageId === ""
                )
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {t("dialogs.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface StageFormDialogProps {
  title: string;
  description: string;
  initialData?: StageFormData;
  nextOrderIndex?: number;
  onSubmit: (data: StageFormData) => void;
  onCancel: () => void;
}

function StageFormDialog({
  title,
  description,
  initialData,
  nextOrderIndex = 1,
  onSubmit,
  onCancel,
}: StageFormDialogProps) {
  const t = useTranslations("apply.recruiting.applicationStages");
  const [formData, setFormData] = useState<StageFormData>({
    id: initialData?.id,
    name: initialData?.name || "",
    description: initialData?.description || "",
    color: initialData?.color || DEFAULT_COLORS[0],
    order_index: initialData?.order_index || nextOrderIndex,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("dialogs.validation.nameRequired"));
      return;
    }
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">
            {t("dialogs.form.name")}
          </label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={t("dialogs.form.namePlaceholder")}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            {t("dialogs.form.description")}
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder={t("dialogs.form.descriptionPlaceholder")}
            rows={3}
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            {t("dialogs.form.color")}
          </label>
          <div className="flex gap-2 mt-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  formData.color === color
                    ? "border-gray-900 scale-110"
                    : "border-gray-200 hover:scale-105"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            {t("dialogs.cancel")}
          </Button>
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            {initialData ? t("dialogs.update") : t("dialogs.create.title")}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
