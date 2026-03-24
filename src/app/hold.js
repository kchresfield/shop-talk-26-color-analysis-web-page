// confirm-update-db
const { createClient } = require('@supabase/supabase-js');

exports.handler = function(context, event, callback) {
  const supabase = createClient(context.SUPABASE_URL, context.SUPABASE_SERVICE_ROLE_KEY);
  const phone = (event.phone || '').trim();
  console.log("Phone: ", phone)
  const confirmed = (event.confirmed ?? 'true').toString().toLowerCase() !== 'false';

  const res = (status, body) =>
    callback(
      null,
      new Twilio.Response()
        .setStatusCode(status)
        .appendHeader('Content-Type', 'application/json')
        .setBody(body)
    );

  if (!phone) {
    return res(400, { error: 'phone required' });
  }
  if (!/^\+\d{10,15}$/.test(phone)) {
    return callback('phone must be E.164 like +15551234567');
  }

  return supabase
  .from('appointments')
  .update({
    confirmed,
    confirmation_time: confirmed ? new Date().toISOString() : null
  })
  .eq('phone', phone)                      // include all identifiers you use to find the row
  .select()
  .maybeSingle()                           // safer: no hard error when 0 rows match
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase error:', error);
      throw { status: 500, message: error.message };
    }
    if (!data) {
      console.warn('Appointment not found for', { phone, appointment_date, appointment_time });
      throw { status: 404, message: 'Appointment not found' };
    }

    console.log('Appointment confirmed:', data.id);
    // if you need to send an SMS or do more work, chain it here and return its promise
    return data;
  })
  .then((data) => {
    // end the Function here so Twilio waits until this point
    const resp = new Twilio.Response()
      .setStatusCode(200)
      .appendHeader('Content-Type', 'application/json')
      .setBody({ ok: true, appointment: data });

    return callback(null, resp);
  })
  .catch((err) => {
    console.error('Update failed:', err);
    const resp = new Twilio.Response()
      .setStatusCode(err.status || 500)
      .appendHeader('Content-Type', 'application/json')
      .setBody({ error: err.message || 'Server error' });

    return callback(null, resp);
  });
};









