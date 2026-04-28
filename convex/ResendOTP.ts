import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { alphabet, generateRandomString } from "oslo/crypto";

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "0001 Link <noreply@0001.dev>",
      to: [email],
      subject: `Your sign-in code: ${token}`,
      text: `Your code is ${token}.\n\nIt expires in 15 minutes.\n\nIf you didn't request this, ignore this email.`,
    });

    if (error) {
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }
  },
});
