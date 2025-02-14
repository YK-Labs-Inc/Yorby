"use client";

import { Tables } from "@/utils/supabase/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InterviewCopilotReviewClientComponentProps {
  questionsAndAnswers: Tables<"interview_copilot_questions_and_answers">[];
  recordingUrl: string;
}

export default function InterviewCopilotReviewClientComponent({
  questionsAndAnswers,
  recordingUrl,
}: InterviewCopilotReviewClientComponentProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);

  const navigateQuestion = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? selectedQuestionIndex - 1
        : selectedQuestionIndex + 1;
    if (newIndex >= 0 && newIndex < questionsAndAnswers.length) {
      setSelectedQuestionIndex(newIndex);

      // Ensure the selected tab is visible by scrolling it into view
      const tabElement = tabsListRef.current?.children[newIndex] as HTMLElement;
      const tabsList = tabsListRef.current;
      if (tabElement && tabsList) {
        const tabsListRect = tabsList.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();

        if (direction === "next" && tabRect.right > tabsListRect.right) {
          tabsList.scrollTo({
            left:
              tabsList.scrollLeft + (tabRect.right - tabsListRect.right) + 16,
            behavior: "smooth",
          });
        } else if (direction === "prev" && tabRect.left < tabsListRect.left) {
          tabsList.scrollTo({
            left: tabsList.scrollLeft - (tabsListRect.left - tabRect.left) - 16,
            behavior: "smooth",
          });
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Video Recording */}
      <Card className="col-span-12 lg:col-span-6 lg:h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Interview Recording</CardTitle>
          <CardDescription>Review your interview performance</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow relative">
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
            <video
              ref={videoRef}
              src={recordingUrl}
              controls
              className="max-h-full max-w-full h-auto w-auto object-contain"
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card className="col-span-12 lg:col-span-6 lg:h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>Review your questions and answers</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col overflow-hidden">
          <Tabs
            value={selectedQuestionIndex.toString()}
            className="flex h-full flex-col"
            onValueChange={(value) => setSelectedQuestionIndex(parseInt(value))}
          >
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                onClick={() => navigateQuestion("prev")}
                disabled={selectedQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <TabsList
                ref={tabsListRef}
                className="w-full justify-start overflow-x-auto scrollbar-hide flex-1"
              >
                {questionsAndAnswers.map((qa, index) => (
                  <TabsTrigger key={qa.id} value={index.toString()}>
                    Question {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                onClick={() => navigateQuestion("next")}
                disabled={
                  selectedQuestionIndex === questionsAndAnswers.length - 1
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {questionsAndAnswers.map((qa, index) => (
              <TabsContent
                key={qa.id}
                value={index.toString()}
                className="flex-1 overflow-hidden"
              >
                <div className="h-full overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Question</h3>
                      <p className="text-muted-foreground">{qa.question}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Your Answer</h3>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {qa.answer}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
