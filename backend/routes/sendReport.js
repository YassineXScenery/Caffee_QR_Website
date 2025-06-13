const express = require('express');
const router = express.Router();
const pdf = require('html-pdf');
const nodemailer = require('nodemailer');
const reportData = require('../helpers/reportData');

console.log('sendReport.js loaded');

const generateHTML = (data) => `
  <h1>Restaurant ${data.period.charAt(0).toUpperCase() + data.period.slice(1)} Report</h1>
  <p>Period: ${data.date}</p>
  <table border="1">
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Total</th>
    </tr>
    ${data.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.total} DT</td>
      </tr>
    `).join('')}
  </table>
  <p>Total Revenue: ${data.revenue} DT</p>
  <p>Expenses: ${data.expenses} DT</p>
  <p>Profit: ${data.revenue - data.expenses} DT</p>
`;

router.post('/', async (req, res) => {
  console.log('POST /send-report called with body:', req.body);
  const { period, date, email } = req.body;

  if (!period || !date || !email) return res.status(400).json({ error: 'Period, date, and email are required' });

  try {
    console.log('Fetching report data for period:', period, 'date:', date);
    const data = await reportData.getReport(period, date);
    console.log('Report data fetched:', data);
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(generateHTML(data)).toBuffer((err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `${period.charAt(0).toUpperCase() + period.slice(1)} Report - ${data.date}`,
      text: `Here is your ${period} restaurant report.`,
      attachments: [
        { filename: `report-${period}-${data.date}.pdf`, content: pdfBuffer }
      ]
    };

    console.log('Sending email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);

    res.json({ message: 'Report sent successfully!' });
  } catch (err) {
    console.error('Send report error:', err);
    res.status(500).json({ error: 'Failed to send report' });
  }
});

module.exports = router;