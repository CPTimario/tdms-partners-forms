"use client";

import { useEffect, useRef, type ChangeEventHandler, type ChangeEvent } from "react";
import TextField from "@mui/material/TextField";
import dayjs, { type Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import MenuItem from "@mui/material/MenuItem";
type RecipientSuggestion = {
  id: string;
  label: string;
  type?: "team" | "missioner";
  team?: string;
  nation?: string;
  travelDate?: string;
  sendingChurch?: string;
};
import SignatureCanvas from "react-signature-canvas";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Lock, RotateCcw, Signature } from "lucide-react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "./FormBuilder.module.css";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
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
  onRecipientSelect?: (item: RecipientSuggestion | null) => void;
};

type SignaturePadProps = {
  value: string;
  onChange: (value: string) => void;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};



// NOTE: value stored as ISO yyyy-mm-dd

type DatePickerInlineProps = {
  value: string;
  id?: string;
  setField?: (field: RequiredStringField, value: string) => void;
  onTextChange: (field: keyof Pick<SupportFormData, "partnerName" | "emailAddress" | "mobileNumber" | "localChurch" | "missionaryName" | "amount" | "nation" | "travelDate" | "sendingChurch" | "partnerPrintedName">) => ChangeEventHandler<HTMLInputElement>;
  hasFieldError: boolean;
  errorId: string;
};

