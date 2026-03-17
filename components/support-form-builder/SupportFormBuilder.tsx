"use client";

import { useEffect, useRef, useState } from "react";
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

type MembershipGateProps = {
  onSelect: (membershipType: MembershipType) => void;
};

function MembershipGate({ onSelect }: MembershipGateProps) {
  const [showAgreement, setShowAgreement] = useState(false);
  const gateDialogRef = useRef<HTMLDivElement | null>(null);
  const agreementDialogRef = useRef<HTMLDivElement | null>(null);
  const yesButtonRef = useRef<HTMLButtonElement | null>(null);
  const noButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<"yes" | "no" | null>(null);

  useEffect(() => {
    if (showAgreement || !restoreFocusRef.current) {
      return;
    }

    const target = restoreFocusRef.current === "yes" ? yesButtonRef.current : noButtonRef.current;
    target?.focus();
    restoreFocusRef.current = null;
  }, [showAgreement]);

  useEffect(() => {
    const dialog = showAgreement ? agreementDialogRef.current : gateDialogRef.current;
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
      if (event.key === "Escape" && showAgreement) {
        event.preventDefault();
        restoreFocusRef.current = "yes";
        setShowAgreement(false);
        return;
      }

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
  }, [showAgreement]);

  if (showAgreement) {
    return (
      <main className={styles.gateShell}>
        <div
          ref={agreementDialogRef}
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
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              type="button"
              onClick={() => {
                restoreFocusRef.current = "yes";
                setShowAgreement(false);
              }}
            >
              Back
            </button>
            <button className={styles.button} type="button" onClick={() => onSelect("victory")}>
              I Agree
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.gateShell}>
      <div
        ref={gateDialogRef}
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
            ref={yesButtonRef}
            className={styles.button}
            type="button"
            onClick={() => setShowAgreement(true)}
          >
            Yes
          </button>
          <button
            ref={noButtonRef}
            className={styles.button}
            type="button"
            onClick={() => onSelect("nonVictory")}
          >
            No
          </button>
        </div>
      </div>
    </main>
  );
}

export function SupportFormBuilder() {
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
