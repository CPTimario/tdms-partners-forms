import {
  consentCopy,
  displayValue,
  formatDisplayDate,
  privacyCopy,
  type SupportFormData,
  updatedCopy,
} from "@/lib/support-form";

type PartnerInfoPreviewProps = {
  data: SupportFormData;
  previewRef?: React.Ref<HTMLDivElement>;
};

type FieldLineProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function FieldLine({ label, value, valueClassName }: FieldLineProps) {
  return (
    <div className="line-field">
      <strong className={`line-field-value ${valueClassName ?? ""}`.trim()}>{value}</strong>
      <div className="line-field-rule" />
      <span className="line-field-label">{label}</span>
    </div>
  );
}

export function PartnerInfoPreview({
  data,
  previewRef,
}: PartnerInfoPreviewProps) {
  return (
    <div className="print-page" ref={previewRef}>
      <div className="upper-sheet">
        <h2>TEN DAYS MISSIONS SUPPORT PARTNER INFORMATION</h2>

        <div className="consent-row">
          <span className="box">X</span>
          <span>{consentCopy}</span>
        </div>

        <div className="partner-recipient-grid">
          <div className="panel">
            <div className="panel-header">PARTNER</div>
            <FieldLine label="PARTNER'S NAME" value={displayValue(data.partnerName)} />
            <FieldLine label="EMAIL ADDRESS" value={displayValue(data.emailAddress)} />
            <FieldLine label="MOBILE NUMBER" value={displayValue(data.mobileNumber)} />
            <FieldLine label="LOCAL CHURCH" value={displayValue(data.localChurch)} />
          </div>

          <div className="panel">
            <div className="panel-header">RECIPIENT</div>
            <FieldLine label="MISSIONER'S NAME/TEAM" value={displayValue(data.missionaryName)} />
            <FieldLine label="AMOUNT" value={displayValue(data.amount)} />
            <div className="trip-details-row">
              <p className="trip-label">Trip Details</p>
              <div className="trip-details-fields">
                <div className="trip-detail-field trip-detail-field--nation">
                  <strong className="trip-detail-value">{displayValue(data.nation)}</strong>
                  <div className="trip-detail-rule" />
                  <span className="trip-detail-label">NATION</span>
                </div>
                <div className="trip-detail-field trip-detail-field--date">
                  <strong className="trip-detail-value">{formatDisplayDate(data.travelDate)}</strong>
                  <div className="trip-detail-rule" />
                  <span className="trip-detail-label">TRAVEL DATE</span>
                </div>
              </div>
            </div>
            <FieldLine label="SENDING CHURCH" value={displayValue(data.sendingChurch)} />
          </div>
        </div>

        <p className="privacy-text">{privacyCopy}</p>
        <p className="updated-text">{updatedCopy}</p>
      </div>
    </div>
  );
}
