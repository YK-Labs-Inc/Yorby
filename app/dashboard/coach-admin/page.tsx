import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Settings } from "lucide-react";

export default function CoachAdminDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Coach Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your curriculum, students, and coaching settings from this
          dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Curriculum Management Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Curriculum</CardTitle>
            </div>
            <CardDescription>
              Manage your job profiles, interview questions, and sample answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Create and manage custom job profiles with tailored interview
              questions and sample answers for your students to practice with.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/coach-admin/programs">
                Manage Programs
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Students Management Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Students</CardTitle>
            </div>
            <CardDescription>
              View and manage your student roster
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Track student progress, review their practice sessions, and manage
              access to your curriculum materials.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/coach-admin/students">
                Manage Students
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Settings Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Settings</CardTitle>
            </div>
            <CardDescription>
              Configure your coaching profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Update your profile information, branding settings, and
              notification preferences.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/coach-admin/settings">
                Manage Settings
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
