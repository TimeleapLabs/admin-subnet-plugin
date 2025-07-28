import { WebSocketServer } from "ws";
import { createServer } from "http";

import { Sia } from "@timeleap/sia";
import { config } from "dotenv";
import { Wallet, Identity, OpCodes } from "@timeleap/client";
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
  decodeUpdateSubnet,
} from "@/model/admin.js";

import {
  credit,
  debit,
  refund,
  authorize,
  unauthorize,
  updateSubnet,
} from "@lib/rpc.js";

import type { ErrorType } from "@/lib/errors.js";
import type { IncomingMessage, ServerResponse } from "http";

config();

const handler = (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === `/${app.protocolVersion}/app`) {
    const body = JSON.stringify({
      appId: app.appId,
      version: app.version,
      protocol: app.protocolVersion,
      name: app.name,
    });

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store",
    });

    res.end(body);
  } else {
    res.writeHead(404).end();
  }
};

const port = parseInt(process.env.ADMIN_SUBNET_PORT || "9123", 10);
const server = createServer(handler);
const wss = new WebSocketServer({ server, path: `/${app.protocolVersion}` });
const wallet = await Wallet.fromBase58(process.env.SUBNET_PRIVATE_KEY!);

logger.info(`Subnet public key: ${wallet.toBase58().publicKey}`);

const { sendError, sendSuccess } = calls.wrap(wallet);

export default () => {
  wss.on("connection", (ws) => {
    logger.info(`New connection established`);

    ws.on("message", async (buf: Buffer) => {
      const sia = new Sia(buf);
      const { opcode, appId, uuid, plugin, method } = decodeFunctionCall(sia);

      const sender = await Identity.fromPublicKey(buf.subarray(-96, -64));

      if (!(await sender.verify(buf))) {
        logger.error("Invalid signature from worker");
        return sendError(ws, 401, uuid);
      }

      if (appId !== app.appId) {
        logger.error("Invalid appId:", appId);
        return await sendError(ws, 404, uuid);
      }

      if (opcode !== OpCodes.RPCRequest) {
        logger.error("Invalid opcode:", opcode);
        return await sendError(ws, 404, uuid);
      }

      if (plugin !== app.pluginName) {
        logger.error("Invalid plugin:", plugin);
        return await sendError(ws, 404, uuid);
      }

      try {
        switch (method) {
          case "credit": {
            const record = decodeCredit(sia);
            await credit(record, uuid, sender.publicKey);
            await sendSuccess(ws, uuid);
            break;
          }

          case "debit": {
            const record = decodeDebit(sia);
            await debit(record, uuid, sender.publicKey);
            await sendSuccess(ws, uuid);
            break;
          }

          case "refund": {
            const record = decodeRefund(sia);
            await refund(record, uuid, sender.publicKey);
            await sendSuccess(ws, uuid);
            break;
          }

          case "updateSubnet": {
            const record = decodeUpdateSubnet(sia);
            await updateSubnet(record, sender.publicKey);
            await sendSuccess(ws, uuid);
            break;
          }

          case "authorize": {
            const record = decodeAuthorize(sia);
            await authorize(record, sender.publicKey);
            await sendSuccess(ws, uuid);
            break;
          }

          case "unauthorize": {
            const record = decodeUnAuthorize(sia);
            await unauthorize(record, sender.publicKey);
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

  server.listen(port, () => {
    logger.info(`Server is listening on port ${port}`);
  });
};
