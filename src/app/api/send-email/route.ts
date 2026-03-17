import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { toEmail, patientName, subject, htmlContent, senderEmail, senderPassword } = body;

        if (!toEmail || !subject || !htmlContent || !senderEmail || !senderPassword) {
            return NextResponse.json(
                { message: 'Missing required fields (to, subject, content, or SMTP credentials)' },
                { status: 400 }
            );
        }

        // Configure Nodemailer transporter dynamically with user's settings profile
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Defaulting to Gmail architecture as requested
            auth: {
                user: senderEmail,
                pass: senderPassword,
            },
        });

        // Test the connection
        await transporter.verify();

        // Send the email
        const info = await transporter.sendMail({
            from: `"Neurology Assessment Center" <${senderEmail}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent,
            text: htmlContent.replace(/<[^>]*>?/gm, ''), // fallback plaintext
        });

        return NextResponse.json(
            { message: 'Email sent successfully', messageId: info.messageId },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('API Email Error:', error);
        return NextResponse.json(
            { message: 'Failed to send email. Please verify your App Password & SMTP configurations.', error: error.message },
            { status: 500 }
        );
    }
}
