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
  async sendMessageMulticast(message: string, tokens: string[]) {
    const result = await notification.admin.messaging().sendMulticast({
      tokens,
      notification: {
        body: message,
        title: "Chortech Notification",
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

    console.log("Failed Tokens:", result);
  }
  async send(message: string, token: string) {
    const result = await notification.admin.messaging().send({
      token,
      notification: {
        body: message,
        title: "Chortech Notification",
        imageUrl:
          "https://chortech.s3.ir-thr-at1.arvanstorage.com/chortech.jpg",
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
