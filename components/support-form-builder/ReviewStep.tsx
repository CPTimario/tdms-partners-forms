import type { RefObject } from "react";
import styles from "./FormBuilder.module.css";
import type { SupportFormData } from "@/lib/support-form";
import { AccountabilityPreview } from "./AccountabilityPreview";
import { PartnerInfoPreview } from "./PartnerInfoPreview";

type ReviewStepProps = {
  data: SupportFormData;
  isExporting: boolean;
  partnerInfoRef: RefObject<HTMLDivElement | null>;
  accountabilityRef: RefObject<HTMLDivElement | null>;
  onEditPartnerInfo: () => void;
  onEditAccountability: () => void;
  onDownloadPartnerInfoPdf: () => void;
  onDownloadPartnerInfoPng: () => void;
  onDownloadAccountabilityPdf: () => void;
  onDownloadAccountabilityPng: () => void;
};

export function ReviewStep({
  data,
  isExporting,
  partnerInfoRef,
  accountabilityRef,
  onEditPartnerInfo,
  onEditAccountability,
  onDownloadPartnerInfoPdf,
  onDownloadPartnerInfoPng,
  onDownloadAccountabilityPdf,
  onDownloadAccountabilityPng,
}: ReviewStepProps) {
  return (
    <main className={`${styles.shell} ${styles.reviewShell}`}>
      <div className={styles.reviewHeader}>
        <div>
          <h1 className={styles.reviewHeaderTitle}>Review Your Forms</h1>
        </div>

        <div className={styles.reviewActions}>
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            type="button"
            onClick={onEditPartnerInfo}
          >
            Edit Partner Information
          </button>
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            type="button"
            onClick={onEditAccountability}
          >
            Edit Accountability
          </button>
          <button className={styles.button} type="button" onClick={onDownloadPartnerInfoPdf} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Partner Info PDF"}
          </button>
          <button className={styles.button} type="button" onClick={onDownloadPartnerInfoPng} disabled={isExporting}>
            Partner Info PNG
          </button>
          <button className={styles.button} type="button" onClick={onDownloadAccountabilityPdf} disabled={isExporting}>
            Accountability PDF
          </button>
          <button className={styles.button} type="button" onClick={onDownloadAccountabilityPng} disabled={isExporting}>
            Accountability PNG
          </button>
        </div>
      </div>

      <div className={styles.reviewPanes}>
        <div className={styles.reviewCard}>
          <h2 className={styles.reviewCardTitle}>Partner Information Form</h2>
          <div className={styles.previewScroll}>
            <PartnerInfoPreview data={data} previewRef={partnerInfoRef} />
          </div>
        </div>

        <div className={styles.reviewCard}>
          <h2 className={styles.reviewCardTitle}>Accountability Form</h2>
          <div className={styles.previewScroll}>
            <AccountabilityPreview data={data} previewRef={accountabilityRef} />
          </div>
        </div>
      </div>
    </main>
  );
}
