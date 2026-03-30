'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme, alpha } from '@mui/material/styles';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';

import { getAccountabilityAffirmationCopy } from '@/lib/support-form';

import styles from './AccountabilityModal.module.css';

type CSSVars = React.CSSProperties & { [key: string]: string | number | undefined };

type Props = {
  open: boolean;
  onAgree: () => void;
  onClose?: () => void;
};

function emphasizeCopy(text: string) {
  // Emphasize a few key phrases and insert small icons visually.
  // The source copy is controlled inside the repo so using simple replacements is acceptable here.
  const replacements: Array<[RegExp, string]> = [
    [/(not approached for partnership)/i, `<span class="${styles.emphasis}">$1</span>`],
    [/(not compelled to give)/i, `<span class="${styles.emphasis}">$1</span>`],
    [
      /(grateful for the opportunity to advance the gospel to the nations)/i,
      `<span class="${styles.emphasis}">$1</span>`,
    ],
  ];

  let out = text;
  replacements.forEach(([re, sub]) => {
    out = out.replace(re, sub);
  });

  // Wrap emphasized phrases with an inline-icon span for visual clarity (icons are added via CSS/markup in the component).
  return out;
}

export default function AccountabilityModal({ open, onAgree, onClose }: Props) {
  const titleId = 'membership-agreement-title';
  const raw = getAccountabilityAffirmationCopy('victory');
  const theme = useTheme();

  // Map MUI theme tokens into CSS variables so the module CSS uses exact design colors
  const cssVars: CSSVars = {
    // text colors
    ['--text']: theme.palette.text.primary,
    ['--text-secondary']: theme.palette.text.secondary,
    // muted/notes use an alpha of the text color
    ['--muted']: alpha(theme.palette.text.primary, 0.65),
    // brand color from primary
    ['--brand']: theme.palette.primary.main,
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} role="dialog">
      <DialogTitle id={titleId}>Accountability Agreement</DialogTitle>
      <DialogContent dividers>
        <div className={styles.root} style={cssVars}>
          <div className={styles.lead}>
            <Info size={18} className={styles.icon} aria-hidden="true" />
            <div>Read the statement below and confirm to continue.</div>
          </div>

          <div className={styles.copy}>
            {/* Safe: source copy is repository-controlled */}
            <p dangerouslySetInnerHTML={{ __html: emphasizeCopy(raw) }} />
          </div>

          <div className={styles.noteRow}>
            <AlertTriangle size={16} aria-hidden="true" style={{ opacity: 0.85 }} />
            <small>Your confirmation will be printed on the final support form.</small>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onAgree}
          variant="contained"
          startIcon={<CheckCircle size={16} aria-hidden="true" />}
        >
          I Agree
        </Button>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
