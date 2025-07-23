"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  XCircle,
  MessageSquareQuote,
  BarChart3,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import type { InterviewAnalysis } from "./actions";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface InterviewAnalysisProps {
  analysis: InterviewAnalysis | null;
  onProcessAnalysis?: () => void;
  isProcessing?: boolean;
}

export default function InterviewAnalysis({
  analysis,
  onProcessAnalysis,
  isProcessing = false,
}: InterviewAnalysisProps) {
  const t = useTranslations("apply.recruiting.candidates.analysis");
  const [activeTab, setActiveTab] = useState("overview");

  // Helper function to get verdict badge color
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "ADVANCE":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECT":
        return "bg-red-100 text-red-800 border-red-200";
      case "BORDERLINE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "low":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  if (!analysis) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t("noAnalysis")}</p>
            <Button
              onClick={onProcessAnalysis}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {t("processing")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("generateAnalysis")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <ShareButton url={window.location.href} />
            <Badge
              className={`text-sm px-3 py-1 ${getVerdictColor(
                analysis.hiring_verdict || "BORDERLINE"
              )}`}
            >
              {t(
                `verdict.${(analysis.hiring_verdict || "BORDERLINE").toLowerCase()}`
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score and Verdict Summary */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("overallMatch")}</span>
              <span className="text-sm font-bold">
                {analysis.overall_match_score || 0}%
              </span>
            </div>
            <Progress
              value={analysis.overall_match_score || 0}
              className="h-2"
            />
          </div>

          <Alert>
            <AlertDescription className="text-sm break-words">
              {analysis.verdict_summary || ""}
            </AlertDescription>
          </Alert>
        </div>

        {/* Processing info */}
        {analysis.created_at && (
          <div className="text-xs text-muted-foreground text-right">
            {t("processedAt", {
              date: new Date(analysis.created_at).toLocaleString(),
            })}
          </div>
        )}

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 overflow-x-auto">
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="strengths">{t("tabs.strengths")}</TabsTrigger>
            <TabsTrigger value="concerns">{t("tabs.concerns")}</TabsTrigger>
            <TabsTrigger value="alignment">{t("tabs.alignment")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Key Highlights */}
            {analysis.highlights &&
              Array.isArray(analysis.highlights) &&
              analysis.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageSquareQuote className="h-4 w-4" />
                    {t("keyHighlights")}
                  </h4>
                  <div className="space-y-3">
                    {analysis.highlights.map(
                      (highlight, idx) => (
                        <Card
                          key={idx}
                          className="p-3 bg-gray-50 border-gray-200"
                        >
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {highlight.highlight_type}
                            </Badge>
                            <blockquote className="text-sm italic text-gray-700 border-l-4 border-gray-300 pl-3 break-words">
                              "{highlight.quote}"
                            </blockquote>
                            <p className="text-xs text-muted-foreground break-words">
                              {highlight.context}
                            </p>
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Question Analysis Summary */}
            {analysis.question_analysis &&
              Array.isArray(analysis.question_analysis) &&
              analysis.question_analysis.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t("questionPerformance")}
                  </h4>
                  <div className="space-y-2">
                    {analysis.question_analysis.map(
                      (qa, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium break-words">
                              {qa.question_text}
                            </p>
                            <p className="text-xs text-muted-foreground break-words">
                              {qa.answer_summary}
                            </p>
                          </div>
                          <div className="ml-4">
                            <Badge
                              variant={
                                (qa.answer_quality_score ?? 0) >= 80
                                  ? "default"
                                  : (qa.answer_quality_score ?? 0) >= 60
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {qa.answer_quality_score ?? 0}%
                            </Badge>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </TabsContent>

          <TabsContent value="strengths" className="space-y-4 mt-4">
            {analysis.strengths &&
            Array.isArray(analysis.strengths) &&
            analysis.strengths.length > 0 ? (
              <div className="space-y-3">
                {analysis.strengths.map((strength, idx) => (
                  <Card key={idx} className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-medium text-sm mb-1 break-words">
                          {strength.title}
                        </h5>
                        <p className="text-sm text-gray-700 mb-2 break-words">
                          {strength.evidence}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {strength.relevance}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noStrengths")}
              </p>
            )}
          </TabsContent>

          <TabsContent value="concerns" className="space-y-4 mt-4">
            {analysis.concerns &&
            Array.isArray(analysis.concerns) &&
            analysis.concerns.length > 0 ? (
              <div className="space-y-3">
                {analysis.concerns.map((concern, idx) => (
                  <Card
                    key={idx}
                    className={`p-4 ${
                      concern.severity === "critical"
                        ? "border-red-200 bg-red-50"
                        : concern.severity === "high"
                          ? "border-orange-200 bg-orange-50"
                          : concern.severity === "medium"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(concern.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-sm break-words">
                            {concern.title}
                          </h5>
                          {concern.is_red_flag && (
                            <Badge variant="destructive" className="text-xs">
                              {t("redFlag")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2 break-words">
                          {concern.description}
                        </p>
                        {concern.evidence && (
                          <p className="text-xs text-gray-600 italic mb-2 break-words">
                            {concern.evidence}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {t("impact")}: {concern.impact}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              concern.severity === "critical"
                                ? "text-red-700"
                                : concern.severity === "high"
                                  ? "text-orange-700"
                                  : concern.severity === "medium"
                                    ? "text-yellow-700"
                                    : "text-blue-700"
                            }`}
                          >
                            {t(`severity.${concern.severity}`)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noConcerns")}
              </p>
            )}
          </TabsContent>

          <TabsContent value="alignment" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Matched Requirements */}
              {analysis.matched_requirements &&
                analysis.matched_requirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("matchedRequirements")}
                    </h4>
                    <ul className="space-y-1">
                      {analysis.matched_requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Exceeded Requirements */}
              {analysis.exceeded_requirements &&
                analysis.exceeded_requirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-700">
                      <TrendingUp className="h-4 w-4" />
                      {t("exceededRequirements")}
                    </h4>
                    <ul className="space-y-1">
                      {analysis.exceeded_requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Missing Requirements */}
              {analysis.missing_requirements &&
                analysis.missing_requirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      {t("missingRequirements")}
                    </h4>
                    <ul className="space-y-1">
                      {analysis.missing_requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-red-600 mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
