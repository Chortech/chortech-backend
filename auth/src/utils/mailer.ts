import nodemailer from "nodemailer";
import util from "util";

const email = process.env.EMAIL;
const pass = process.env.EMAIL_PASS;
const serivce = process.env.MAIL_SERVICE;

const transporter = nodemailer.createTransport({
  service: serivce,
  auth: {
    user: email,
    pass: pass,
  },
});

const sendAsync = util.promisify(transporter.sendMail).bind(transporter);

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const sendMail = async (mailOptions: MailOptions) => {
  await sendAsync({ ...mailOptions, from: email });
};

const sendMailMultiple = async (
  subject: string,
  mails: { text?: string; html?: string; email: string }[]
) => {
  for (const mail of mails) {
    const { text, html, email } = mail;
    await sendMail({ subject: subject, text: text, html: html, to: email });
  }
};

export { sendMail, sendMailMultiple };
