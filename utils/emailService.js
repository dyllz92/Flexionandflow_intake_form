const nodemailer = require('nodemailer');

/**
 * EmailService - Sends email notifications for user registrations
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
        this.init();
    }

    /**
     * Initialize email service with configured transport
     */
    init() {
        try {
            // Check if email is configured
            const emailService = process.env.EMAIL_SERVICE;
            const emailUser = process.env.EMAIL_USER;
            const emailPassword = process.env.EMAIL_PASSWORD;

            if (!emailService || !emailUser || !emailPassword) {
                console.warn('⚠ Email service not configured. Registration notifications will be skipped.');
                console.warn('  Set EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD in .env to enable.');
                return;
            }

            // Create transporter based on service
            if (emailService.toLowerCase() === 'gmail') {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: emailUser,
                        pass: emailPassword
                    }
                });
            } else {
                // Custom SMTP settings
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: emailUser,
                        pass: emailPassword
                    }
                });
            }

            this.initialized = true;
            console.log('✓ Email service initialized');
        } catch (error) {
            console.error('Failed to initialize email service:', error.message);
        }
    }

    /**
     * Send approval email
     */
    async sendApprovalEmail(email, username) {
        if (!this.initialized || !this.transporter) {
            console.log(`[SKIPPED EMAIL] Approval email to ${email} - email service not configured`);
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000/analytics';
            const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;

            const mailOptions = {
                from: emailFrom,
                to: email,
                subject: 'Your Analytics Dashboard Access Has Been Approved',
                html: this.getApprovalEmailTemplate(username, dashboardUrl)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✓ Approval email sent to ${email}`, result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`✗ Failed to send approval email to ${email}:`, error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Send rejection email
     */
    async sendRejectionEmail(email, username, reason = '') {
        if (!this.initialized || !this.transporter) {
            console.log(`[SKIPPED EMAIL] Rejection email to ${email} - email service not configured`);
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;

            const mailOptions = {
                from: emailFrom,
                to: email,
                subject: 'Your Analytics Dashboard Registration',
                html: this.getRejectionEmailTemplate(username, reason)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✓ Rejection email sent to ${email}`, result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`✗ Failed to send rejection email to ${email}:`, error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get approval email HTML template
     */
    getApprovalEmailTemplate(username, dashboardUrl) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome! 🎉</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${this.escapeHtml(username)}</strong>,</p>
            <p>Great news! Your registration for the Analytics Dashboard has been <strong>approved</strong>.</p>
            <p>You can now log in and access the dashboard:</p>
            <p style="text-align: center;">
                <a href="${this.escapeHtml(dashboardUrl)}" class="button">Access Dashboard</a>
            </p>
            <p>Use your username and password to log in.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p>If you have any questions, please contact your administrator.</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Get rejection email HTML template
     */
    getRejectionEmailTemplate(username, reason) {
        const reasonText = reason ? `<p><strong>Reason:</strong> ${this.escapeHtml(reason)}</p>` : '';
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Registration Status</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${this.escapeHtml(username)}</strong>,</p>
            <p>Thank you for registering for the Analytics Dashboard.</p>
            <p>Unfortunately, your registration could not be approved at this time.</p>
            ${reasonText}
            <p>You may try registering again if you believe this was an error, or contact your administrator for more information.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p>If you have any questions, please reach out to your administrator.</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Escape HTML to prevent injection
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

module.exports = new EmailService();
