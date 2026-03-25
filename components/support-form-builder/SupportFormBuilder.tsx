"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  downloadPDF,
  generateReviewPDF,
} from "@/lib/pdf-generator";
import { useSupportForm } from "@/hooks/use-support-form";
import { useTeamsWithSuggestions, type Suggestion } from "@/hooks/useTeams";
import { Share2 } from "lucide-react";
import { parseRecipientParam, canonicalRecipientId, type Recipient } from "@/lib/recipient";
import { generateCompositeQr } from "@/lib/qr";
import {
  getAccountabilityAffirmationCopy,
  type MembershipType,
} from "@/lib/support-form";
import { FillStep } from "@/components/support-form-builder/FillStep";
import { Snackbar } from "@/components/Snackbar";
import { useSnackbar } from "@/hooks/use-snackbar";
import styles from "./FormBuilder.module.css";
import { ReviewStep } from "./ReviewStep";

const VALIDATION_ERROR_MESSAGE =
  "Some fields need your attention. Please fix the highlighted errors.";

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
    onCurrencyChange,
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
    setField,
  } = useSupportForm(membershipType);
  // setField allows programmatic updates to text fields (e.g., when selecting autocomplete suggestions)
  const snackbar = useSnackbar();
  const [isExporting, setIsExporting] = useState(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [reviewPdfBytes, setReviewPdfBytes] = useState<Uint8Array | null>(null);
  const [reviewPdfUrl, setReviewPdfUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { suggestions, loading: suggestionsLoading } = useTeamsWithSuggestions();

  // QR/share state
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [currentRecipient, setCurrentRecipient] = useState<Suggestion | null>(null);

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

  // Initialize form fields from URL deeplink param `recipient`
  const _deeplinkInitialized = useRef(false);
  useEffect(() => {
    if (suggestionsLoading) return;
    if (_deeplinkInitialized.current) return;
    try {
      const recipientParam = searchParams.get("recipient");
      if (!recipientParam) {
        _deeplinkInitialized.current = true;
        return;
      }

      // parse and normalize the incoming param (reject ambiguous/loose matches)
      const parsed = parseRecipientParam(recipientParam);
      if (!parsed) {
        _deeplinkInitialized.current = true;
        return;
      }

      // find exact suggestion by canonical id
      const canonicalId = canonicalRecipientId(parsed);
      const recipientSuggestion = suggestions?.find((s) => s.id === canonicalId) ?? null;

      if (recipientSuggestion) {
        if (setField && data.missionaryName !== recipientSuggestion.label) {
          if (recipientSuggestion.nation) setField("nation", recipientSuggestion.nation);
          if (recipientSuggestion.travelDate) setField("travelDate", recipientSuggestion.travelDate);
          if (recipientSuggestion.sendingChurch) setField("sendingChurch", recipientSuggestion.sendingChurch);
          setField("missionaryName", recipientSuggestion.label);
        }
        setCurrentRecipient(recipientSuggestion);
      }

      // normalize URL to canonical ID if matched
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      if (recipientSuggestion) params.set("recipient", recipientSuggestion.id);
      const current = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
      const desired = params.toString();
      if (desired && desired !== current) {
        router.replace(`${typeof window !== "undefined" ? window.location.pathname : "/"}${desired ? `?${desired}` : ""}`);
      }
    } catch (err) {
      // Log deeplink initialization failures for observability
      console.warn("SupportFormBuilder: deeplink initialization failed", err);
    } finally {
      _deeplinkInitialized.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions, suggestionsLoading]);

  const handleShowQR = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      const title = data.membershipType === "victory" ? "PIC & SAF Form for Victory Members" : "PIC & SAF Form";
      const recipientForQr: Recipient | null = currentRecipient
        ? {
            kind: currentRecipient.type === "team" ? "team" : "missioner",
            id: currentRecipient.id,
            name: currentRecipient.label,
            nation: currentRecipient.nation ?? null,
            travelDate: currentRecipient.travelDate ?? null,
            sendingChurch: currentRecipient.sendingChurch ?? null,
          }
        : null;
      const finalDataUrl = await generateCompositeQr(url, { title, recipient: recipientForQr });
      setQrDataUrl(finalDataUrl);
      setShowQR(true);
      try {
        await navigator.clipboard.writeText(url);
        snackbar.show("Link copied to clipboard");
      } catch {
        // ignore clipboard failures
      }
    } catch (err) {
      console.warn("SupportFormBuilder: composite QR generation failed", err);
      // fallback to plain QR
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(url);
        setQrDataUrl(dataUrl);
        setShowQR(true);
      } catch (err2) {
        console.warn("SupportFormBuilder: fallback QR generation failed", err2);
        snackbar.show("Unable to generate QR code");
      }
    }
  };

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

  const handleGoToAccountability = () => {
    if (!goToAccountability()) {
      snackbar.show(VALIDATION_ERROR_MESSAGE);
    }
  };

  const handleGoToReview = () => {
    if (!goToReview()) {
      snackbar.show(VALIDATION_ERROR_MESSAGE);
    }
  };

  if (step !== "review") {
    return (
      <>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", right: 12, top: 12, zIndex: 60, display: "flex", gap: 8, alignItems: "center" }}>
              <div className={styles.shareControls}>
                <button className={styles.button} type="button" onClick={handleShowQR} disabled={!currentRecipient} aria-disabled={!currentRecipient} title={currentRecipient ? "Share link" : "Select a team or missioner to share"}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Share2 size={16} aria-hidden="true" />
                    <span className={styles.shareButtonLabel}>Share</span>
                  </span>
                </button>
              </div>
          </div>
          <FillStep
            data={data}
            step={step}
            fieldErrors={fieldErrors}
            formErrors={formErrors}
            isFormValid={isFormValid}
            isPartnerStepComplete={isPartnerStepComplete}
            isAccountabilityStepComplete={isAccountabilityStepComplete}
            onTextChange={onTextChange}
            onCurrencyChange={onCurrencyChange}
            onCheckboxChange={onCheckboxChange}
            onUnableToGoChange={onUnableToGoChange}
            onReroutedChange={onReroutedChange}
            onCanceledChange={onCanceledChange}
            onPartnerSignatureChange={setPartnerSignature}
            onPartnerTab={goToPartner}
            onAccountabilityTab={handleGoToAccountability}
            onReview={handleGoToReview}
            onReset={resetForm}
            setField={setField}
            onRecipientSelect={(item) => {
              // update local recipient state
              setCurrentRecipient(item ?? null);
              try {
                const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
                if (item) {
                  params.set("recipient", item.id);
                } else {
                  params.delete("recipient");
                }
                const qs = params.toString();
                router.replace(`${typeof window !== "undefined" ? window.location.pathname : "/"}${qs ? `?${qs}` : ""}`);
              } catch (err) {
                // Log router failures for debugging
                console.warn("SupportFormBuilder: failed to update recipient param", err);
              }
            }}
          />
        </div>
        <Snackbar message={snackbar.message} onDismiss={snackbar.dismiss} />

        {showQR ? (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80 }} onClick={() => setShowQR(false)}>
            <div style={{ background: "white", padding: 16, borderRadius: 8, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Share link</h3>
              {qrDataUrl ? (
                // Using a plain <img> because the QR is a generated data-URL
                // and cannot be optimized by `next/image`. This is intentional.
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="QR code" src={qrDataUrl} style={{ width: 300, height: 300 }} />
              ) : (
                <p>Generating QR...</p>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center" }}>
                {qrDataUrl ? (
                  <a className={styles.button} href={qrDataUrl} download="tdm-link-qr.png">Download</a>
                ) : null}
                <button className={styles.button} type="button" onClick={() => { setShowQR(false); }}>Close</button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <ReviewStep
        isExporting={isExporting}
        isPreparingPreview={isPreparingPreview}
        previewPdfUrl={reviewPdfUrl}
        previewError={previewError}
        onEditPartnerInfo={goToPartner}
        onEditAccountability={handleGoToAccountability}
        onDownloadPdf={downloadReviewPdf}
      />
      <Snackbar message={snackbar.message} onDismiss={snackbar.dismiss} />
    </>
  );
}
