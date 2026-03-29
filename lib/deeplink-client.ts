export async function createRecipientToken(payload: Record<string, string>, signal?: AbortSignal) {
  const res = await fetch("/api/deeplink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error("unable to create token");
  const json = await res.json();
  return String(json.token);
}
