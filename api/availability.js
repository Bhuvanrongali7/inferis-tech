const { google } = require('googleapis');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date required' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Get all events for the selected date
    const startOfDay = new Date(`${date}T00:00:00-04:00`);
    const endOfDay = new Date(`${date}T23:59:59-04:00`);

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'inferistech@gmail.com',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busyTimes = (response.data.items || []).map(event => ({
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
    }));

    // Available slots: 9am - 5pm ET, every 30 mins
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30'
    ];

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => {
      const slotStart = new Date(`${date}T${slot}:00-04:00`);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      return !busyTimes.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slotStart < busyEnd && slotEnd > busyStart;
      });
    });

    // Don't show past slots
    const now = new Date();
    const filteredSlots = availableSlots.filter(slot => {
      const slotTime = new Date(`${date}T${slot}:00-04:00`);
      return slotTime > now;
    });

    return res.status(200).json({ slots: filteredSlots });

  } catch (error) {
    console.error('Availability error:', error);
    // Return default slots if calendar check fails
    return res.status(200).json({
      slots: ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30']
    });
  }
}
