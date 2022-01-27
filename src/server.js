import express, { json } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import dayjs from "dayjs";
dotenv.config();

const server = express();
server.use(cors());
server.use(json());
const mongoCliente = new MongoClient(process.env.MONGO_URI);
let db;
mongoCliente.connect(() => {
  db = mongoCliente.db("batepapo_uol");
});

server.post("/participants", async (req, res) => {
  const participant = { ...req.body, lasStatus: Date.now() };
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
    console.log(error);
    res.sendStatus(500);
  }
});

server.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

server.post("/messages", (req, res) => {
  try {
    const message = {
      ...req.body,
      from: req.headers.user,
      time: dayjs(Date.now).format("HH:mm:ss"),
    };
    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

server.get("/messages", async (req, res) => {
  try {
    const user = req.headers.user;
    const limit = parseInt(req.query.limit);
    const messages = messagesUserCanSee(user);

    if (limit) {
      res.send(messages.slice(-limit));
    } else {
      res.send(messages);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

server.post("/status", (req, res) => {});

function messagesUserCanSee(user) {
  const seeableMessages = [];
  const messages = await db.collection("messages").find().toArray();

  for (let message of messages) {
    if (message.to === "Todos" || message.to === user) {
      seeableMessages.push(message);
    }
  }
}

server.listen(4000);
