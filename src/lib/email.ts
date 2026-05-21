import nodemailer from "nodemailer";
import { getEmailConfig } from "./settings";

async function getTransporter() {
  const config = await getEmailConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
}

async function sendMail(to: string, subject: string, html: string) {
  const config = await getEmailConfig();
  const transporter = await getTransporter();
  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject,
    html,
  });
}

export async function sendBookingConfirmation(params: {
  to: string;
  name: string;
  bookingNumber: string;
  eventDate: Date;
  items: string[];
  total: string;
  depositAmount: string;
}) {
  const subject = `Booking Confirmation – ${params.bookingNumber}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #2d5016; padding: 32px; text-align: center;">
        <h1 style="color: #c9a84c; font-size: 28px; margin: 0; letter-spacing: 2px;">
          THE WILD FLOWER VAULT
        </h1>
        <p style="color: #fefcf7; margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">
          WEDDING & EVENT RENTALS
        </p>
      </div>
      <div style="padding: 40px 32px; background: #fefcf7;">
        <p style="font-size: 18px; color: #2d5016;">Dear ${params.name},</p>
        <p>Thank you for choosing The Wild Flower Vault! Your booking has been received.</p>
        <div style="background: #f7f2e8; border-left: 4px solid #c9a84c; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 1px; color: #2d5016; text-transform: uppercase;">Booking Reference</p>
          <p style="font-size: 24px; font-weight: bold; color: #2d5016; margin: 0;">${params.bookingNumber}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Event Date</td>
              <td style="padding: 8px 0; font-weight: 600;">${new Intl.DateTimeFormat("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(params.eventDate)}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Items</td>
              <td style="padding: 8px 0;">${params.items.join(", ")}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Total</td>
              <td style="padding: 8px 0; font-weight: 600;">${params.total}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Deposit Due</td>
              <td style="padding: 8px 0; font-weight: 600; color: #c9a84c;">${params.depositAmount}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="font-size: 14px; color: #666;">Questions? Reply to this email or visit your <a href="${process.env.NEXT_PUBLIC_SITE_URL}/portal" style="color: #2d5016;">customer portal</a> to manage your booking.</p>
      </div>
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} The Wild Flower Vault · Des Moines, Iowa</p>
      </div>
    </div>
  `;
  await sendMail(params.to, subject, html);
}

export async function sendBookingNotificationToAdmin(params: {
  bookingNumber: string;
  guestName: string;
  guestEmail: string;
  eventDate: Date;
  items: string[];
  total: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const subject = `New Booking: ${params.bookingNumber} – ${params.guestName}`;
  const html = `
    <h2>New Booking Received</h2>
    <p><strong>Booking #:</strong> ${params.bookingNumber}</p>
    <p><strong>Customer:</strong> ${params.guestName} (${params.guestEmail})</p>
    <p><strong>Event Date:</strong> ${params.eventDate.toDateString()}</p>
    <p><strong>Items:</strong> ${params.items.join(", ")}</p>
    <p><strong>Total:</strong> ${params.total}</p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders" style="background:#2d5016;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:16px;">View in Admin</a>
  `;
  await sendMail(adminEmail, subject, html);
}

export async function sendCancellationEmail(params: {
  to: string;
  name: string;
  bookingNumber: string;
  eventDate: Date;
}) {
  const subject = `Booking Cancelled – ${params.bookingNumber}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2d5016; padding: 32px; text-align: center;">
        <h1 style="color: #c9a84c; font-size: 24px; margin: 0;">THE WILD FLOWER VAULT</h1>
      </div>
      <div style="padding: 40px 32px;">
        <p>Dear ${params.name},</p>
        <p>Your booking <strong>${params.bookingNumber}</strong> (${params.eventDate.toDateString()}) has been cancelled.</p>
        <p>If you believe this is an error or have questions, please reply to this email.</p>
      </div>
    </div>
  `;
  await sendMail(params.to, subject, html);
}

export async function sendInquiryAck(params: { to: string; name: string }) {
  const subject = "We received your inquiry – The Wild Flower Vault";
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2d5016; padding: 32px; text-align: center;">
        <h1 style="color: #c9a84c; font-size: 24px; margin: 0;">THE WILD FLOWER VAULT</h1>
      </div>
      <div style="padding: 40px 32px; background: #fefcf7;">
        <p>Dear ${params.name},</p>
        <p>Thank you for reaching out! We've received your inquiry and will be in touch within 24–48 hours to discuss your event.</p>
        <p style="color: #2d5016; font-style: italic;">With love, <br/>The Wild Flower Vault Team</p>
      </div>
    </div>
  `;
  await sendMail(params.to, subject, html);
}
