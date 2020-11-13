import axois from "axios";
import cron from "node-cron";

interface SendBody {
  Messages: string[];
  MobileNumbers: string[];
  LineNumber: string;
}

interface TokenBody {
  UserApiKey: string;
  SecretKey: string;
}

interface TokenResponse {
  TokenKey?: string;
  IsSuccessful: boolean;
  Message: string;
}

interface SendResponse {
  Ids?: [{ ID: number; MobileNo: string }];
  BatchKey?: string;
  IsSuccessful: boolean;
  Message: string;
}

let token: string | undefined;

const sendSMS = async (msg: string, phone: string): Promise<boolean> => {
  const body: SendBody = {
    Messages: [msg],
    MobileNumbers: [phone],
    LineNumber: process.env.LINE_NUMBER!,
  };

  if (!token) throw new Error("Missing token for sms api!");

  const headers = {
    "x-sms-ir-secure-token": token,
    "Content-Type": "application/json",
  };

  const res: SendResponse = (
    await axois.post("https://RestfulSms.com/api/MessageSend", body, {
      headers,
    })
  ).data;

  console.log(res);
  if (!res.IsSuccessful) {
    if (res.Message.indexOf("Token")) {
      throw new Error("Token is invalid and this state is not acceptable!");
    }
  }

  return res.IsSuccessful;
};

const sendSMSMultiple = async (
  datas: { message: string; phone: string }[]
): Promise<boolean> => {
  const msgs = datas.map((d) => d.message);
  const phones = datas.map((d) => d.phone);

  const body: SendBody = {
    Messages: msgs,
    MobileNumbers: phones,
    LineNumber: process.env.LINE_NUMBER!,
  };

  if (!token) throw new Error("Missing token for sms api!");

  const headers = {
    "x-sms-ir-secure-token": token,
    "Content-Type": "application/json",
  };

  const res: SendResponse = (
    await axois.post("https://RestfulSms.com/api/MessageSend", body, {
      headers,
    })
  ).data;

  console.log(res);
  if (!res.IsSuccessful) {
    if (res.Message.indexOf("Token")) {
      throw new Error("Token is invalid and this state is not acceptable!");
    }
  }

  return res.IsSuccessful;
};

// POST  https://RestfulSms.com/api/Token

const getToken = async (body: TokenBody): Promise<TokenResponse> => {
  const headers = {
    "Content-Type": "application/json",
  };

  const res = await axois.post("https://RestfulSms.com/api/Token", body, {
    headers,
  });

  return res.data;
};

async function obtainToken() {
  const res = await getToken({
    SecretKey: process.env.SMS_SECRET!,
    UserApiKey: process.env.SMS_API_KEY!,
  });

  if (!res.IsSuccessful)
    throw new Error("Something went wrong when obtaining token from sms api!");

  token = res.TokenKey;
}

obtainToken();

cron.schedule("*/29 * * * *", obtainToken);

const smsSender = {
  sendSMS,
  obtainToken,
  sendSMSMultiple,
};

export default smsSender;

export { SendBody, TokenBody, TokenResponse, SendResponse };
