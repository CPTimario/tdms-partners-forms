"use client";

import { useEffect, useRef, type ChangeEventHandler } from "react";
import Autocomplete from "./Autocomplete";
import { useTeamsWithSuggestions } from "@/hooks/useTeams";
import SignatureCanvas from "react-signature-canvas";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Lock, RotateCcw, Signature } from "lucide-react";
import styles from "./FormBuilder.module.css";
import {
  consentCopy,
  getAccountabilityAffirmationCopy,
  getAccountabilityInstructionCopy,
  getAccountabilityTitle,
  privacyCopy,
  type SupportFormFieldErrors,
  stepLabels,
  type EditableFormStep,
  type SupportFormData,
  type RequiredStringField,
} from "@/lib/support-form";

type FillStepProps = {
  data: SupportFormData;
  step: EditableFormStep;
  fieldErrors: SupportFormFieldErrors;
  formErrors: string[];
  isFormValid: boolean;
  isPartnerStepComplete: boolean;
  isAccountabilityStepComplete: boolean;
  onTextChange: (field: keyof Pick<SupportFormData, "partnerName" | "emailAddress" | "mobileNumber" | "localChurch" | "missionaryName" | "amount" | "nation" | "travelDate" | "sendingChurch" | "partnerPrintedName">) => ChangeEventHandler<HTMLInputElement>;
  onCurrencyChange: ChangeEventHandler<HTMLSelectElement>;
  onCheckboxChange: (field: "consentGiven") => ChangeEventHandler<HTMLInputElement>;
  onUnableToGoChange: ChangeEventHandler<HTMLInputElement>;
  onReroutedChange: ChangeEventHandler<HTMLInputElement>;
  onCanceledChange: ChangeEventHandler<HTMLInputElement>;
  onPartnerSignatureChange: (value: string) => void;
  onPartnerTab: () => void;
  onAccountabilityTab: () => void;
  onReview: () => void;
  onReset: () => void;
  // programmatic field setter from useSupportForm
  setField?: (field: RequiredStringField, value: string) => void;
};

type SignaturePadProps = {
  value: string;
  onChange: (value: string) => void;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

function SignaturePad({ value, onChange, ariaInvalid, ariaDescribedBy }: SignaturePadProps) {
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

    const nextValue = canvas.getTrimmedCanvas().toDataURL("image/png");
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
          "aria-invalid": ariaInvalid,
          "aria-describedby": ariaDescribedBy,
          tabIndex: 0,
        }}
      />
      <div className={styles.signaturePadActions}>
        <p className={styles.helperText}>Sign using mouse, touch, or stylus.</p>
        <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={handleClear}>
          <span className={styles.buttonContent}>
            <RotateCcw size={16} aria-hidden="true" />
            Clear Signature
          </span>
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
      aria-current={active ? "step" : undefined}
      onClick={onClick}
    >
      <span className={styles.tabNumber}>
        {step === "partner" ? "01" : step === "accountability" ? "02" : "03"}
      </span>
      <span className={styles.tabMeta}>
        <span className={styles.tabLabel}>{label}</span>
        <span className={styles.tabStatus}>
          {status === "Complete" ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
          {status === "Needs details" ? <AlertTriangle size={14} aria-hidden="true" /> : null}
          {status === "Locked" ? <Lock size={14} aria-hidden="true" /> : null}
          {status}
        </span>
      </span>
    </button>
  );
}

