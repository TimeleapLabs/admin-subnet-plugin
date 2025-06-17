import { WebSocketServer } from "ws";
import { Sia } from "@timeleap/sia";
import { config } from "dotenv";
import { Wallet, Identity, OpCodes } from "@timeleap/client";
import { credit, debit, refund, authorize, unauthorize } from "@lib/rpc.js";
import { logger } from "@lib/logging.js";

import * as calls from "@lib/calls.js";
import * as app from "@lib/app.js";

import {
  decodeAuthorize,
  decodeCredit,
  decodeDebit,
  decodeFunctionCall,
  decodeRefund,
  decodeUnAuthorize,
} from "@model/accounting.js";

import type { ErrorType } from "./lib/errors.js";

config();

const port = parseInt(process.env.ADMIN_PLUGIN_PORT || "3000", 10);
const wss = new WebSocketServer({ port });
const wallet = await Wallet.fromBase58(process.env.PLUGIN_PRIVATE_KEY!);
const worker = await Identity.fromBase58(process.env.WORKER_PUBLIC_KEY!);

const { sendError, sendSuccess, verifySignature } = calls.wrap(wallet);
const PLUGIN_NAME = "swiss.timeleap.admin.v1";

wss.on("connection", (ws) => {
  logger.info("Client connected");

  ws.on("message", async (buf: Buffer) => {
    if (!(await worker.verify(buf))) {
      logger.error("Invalid signature from worker");
      return;
    }

    const sia = new Sia(buf);
    const { opcode, appId, uuid, plugin, method } = decodeFunctionCall(sia);

    if (appId !== app.appId) {
      logger.error("Invalid appId:", appId);
      return await sendError(ws, 404, uuid);
    }

    if (opcode !== OpCodes.RPCRequest) {
      logger.error("Invalid opcode:", opcode);
      return await sendError(ws, 404, uuid);
    }

    if (plugin !== PLUGIN_NAME) {
      logger.error("Invalid plugin:", plugin);
      return await sendError(ws, 404, uuid);
    }

    const paramsStart = sia.offset;

    try {
      switch (method) {
        case "credit": {
          const record = decodeCredit(sia);
          const paramsEnd = sia.offset;
          const paramsBuf = buf.subarray(paramsStart, paramsEnd);
          if (!(await verifySignature(ws, paramsBuf, record.proof))) {
            return;
          }
          await credit(record, uuid);
          await sendSuccess(ws, uuid);
          break;
        }

        case "debit": {
          const record = decodeDebit(sia);
          const paramsEnd = sia.offset;
          const paramsBuf = buf.subarray(paramsStart, paramsEnd);
          if (!(await verifySignature(ws, paramsBuf, record.proof))) {
            return;
          }
          await debit(record, uuid);
          await sendSuccess(ws, uuid);
          break;
        }

        case "refund": {
          const record = decodeRefund(sia);
          const paramsEnd = sia.offset;
          const paramsBuf = buf.subarray(paramsStart, paramsEnd);
          if (!(await verifySignature(ws, paramsBuf, record.proof))) {
            return;
          }
          await refund(record, uuid);
          await sendSuccess(ws, uuid);
          break;
        }

        case "authorize": {
          const record = decodeAuthorize(sia);
          const paramsEnd = sia.offset;
          const paramsBuf = buf.subarray(paramsStart, paramsEnd);
          if (!(await verifySignature(ws, paramsBuf, record.proof))) {
            return;
          }
          await authorize(record);
          await sendSuccess(ws, uuid);
          break;
        }

        case "unauthorize": {
          const record = decodeUnAuthorize(sia);
          const paramsEnd = sia.offset;
          const paramsBuf = buf.subarray(paramsStart, paramsEnd); // Exclude the signature length
          if (!(await verifySignature(ws, paramsBuf, record.proof))) {
            return;
          }
          await unauthorize(record);
          await sendSuccess(ws, uuid);
          break;
        }

        default:
          logger.error("Unknown method:", method);
          await sendError(ws, 404, uuid);
          break;
      }
    } catch (error) {
      logger.error(error, "Error processing message");
      const errorCode = (error as ErrorType).cause?.code || 500;
      await sendError(ws, errorCode, uuid);
    }
  });
});

logger.info(`WebSocket server is running on ws://localhost:${port}`);
