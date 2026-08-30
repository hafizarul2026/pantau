/** Only this mailbox is ever inspected. Other accounts are ignored. */
export const MONITORED_MAILBOX = "mohd_hafizarul@moh.gov.my";

export const MONITORED_MAILBOX_SHORT = "mohd_hafizarul@moh";

export function isMonitoredMailbox(address: string | null | undefined) {
  if (!address) return false;
  const normalised = address.trim().toLowerCase();
  return (
    normalised === MONITORED_MAILBOX ||
    normalised === MONITORED_MAILBOX_SHORT ||
    normalised === "mohd_hafizarul@moh.gov"
  );
}
