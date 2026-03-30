import styles from "./FormBuilder.module.css";
import { Download, FilePenLine, ListChecks } from "lucide-react";
import Button from "@mui/material/Button";

type ReviewStepProps = {
  isExporting: boolean;
  isPreparingPreview: boolean;
  previewPdfUrl: string | null;
  previewError: string | null;
  onEditPartnerInfo: () => void;
  onEditAccountability: () => void;
  onDownloadPdf: () => void | Promise<void>;
};

export function ReviewStep({
  isExporting,
  isPreparingPreview,
  previewPdfUrl,
  previewError,
  onEditPartnerInfo,
  onEditAccountability,
  onDownloadPdf,
}: ReviewStepProps) {
  const isBusy = isExporting || isPreparingPreview;

  return (
    <main className={`${styles.shell} ${styles.reviewShell}`}>
      <div className={styles.reviewHeader}>
        <div>
          <h1 className={styles.reviewHeaderTitle}>Review Your Forms</h1>
        </div>

        <div className={styles.reviewActions}>
          <Button variant="outlined" startIcon={<FilePenLine size={16} aria-hidden="true" />} onClick={onEditPartnerInfo}>
            Edit Partner Details
          </Button>
          <Button variant="outlined" startIcon={<ListChecks size={16} aria-hidden="true" />} onClick={onEditAccountability}>
            Edit Accountability Choices
          </Button>
          <Button startIcon={<Download size={16} aria-hidden="true" />} onClick={() => { void onDownloadPdf(); }} disabled={isBusy}>
            {isBusy ? "Preparing PDF..." : "Download Final PDF"}
          </Button>
        </div>
      </div>

      <div className={styles.reviewPanes}>
        <div className={styles.reviewCard}>
          <h2 className={styles.reviewCardTitle}>Generated PDF Preview</h2>
          <div className={styles.previewScroll}>
            {previewPdfUrl ? (
              <iframe
                className={styles.pdfPreviewFrame}
                src={previewPdfUrl}
                title="Generated Support Forms PDF Preview"
              />
            ) : (
              <p className={styles.previewPlaceholder}>Preparing preview...</p>
            )}
            {previewError ? (
              <p className={styles.previewError}>{previewError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
