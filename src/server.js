import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { json } from "express/lib/response";
import dotenv from "dotenv";
import cors from "cors";
import dayjs from "dayjs";
dotenv.config();

const server = express();
server.use(cors());
server.use(json());
const mongoCliente = new MongoClient("mongodb://localhost:27017");
let db;
mongoCliente.connect(() => {
  db = mongoCliente.db("batepapo_uol");
});

server.post("/participants", async (req, res) => {
  try {
    await db
      .collection("participants")
      .insertOne({ name: req.body, lastStatus: Date.now() });
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

server.post("/messages", (req, res) => {});

server.get("/messages", (req, res) => {});

server.post("/status", (req, res) => {});

server.listen(4000);
