import { WebSocketServer } from "ws";
import { Sia } from "@timeleap/sia";
import { Uuid25 } from "uuid25";
import { config } from "dotenv";
import { Wallet, Identity } from "@timeleap/client";

config();

const wss = new WebSocketServer({ port: 3000 });
const wallet = await Wallet.fromBase58(process.env.PLUGIN_PRIVATE_KEY!);
const worker = await Identity.fromBase58(process.env.WORKER_PUBLIC_KEY!);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (buf: Buffer) => {
    if (!(await worker.verify(buf))) {
      console.log("Invalid signature");
      return;
    }
  });
});

console.log("Server started on port 3000");
