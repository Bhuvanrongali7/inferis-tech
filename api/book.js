const { google } = require('googleapis');

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, business, service, date, time, message } = req.body;

  // Validate required fields
  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ── Google Calendar Auth ──────────────────────────────────────────
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // ── Build event times ─────────────────────────────────────────────
    // date = "2026-06-10", time = "10:00"
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 min

    // ── Create Calendar Event ─────────────────────────────────────────
    const event = {
      summary: `Strategy Call — ${name}`,
      description: `
Client: ${name}
Email: ${email}
Business: ${business || 'Not provided'}
Service Interest: ${service || 'Not specified'}
Message: ${message || 'None'}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: email },
        { email: process.env.OWNER_EMAIL || 'inferistech@gmail.com' }
      ],
      conferenceData: {
        createRequest: {
          requestId: `inferis-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'inferistech@gmail.com',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    const meetLink = createdEvent.data.hangoutLink || '';

    // ── Send confirmation email via Gmail API ─────────────────────────
    const gmail = google.gmail({ version: 'v1', auth });

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const formatTime = (t) => {
      const [h, m] = t.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm} ET`;
    };

    // Email to client
    const clientEmailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'DM Sans', Arial, sans-serif; background: #f5f5f5; padding: 40px 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #1c1c1e; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #4ade80, #60a5fa); padding: 32px; text-align: center;">
      <h1 style="color: #1c1c1e; font-size: 24px; font-weight: 800; margin: 0;">Inferis Tech</h1>
      <p style="color: rgba(28,28,30,0.7); margin: 8px 0 0; font-size: 14px;">Your call is confirmed 🎉</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #f2f2f7; font-size: 16px; margin: 0 0 24px;">Hey ${name},</p>
      <p style="color: rgba(210,220,210,0.7); font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Your free 30-minute strategy call with Inferis Tech is confirmed. Here are your details:
      </p>
      <div style="background: #2c2c2e; border: 1px solid rgba(74,222,128,0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; margin-bottom: 12px;">
          <span style="color: #4ade80; font-size: 13px; width: 80px; flex-shrink: 0;">📅 Date</span>
          <span style="color: #f2f2f7; font-size: 13px; font-weight: 500;">${formatDate(date)}</span>
        </div>
        <div style="display: flex; margin-bottom: 12px;">
          <span style="color: #4ade80; font-size: 13px; width: 80px; flex-shrink: 0;">⏰ Time</span>
          <span style="color: #f2f2f7; font-size: 13px; font-weight: 500;">${formatTime(time)}</span>
        </div>
        <div style="display: flex; margin-bottom: 12px;">
          <span style="color: #4ade80; font-size: 13px; width: 80px; flex-shrink: 0;">⏱ Duration</span>
          <span style="color: #f2f2f7; font-size: 13px; font-weight: 500;">30 minutes</span>
        </div>
        ${meetLink ? `
        <div style="display: flex;">
          <span style="color: #4ade80; font-size: 13px; width: 80px; flex-shrink: 0;">🔗 Meet</span>
          <a href="${meetLink}" style="color: #60a5fa; font-size: 13px;">${meetLink}</a>
        </div>` : ''}
      </div>
      <p style="color: rgba(210,220,210,0.5); font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
        We'll send you a Google Meet link before the call. Looking forward to talking with you!
      </p>
      <p style="color: rgba(210,220,210,0.5); font-size: 13px; margin: 0;">
        Questions? Reply to this email or reach us at <a href="mailto:inferistech@gmail.com" style="color: #4ade80;">inferistech@gmail.com</a>
      </p>
    </div>
    <div style="padding: 20px 32px; border-top: 1px solid rgba(74,222,128,0.1); text-align: center;">
      <p style="color: rgba(210,220,210,0.25); font-size: 11px; margin: 0;">© 2026 Inferis Tech. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const clientEmail = [
      `From: Inferis Tech <inferistech@gmail.com>`,
      `To: ${email}`,
      `Subject: Your Strategy Call is Confirmed — Inferis Tech`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      clientEmailBody
    ].join('\n');

    const encodedClient = Buffer.from(clientEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedClient }
    });

    // Notify owner
    const ownerEmail = [
      `From: Inferis Tech <inferistech@gmail.com>`,
      `To: inferistech@gmail.com`,
      `Subject: New Booking: ${name} — ${formatDate(date)} at ${formatTime(time)}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #4ade80;">New Strategy Call Booked 🎉</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Business:</strong> ${business || 'Not provided'}</p>
        <p><strong>Service:</strong> ${service || 'Not specified'}</p>
        <p><strong>Date:</strong> ${formatDate(date)}</p>
        <p><strong>Time:</strong> ${formatTime(time)}</p>
        <p><strong>Message:</strong> ${message || 'None'}</p>
        ${meetLink ? `<p><strong>Meet Link:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
      </div>`
    ].join('\n');

    const encodedOwner = Buffer.from(ownerEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedOwner }
    });

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed!',
      meetLink
    });

  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({
      error: 'Failed to create booking. Please try again or email us at inferistech@gmail.com'
    });
  }
}
