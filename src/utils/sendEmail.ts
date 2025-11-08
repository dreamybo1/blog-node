import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const data = await resend.emails.send({
      from: 'DreamNet', // купи домен за 1$
      to: [to],
      subject,
      html,
    });
    console.log('Resend ✅', data);
  } catch (error: any) {
    console.error('Resend ❌', error);
    throw error;
  }
}