import * as admin from "firebase-admin";

class Notification {
  init(path: string) {
    admin.initializeApp({
      credential: admin.credential.cert(path),
    });
  }
  get admin() {
    return admin;
  }
  async sendMessageMulticast(data: any, tokens: string[]) {
    const res = await admin.messaging().sendMulticast({ tokens, data });
    const faildTokens: string[] = [];
    if (res.failureCount > 0) {
      res.responses.forEach((resp, idx) => {
        if (!resp.success) {
          faildTokens.push(tokens[idx]);
        }
      });
    }

    console.log("Failed Tokens: ", faildTokens);
  }
  async sendMessage(data: any, token: string) {
    const res = await admin.messaging().send({ token, data });
    console.log("sent", res);
  }
}

export const notification = new Notification();