const DatePickerInline = ({ value, id, setField, onTextChange, hasFieldError, errorId }: DatePickerInlineProps) => {
  const parsed: Dayjs | null = value ? dayjs(value, "YYYY-MM-DD") : null;

  const handleDateChange = (next: Dayjs | null) => {
    const val = next ? next.format("YYYY-MM-DD") : "";
    if (setField) {
      setField("travelDate", val);
    } else {
      const handler = onTextChange("travelDate");
      const synthetic = { target: { value: val } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handler(synthetic);
    }
  };

  return (
    <div className={styles.dateInputWrap}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          enableAccessibleFieldDOMStructure={false}
          value={parsed}
          onChange={handleDateChange}
          disablePast
          minDate={dayjs().startOf("day")}
          slots={{ textField: TextField }}
          slotProps={{
            textField: {
              id,
              size: "small",
              variant: "outlined",
              className: `${styles.textInput} ${styles.dateInput} ${hasFieldError ? styles.textInputError : ""}`,
              placeholder: "MM/DD/YYYY",
              inputProps: {
                inputMode: "numeric",
                "aria-invalid": hasFieldError,
                "aria-describedby": hasFieldError ? errorId : undefined,
              },
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

function SignaturePad({ value, onChange, ariaInvalid, ariaDescribedBy }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const loadedValueRef = useRef("");

  useEffect(() => {
    const canvas = signatureRef.current;
    if (!canvas) return;

    if (!value) {
      if (!canvas.isEmpty()) canvas.clear();
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
    if (!canvas) return;

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
    if (!canvas) return;
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
        <Button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={handleClear} variant="outlined">
          <span className={styles.buttonContent}>
            <RotateCcw size={16} aria-hidden="true" />
            Clear Signature
          </span>
        </Button>
      </div>
    </div>
  );
}

// Use MUI Tabs for step navigation
function renderTabLabel(number: string, label: string, status: string) {
  return (
    <span className={styles.tabMeta}>
      <span className={styles.tabNumber}>{number}</span>
      <span className={styles.tabLabel}>{label}</span>
      <span className={styles.tabStatus}>
        {status === "Complete" ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
        {status === "Needs details" ? <AlertTriangle size={14} aria-hidden="true" /> : null}
        {status === "Locked" ? <Lock size={14} aria-hidden="true" /> : null}
        {status}
      </span>
    </span>
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
  onRecipientSelect,
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

  // simple responsive switch: use scrollable tabs on xs, fullWidth on sm+
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  const tabsSx = {
    width: "100%",
    '& .MuiTabs-scroller': { scrollSnapType: isSmUp ? 'none' : 'x mandatory' },
    '& .MuiTabs-flexContainer': { width: '100%', display: 'flex' },
  };

  const tabSx = {
    wrapped: true,
    sx: {
      flex: { xs: '0 0 100%', sm: '1 1 0' },
      width: { xs: '100%', sm: 'auto' },
      minWidth: { xs: 0, sm: 0 },
      scrollSnapAlign: { xs: 'start', sm: 'none' },
    },
  } as const;


  return (
    <main className={`${styles.shell} ${styles.fillShell}`}>
      <div className={styles.card}>
        <header className={styles.headerBlock}>
          <h1 className={styles.title}>Ten Days Missions Support Forms</h1>
        </header>

        <nav className={styles.tabList} aria-label="Support form steps">
          <Tabs
            value={step}
            variant={isSmUp ? "fullWidth" : "scrollable"}
            scrollButtons={isSmUp ? undefined : "auto"}
            allowScrollButtonsMobile={!isSmUp}
            sx={tabsSx}
            onChange={(_: React.SyntheticEvent, newValue: string) => {
              if (newValue === "partner") onPartnerTab();
              else if (newValue === "accountability") onAccountabilityTab();
              else if (newValue === "review") onReview();
            }}
            aria-label="Support form steps"
          >
            <Tab {...tabSx} label={<div className={styles.tabButton}>{renderTabLabel("01", stepLabels.partner, isPartnerStepComplete ? "Complete" : "Needs details")}</div>} value="partner" />
            <Tab {...tabSx} label={<div className={styles.tabButton}>{renderTabLabel("02", stepLabels.accountability, isAccountabilityStepComplete ? "Complete" : "Needs details")}</div>} value="accountability" />
            <Tab {...tabSx} label={<div className={styles.tabButton}>{renderTabLabel("03", "Review", isFormValid ? "Ready" : "Locked")}</div>} value="review" />
          </Tabs>
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
                  <TextField
                    id="support-partnerName"
                    size="small"
                    variant="outlined"
                    className={styles.textInput}
                    value={data.partnerName}
                    onChange={onTextChange("partnerName")}
                    error={hasFieldError("partnerName")}
                    inputProps={{
                      "aria-invalid": hasFieldError("partnerName"),
                      "aria-describedby": hasFieldError("partnerName") ? errorId("partnerName") : undefined,
                    }}
                  />
                  {renderFieldError("partnerName")}
                </label>
                <label className={styles.fieldLabel}>
                  Email Address
                  <TextField
                    id="support-emailAddress"
                    size="small"
                    variant="outlined"
                    className={styles.textInput}
                    value={data.emailAddress}
                    onChange={onTextChange("emailAddress")}
                    error={hasFieldError("emailAddress")}
                    inputProps={{
                      "aria-invalid": hasFieldError("emailAddress"),
                      "aria-describedby": hasFieldError("emailAddress") ? errorId("emailAddress") : undefined,
                    }}
                  />
                  {renderFieldError("emailAddress")}
                </label>
                <label className={styles.fieldLabel}>
                  Mobile Number
                  <TextField
                    id="support-mobileNumber"
                    size="small"
                    variant="outlined"
                    className={styles.textInput}
                    value={data.mobileNumber}
                    onChange={onTextChange("mobileNumber")}
                    error={hasFieldError("mobileNumber")}
                    inputProps={{
                      "aria-invalid": hasFieldError("mobileNumber"),
                      "aria-describedby": hasFieldError("mobileNumber") ? errorId("mobileNumber") : undefined,
                    }}
                  />
                  {renderFieldError("mobileNumber")}
                </label>
                <label className={styles.fieldLabel}>
                  Local Church
                  <TextField
                    id="support-localChurch"
                    size="small"
                    variant="outlined"
                    className={styles.textInput}
                    value={data.localChurch}
                    onChange={onTextChange("localChurch")}
                    error={hasFieldError("localChurch")}
                    inputProps={{
                      "aria-invalid": hasFieldError("localChurch"),
                      "aria-describedby": hasFieldError("localChurch") ? errorId("localChurch") : undefined,
                    }}
                  />
                  {renderFieldError("localChurch")}
                </label>
              </fieldset>

              <fieldset className={styles.fieldBlock}>
                <legend>Recipient</legend>
                <label className={styles.fieldLabel}>
                  Missioner Name/Team
                  <TextField
                    id="support-missionaryName"
                    size="small"
                    variant="outlined"
                    className={styles.textInput}
                    value={data.missionaryName}
                    onChange={(e) => {
                      const handler = onTextChange("missionaryName");
                      handler(e as unknown as React.ChangeEvent<HTMLInputElement>);
                      onRecipientSelect?.(null);
                    }}
                    error={hasFieldError("missionaryName")}
                    inputProps={{
                      placeholder: "Type team or missioner name",
                      "aria-invalid": hasFieldError("missionaryName"),
                    }}
                  />
                  {renderFieldError("missionaryName")}
                </label>
                <label className={styles.fieldLabel}>
                  Amount
                  <div className={styles.currencyAmountRow}>
                    <TextField
                      id="support-currency"
                      select
                      size="small"
                      variant="outlined"
                      className={styles.selectInput}
                      value={data.currency}
                      onChange={(e) => onCurrencyChange(e as unknown as React.ChangeEvent<HTMLSelectElement>)}
                      error={hasFieldError("currency")}
                      inputProps={{
                        "aria-invalid": hasFieldError("currency"),
                        "aria-describedby": hasFieldError("currency") ? errorId("currency") : undefined,
                      }}
                    >
                      <MenuItem value="PHP">PHP</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                    </TextField>
                    <TextField
                      id="support-amount"
                      size="small"
                      variant="outlined"
                      className={styles.textInput}
                      inputProps={{ inputMode: "decimal", "aria-invalid": hasFieldError("amount"), "aria-describedby": hasFieldError("amount") ? errorId("amount") : undefined }}
                      placeholder="0.00"
                      value={data.amount}
                      onChange={onTextChange("amount")}
                      error={hasFieldError("amount")}
                    />
                  </div>
                  {renderFieldError("currency")}
                  {renderFieldError("amount")}
                </label>
                <div className={styles.recipientDetailsGrid}>
                  <label className={styles.fieldLabel}>
                    Nation
                    <TextField
                      id="support-nation"
                      size="small"
                      variant="outlined"
                      className={styles.textInput}
                      value={data.nation}
                      onChange={onTextChange("nation")}
                      error={hasFieldError("nation")}
                      inputProps={{
                        "aria-invalid": hasFieldError("nation"),
                        "aria-describedby": hasFieldError("nation") ? errorId("nation") : undefined,
                      }}
                    />
                    {renderFieldError("nation")}
                  </label>
                  <label className={`${styles.fieldLabel} ${styles.dateFieldLabel}`}>
                    Travel Date
                    <DatePickerInline
                      value={data.travelDate}
                      setField={setField}
                      onTextChange={onTextChange}
                      id="support-travelDate"
                      hasFieldError={hasFieldError("travelDate")}
                      errorId={errorId("travelDate")}
                    />
                    {renderFieldError("travelDate")}
                  </label>
                </div>
                <label className={styles.fieldLabel}>
                  Sending Church
                  <TextField
                    id="support-sendingChurch"
                    size="small"
                    variant="outlined"
                    className={styles.textInput}
                    value={data.sendingChurch}
                    onChange={onTextChange("sendingChurch")}
                    error={hasFieldError("sendingChurch")}
                    inputProps={{
                      "aria-invalid": hasFieldError("sendingChurch"),
                      "aria-describedby": hasFieldError("sendingChurch") ? errorId("sendingChurch") : undefined,
                    }}
                  />
                  {renderFieldError("sendingChurch")}
                </label>
              </fieldset>
            </div>

            <fieldset className={styles.fieldBlock}>
              <legend>Consent</legend>
              <label className={styles.fieldLabel}>
                <span>
                  <Checkbox
                    className={styles.choiceInput}
                    checked={data.consentGiven}
                    onChange={(e) => onCheckboxChange("consentGiven")(e as unknown as ChangeEvent<HTMLInputElement>)}
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
                  <Radio
                    className={styles.choiceInput}
                    name="unableToGo"
                    value="teamFund"
                    checked={data.unableToGoChoice === "teamFund"}
                    onChange={(e) => onUnableToGoChange(e as unknown as ChangeEvent<HTMLInputElement>)}
                    aria-describedby={hasFieldError("unableToGoChoice") ? errorId("unableToGoChoice") : undefined}
                  />
                  Redirect my support to the team fund
                </span>
              </label>
              <label className={styles.fieldLabel}>
                <span>
                  <Radio
                    className={styles.choiceInput}
                    name="unableToGo"
                    value="generalFund"
                    checked={data.unableToGoChoice === "generalFund"}
                    onChange={(e) => onUnableToGoChange(e as unknown as ChangeEvent<HTMLInputElement>)}
                    aria-describedby={hasFieldError("unableToGoChoice") ? errorId("unableToGoChoice") : undefined}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>
              {renderFieldError("unableToGoChoice")}

              <p className={styles.groupLabel}>If the missioner or team is rerouted:</p>
              <label className={styles.fieldLabel}>
                <span>
                  <Radio
                    className={styles.choiceInput}
                    name="rerouted"
                    value="retain"
                    checked={data.reroutedChoice === "retain"}
                    onChange={(e) => onReroutedChange(e as unknown as ChangeEvent<HTMLInputElement>)}
                    aria-describedby={hasFieldError("reroutedChoice") ? errorId("reroutedChoice") : undefined}
                  />
                  Retain my support
                </span>
              </label>
              <label className={styles.fieldLabel}>
                <span>
                  <Radio
                    className={styles.choiceInput}
                    name="rerouted"
                    value="generalFund"
                    checked={data.reroutedChoice === "generalFund"}
                    onChange={(e) => onReroutedChange(e as unknown as ChangeEvent<HTMLInputElement>)}
                    aria-describedby={hasFieldError("reroutedChoice") ? errorId("reroutedChoice") : undefined}
                  />
                  Redirect my support to the Every Nation World Missions General Fund
                </span>
              </label>
              {renderFieldError("reroutedChoice")}

              <p className={styles.groupLabel}>If the trip is canceled:</p>
              <label className={styles.fieldLabel}>
                <span>
                  <Radio
                    className={styles.choiceInput}
                    name="canceled"
                    value="generalFund"
                    checked={data.canceledChoice === "generalFund"}
                    onChange={(e) => onCanceledChange(e as unknown as ChangeEvent<HTMLInputElement>)}
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
                <TextField
                  id="support-partnerPrintedName"
                  size="small"
                  variant="outlined"
                  className={styles.textInput}
                  value={data.partnerPrintedName}
                  onChange={onTextChange("partnerPrintedName")}
                  error={hasFieldError("partnerPrintedName")}
                  inputProps={{
                    "aria-invalid": hasFieldError("partnerPrintedName"),
                    "aria-describedby": hasFieldError("partnerPrintedName") ? errorId("partnerPrintedName") : undefined,
                  }}
                />
                {renderFieldError("partnerPrintedName")}
              </label>
            </fieldset>
          </section>
        )}

        <div className={`${styles.actions} ${styles.stepActions}`}>
          <Button
            className={`${styles.button} ${styles.secondaryButton}`}
            type="button"
            onClick={onReset}
            startIcon={<RotateCcw size={16} aria-hidden="true" />}
            variant="outlined"
          >
            Reset Form
          </Button>

          {isPartnerTab ? (
            <Button
              className={styles.button}
              type="button"
              onClick={onAccountabilityTab}
              endIcon={<ArrowRight size={16} aria-hidden="true" />}
              variant="contained"
            >
              Continue to Accountability
            </Button>
          ) : (
            <Button
              className={`${styles.button} ${styles.secondaryButton}`}
              type="button"
              onClick={onPartnerTab}
              startIcon={<ArrowLeft size={16} aria-hidden="true" />}
              variant="outlined"
            >
              Back to Partner Information
            </Button>
          )}

          <Button
            className={styles.button}
            type="button"
            onClick={onReview}
            startIcon={<Signature size={16} aria-hidden="true" />}
            variant="contained"
          >
            Review and Generate PDF
          </Button>
        </div>
      </div>
    </main>
  );
}
