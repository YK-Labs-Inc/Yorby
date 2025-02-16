import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

interface CreditUsageItemProps {
  title: string;
  description: string;
  creditCount: number;
  formatCredits: (count: number) => string;
}

const CreditUsageItem = ({
  title,
  description,
  creditCount,
  formatCredits,
}: CreditUsageItemProps) => (
  <div className="rounded-lg bg-muted p-4">
    <div className="flex items-center justify-between">
      <div className="w-2/3">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-sm font-medium">{formatCredits(creditCount)}</div>
    </div>
  </div>
);

const CreditUsageModal = async () => {
  const t = await getTranslations("purchase.creditUsage");

  const formatCredits = (count: number) => {
    return t("items.jobPrep.credits", { count });
  };

  const creditUsageItems = [
    {
      title: t("items.jobPrep.title"),
      description: t("items.jobPrep.description"),
      creditCount: 1,
    },
    {
      title: t("items.copilot.title"),
      description: t("items.copilot.description"),
      creditCount: 1,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          {t("modalTrigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("modalTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {creditUsageItems.map((item, index) => (
            <CreditUsageItem
              key={index}
              title={item.title}
              description={item.description}
              creditCount={item.creditCount}
              formatCredits={formatCredits}
            />
          ))}
        </div>
        <div className="mt-6">
          <DialogTrigger asChild>
            <Button variant="default" className="w-full">
              {t("gotItButton")}
            </Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditUsageModal;
