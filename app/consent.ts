// The list, and the words on the form.
//
// One constant, read by the form that shows it and by the handler that stores
// it, so consent shown and consent stored can never be two different
// sentences. Kicklace keeps the text verbatim as the proof, with the day; a
// subscribe with no consent is refused (`missing_consent`).
//
// Change the sentence to whatever your form really says, and change LIST to
// the address of a list in your workspace (Settings → Lists).
export const LIST = "product-updates";

export const CONSENT =
  "Email me when there is something new to try. I can unsubscribe with one click.";

/** Where the tag keeps this browser's id, so a visit and a signup are one person. */
export const ANON_ID_KEY = "kl_id";
