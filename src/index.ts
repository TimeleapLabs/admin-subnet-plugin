import { WebSocketServer } from "ws";
import { Sia } from "@timeleap/sia";
import { config } from "dotenv";
import { Wallet, Identity } from "@timeleap/client";
import { credit, debit, refund, authorize, unauthorize } from "@lib/rpc.js";

import * as calls from "@lib/calls.js";

import {
  decodeCredit,
  decodeDebit,
  decodeFunctionCall,
  decodeRefund,
} from "@model/accounting.js";
import { logger } from "./lib/logging.js";

config();

const wss = new WebSocketServer({ port: 3000 });
const wallet = await Wallet.fromBase58(process.env.PLUGIN_PRIVATE_KEY!);
const worker = await Identity.fromBase58(process.env.WORKER_PUBLIC_KEY!);

const { sendError, sendSuccess, verifySignature } = calls.wrap(wallet);
const PLUGIN_NAME = "swiss.timeleap.admin.v1";

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (buf: Buffer) => {
    if (!(await worker.verify(buf))) {
      logger.error("Invalid signature from worker");
      return;
    }

    const sia = new Sia(buf);
    const { uuid, plugin, method } = decodeFunctionCall(sia);

    if (plugin !== PLUGIN_NAME) {
      logger.error("Invalid plugin:", plugin);
      return await sendError(ws, 404, uuid);
    }

    const clientBuf = buf.subarray(sia.offset);

    try {
      switch (method) {
        case "credit":
          const record = decodeCredit(sia);
          if (!(await verifySignature(ws, clientBuf, record.proof))) {
            return;
          }
          await credit(record);
          await sendSuccess(ws, uuid);
          break;

        case "debit":
          const debitRecord = decodeDebit(sia);
          if (!(await verifySignature(ws, clientBuf, debitRecord.proof))) {
            return;
          }
          await debit(debitRecord);
          await sendSuccess(ws, uuid);
          break;

        case "refund":
          const refundRecord = decodeRefund(sia);
          if (!(await verifySignature(ws, clientBuf, refundRecord.proof))) {
            return;
          }
          await refund(refundRecord);
          await sendSuccess(ws, uuid);
          break;

        case "authorize":
          const authorizeRecord = decodeCredit(sia);
          if (!(await verifySignature(ws, clientBuf, authorizeRecord.proof))) {
            return;
          }
          await authorize(authorizeRecord);
          await sendSuccess(ws, uuid);
          break;

        case "unauthorize":
          const unauthorizeRecord = decodeCredit(sia);
          if (
            !(await verifySignature(ws, clientBuf, unauthorizeRecord.proof))
          ) {
            return;
          }
          await unauthorize(unauthorizeRecord);
          await sendSuccess(ws, uuid);
          break;

        default:
          logger.error("Unknown method:", method);
          await sendError(ws, 404, uuid);
          break;
      }
    } catch (error) {
      logger.error("Error processing message:", error);
      await sendError(ws, 500, uuid);
    }
  });
});

logger.info("WebSocket server is running on ws://localhost:3000");
