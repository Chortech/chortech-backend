import { Router } from "express";
import Joi from "joi";
import { validate } from "@chortec/common";
import redis from "redis";
import Queue from "bull";

interface Payload {
  code: string;
  value: string;
}

const client = redis.createClient();

const codeQueue = new Queue<Payload>(
  "handling code expiration",
  "redis://127.0.0.1:6379"
);

const router = Router();

client.on("error", function (error) {
  console.error("Hellllllo", error);
});

// client.set("sina", "shabani");

// const getAsync = util.promisify(client.get).bind(client);

// (async () => {
//   try {
//     console.log(await getAsync("sina"));
//   } catch (err) {
//     console.log(err);
//   }
// })();

// client.del("sina");

// (async () => {
//   try {
//     console.log(await getAsync("sina"));
//   } catch (err) {
//     console.log(err);
//   }
// })();

// **** IMPORTANT TODO Change this later on
// the key is the code and the value is email or phone
const tempMap = new Map<string, string>();

codeQueue.process(async (job) => {
  console.log(`deleting ${job.data.code}`);
  // client.del(job.data.code);
});

async function expire() {
  try {
    // const num = await generate(tempMap);
    // client.set(num, "myemail");
    // console.log(num);
    // await codeQueue.add({ code: num, value: "myemail" });
  } catch (err) {
    console.log(err);
  }
}
expire();

const verifyShema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
})
  .or("email", "phone")
  .label("body");

router.post("/verify", validate(verifyShema), async (req, res) => {
  const { phone, email } = req.body;

  // const code = await generate(tempMap);

  // if (phone) {
  //   tempMap.set(code, phone);
  //   // Send sms
  // } else {
  //   tempMap.set(code, email);
  //   // Send email
  // }
});

const checkShema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string()
    .regex(
      new RegExp(
        /(^(\+98|98|0|0098)9\d{9}$)|(^(\+\u0669\u0668|\u0669\u0668|\u0660|\u0660\u0660\u0669\u0668)\u0669[\u0660-\u0669]{9}$)|(^(\+\u06f9\u06f8|\u06f9\u06f8|\u06f0|\u06f0\u06f0\u06f9\u06f8)\u06f9[\u06f0-\u06f9]{9}$)/
      )
    )
    .message("Invalid phone number"),
  code: Joi.number().min(9).max(9),
})
  .or("email", "phone")
  .label("body");

router.post("/check", validate(checkShema), async (req, res) => {
  const { phone, email, code } = req.body;

  if (!tempMap.has(code)) throw new Error("Wrong Code!");

  // if (phone) {
  //   if(tempMap.get(code) != phone)

  // } else {
  //   tempMap.set(code, email);
  //   // Send email
  // }
});

// router.post(
//   "/cancel",
//   () => validate(codeShema),
//   (req, res) => {}
// );
