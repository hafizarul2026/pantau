import { NextResponse } from "next/server";
import { isMonitoredMailbox, MONITORED_MAILBOX } from "@/lib/mailbox";
import { DEMO_INBOX } from "@/lib/seed";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("mailbox") ?? MONITORED_MAILBOX;

  if (!isMonitoredMailbox(requested)) {
    return NextResponse.json(
      {
        error: "Hanya peti mohd_hafizarul@moh.gov.my disemak.",
        mailbox: MONITORED_MAILBOX,
        emails: [],
      },
      { status: 403 },
    );
  }

  const emails = DEMO_INBOX.filter((email) => isMonitoredMailbox(email.to));

  return NextResponse.json({
    mailbox: MONITORED_MAILBOX,
    source: "demo",
    notice:
      "Gmail belum disambung. Paparan ini hanya emel ke mohd_hafizarul@moh.gov.my — akaun lain ditapis.",
    emails,
  });
}
