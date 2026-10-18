"use client";

import { useRouter } from "next/navigation";
import { Case } from "@/types/cases.types";
import { CaseListPanel } from "@/components/case";

interface CaseListWrapperProps {
  cases: Case[];
  canEscalateCase?: boolean;
}

export const CaseListWrapper = ({
  cases,
  canEscalateCase,
}: CaseListWrapperProps) => {
  const router = useRouter();

  const handleCaseClick = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  return (
    <CaseListPanel
      cases={cases}
      onCaseClick={handleCaseClick}
      canEscalateCase={canEscalateCase}
    />
  );
};
