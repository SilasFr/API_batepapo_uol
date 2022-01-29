import express, { json } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import cors from "cors";
import Joi from "joi";
dotenv.config();

const mongoCliente = new MongoClient(process.env.MONGO_URI);
let db;
mongoCliente.connect(() => {
  db = mongoCliente.db("batepapo_uol");
});

const server = express();
server.use(cors());
server.use(json());

const participantSchema = Joi.object().keys({
  name: Joi.string().required().min(3).max(30),
});

server.post("/participants", async (req, res) => {
  const validation = Joi.validate(req.body, participantSchema);
  if (validation.error) {
    res.sendStatus(422);
    return;
  }
  const participant = { ...req.body, lasStatus: Date.now() };

  const allParticipants = await db.collection("participants").find().toArray();
  for (let user of allParticipants) {
    console.log(user);
    if (user.name === participant.name) {
      res.sendStatus(409);
      return;
    }
  }

  try {
    await db.collection("participants").insertOne(participant);
    await db.collection("messages").insertOne({
      from: participant.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs(participant.lastStatus).format("HH:mm:ss"),
    });
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

server.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch (error) {
    res.sendStatus(500);
  }
});

server.post("/messages", async (req, res) => {
  try {
    const message = {
      ...req.body,
      from: req.headers.user,
      time: dayjs(Date.now).format("HH:mm:ss"),
    };
    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

server.get("/messages", async (req, res) => {
  try {
    const user = req.headers.user;
    const limit = parseInt(req.query.limit);
    const messages = db
      .collection("messages")
      .find({ $or: [{ to: "todos" }, { to: user }] });
    if (limit) {
      res.send(messages.slice(-limit));
    } else {
      res.send(messages);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});

server.post("/status", (req, res) => {
  try {
  } catch (error) {
    res.send(500);
  }
});

setInterval(async () => {
  try {
    const limit = Date.now() - 10000;
    const result = await db
      .collection("participants")
      .deleteMany({ lastStatus: { $gt: limit } });
    console.log(result);
  } catch (e) {
    console.log(e);
  }
}, 15000);

// async function messagesUserCanSee(user) {
//   const seeableMessages = [];
//   const messages = await db.collection("messages").find().toArray();

//   if (!user) {
//     return messages;
//   }

//   for (let message of messages) {
//     if (message.to === "Todos" || message.to === user) {
//       seeableMessages.push(message);
//     }
//   }
//   return seeableMessages;
// }

server.listen(4000);
