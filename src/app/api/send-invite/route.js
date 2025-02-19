import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, role, token } = body;
 
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Invitation to join Easy Inventory Management',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .footer { font-size: 14px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Welcome to Easy Inventory Management!</h2>
              <p>You've been invited to join as a <strong>${role}</strong>.</p>
              <p>Click the button below to accept the invitation:</p>
              <a href="${inviteUrl}" style="color: white; background-color: #4F46E5; padding: 12px 24px; text-decoration: none; 
              border-radius: 6px; margin: 20px 0;" class="button">Accept Invitation</a>
              <p class="footer">
                This invitation will expire in 7 days.<br>
                If you didn't expect this invitation, please ignore this email.
              </p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 