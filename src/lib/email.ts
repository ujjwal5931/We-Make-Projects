import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    if (!process.env.SMTP_USER || !pass) {
      console.warn("[Email] SMTP credentials not configured. Email not sent.");
      // In dev without credentials, log the email instead
      if (process.env.NODE_ENV === "development") {
        console.log("[Email DEV] Would send email:", {
          to: options.to,
          subject: options.subject,
        });
        return { success: true };
      }
      return { success: false, error: "SMTP not configured" };
    }

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "We Make Projects <noreply@wemakeprojects.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Email] Send error:", error);
    return { success: false, error: error.message };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Email Templates
// ──────────────────────────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We Make Projects</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0f172a; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
    .body { padding: 40px; }
    .body h2 { color: #0f172a; font-size: 20px; margin: 0 0 16px; }
    .body p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-size: 14px; }
    .info-value { color: #0f172a; font-size: 14px; font-weight: 600; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .btn-success { background: #16a34a; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .status-approved { background: #dcfce7; color: #15803d; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
    .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 13px; margin: 4px 0; }
    .footer a { color: #2563eb; text-decoration: none; }
    .product-item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .product-item:last-child { border-bottom: none; }
    .product-name { color: #0f172a; font-weight: 600; font-size: 15px; }
    .product-price { color: #2563eb; font-weight: 700; font-size: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>We Make Projects</h1>
      <p>Digital Engineering Resources</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>We Make Projects — Digital Engineering Resources for Students</p>
      <p>Need help? <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact">Contact Support</a></p>
      <p style="margin-top: 12px; font-size: 11px; color: #cbd5e1;">
        © ${new Date().getFullYear()} We Make Projects. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

export function orderPlacedEmail(data: {
  customerName: string;
  orderNumber: string;
  totalAmount: string;
  products: { name: string; price: string }[];
}) {
  const productRows = data.products
    .map(
      (p) => `
    <div class="product-item">
      <span class="product-name">${p.name}</span>
      <span class="product-price" style="float:right;">${p.price}</span>
    </div>
  `
    )
    .join("");

  return {
    subject: `Order Placed — ${data.orderNumber} | We Make Projects`,
    html: baseTemplate(`
      <h2>Order Placed Successfully</h2>
      <p>Hi ${data.customerName},</p>
      <p>Thank you for your order! We've received your order details and are awaiting your payment confirmation.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Order Number</span>
          <span class="info-value">${data.orderNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Amount</span>
          <span class="info-value">${data.totalAmount}</span>
        </div>
      </div>

      <h2 style="font-size: 16px; color: #475569; margin-bottom: 12px;">Products Ordered</h2>
      <div class="info-box">${productRows}</div>

      <p style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px; color: #92400e;">
        <strong>⚠️ Action Required:</strong> Please complete your UPI payment and submit the payment details on our website to proceed.
      </p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders" class="btn">View My Orders</a>

      <p>If you have any questions, please <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" style="color: #2563eb;">contact us</a>.</p>
    `),
  };
}

export function paymentSubmittedEmail(data: {
  customerName: string;
  orderNumber: string;
  utrReference: string;
}) {
  return {
    subject: `Payment Details Received — ${data.orderNumber} | We Make Projects`,
    html: baseTemplate(`
      <h2>Payment Details Received</h2>
      <p>Hi ${data.customerName},</p>
      <p>We've received your payment details for order <strong>${data.orderNumber}</strong>.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Order Number</span>
          <span class="info-value">${data.orderNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">UTR / Reference ID</span>
          <span class="info-value">${data.utrReference}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">
            <span class="status-badge" style="background:#dbeafe;color:#1d4ed8;">Under Review</span>
          </span>
        </div>
      </div>

      <p>Our team will verify your payment manually. This typically takes a few hours. You'll receive another email once your payment is verified.</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders" class="btn">Track Order Status</a>
    `),
  };
}

export function paymentApprovedEmail(data: {
  customerName: string;
  orderNumber: string;
  totalAmount: string;
  products: { name: string; downloadUrl: string }[];
}) {
  const productRows = data.products
    .map(
      (p) => `
    <div class="product-item">
      <div class="product-name" style="margin-bottom: 8px;">${p.name}</div>
      <a href="${p.downloadUrl}" class="btn btn-success" style="font-size: 13px; padding: 8px 16px; margin: 0;">
        ⬇ Download Now
      </a>
    </div>
  `
    )
    .join("");

  return {
    subject: `✅ Payment Verified — Your Products Are Ready | We Make Projects`,
    html: baseTemplate(`
      <h2>🎉 Payment Verified — Download Your Products</h2>
      <p>Hi ${data.customerName},</p>
      <p>Great news! Your payment for order <strong>${data.orderNumber}</strong> has been verified by our team.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Order Number</span>
          <span class="info-value">${data.orderNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Paid</span>
          <span class="info-value">${data.totalAmount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">
            <span class="status-badge status-approved">✓ Payment Approved</span>
          </span>
        </div>
      </div>

      <h2 style="font-size: 16px; color: #475569; margin-bottom: 12px;">Your Downloads</h2>
      <div class="info-box">${productRows}</div>

      <p style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; color: #15803d;">
        Download links are also available in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders" style="color: #15803d; font-weight: 600;">My Orders</a> page.
      </p>

      <p>Thank you for choosing We Make Projects!</p>
    `),
  };
}

export function paymentRejectedEmail(data: {
  customerName: string;
  orderNumber: string;
  rejectionReason: string;
}) {
  return {
    subject: `❌ Payment Verification Failed — ${data.orderNumber} | We Make Projects`,
    html: baseTemplate(`
      <h2>Payment Verification Failed</h2>
      <p>Hi ${data.customerName},</p>
      <p>Unfortunately, we were unable to verify your payment for order <strong>${data.orderNumber}</strong>.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Order Number</span>
          <span class="info-value">${data.orderNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">
            <span class="status-badge status-rejected">✗ Payment Rejected</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Reason</span>
          <span class="info-value">${data.rejectionReason}</span>
        </div>
      </div>

      <p>If you believe this is a mistake, please contact us with your UTR/reference ID. You can also resubmit your payment details from the order page.</p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders" class="btn" style="background: #dc2626;">View Order Details</a>

      <p>Need help? <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" style="color: #2563eb;">Contact our support team</a>.</p>
    `),
  };
}
