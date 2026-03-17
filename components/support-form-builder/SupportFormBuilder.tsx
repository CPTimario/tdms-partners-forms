"use client";

import { useEffect, useState } from "react";
import {
  downloadPDF,
  generateReviewPDF,
} from "@/lib/pdf-generator";
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
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [reviewPdfBytes, setReviewPdfBytes] = useState<Uint8Array | null>(null);
  const [reviewPdfUrl, setReviewPdfUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (step !== "review") {
      setReviewPdfBytes(null);
      setPreviewError(null);
      setReviewPdfUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
      return () => {
        cancelled = true;
      };
    }

    setIsPreparingPreview(true);
    setPreviewError(null);
    void (async () => {
      try {
        const bytes = await generateReviewPDF(data);
        if (cancelled) {
          return;
        }

        const nextUrl = URL.createObjectURL(
          new Blob([bytes as any], { type: "application/pdf" }),
        );

        setReviewPdfBytes(bytes);
        setReviewPdfUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return nextUrl;
        });
      } catch {
        if (!cancelled) {
          setReviewPdfBytes(null);
          setReviewPdfUrl((previous) => {
            if (previous) {
              URL.revokeObjectURL(previous);
            }
            return null;
          });
          setPreviewError("Unable to prepare preview. Please retry or reload the page. If the issue persists, contact support.");
        }
      } finally {
        if (!cancelled) {
          setIsPreparingPreview(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, step]);

  useEffect(() => {
    return () => {
      if (reviewPdfUrl) {
        URL.revokeObjectURL(reviewPdfUrl);
      }
    };
  }, [reviewPdfUrl]);

  const downloadReviewPdf = async () => {
    setIsExporting(true);
    try {
      const bytes = reviewPdfBytes ?? (await generateReviewPDF(data));
      setReviewPdfBytes(bytes);
      setPreviewError(null);
      await downloadPDF(bytes, "tdm-support-forms.pdf");
    } catch {
      setPreviewError("Unable to generate PDF. Please try again.");
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
      isExporting={isExporting}
      isPreparingPreview={isPreparingPreview}
      previewPdfUrl={reviewPdfUrl}
      previewError={previewError}
      onEditPartnerInfo={goToPartner}
      onEditAccountability={goToAccountability}
      onDownloadPdf={downloadReviewPdf}
    />
  );
}
