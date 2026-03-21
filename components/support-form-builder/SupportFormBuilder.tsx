"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  downloadPDF,
  generateReviewPDF,
} from "@/lib/pdf-generator";
import { useSupportForm } from "@/hooks/use-support-form";
import {
  getAccountabilityAffirmationCopy,
  type MembershipType,
} from "@/lib/support-form";
import { FillStep } from "@/components/support-form-builder/FillStep";
import styles from "./FormBuilder.module.css";
import { ReviewStep } from "./ReviewStep";

function MembershipGate() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement?.focus();

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusableElements.length === 0) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    dialog.addEventListener("keydown", handleTabTrap);
    return () => {
      dialog.removeEventListener("keydown", handleTabTrap);
    };
  }, []);

  return (
    <main className={styles.gateShell}>
      <div
        ref={dialogRef}
        className={styles.gateCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-gate-title"
      >
        <h1 className={styles.gateTitle} id="membership-gate-title">
          Are you a Victory church member?
        </h1>
        <p className={styles.gateText}>Choose Yes or No to continue.</p>
        <div className={styles.gateActions}>
          <button
            className={styles.button}
            type="button"
            onClick={() => router.push("/victory")}
          >
            Yes
          </button>
          <button
            className={styles.button}
            type="button"
            onClick={() => router.push("/non-victory")}
          >
            No
          </button>
        </div>
      </div>
    </main>
  );
}

type VictoryAgreementGateProps = {
  onAgree: () => void;
};

function VictoryAgreementGate({ onAgree }: VictoryAgreementGateProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement?.focus();

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusableElements.length === 0) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    dialog.addEventListener("keydown", handleTabTrap);
    return () => {
      dialog.removeEventListener("keydown", handleTabTrap);
    };
  }, []);

  return (
    <main className={styles.gateShell}>
      <div
        ref={dialogRef}
        className={styles.gateCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-agreement-title"
      >
        <h1 className={styles.gateTitle} id="membership-agreement-title">
          Accountability Agreement
        </h1>
        <p className={styles.gateText}>{getAccountabilityAffirmationCopy("victory")}</p>
        <div className={styles.gateActions}>
          <button className={styles.button} type="button" onClick={onAgree}>
            I Agree
          </button>
        </div>
      </div>
    </main>
  );
}

type SupportFormBuilderProps = {
  membershipType?: MembershipType;
};

export function SupportFormBuilder({ membershipType }: SupportFormBuilderProps = {}) {
  const {
    data,
    step,
    fieldErrors,
    formErrors,
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
  } = useSupportForm(membershipType);
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
          new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
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
    if (membershipType === "victory") {
      return <VictoryAgreementGate onAgree={() => setMembership("victory")} />;
    }
    return <MembershipGate />;
  }

  if (step !== "review") {
    return (
      <FillStep
        data={data}
        step={step}
        fieldErrors={fieldErrors}
        formErrors={formErrors}
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
