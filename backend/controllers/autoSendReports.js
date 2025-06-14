// controllers/autoSendReports.js
const cron = require('node-cron');
const pdf = require('html-pdf');
const nodemailer = require('nodemailer');
const reportData = require('../helpers/reportData');
const db = require('../databasemenu');

// Reuse the same HTML template you have in your manual sender
const generateHTML = (data) => `
  <h1>Restaurant ${data.period.charAt(0).toUpperCase() + data.period.slice(1)} Report</h1>
  <p>Period: ${data.date}</p>
  <table border="1" cellpadding="5" cellspacing="0">
    <tr>
      <th>Item</th><th>Qty</th><th>Total</th>
    </tr>
    ${data.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.total} DT</td>
      </tr>
    `).join('')}
  </table>
  <p><strong>Total Revenue:</strong> ${data.revenue} DT</p>
  <p><strong>Expenses:</strong> ${data.expenses} DT</p>
  <p><strong>Profit:</strong> ${data.revenue - data.expenses} DT</p>
`;

// Core auto‐send function
async function autoSend(period, date) {
  // Fetch all enabled report receivers for this period
  const periodCol =
    period === 'daily' ? 'receive_daily' :
    period === 'monthly' ? 'receive_monthly' :
    period === 'yearly' ? 'receive_yearly' : null;
  if (!periodCol) throw new Error('Invalid period for autoSend');

  // Get all receivers for this period
  const receivers = await new Promise((resolve, reject) => {
    db.query(
      `SELECT a.email FROM report_receivers r JOIN admins a ON r.admin_id = a.id WHERE r.${periodCol} = 1 AND a.email IS NOT NULL AND a.email != ''`,
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });
  const emails = receivers.map(r => r.email).filter(Boolean);
  if (!emails.length) {
    console.log(`No report receivers found for period ${period}. Skipping send.`);
    return;
  }

  // Fetch data
  const data = await reportData.getReport(period, date);
  data.date = date;
  data.period = period;

  // Build PDF
  const buffer = await new Promise((resolve, reject) =>
    pdf.create(generateHTML(data)).toBuffer((err, buf) =>
      err ? reject(err) : resolve(buf)
    )
  );

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emails,
    subject: `Automatic ${period.charAt(0).toUpperCase() + period.slice(1)} Report - ${date}`,
    text: `Please find attached the automatic ${period} report for ${date}.`,
    attachments: [
      { filename: `report-${period}-${date}.pdf`, content: buffer }
    ]
  });

  console.log(`✅ Sent automatic ${period} report for ${date} to: ${emails.join(', ')}`);
}

// Schedule jobs:

// 1) Daily at 21:00 (9pm)
cron.schedule('0 21 * * *', () => {
  const d = new Date();
  const date = d.toISOString().slice(0, 10); // YYYY-MM-DD
  autoSend('daily', date).catch(err => console.error(err));
});

// 2) Monthly on the 1st at 10:00
cron.schedule('0 10 1 * *', () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const date = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  autoSend('monthly', date).catch(err => console.error(err));
});

// 3) Yearly on Jan 1st at 10:00
cron.schedule('0 10 1 1 *', () => {
  const year = (new Date().getFullYear() - 1).toString(); // YYYY
  autoSend('yearly', year).catch(err => console.error(err));
});

console.log('🤖 AutoSendReports scheduler initialized.');
