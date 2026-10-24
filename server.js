const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy for Render / Cloudflare (ensures correct client IP for rate limiting)
app.set('trust proxy', 1);

// Allowed origins configuration
const defaultAllowedOrigins = [
  'https://portfolio-project-sigma-steel.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const customOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [...defaultAllowedOrigins, ...customOrigins];

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. curl, server-to-server, Render health checks)
    if (!origin) return callback(null, true);

    const originNormalized = origin.trim().replace(/\/$/, '').toLowerCase();
    const isAllowed = allowedOrigins.some(allowed => allowed.toLowerCase() === originNormalized);

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// Rate limiting: maximum 5 contact form submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many contact requests from this IP. Please wait 15 minutes before trying again."
  }
});

// Helper to sanitize HTML characters and prevent email injection / XSS
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Contact form endpoint
app.post('/api/contact-form', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    // Validate inputs
    const cleanName = (typeof name === 'string' ? name : '').trim();
    const cleanEmail = (typeof email === 'string' ? email : '').trim();
    const cleanSubject = (typeof subject === 'string' ? subject : '').trim() || 'Portfolio Contact Form';
    const cleanMessage = (typeof message === 'string' ? message : '').trim();

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid name (up to 100 characters)."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (cleanSubject.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Subject must not exceed 200 characters."
      });
    }

    if (!cleanMessage || cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message (up to 5000 characters)."
      });
    }

    // Verify environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    const emailTo = process.env.EMAIL_TO;

    if (!apiKey || !emailFrom || !emailTo) {
      console.error("[Email Config Error] Missing RESEND_API_KEY, EMAIL_FROM, or EMAIL_TO environment variable.");
      return res.status(500).json({
        success: false,
        message: "Email service is temporarily unavailable. Please try again later or contact me directly."
      });
    }

    const resend = new Resend(apiKey);

    const safeName = escapeHtml(cleanName);
    const safeEmail = escapeHtml(cleanEmail);
    const safeSubject = escapeHtml(cleanSubject);
    const safeMessage = escapeHtml(cleanMessage);

    // HTML template for owner notification
    const adminHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px; color: #111;">
        <h2 style="color: #111; margin-top: 0; padding-bottom: 12px; border-bottom: 2px solid #ffdb70;">New Contact Form Submission</h2>
        <p style="margin: 8px 0;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #0066cc;">${safeEmail}</a></p>
        <p style="margin: 8px 0;"><strong>Subject:</strong> ${safeSubject}</p>
        <div style="margin-top: 16px; padding: 16px; background-color: #f7f7f7; border-radius: 6px; border-left: 4px solid #ffdb70;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #555;">Message:</p>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #777;">You can reply directly to this email to respond to ${safeName}.</p>
      </div>
    `;

    const adminText = `New Contact Form Submission\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject}\n\nMessage:\n${cleanMessage}\n\n---\nYou can reply directly to this email to respond to ${cleanName}.`;

    console.log(`[Contact Form] Dispatching message notification for: ${cleanEmail}`);

    // Send owner notification
    const { data: ownerEmailData, error: ownerEmailError } = await resend.emails.send({
      from: emailFrom,
      to: [emailTo],
      subject: `New Contact Form: ${cleanSubject}`,
      reply_to: cleanEmail,
      html: adminHtml,
      text: adminText,
    });

    if (ownerEmailError) {
      console.error("[Resend Error] Notification failed:", ownerEmailError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send message via email provider. Please try again later."
      });
    }

    console.log(`[Resend Success] Notification delivered to owner (ID: ${ownerEmailData?.id})`);

    // Check if visitor acknowledgement email can be sent
    let acknowledgementSent = false;
    const isTestSender = emailFrom.includes('resend.dev');

    if (isTestSender) {
      console.log("[Resend Notice] Sender is using onboarding@resend.dev test domain. Skipping visitor acknowledgement email (requires custom verified domain in Resend).");
    } else {
      // Verified custom domain: send acknowledgement email to visitor
      try {
        const userHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px; color: #111;">
            <h2 style="color: #111; margin-top: 0; padding-bottom: 12px; border-bottom: 2px solid #ffdb70;">Thank You for Reaching Out!</h2>
            <p>Hi ${safeName},</p>
            <p>Thank you for getting in touch. I have received your message regarding "<strong>${safeSubject}</strong>" and will get back to you shortly.</p>
            <div style="margin-top: 16px; padding: 16px; background-color: #f7f7f7; border-radius: 6px; border-left: 4px solid #ffdb70;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #555;">Your Message Copy:</p>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
            </div>
            <p style="margin-top: 24px; font-size: 13px; color: #777;">Best regards,<br>Prashant Vaishnav</p>
          </div>
        `;

        const userText = `Hi ${cleanName},\n\nThank you for reaching out. I have received your message regarding "${cleanSubject}" and will get back to you shortly.\n\nYour message:\n${cleanMessage}\n\nBest regards,\nPrashant Vaishnav`;

        const { data: userEmailData, error: userEmailError } = await resend.emails.send({
          from: emailFrom,
          to: [cleanEmail],
          subject: `Thank you for contacting me, ${cleanName}!`,
          html: userHtml,
          text: userText,
        });

        if (userEmailError) {
          console.warn("[Resend Warning] Visitor acknowledgement failed:", userEmailError.message);
        } else {
          console.log(`[Resend Success] Visitor acknowledgement sent (ID: ${userEmailData?.id})`);
          acknowledgementSent = true;
        }
      } catch (ackEx) {
        console.warn("[Resend Exception] Visitor acknowledgement threw:", ackEx.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Thank you! Your message has been sent successfully.",
      acknowledgementSent
    });

  } catch (error) {
    console.error("[Server Error] Contact form handler crashed:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while processing your request. Please try again later."
    });
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload provided.'
    });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Request from your origin is not allowed.'
    });
  }
  console.error("[Unhandled Error]:", err.message);
  return res.status(500).json({
    success: false,
    message: 'Internal server error.'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
