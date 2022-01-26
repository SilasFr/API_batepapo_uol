import express from "express";
import cors from "cors";
import { json } from "express/lib/response";
import { MongoCliente } from "mongodb";

const server = express();
server.use(cors());
server.use(json());

server.post("/participants", (req, res) => {
  res.send("OK");
});

server.get("/participants", (req, res) => {});

server.post("/messages", (req, res) => {});

server.get("/messages", (req, res) => {});

server.post("/status", (req, res) => {});

server.listen(4000);
