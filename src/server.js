import express, { json } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import cors from "cors";
dotenv.config();

const mongoCliente = new MongoClient(process.env.MONGO_URI);
let db;

const server = express();
server.use(cors());
server.use(json());

server.post("/participants", async (req, res) => {
  mongoCliente.connect(() => {
    db = mongoCliente.db("batepapo_uol");
  });
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
    mongoCliente.close();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
    mongoCliente.close();
  }
});

server.get("/participants", async (req, res) => {
  mongoCliente.connect(() => {
    db = mongoCliente.db("batepapo_uol");
  });
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
    mongoCliente.close();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
    mongoCliente.close();
  }
});

server.post("/messages", async (req, res) => {
  mongoCliente.connect(() => {
    db = mongoCliente.db("batepapo_uol");
  });
  try {
    const message = {
      ...req.body,
      from: req.headers.user,
      time: dayjs(Date.now).format("HH:mm:ss"),
    };
    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
    mongoCliente.close();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
    mongoCliente.close();
  }
});

server.get("/messages", async (req, res) => {
  mongoCliente.connect(() => {
    db = mongoCliente.db("batepapo_uol");
  });
  try {
    const user = req.headers.user;
    const limit = parseInt(req.query.limit);
    const messages = messagesUserCanSee(user);

    if (limit) {
      res.send(messages.slice(-limit));
    } else {
      res.send(messages);
    }
    mongoCliente.close();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
    mongoCliente.close();
  }
});

server.post("/status", (req, res) => {
  mongoCliente.connect(() => {
    db = mongoCliente.db("batepapo_uol");
  });
  try {
    mongoCliente.close();
  } catch (error) {
    console.log(error);
    res.send(500);
    mongoCliente.close();
  }
});

async function messagesUserCanSee(user) {
  mongoCliente.connect(() => {
    db = mongoCliente.db("batepapo_uol");
  });
  const seeableMessages = [];
  const messages = await db.collection("messages").find().toArray();

  if (!user) {
    return messages;
  }

  for (let message of messages) {
    if (message.to === "Todos" || message.to === user) {
      seeableMessages.push(message);
    }
  }
  return seeableMessages;
}

server.listen(4000);
