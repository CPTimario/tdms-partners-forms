import { useEffect, useRef, type ChangeEventHandler } from "react";
import SignatureCanvas from "react-signature-canvas";
import styles from "./FormBuilder.module.css";
import {
  consentCopy,
  getAccountabilityAffirmationCopy,
  getAccountabilityInstructionCopy,
  getAccountabilityTitle,
  privacyCopy,
  stepLabels,
  type EditableFormStep,
  type SupportFormData,
  updatedCopy,
} from "@/lib/support-form";

type FillStepProps = {
  data: SupportFormData;
  step: EditableFormStep;
  validationErrors: string[];
  isFormValid: boolean;
  isPartnerStepComplete: boolean;
  isAccountabilityStepComplete: boolean;
  onTextChange: (field: keyof Pick<SupportFormData, "partnerName" | "emailAddress" | "mobileNumber" | "localChurch" | "missionaryName" | "amount" | "nation" | "travelDate" | "sendingChurch">) => ChangeEventHandler<HTMLInputElement>;
  onCheckboxChange: (field: "consentGiven") => ChangeEventHandler<HTMLInputElement>;
  onUnableToGoChange: ChangeEventHandler<HTMLInputElement>;
  onReroutedChange: ChangeEventHandler<HTMLInputElement>;
  onCanceledChange: ChangeEventHandler<HTMLInputElement>;
  onPartnerSignatureChange: (value: string) => void;
  onPartnerTab: () => void;
  onAccountabilityTab: () => void;
  onReview: () => void;
  onReset: () => void;
};

type SignaturePadProps = {
  value: string;
  onChange: (value: string) => void;
};

function SignaturePad({ value, onChange }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const loadedValueRef = useRef("");

  useEffect(() => {
    const canvas = signatureRef.current;
    if (!canvas) {
      return;
    }

    if (!value) {
      if (!canvas.isEmpty()) {
        canvas.clear();
      }
      loadedValueRef.current = "";
      return;
    }

    if (value !== loadedValueRef.current) {
      canvas.fromDataURL(value);
      loadedValueRef.current = value;
    }
  }, [value]);

  const handleEnd = () => {
    const canvas = signatureRef.current;
    if (!canvas) {
      return;
    }

    if (canvas.isEmpty()) {
      loadedValueRef.current = "";
      onChange("");
      return;
    }

    const nextValue = canvas.toDataURL("image/png");
    loadedValueRef.current = nextValue;
    onChange(nextValue);
  };

  const handleClear = () => {
    const canvas = signatureRef.current;
    if (!canvas) {
      return;
    }

    canvas.clear();
    loadedValueRef.current = "";
    onChange("");
  };

  return (
    <div className={styles.signaturePadWrap}>
      <SignatureCanvas
        ref={(instance) => {
          signatureRef.current = instance;
        }}
        onEnd={handleEnd}
        penColor="#111111"
        minWidth={1}
        maxWidth={2}
        canvasProps={{
          className: styles.signaturePad,
          "aria-label": "Partner Signature",
        }}
      />
      <div className={styles.signaturePadActions}>
        <p className={styles.helperText}>Sign using mouse, touch, or stylus.</p>
        <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={handleClear}>
          Clear Signature
        </button>
      </div>
    </div>
  );
}

type TabButtonProps = {
  step: "partner" | "accountability" | "review";
  label: string;
  status: string;
  active: boolean;
  onClick: () => void;
};

function TabButton({ step, label, status, active, onClick }: TabButtonProps) {
  return (
    <button
      className={`${styles.tabButton} ${active ? styles.tabButtonActive : ""}`}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      <span className={styles.tabNumber}>
        {step === "partner" ? "01" : step === "accountability" ? "02" : "03"}
      </span>
      <span className={styles.tabMeta}>
        <span className={styles.tabLabel}>{label}</span>
        <span className={styles.tabStatus}>{status}</span>
      </span>
    </button>
  );
}

