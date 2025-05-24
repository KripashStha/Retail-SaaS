import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {  try {
    const body = await request.json();
    const { email, role, token } = body;
 
    // Ensure the URL is properly formatted with protocol
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://easyinventory.tech';
    // Add https:// if not already present
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    const inviteUrl = `${baseUrl}/invite/accept?token=${token}`;
    
    console.log(`Generated invitation URL: ${inviteUrl}`);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Invitation to join Easy Inventory Management',
      html: `
       <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Invitation - Easy Inventory Management</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f6f8;
        margin: 0;
        padding: 0;
        
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        padding: 40px 30px;
        border-radius: 10px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
      }

      h2 {
        color: #1f2937;
        font-size: 26px;
        margin-bottom: 20px;
      }

      p {
        font-size: 16px;
        margin: 15px 0;
        line-height: 1.6;
      }

      .button {
        display: inline-block;
        background-color: #4f46e5;
        padding: 14px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 16px;
        font-weight: 600;
        margin: 20px 0;
        transition: background-color 0.3s ease;
      }

      .button:hover {
        background-color: #4338ca;
      }

      .footer {
        font-size: 14px;
        color: #777;
        margin-top: 30px;
        border-top: 1px solid #eee;
        padding-top: 20px;
      }

      @media (max-width: 600px) {
        .container {
          padding: 20px;
        }

        h2 {
          font-size: 22px;
        }

        .button {
          width: 100%;
          text-align: center;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>You're Invited to Join Easy Inventory Management</h2>
      <p>Hello,</p>
      <p>We're excited to have you onboard! You've been invited to join as a <strong>${role}</strong>.</p>
      <p>Click the button below to accept your invitation and get started:</p>
      <a href="${inviteUrl}" style="color:white" class="button">Accept Invitation</a>
      <p class="footer">
        This invitation link will expire in 7 days.<br />
        If you did not request or expect this invitation, please disregard this email.
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