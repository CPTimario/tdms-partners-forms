import createCache from "@emotion/cache";

export default function createEmotionCache() {
  let insertionPoint: HTMLMetaElement | undefined;

  if (typeof document !== "undefined") {
    insertionPoint = document.querySelector<HTMLMetaElement>('meta[name="emotion-insertion-point"]') ?? undefined;
  }

  return createCache({ key: "mui", insertionPoint });
}
