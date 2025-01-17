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
import { Progress } from "@/components/ui/progress";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MockInterviewReviewClientComponentProps {
  mockInterview: Tables<"custom_job_mock_interviews">;
  messages: Tables<"mock_interview_messages">[];
  feedback: Tables<"custom_job_mock_interview_feedback">;
  questionFeedback: Tables<"mock_interview_question_feedback">[];
  recordingUrl: string;
}

export default function MockInterviewReviewClientComponent({
  mockInterview,
  messages,
  feedback,
  questionFeedback,
  recordingUrl,
}: MockInterviewReviewClientComponentProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);

  const navigateQuestion = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? selectedQuestionIndex - 1
        : selectedQuestionIndex + 1;
    if (newIndex >= 0 && newIndex < questionFeedback.length) {
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
              tabsList.scrollLeft + (tabRect.right - tabsListRect.right) + 16, // 16px padding
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
      {/* Top Row: Video and Transcript */}
      <div className="col-span-12 grid grid-cols-12 gap-6">
        {/* Video Recording */}
        <Card className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardTitle>Interview Recording</CardTitle>
            <CardDescription>Review your interview performance</CardDescription>
          </CardHeader>
          <CardContent>
            <video
              ref={videoRef}
              src={recordingUrl}
              controls
              className="w-full rounded-lg aspect-video"
            />
          </CardContent>
        </Card>

        {/* Interview Transcript */}
        <Card className="col-span-12 lg:col-span-6">
          <CardHeader>
            <CardTitle>Interview Transcript</CardTitle>
            <CardDescription>Complete interview conversation</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Overall Score */}
      <Card className="col-span-12 lg:col-span-4">
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
          <CardDescription>
            Your interview score and fit analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Interview Score</span>
              <span className="text-sm font-medium">{feedback.score}%</span>
            </div>
            <Progress value={feedback.score} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Job Fit</span>
              <span className="text-sm font-medium">
                {feedback.job_fit_percentage}%
              </span>
            </div>
            <Progress value={feedback.job_fit_percentage} />
          </div>
        </CardContent>
      </Card>

      {/* Overall Feedback */}
      <Card className="col-span-12 lg:col-span-8">
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
          <CardDescription>
            General feedback and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Overview</h3>
            <p className="text-muted-foreground">{feedback.overview}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Job Fit Analysis</h3>
            <p className="text-muted-foreground">{feedback.job_fit_analysis}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Key Improvements</h3>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              {feedback.key_improvements.map((improvement, i) => (
                <li key={i}>{improvement}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>Detailed feedback for each question</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedQuestionIndex.toString()}
            className="w-full"
            onValueChange={(value) => setSelectedQuestionIndex(parseInt(value))}
          >
            <div className="flex items-center gap-2">
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
                {questionFeedback.map((qf, index) => (
                  <TabsTrigger key={qf.id} value={index.toString()}>
                    Question {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                onClick={() => navigateQuestion("next")}
                disabled={selectedQuestionIndex === questionFeedback.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {questionFeedback.map((qf, index) => (
              <TabsContent
                key={qf.id}
                value={index.toString()}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Question</h3>
                    <p className="text-muted-foreground">{qf.question}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Your Answer</h3>
                    <p className="text-muted-foreground">{qf.answer}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Score</h3>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        Question Score
                      </span>
                      <span className="text-sm font-medium">{qf.score}%</span>
                    </div>
                    <Progress value={qf.score} className="mb-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Strengths</h3>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {qf.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Areas for Improvement
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {qf.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
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
