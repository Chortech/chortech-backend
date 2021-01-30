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
  async send(message: string, token: string) {
    const result = await notification.admin.messaging().send({
      token,
      notification: {
        body: message
          ? message
          : "This is an FCM notification that displays an image!",
        title: "FCM Notification",
      },
      apns: {
        payload: {
          aps: {
            "mutable-content": 1,
          },
        },
        fcmOptions: {
          imageUrl:
            "https://chortech.s3.ir-thr-at1.arvanstorage.com/chortech.jpg",
        },
      },
      android: {
        notification: {
          imageUrl:
            "https://chortech.s3.ir-thr-at1.arvanstorage.com/chortech.jpg",
        },
      },
    });

    console.log("sent", result);
  }
}

export const notification = new Notification();