export function FillStep({
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
  onUnableToGoChange,
  onReroutedChange,
  onCanceledChange,
  onPartnerSignatureChange,
  onPartnerTab,
  onAccountabilityTab,
  onReview,
  onReset,
  setField,
}: FillStepProps) {
  const isPartnerTab = step === "partner";
  const hasFieldError = (name: keyof SupportFormFieldErrors) => Boolean(fieldErrors[name]);
  const errorId = (name: keyof SupportFormFieldErrors) => `support-form-error-${name}`;
  const renderFieldError = (name: keyof SupportFormFieldErrors) => {
    const message = fieldErrors[name];
    if (!message) {
      return null;
    }

    return (
      <p id={errorId(name)} className={styles.fieldError} role="alert">
        {message}
      </p>
    );
  };

  const { suggestions } = useTeamsWithSuggestions();

  return (
    <main className={`${styles.shell} ${styles.fillShell}`}>
      <div className={styles.card}>
        <header className={styles.headerBlock}>
          <h1 className={styles.title}>Ten Days Missions Support Forms</h1>
        </header>

        <nav className={styles.tabList} aria-label="Support form steps">
          <TabButton
            step="partner"
            label={stepLabels.partner}
            status={isPartnerStepComplete ? "Complete" : "Needs details"}
            active={step === "partner"}
            onClick={onPartnerTab}
          />
          <TabButton
            step="accountability"
            label={stepLabels.accountability}
            status={isAccountabilityStepComplete ? "Complete" : "Needs details"}
            active={step === "accountability"}
            onClick={onAccountabilityTab}
          />
          <TabButton
            step="review"
            label="Review"
            status={isFormValid ? "Ready" : "Locked"}
            active={false}
            onClick={onReview}
          />
        </nav>

        {formErrors.length > 0 ? (
          <ul className={styles.errorList} role="alert" aria-live="assertive" aria-atomic="true">
            {formErrors.map((message) => (
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
                  <input
                    className={`${styles.textInput} ${hasFieldError("partnerName") ? styles.textInputError : ""}`}
                    value={data.partnerName}
                    onChange={onTextChange("partnerName")}
                    aria-invalid={hasFieldError("partnerName")}
                    aria-describedby={hasFieldError("partnerName") ? errorId("partnerName") : undefined}
                  />
                  {renderFieldError("partnerName")}
                </label>
                <label className={styles.fieldLabel}>
                  Email Address
                  <input
                    className={`${styles.textInput} ${hasFieldError("emailAddress") ? styles.textInputError : ""}`}
                    value={data.emailAddress}
                    onChange={onTextChange("emailAddress")}
                    aria-invalid={hasFieldError("emailAddress")}
                    aria-describedby={hasFieldError("emailAddress") ? errorId("emailAddress") : undefined}
                  />
                  {renderFieldError("emailAddress")}
                </label>
                <label className={styles.fieldLabel}>
                  Mobile Number
                  <input
                    className={`${styles.textInput} ${hasFieldError("mobileNumber") ? styles.textInputError : ""}`}
                    value={data.mobileNumber}
                    onChange={onTextChange("mobileNumber")}
                    aria-invalid={hasFieldError("mobileNumber")}
                    aria-describedby={hasFieldError("mobileNumber") ? errorId("mobileNumber") : undefined}
                  />
                  {renderFieldError("mobileNumber")}
                </label>
                <label className={styles.fieldLabel}>
                  Local Church
                  <input
                    className={`${styles.textInput} ${hasFieldError("localChurch") ? styles.textInputError : ""}`}
                    value={data.localChurch}
                    onChange={onTextChange("localChurch")}
                    aria-invalid={hasFieldError("localChurch")}
                    aria-describedby={hasFieldError("localChurch") ? errorId("localChurch") : undefined}
                  />
                  {renderFieldError("localChurch")}
                </label>
              </fieldset>

              <fieldset className={styles.fieldBlock}>
                <legend>Recipient</legend>
                <label className={styles.fieldLabel}>
                  Missioner Name/Team
                  {/* Autocomplete: suggestions come from useTeams hook via parent */}
                  {/* Lazy import to reduce surface area; use a simple local component */}
                  <Autocomplete
                    value={data.missionaryName}
                    onChange={(v) => {
                      // update text input value
                      const handler = onTextChange("missionaryName");
                      handler({ target: { value: v } } as unknown as React.ChangeEvent<HTMLInputElement>);
                    }}
                    onSelect={(item) => {
                      // populate fields when a suggestion is selected
                      const handler = onTextChange("missionaryName");
                      handler({ target: { value: item.label } } as unknown as React.ChangeEvent<HTMLInputElement>);
                      if (setField) {
                        if (item.nation) setField("nation", item.nation);
                        if (item.travelDate) setField("travelDate", item.travelDate);
                        if (item.sendingChurch) setField("sendingChurch", item.sendingChurch);
                        if (item.team) setField("missionaryName", item.label);
                      }
                    }}
                    suggestions={suggestions ?? []}
                    placeholder="Type team or missioner name"
                  />
                  {renderFieldError("missionaryName")}
                </label>
                <label className={styles.fieldLabel}>
                  Amount
                  <div className={styles.currencyAmountRow}>
                    <select
                      className={`${styles.selectInput} ${hasFieldError("currency") ? styles.textInputError : ""}`}
                      value={data.currency}
                      onChange={onCurrencyChange}
                      aria-invalid={hasFieldError("currency")}
                      aria-describedby={hasFieldError("currency") ? errorId("currency") : undefined}
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                    </select>
                    <input
                      className={`${styles.textInput} ${hasFieldError("amount") ? styles.textInputError : ""}`}
                      inputMode="decimal"
                      placeholder="0.00"
                      value={data.amount}
                      onChange={onTextChange("amount")}
                      aria-invalid={hasFieldError("amount")}
                      aria-describedby={hasFieldError("amount") ? errorId("amount") : undefined}
                    />
                  </div>
                  {renderFieldError("currency")}
                  {renderFieldError("amount")}
                </label>
                <div className={styles.recipientDetailsGrid}>
                  <label className={styles.fieldLabel}>
                    Nation
                    <input
                      className={`${styles.textInput} ${hasFieldError("nation") ? styles.textInputError : ""}`}
                      value={data.nation}
                      onChange={onTextChange("nation")}
                      aria-invalid={hasFieldError("nation")}
                      aria-describedby={hasFieldError("nation") ? errorId("nation") : undefined}
                    />
                    {renderFieldError("nation")}
                  </label>
                  <label className={`${styles.fieldLabel} ${styles.dateFieldLabel}`}>
                    Travel Date
                    <input
                      className={`${styles.textInput} ${styles.dateInput} ${hasFieldError("travelDate") ? styles.textInputError : ""}`}
                      type="date"
                      value={data.travelDate}
                      onChange={onTextChange("travelDate")}
                      aria-invalid={hasFieldError("travelDate")}
                      aria-describedby={hasFieldError("travelDate") ? errorId("travelDate") : undefined}
                    />
                    {renderFieldError("travelDate")}
                  </label>
                </div>
                <label className={styles.fieldLabel}>
                  Sending Church
                  <input
                    className={`${styles.textInput} ${hasFieldError("sendingChurch") ? styles.textInputError : ""}`}
                    value={data.sendingChurch}
                    onChange={onTextChange("sendingChurch")}
                    aria-invalid={hasFieldError("sendingChurch")}
                    aria-describedby={hasFieldError("sendingChurch") ? errorId("sendingChurch") : undefined}
                  />
                  {renderFieldError("sendingChurch")}
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
                    aria-invalid={hasFieldError("consentGiven")}
                    aria-describedby={hasFieldError("consentGiven") ? errorId("consentGiven") : undefined}
                  />
                  {consentCopy}
                </span>
              </label>
              {renderFieldError("consentGiven")}
              <p className={styles.longText}>{privacyCopy}</p>
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
                    aria-describedby={hasFieldError("unableToGoChoice") ? errorId("unableToGoChoice") : undefined}
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
                    aria-describedby={hasFieldError("unableToGoChoice") ? errorId("unableToGoChoice") : undefined}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>
              {renderFieldError("unableToGoChoice")}

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
                    aria-describedby={hasFieldError("reroutedChoice") ? errorId("reroutedChoice") : undefined}
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
                    aria-describedby={hasFieldError("reroutedChoice") ? errorId("reroutedChoice") : undefined}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>
              {renderFieldError("reroutedChoice")}

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
                    aria-describedby={hasFieldError("canceledChoice") ? errorId("canceledChoice") : undefined}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>
              {renderFieldError("canceledChoice")}
            </fieldset>

            <fieldset className={styles.fieldBlock}>
              <legend>Signature</legend>
              <SignaturePad
                value={data.partnerSignature}
                onChange={onPartnerSignatureChange}
                ariaInvalid={hasFieldError("partnerSignature")}
                ariaDescribedBy={hasFieldError("partnerSignature") ? errorId("partnerSignature") : undefined}
              />
              {renderFieldError("partnerSignature")}

              <label className={styles.fieldLabel}>
                Partner Full Name (Printed)
                <input
                  className={`${styles.textInput} ${hasFieldError("partnerPrintedName") ? styles.textInputError : ""}`}
                  value={data.partnerPrintedName}
                  onChange={onTextChange("partnerPrintedName")}
                  aria-invalid={hasFieldError("partnerPrintedName")}
                  aria-describedby={hasFieldError("partnerPrintedName") ? errorId("partnerPrintedName") : undefined}
                />
                {renderFieldError("partnerPrintedName")}
              </label>
            </fieldset>
          </section>
        )}

        <div className={`${styles.actions} ${styles.stepActions}`}>
          <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={onReset}>
            <span className={styles.buttonContent}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset Form
            </span>
          </button>

          {isPartnerTab ? (
            <button className={styles.button} type="button" onClick={onAccountabilityTab}>
              <span className={styles.buttonContent}>
                Continue to Accountability
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
          ) : (
            <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={onPartnerTab}>
              <span className={styles.buttonContent}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back to Partner Information
              </span>
            </button>
          )}

          <button className={styles.button} type="button" onClick={onReview}>
            <span className={styles.buttonContent}>
              <Signature size={16} aria-hidden="true" />
              Review and Generate PDF
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