export function FillStep({
  data,
  step,
  validationErrors,
  isFormValid,
  isPartnerStepComplete,
  isAccountabilityStepComplete,
  onTextChange,
  onCheckboxChange,
  onUnableToGoChange,
  onReroutedChange,
  onCanceledChange,
  onPartnerSignatureChange,
  onPartnerTab,
  onAccountabilityTab,
  onReview,
  onReset,
}: FillStepProps) {
  const isPartnerTab = step === "partner";

  return (
    <main className={`${styles.shell} ${styles.fillShell}`}>
      <div className={styles.card}>
        <header className={styles.headerBlock}>
          <h1 className={styles.title}>Ten Days Missions Support Forms</h1>
        </header>

        <div className={styles.tabList} role="tablist" aria-label="Support form steps">
          <TabButton
            step="partner"
            label={stepLabels.partner}
            status={isPartnerStepComplete ? "Ready for review" : "Incomplete"}
            active={step === "partner"}
            onClick={onPartnerTab}
          />
          <TabButton
            step="accountability"
            label={stepLabels.accountability}
            status={isAccountabilityStepComplete ? "Ready for review" : "Incomplete"}
            active={step === "accountability"}
            onClick={onAccountabilityTab}
          />
          <TabButton
            step="review"
            label="Review"
            status={isFormValid ? "Available" : "Locked until complete"}
            active={false}
            onClick={onReview}
          />
        </div>

        {validationErrors.length > 0 ? (
          <ul className={styles.errorList}>
            {validationErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}

        {isPartnerTab ? (
          <section className={styles.stepSection} aria-labelledby="partner-information-step">
            <div className={styles.stepIntroCard}>
              <p className={styles.stepEyebrow}>Step 1</p>
              <h2 className={styles.stepTitle} id="partner-information-step">
                {stepLabels.partner}
              </h2>
            </div>

            <div className={styles.formColumns}>
              <fieldset className={styles.fieldBlock}>
                <legend>Partner</legend>
                <label className={styles.fieldLabel}>
                  Partner Name
                  <input className={styles.textInput} value={data.partnerName} onChange={onTextChange("partnerName")} />
                </label>
                <label className={styles.fieldLabel}>
                  Email Address
                  <input className={styles.textInput} value={data.emailAddress} onChange={onTextChange("emailAddress")} />
                </label>
                <label className={styles.fieldLabel}>
                  Mobile Number
                  <input className={styles.textInput} value={data.mobileNumber} onChange={onTextChange("mobileNumber")} />
                </label>
                <label className={styles.fieldLabel}>
                  Local Church
                  <input className={styles.textInput} value={data.localChurch} onChange={onTextChange("localChurch")} />
                </label>
              </fieldset>

              <fieldset className={styles.fieldBlock}>
                <legend>Recipient</legend>
                <label className={styles.fieldLabel}>
                  Missioner Name/Team
                  <input className={styles.textInput} value={data.missionaryName} onChange={onTextChange("missionaryName")} />
                </label>
                <label className={styles.fieldLabel}>
                  Amount
                  <input className={styles.textInput} value={data.amount} onChange={onTextChange("amount")} />
                </label>
                <div className={styles.recipientDetailsGrid}>
                  <label className={styles.fieldLabel}>
                    Nation
                    <input className={styles.textInput} value={data.nation} onChange={onTextChange("nation")} />
                  </label>
                  <label className={`${styles.fieldLabel} ${styles.dateFieldLabel}`}>
                    Travel Date
                    <input
                      className={`${styles.textInput} ${styles.dateInput}`}
                      type="date"
                      value={data.travelDate}
                      onChange={onTextChange("travelDate")}
                    />
                  </label>
                </div>
                <label className={styles.fieldLabel}>
                  Sending Church
                  <input className={styles.textInput} value={data.sendingChurch} onChange={onTextChange("sendingChurch")} />
                </label>
              </fieldset>
            </div>

            <fieldset className={styles.fieldBlock}>
              <legend>Consent</legend>
              <label className={styles.fieldLabel}>
                <span>
                  <input
                    className={styles.choiceInput}
                    type="checkbox"
                    checked={data.consentGiven}
                    onChange={onCheckboxChange("consentGiven")}
                  />
                  {consentCopy}
                </span>
              </label>
              <p className={styles.longText}>{privacyCopy}</p>
              <p className={styles.mutedCaption}>{updatedCopy}</p>
            </fieldset>
          </section>
        ) : (
          <section className={styles.stepSection} aria-labelledby="accountability-step">
            <div className={styles.stepIntroCard}>
              <p className={styles.stepEyebrow}>Step 2</p>
              <h2 className={styles.stepTitle} id="accountability-step">
                {stepLabels.accountability}
              </h2>
            </div>

            <section className={styles.statementCard} aria-label="Accountability statement">
              <h3 className={styles.statementTitle}>{getAccountabilityTitle(data.membershipType)}</h3>
              <p className={styles.statementText}>{getAccountabilityAffirmationCopy(data.membershipType)}</p>
              {getAccountabilityInstructionCopy(data.membershipType) ? (
                <p className={styles.statementText}>{getAccountabilityInstructionCopy(data.membershipType)}</p>
              ) : null}
            </section>

            <fieldset className={styles.fieldBlock}>
              <legend>Accountability Options</legend>

              <p className={styles.groupLabel}>If the missioner is unable to go:</p>
              <label className={styles.fieldLabel}>
                <span>
                  <input
                    className={styles.choiceInput}
                    type="radio"
                    name="unableToGo"
                    value="teamFund"
                    checked={data.unableToGoChoice === "teamFund"}
                    onChange={onUnableToGoChange}
                  />
                  Redirect my support to the team fund
                </span>
              </label>
              <label className={styles.fieldLabel}>
                <span>
                  <input
                    className={styles.choiceInput}
                    type="radio"
                    name="unableToGo"
                    value="generalFund"
                    checked={data.unableToGoChoice === "generalFund"}
                    onChange={onUnableToGoChange}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>

              <p className={styles.groupLabel}>If the missioner or team is rerouted:</p>
              <label className={styles.fieldLabel}>
                <span>
                  <input
                    className={styles.choiceInput}
                    type="radio"
                    name="rerouted"
                    value="retain"
                    checked={data.reroutedChoice === "retain"}
                    onChange={onReroutedChange}
                  />
                  Retain my support
                </span>
              </label>
              <label className={styles.fieldLabel}>
                <span>
                  <input
                    className={styles.choiceInput}
                    type="radio"
                    name="rerouted"
                    value="generalFund"
                    checked={data.reroutedChoice === "generalFund"}
                    onChange={onReroutedChange}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>

              <p className={styles.groupLabel}>If the trip is canceled:</p>
              <label className={styles.fieldLabel}>
                <span>
                  <input
                    className={styles.choiceInput}
                    type="radio"
                    name="canceled"
                    value="generalFund"
                    checked={data.canceledChoice === "generalFund"}
                    onChange={onCanceledChange}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>
            </fieldset>

            <fieldset className={styles.fieldBlock}>
              <legend>Signature</legend>
              <SignaturePad value={data.partnerSignature} onChange={onPartnerSignatureChange} />
            </fieldset>
          </section>
        )}

        <div className={`${styles.actions} ${styles.stepActions}`}>
          <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={onReset}>
            Clear Form
          </button>

          {isPartnerTab ? (
            <button className={styles.button} type="button" onClick={onAccountabilityTab}>
              Continue to Accountability
            </button>
          ) : (
            <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={onPartnerTab}>
              Back to Partner Information
            </button>
          )}

          <button className={styles.button} type="button" onClick={onReview}>
            Review Forms
          </button>
        </div>
      </div>
    </main>
  );
}
