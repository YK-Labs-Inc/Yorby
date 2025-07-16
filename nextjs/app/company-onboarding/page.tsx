"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Users, Briefcase, ArrowRight } from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { toast } from "sonner";

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "education", label: "Education" },
  { value: "consulting", label: "Consulting" },
  { value: "real_estate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality" },
  { value: "other", label: "Other" },
];

export default function CompanyOnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    companySize: "",
    industry: "",
    customIndustry: "",
  });
  const router = useRouter();
  const { logInfo, logError } = useAxiomLogging();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      toast.error("Please enter your company name");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companySize || !formData.industry) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (formData.industry === "other" && !formData.customIndustry.trim()) {
      toast.error("Please specify your industry");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    logInfo("Company onboarding submission started", { formData });

    try {
      const submissionData = {
        ...formData,
        industry: formData.industry === "other" ? formData.customIndustry : formData.industry,
      };
      
      const response = await fetch("/api/company/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register company");
      }

      logInfo("Company registration successful", { companyId: data.company.id });
      toast.success("Company registered successfully!");
      
      // Redirect to company dashboard
      router.push("/dashboard/company");
    } catch (error: any) {
      logError("Company registration failed", { error: error.message });
      toast.error(error.message || "Failed to register company");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Perfect Interview for Companies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's set up your company account to start screening candidates
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
            }`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? "bg-primary" : "bg-gray-300"}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
            }`}>
              2
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 ? (
                <>
                  <Building2 className="h-5 w-5" />
                  Company Information
                </>
              ) : (
                <>
                  <Briefcase className="h-5 w-5" />
                  Company Details
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Tell us about your company"
                : "Help us understand your business better"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.companyWebsite}
                    onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500">Optional</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size *</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => handleInputChange("companySize", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="companySize">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange("industry", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.industry === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customIndustry">Specify Your Industry *</Label>
                    <Input
                      id="customIndustry"
                      placeholder="Enter your industry"
                      value={formData.customIndustry}
                      onChange={(e) => handleInputChange("customIndustry", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between pt-4">
              {step === 1 ? (
                <div></div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : step === 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Easy company setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Invite team members</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>Start hiring smarter</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}