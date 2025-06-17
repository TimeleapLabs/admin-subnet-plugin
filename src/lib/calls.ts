import { encodeError, encodeSuccess, Signature } from "@/model/admin.js";
import { Identity, Wallet, OpCodes } from "@timeleap/client";
import { Sia } from "@timeleap/sia";
import { appId } from "./app.js";

import WebSocket from "ws";
import { logger } from "./logging.js";

export const wrap = (wallet: Wallet) => {
  const sendError = async (
    ws: WebSocket,
    errorCode: number,
    uuid: Uint8Array,
  ) => {
    const error = encodeError(Sia.alloc(512), {
      opcode: OpCodes.RPCResponse,
      appId,
      error: errorCode,
      uuid,
    });
    const payload = await wallet.signSia(error);
    ws.send(payload.toUint8ArrayReference());
  };

  const sendSuccess = async (ws: WebSocket, uuid: Uint8Array) => {
    const success = encodeSuccess(Sia.alloc(512), {
      opcode: OpCodes.RPCResponse,
      appId,
      error: 0,
      uuid,
      status: true,
    });
    const payload = await wallet.signSia(success);
    ws.send(payload.toUint8ArrayReference());
  };

  return {
    sendError,
    sendSuccess,
  };
};
