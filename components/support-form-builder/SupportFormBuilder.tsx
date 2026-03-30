"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  downloadPDF,
  generateReviewPDF,
} from "@/lib/pdf-generator";
import { useSupportForm } from "@/hooks/use-support-form";
type RecipientSuggestion = {
  id: string;
  label: string;
  type?: "team" | "missioner";
  team?: string;
  nation?: string;
  travelDate?: string;
  sendingChurch?: string;
};
import { Share2 } from "lucide-react";
 
import { generateCompositeQr } from "@/lib/qr";
import { createRecipientToken } from "@/lib/deeplink-client";
import {
  getAccountabilityAffirmationCopy,
  type MembershipType,
  type SupportFormFieldErrors,
} from "@/lib/support-form";
import { FillStep } from "@/components/support-form-builder/FillStep";
import AppSnackbar from "@/components/ui/Snackbar";
import Button from "@mui/material/Button";
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
          <Button variant="contained" onClick={() => router.push("/victory")}>Yes</Button>
          <Button variant="contained" onClick={() => router.push("/non-victory")}>No</Button>
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
          <Button variant="contained" onClick={onAgree}>I Agree</Button>
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
    setValidation,
  } = useSupportForm(membershipType);
  // setField allows programmatic updates to text fields (used when populating from deeplinks or selections)
  const snackbar = useSnackbar();
  const [isExporting, setIsExporting] = useState(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [reviewPdfBytes, setReviewPdfBytes] = useState<Uint8Array | null>(null);
  const [reviewPdfUrl, setReviewPdfUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  // suggestions/API removed; keeping compatible types

  // QR/share state
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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

  // Initialize form fields from encrypted URL deeplink param `recipient`
  const _deeplinkInitialized = useRef(false);
  // cache: payloadKey -> token
  const tokenCacheRef = useRef<Map<string, string>>(new Map());
  const inflightAbortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (_deeplinkInitialized.current) return;
    try {
      const recipientParam = searchParams.get("recipient");
      if (!recipientParam) {
        _deeplinkInitialized.current = true;
        return;
      }

      // Ask server to decrypt the token so the secret key stays server-side
      void (async () => {
        try {
          const res = await fetch(`/api/deeplink?token=${encodeURIComponent(recipientParam)}`);
          if (!res.ok) return;
          const json = await res.json();
          const parsed = json.fields as Record<string, string> | null;
          if (parsed && setField) {
            if (parsed.missionaryName) setField("missionaryName", parsed.missionaryName);
            if (parsed.nation) setField("nation", parsed.nation);
            if (parsed.travelDate) setField("travelDate", parsed.travelDate);
            if (parsed.sendingChurch) setField("sendingChurch", parsed.sendingChurch);
          }
        } catch (err) {
          console.warn("SupportFormBuilder: deeplink fetch failed", err);
        }
      })();
    } catch (err) {
      console.warn("SupportFormBuilder: deeplink initialization failed", err);
    } finally {
      _deeplinkInitialized.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounced sync: when share-related fields are present & valid, create token and update URL
  useEffect(() => {
    // Only run client-side
    if (typeof window === "undefined") return;

    const m = String(data.missionaryName ?? "").trim();
    const n = String(data.nation ?? "").trim();
    const t = String(data.travelDate ?? "").trim();
    const s = String(data.sendingChurch ?? "").trim();

    const requiredPresent = m && n && t && s;
    if (!requiredPresent) {
      return;
    }

    // validate travelDate >= today (local)
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, "0");
    const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (t < localToday) return;

    const payload = { missionaryName: m, nation: n, travelDate: t, sendingChurch: s };
    const payloadKey = JSON.stringify(payload);

    const updateUrlWithToken = (token: string) => {
      try {
        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        if (params.get("recipient") === token) return;
        params.set("recipient", token);
        const qs = params.toString();
        router.replace(`${typeof window !== "undefined" ? window.location.pathname : "/"}${qs ? `?${qs}` : ""}`);
      } catch (err) {
        // ignore router errors
      }
    };

    // cached token -> update immediately
    const cached = tokenCacheRef.current.get(payloadKey);
    if (cached) {
      updateUrlWithToken(cached);
      return;
    }

    // debounce token creation
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(async () => {
      // cancel previous inflight
      if (inflightAbortRef.current) inflightAbortRef.current.abort();
      const ac = new AbortController();
      inflightAbortRef.current = ac;
      try {
        const token = await createRecipientToken(payload, ac.signal);
        tokenCacheRef.current.set(payloadKey, token);
        updateUrlWithToken(token);
      } catch (err) {
        // ignore network/errors (including abort)
      } finally {
        inflightAbortRef.current = null;
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      // abort any inflight request when dependencies change or on unmount
      if (inflightAbortRef.current) {
        inflightAbortRef.current.abort();
        inflightAbortRef.current = null;
      }
    };
  // only watch the four fields
  }, [data.missionaryName, data.nation, data.travelDate, data.sendingChurch, router]);

  const handleShowQR = async () => {
    const currentHref = typeof window !== "undefined" ? window.location.href : "";

    // require these fields for deeplinking/QR
    const missing: SupportFormFieldErrors = {};
    if (!data.missionaryName || !String(data.missionaryName).trim()) missing.missionaryName = "This field is required to share a QR link.";
    if (!data.nation || !String(data.nation).trim()) missing.nation = "This field is required to share a QR link.";
    if (!data.travelDate || !String(data.travelDate).trim()) missing.travelDate = "This field is required to share a QR link.";
    if (!data.sendingChurch || !String(data.sendingChurch).trim()) missing.sendingChurch = "This field is required to share a QR link.";

    // ensure travelDate is today or later (compare YYYY-MM-DD strings in local date)
    if (data.travelDate && String(data.travelDate).trim()) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      if (String(data.travelDate) < localToday) {
        missing.travelDate = "Travel date must be today or later to share a QR link.";
      }
    }

    if (Object.keys(missing).length > 0) {
      setValidation({ fieldErrors: missing, formErrors: [] });
      snackbar.show(VALIDATION_ERROR_MESSAGE);
      return;
    }

    const title = data.membershipType === "victory" ? "PIC & SAF Form for Victory Members" : "PIC & SAF Form";

    try {
      const recipientPayload: Record<string, string> = {
        missionaryName: data.missionaryName ?? "",
        nation: data.nation ?? "",
        travelDate: data.travelDate ?? "",
        sendingChurch: data.sendingChurch ?? "",
      };

      // Request server to create encrypted token (server keeps DEEPLINK_KEY)
      const tokenRes = await fetch("/api/deeplink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipientPayload),
      });
      if (!tokenRes.ok) throw new Error("unable to create deeplink token");
      const tokenJson = await tokenRes.json();
      const token = tokenJson.token as string;

      const shareUrl = new URL(currentHref || "http://localhost");
      shareUrl.searchParams.set("recipient", token);

      const finalDataUrl = await generateCompositeQr(shareUrl.toString(), {
        title,
        recipient: {
          kind: "missioner",
          id: String(data.missionaryName ?? ""),
          name: data.missionaryName ?? null,
          nation: data.nation ?? null,
          travelDate: data.travelDate ?? null,
          sendingChurch: data.sendingChurch ?? null,
        },
      });
      setQrDataUrl(finalDataUrl);
      setShowQR(true);
      try {
        await navigator.clipboard.writeText(shareUrl.toString());
        snackbar.show("Link copied to clipboard");
      } catch {
        // ignore clipboard failures
      }
    } catch (err) {
      console.warn("SupportFormBuilder: composite QR generation failed", err);
      // fallback to plain QR
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(currentHref || "");
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
                <Button className={styles.button} type="button" onClick={handleShowQR} title="Share link" startIcon={<Share2 size={16} aria-hidden="true" />}>
                  <span className={styles.shareButtonLabel}>Share</span>
                </Button>
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
            onRecipientSelect={async (item: RecipientSuggestion | null) => {
              // When a suggestion is selected (if present), populate fields and set an encrypted recipient token in the URL.
              if (item) {
                if (setField) {
                  if (item.label) setField("missionaryName", item.label);
                  if (item.nation) setField("nation", item.nation);
                  if (item.travelDate) setField("travelDate", item.travelDate);
                  if (item.sendingChurch) setField("sendingChurch", item.sendingChurch);
                }
                try {
                  const payload = {
                    missionaryName: item.label,
                    nation: item.nation ?? "",
                    travelDate: item.travelDate ?? "",
                    sendingChurch: item.sendingChurch ?? "",
                  };
                  const tokenRes = await fetch("/api/deeplink", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!tokenRes.ok) throw new Error("failed to create token");
                  const tokenJson = await tokenRes.json();
                  const token = tokenJson.token as string;

                  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
                  params.set("recipient", token);
                  const qs = params.toString();
                  router.replace(`${typeof window !== "undefined" ? window.location.pathname : "/"}${qs ? `?${qs}` : ""}`);
                } catch (err) {
                  console.warn("SupportFormBuilder: failed to update recipient param", err);
                }
                return;
              }

              try {
                const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
                params.delete("recipient");
                const qs = params.toString();
                router.replace(`${typeof window !== "undefined" ? window.location.pathname : "/"}${qs ? `?${qs}` : ""}`);
              } catch (err) {
                console.warn("SupportFormBuilder: failed to clear recipient param", err);
              }
            }}
          />
        </div>
        <AppSnackbar open={Boolean(snackbar.message)} message={snackbar.message} onClose={snackbar.dismiss} />

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
                <Button className={styles.button} type="button" onClick={() => { setShowQR(false); }} variant="outlined">Close</Button>
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
      <AppSnackbar open={Boolean(snackbar.message)} message={snackbar.message} onClose={snackbar.dismiss} />
    </>
  );
}
