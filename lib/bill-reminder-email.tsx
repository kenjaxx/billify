export function billReminderEmail({
  userName,
  bills,
}: {
  userName: string
  bills: { title: string; amount: number; dueDate: Date; categoryName: string; categoryIcon: string }[]
}) {
  const formatted = bills.map(b => ({
    ...b,
    dueDateStr: new Date(b.dueDate).toLocaleDateString('en-PH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    amountStr: `₱${b.amount.toLocaleString()}`,
    daysLeft: Math.ceil((new Date(b.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  }))

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Upcoming Bill Reminders</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:22px;font-weight:500;color:#ffffff;letter-spacing:-0.5px;">
            Bill<span style="color:#3b82f6;">ify</span>
          </h1>
        </td></tr>

        <!-- Title -->
        <tr><td style="background:#161b27;border:0.5px solid rgba(255,255,255,0.08);border-radius:12px 12px 0 0;padding:24px 24px 0 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px;">Reminder</p>
          <h2 style="margin:0 0 6px;font-size:18px;font-weight:500;color:#ffffff;">You have upcoming bills</h2>
          <p style="margin:0 0 24px;font-size:13px;color:rgba(255,255,255,0.45);">
            Hey ${userName}, here are your bills due within the next 7 days.
          </p>
        </td></tr>

        <!-- Bills -->
        ${formatted.map((b, i) => `
        <tr><td style="background:#161b27;border-left:0.5px solid rgba(255,255,255,0.08);border-right:0.5px solid rgba(255,255,255,0.08);padding:0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:${i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.06)'};padding:16px 0;">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:20px;padding-right:12px;vertical-align:middle;">${b.categoryIcon}</td>
                    <td style="vertical-align:middle;">
                      <p style="margin:0;font-size:13px;font-weight:500;color:#ffffff;">${b.title}</p>
                      <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.4);">${b.categoryName} · Due ${b.dueDateStr}</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" style="vertical-align:middle;">
                <p style="margin:0;font-size:13px;font-weight:500;color:#ffffff;">${b.amountStr}</p>
                <p style="margin:2px 0 0;font-size:11px;color:${b.daysLeft <= 2 ? '#f87171' : b.daysLeft <= 4 ? '#fbbf24' : '#34d399'};text-align:right;">
                  ${b.daysLeft === 0 ? 'Due today!' : b.daysLeft === 1 ? 'Due tomorrow!' : `${b.daysLeft} days left`}
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
        `).join('')}

        <!-- Footer -->
        <tr><td style="background:#161b27;border:0.5px solid rgba(255,255,255,0.08);border-top:none;border-radius:0 0 12px 12px;padding:20px 24px;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">
            You're receiving this because you have bills due soon in Billify.<br/>
            Log in to mark them as paid.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `

  const text = [
    `Hey ${userName}, you have ${bills.length} bill(s) due within 7 days:\n`,
    ...formatted.map(b => `• ${b.title} — ${b.amountStr} — Due ${b.dueDateStr} (${b.daysLeft === 0 ? 'today' : b.daysLeft === 1 ? 'tomorrow' : `in ${b.daysLeft} days`})`),
    '\nLog in to Billify to mark them as paid.',
  ].join('\n')

  return { html, text }
}