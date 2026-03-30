"use client";

import ButtonBase from "@mui/material/ButtonBase";
import { Users, ChevronDown } from "lucide-react";
import styles from "./FormBuilder.module.css";
import { useRouter } from "next/navigation";

type Props = {
  onNonVictory?: () => void;
  onVictory?: () => void;
};

export default function LandingMembershipCTAs({ onNonVictory, onVictory }: Props) {
  const router = useRouter();

  const handleNonVictory = () => {
    if (onNonVictory) return onNonVictory();
    void router.push("/non-victory");
  };

  const handleVictory = () => {
    if (onVictory) return onVictory();
    void router.push("/victory");
  };

  return (
    <main className={styles.ctaShell}>
      <div className={styles.ctaCardWrapper} role="region" aria-labelledby="membership-choose-title">
        <div className={styles.ctaHeadingRow}>
          <h1 id="membership-choose-title" className={styles.gateTitle}>Choose a form</h1>
          <div className={styles.ctaIntro}>Select whether you&apos;re a Victory member or not to continue.</div>
        </div>
        <div className={styles.ctaGrid} role="group" aria-label="Choose membership">
      <ButtonBase
        className={styles.ctaCard}
        onClick={handleNonVictory}
        focusRipple
        aria-label="Open partners&apos; forms for Non-Victory members"
        title="Non-Victory partners&apos; forms"
      >
        <div className={styles.ctaIcon} aria-hidden>
          <Users size={28} />
        </div>
        <div>
          <div className={styles.ctaTitle}>Partners&apos; forms for Non‑Victory members</div>
          <div className={styles.ctaDesc}>Forms for church partners who are not Victory members</div>
        </div>
      </ButtonBase>

      <ButtonBase
        className={styles.ctaCard}
        onClick={handleVictory}
        focusRipple
        aria-label="Open partners&apos; forms for Victory members"
        title="Victory members&apos; forms"
      >
        <div className={styles.ctaIcon} aria-hidden>
          <ChevronDown size={28} />
        </div>
        <div>
          <div className={styles.ctaTitle}>Partners&apos; forms for Victory members</div>
          <div className={styles.ctaDesc}>Forms for Victory church members</div>
        </div>
      </ButtonBase>
        </div>
      </div>
    </main>
  );
}
