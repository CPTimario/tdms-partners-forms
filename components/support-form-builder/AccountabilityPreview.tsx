import {
  checkmark,
  displayValue,
  getAccountabilityAffirmationCopy,
  getAccountabilityInstructionCopy,
  getAccountabilityTitle,
  type SupportFormData,
} from "@/lib/support-form";

type AccountabilityPreviewProps = {
  data: SupportFormData;
  previewRef?: React.Ref<HTMLDivElement>;
};

export function AccountabilityPreview({
  data,
  previewRef,
}: AccountabilityPreviewProps) {
  return (
    <div className="print-page" ref={previewRef}>
      <div className="lower-sheet lower-sheet--standalone">
        <h3 aria-hidden="true">{getAccountabilityTitle(data.membershipType)}</h3>

        <p>{getAccountabilityAffirmationCopy(data.membershipType)}</p>
        {getAccountabilityInstructionCopy(data.membershipType) ? (
          <p>{getAccountabilityInstructionCopy(data.membershipType)}</p>
        ) : null}

        <div className="accountability-grid">
          <div>
            <h4>
              If the missioner is <u>unable to go</u> due to unforeseen reasons,
              please
            </h4>
            <div className="check-line">
              <span className="box">
                {checkmark(data.unableToGoChoice === "teamFund")}
              </span>
              <span>Redirect my support to the team fund</span>
            </div>
            <div className="check-line">
              <span className="box">
                {checkmark(data.unableToGoChoice === "generalFund")}
              </span>
              <span>
                Redirect my support to the Every Nation World Missions General
                Fund
              </span>
            </div>
          </div>

          <div>
            <h4>
              If the missioner or team is <u>rerouted</u>, please
            </h4>
            <div className="check-line">
              <span className="box">
                {checkmark(data.reroutedChoice === "retain")}
              </span>
              <span>Retain my support</span>
            </div>
            <div className="check-line">
              <span className="box">
                {checkmark(data.reroutedChoice === "generalFund")}
              </span>
              <span>
                Redirect my support to the Every Nation World Missions General
                Fund
              </span>
            </div>
          </div>

          <div>
            <h4>
              If the trip is <u>canceled</u>, please
            </h4>
            <div className="check-line">
              <span className="box">{checkmark(data.canceledChoice === "generalFund")}</span>
              <span>
                Redirect my support to the Every Nation World Missions General
                Fund
              </span>
            </div>
          </div>
        </div>

        <div className="signature-area">
          <strong>{displayValue(data.partnerSignature)}</strong>
          <div className="line" />
          <span>PARTNER&apos;S SIGNATURE OVER PRINTED NAME</span>
        </div>
      </div>
    </div>
  );
}
