"use client";

import { useRef, useState } from "react";
import { exportFormElement } from "@/lib/export-form";
import { useSupportForm } from "@/hooks/use-support-form";
import type { MembershipType } from "@/lib/support-form";
import { FillStep } from "@/components/support-form-builder/FillStep";
import styles from "./FormBuilder.module.css";
import { ReviewStep } from "./ReviewStep";

type MembershipGateProps = {
  onSelect: (membershipType: MembershipType) => void;
};

function MembershipGate({ onSelect }: MembershipGateProps) {
  return (
    <main className={styles.gateShell}>
      <div className={styles.gateCard} role="dialog" aria-modal="true" aria-labelledby="membership-gate-title">
        <h1 className={styles.gateTitle} id="membership-gate-title">
          Select Membership Type
        </h1>
        <p className={styles.gateText}>
          Choose the paper form variant to continue.
        </p>
        <div className={styles.gateActions}>
          <button className={styles.button} type="button" onClick={() => onSelect("victory")}>Victory Member</button>
          <button className={styles.button} type="button" onClick={() => onSelect("nonVictory")}>Non-Victory Member</button>
        </div>
      </div>
    </main>
  );
}

export function SupportFormBuilder() {
  const {
    data,
    step,
    validationErrors,
    isFormValid,
    isPartnerStepComplete,
    isAccountabilityStepComplete,
    onTextChange,
    onCheckboxChange,
    setMembership,
    onUnableToGoChange,
    onReroutedChange,
    onCanceledChange,
    setPartnerSignature,
    resetForm,
    goToPartner,
    goToAccountability,
    goToReview,
  } = useSupportForm();
  const [isExporting, setIsExporting] = useState(false);

  const partnerInfoRef = useRef<HTMLDivElement>(null);
  const accountabilityRef = useRef<HTMLDivElement>(null);

  const download = async (
    element: HTMLDivElement | null,
    type: "pdf" | "png",
    filename: string,
  ) => {
    if (!element) {
      return;
    }

    setIsExporting(true);
    try {
      await exportFormElement(element, type, filename);
    } finally {
      setIsExporting(false);
    }
  };

  if (!data.membershipType) {
    return <MembershipGate onSelect={setMembership} />;
  }

  if (step !== "review") {
    return (
      <FillStep
        data={data}
        step={step}
        validationErrors={validationErrors}
        isFormValid={isFormValid}
        isPartnerStepComplete={isPartnerStepComplete}
        isAccountabilityStepComplete={isAccountabilityStepComplete}
        onTextChange={onTextChange}
        onCheckboxChange={onCheckboxChange}
        onUnableToGoChange={onUnableToGoChange}
        onReroutedChange={onReroutedChange}
        onCanceledChange={onCanceledChange}
        onPartnerSignatureChange={setPartnerSignature}
        onPartnerTab={goToPartner}
        onAccountabilityTab={goToAccountability}
        onReview={goToReview}
        onReset={resetForm}
      />
    );
  }

  return (
    <ReviewStep
      data={data}
      isExporting={isExporting}
      partnerInfoRef={partnerInfoRef}
      accountabilityRef={accountabilityRef}
      onEditPartnerInfo={goToPartner}
      onEditAccountability={goToAccountability}
      onDownloadPartnerInfoPdf={() =>
        download(partnerInfoRef.current, "pdf", "tdm-partner-information.pdf")
      }
      onDownloadPartnerInfoPng={() =>
        download(partnerInfoRef.current, "png", "tdm-partner-information.png")
      }
      onDownloadAccountabilityPdf={() =>
        download(accountabilityRef.current, "pdf", "tdm-accountability-form.pdf")
      }
      onDownloadAccountabilityPng={() =>
        download(accountabilityRef.current, "png", "tdm-accountability-form.png")
      }
    />
  );
}
