import * as admin from "firebase-admin";

class Notification {
  init(path: string) {
    admin.initializeApp({
      credential: admin.credential.cert(path),
    });
  }
}

export const notification = new Notification();
