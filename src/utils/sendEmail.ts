import { createTransport } from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const res = await transporter.sendMail({
    from: `"DreamNet" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log(res);
  
}
