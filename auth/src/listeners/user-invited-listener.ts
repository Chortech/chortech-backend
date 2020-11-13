import { Message } from "node-nats-streaming";
import User from "../models/user";
import {
  ResourceConflictError,
  IUserInvited,
  Listener,
  Subjects,
} from "@chortec/common";
import { v4 as uuid } from "uuid";
import { redisWrapper } from "../utils/redis-wrapper";
import smsSender from "../utils/smsSender";
import { sendMailMultiple } from "../utils/mailer";

const INVITE_EXPIRATION = 60 * 60 * 24;

interface Invite {
  inviter: string;
  invitee: {
    name: string;
    phone?: string;
    email?: string;
  };
}

class UserInvitedListener extends Listener<IUserInvited> {
  subject: Subjects.UserInvited = Subjects.UserInvited;
  queueName = "user-service";
  async onMessage(data: IUserInvited["data"], done: Message) {
    try {
      const mailList: { html?: string; text?: string; email: string }[] = [];
      const smsList: { message: string; phone: string }[] = [];
      for (const user of data.Invitees) {
        const { phone, email, name } = user;

        const exists = await User.exists({
          $or: [
            { email: { $exists: true, $eq: email } },
            { phone: { $exists: true, $eq: phone } },
          ],
        });

        if (exists) {
          throw new ResourceConflictError("User already exists!");
        }
        const id = uuid();
        const base64 = Buffer.from(id).toString("base64");

        const invite: Invite = {
          inviter: data.Inviter.id,
          invitee: {
            name,
            email,
            phone,
          },
        };

        await redisWrapper.setEXAsync(
          id,
          JSON.stringify(invite),
          INVITE_EXPIRATION
        );

        await redisWrapper.setEXAsync(phone || email!, id, INVITE_EXPIRATION);
        // /signup/i/base64
        const link = `localhost/signup/i/${base64}`;
        const text = `شمارو به اپ چرتک دعوت کرده ${data.Inviter.name}
${link} :لینک دعوت شما`;
        const html = `شمارو به اپ چرتک دعوت کرده ${data.Inviter.name}<br/>
<a href=${link}>${link}</a> :لینک دعوت شما`;
        if (phone) smsList.push({ message: text, phone });
        else if (email) mailList.push({ html, email });
      }

      if (mailList.length != 0) {
        sendMailMultiple("دعوتنامه", mailList);
      }
      if (smsList.length != 0) {
        smsSender.sendSMSMultiple(smsList);
      }

      done.ack();
    } catch (error) {
      console.log(error);
    }
  }
}

export { UserInvitedListener, Invite };
