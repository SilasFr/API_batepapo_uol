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
  const participant = { ...req.body, lastStatus: Date.now() };

  const allParticipants = await db.collection("participants").find().toArray();
  for (let user of allParticipants) {
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
      time: dayjs(Date.now()).format("HH:mm:ss"),
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
    const messages = await db
      .collection("messages")
      .find({
        $or: [
          { type: "status" },
          { type: "message" },
          { to: user, type: "private_message" },
          { from: user, type: "private_message" },
        ],
      })
      .toArray();
    if (limit) {
      res.send(messages.slice(-limit));
      return;
    } else {
      res.send(messages);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});

server.post("/status", async (req, res) => {
  try {
    const user = req.headers.user;
    const userExists = await db
      .collection("participants")
      .findOne({ name: user });
    if (!userExists) {
      res.sendStatus(404);
      return;
    }

    await db.collection("participants").updateOne(
      {
        _id: userExists._id,
      },
      { $set: { lastStatus: Date.now() } }
    );
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

setInterval(async () => {
  try {
    const limit = Date.now() - 10000;
    const usersTimedOut = db
      .collection("participants")
      .find({ lastStatus: { $lt: limit } });

    await usersTimedOut.forEach(async (userTimedOut) => {
      await db.collection("messages").insertOne({
        from: userTimedOut.name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: dayjs(Date.now()).format("HH:mm:ss"),
      });
    });

    const { acknowledged, deletedCount } = await db
      .collection("participants")
      .deleteMany({ lastStatus: { $lt: limit } });
  } catch (e) {
    console.log("error", e);
  }
}, 15000);

server.listen(4000);
