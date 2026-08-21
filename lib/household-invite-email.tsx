export function householdInviteEmail({
  inviterName,
  householdName,
  appUrl,
}: {
  inviterName: string
  householdName: string
  appUrl: string
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Household invite</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:22px;font-weight:500;color:#ffffff;letter-spacing:-0.5px;">
            Bill<span style="color:#3b82f6;">ify</span>
          </h1>
        </td></tr>
        <tr><td style="background:#161b27;border:0.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px;">Household invite</p>
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:500;color:#ffffff;">
            ${inviterName} invited you to "${householdName}"
          </h2>
          <p style="margin:0 0 24px;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
            Join their household on Billify to split bills, track shared expenses, and see who owes what.
          </p>
          <a href="${appUrl}/household" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;padding:11px 22px;font-size:13px;font-weight:500;">
            View invite
          </a>
          <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.3);">
            Sign in with this email address to see and accept the invite.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `

  const text = `${inviterName} invited you to join "${householdName}" on Billify.\n\nSign in at ${appUrl}/household with this email address to accept the invite.`

  return { html, text }
}