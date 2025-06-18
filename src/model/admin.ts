import { Sia } from "@timeleap/sia";
import { Client, Function } from "@timeleap/client";

export interface Signature {
  signer: Uint8Array | Buffer;
  signature: Uint8Array | Buffer;
}

export function encodeSignature(sia: Sia, signature: Signature): Sia {
  sia.addByteArrayN(signature.signer);
  sia.addByteArrayN(signature.signature);
  return sia;
}

export function decodeSignature(sia: Sia): Signature {
  return {
    signer: sia.readByteArrayN(32),
    signature: sia.readByteArrayN(64),
  };
}

export interface Fee {
  amount: number;
  currency: string;
}

export function encodeFee(sia: Sia, fee: Fee): Sia {
  sia.addUInt64(fee.amount);
  sia.addString8(fee.currency);
  return sia;
}

export function decodeFee(sia: Sia): Fee {
  return {
    amount: sia.readUInt64(),
    currency: sia.readString8(),
  };
}

export interface Credit {
  amount: number;
  currency: string;
  user: Uint8Array | Buffer;
  subnet: Uint8Array | Buffer;
}

export function encodeCredit(sia: Sia, credit: Credit): Sia {
  sia.addUInt64(credit.amount);
  sia.addString8(credit.currency);
  sia.addByteArrayN(credit.user);
  sia.addByteArrayN(credit.subnet);
  return sia;
}

export function decodeCredit(sia: Sia): Credit {
  return {
    amount: sia.readUInt64(),
    currency: sia.readString8(),
    user: sia.readByteArrayN(32),
    subnet: sia.readByteArrayN(32),
  };
}

export interface Refund {
  debit: Uint8Array | Buffer;
  amount: number;
  currency: string;
  user: Uint8Array | Buffer;
  subnet: Uint8Array | Buffer;
}

export function encodeRefund(sia: Sia, refund: Refund): Sia {
  sia.addByteArray8(refund.debit);
  sia.addUInt64(refund.amount);
  sia.addString8(refund.currency);
  sia.addByteArrayN(refund.user);
  sia.addByteArrayN(refund.subnet);
  return sia;
}

export function decodeRefund(sia: Sia): Refund {
  return {
    debit: sia.readByteArray8(),
    amount: sia.readUInt64(),
    currency: sia.readString8(),
    user: sia.readByteArrayN(32),
    subnet: sia.readByteArrayN(32),
  };
}

export interface Debit {
  amount: number;
  currency: string;
  user: Signature;
  subnet: Uint8Array | Buffer;
}

export function encodeDebit(sia: Sia, debit: Debit): Sia {
  sia.addUInt64(debit.amount);
  sia.addString8(debit.currency);
  encodeSignature(sia, debit.user);
  sia.addByteArrayN(debit.subnet);
  return sia;
}

export function decodeDebit(sia: Sia): Debit {
  return {
    amount: sia.readUInt64(),
    currency: sia.readString8(),
    user: decodeSignature(sia),
    subnet: sia.readByteArrayN(32),
  };
}

export interface UpdateSubnet {
  subnet: Uint8Array | Buffer;
  stakeUser: Uint8Array | Buffer;
}

export function encodeUpdateSubnet(sia: Sia, updateSubnet: UpdateSubnet): Sia {
  sia.addByteArrayN(updateSubnet.subnet);
  sia.addByteArrayN(updateSubnet.stakeUser);
  return sia;
}

export function decodeUpdateSubnet(sia: Sia): UpdateSubnet {
  return {
    subnet: sia.readByteArrayN(32),
    stakeUser: sia.readByteArrayN(20),
  };
}

export interface Authorize {
  user: Uint8Array | Buffer;
  subnet: Uint8Array | Buffer;
}

export function encodeAuthorize(sia: Sia, authorize: Authorize): Sia {
  sia.addByteArrayN(authorize.user);
  sia.addByteArrayN(authorize.subnet);
  return sia;
}

export function decodeAuthorize(sia: Sia): Authorize {
  return {
    user: sia.readByteArrayN(32),
    subnet: sia.readByteArrayN(32),
  };
}

export interface UnAuthorize {
  user: Uint8Array | Buffer;
  subnet: Uint8Array | Buffer;
}

export function encodeUnAuthorize(sia: Sia, unAuthorize: UnAuthorize): Sia {
  sia.addByteArrayN(unAuthorize.user);
  sia.addByteArrayN(unAuthorize.subnet);
  return sia;
}

export function decodeUnAuthorize(sia: Sia): UnAuthorize {
  return {
    user: sia.readByteArrayN(32),
    subnet: sia.readByteArrayN(32),
  };
}

export interface FunctionCall {
  opcode: number;
  appId: number;
  uuid: Uint8Array | Buffer;
  plugin: string;
  method: string;
  timeout: number;
  fee: Fee;
}

export function encodeFunctionCall(sia: Sia, functionCall: FunctionCall): Sia {
  sia.addUInt8(functionCall.opcode);
  sia.addUInt64(functionCall.appId);
  sia.addByteArray8(functionCall.uuid);
  sia.addString8(functionCall.plugin);
  sia.addString8(functionCall.method);
  sia.addUInt64(functionCall.timeout);
  encodeFee(sia, functionCall.fee);
  return sia;
}

export function decodeFunctionCall(sia: Sia): FunctionCall {
  return {
    opcode: sia.readUInt8(),
    appId: sia.readUInt64(),
    uuid: sia.readByteArray8(),
    plugin: sia.readString8(),
    method: sia.readString8(),
    timeout: sia.readUInt64(),
    fee: decodeFee(sia),
  };
}

export interface Error {
  opcode: number;
  appId: number;
  uuid: Uint8Array | Buffer;
  error: number;
}

export function encodeError(sia: Sia, error: Error): Sia {
  sia.addUInt8(error.opcode);
  sia.addUInt64(error.appId);
  sia.addByteArray8(error.uuid);
  sia.addUInt16(error.error);
  return sia;
}

export function decodeError(sia: Sia): Error {
  return {
    opcode: sia.readUInt8(),
    appId: sia.readUInt64(),
    uuid: sia.readByteArray8(),
    error: sia.readUInt16(),
  };
}

export interface Success {
  opcode: number;
  appId: number;
  uuid: Uint8Array | Buffer;
  error?: number;
  status: boolean;
}

export function encodeSuccess(sia: Sia, success: Success): Sia {
  sia.addUInt8(success.opcode);
  sia.addUInt64(success.appId);
  sia.addByteArray8(success.uuid);
  sia.addUInt16(success.error ?? 0);
  sia.addBool(success.status);
  return sia;
}

export function decodeSuccess(sia: Sia): Success {
  return {
    opcode: sia.readUInt8(),
    appId: sia.readUInt64(),
    uuid: sia.readByteArray8(),
    error: sia.readUInt16(),
    status: sia.readBool(),
  };
}

export interface Status {
  ok: boolean;
}

export function encodeStatus(sia: Sia, status: Status): Sia {
  sia.addBool(status.ok);
  return sia;
}

export function decodeStatus(sia: Sia): Status {
  return {
    ok: sia.readBool(),
  };
}

export class Admin {
  private methods: Map<string, Function> = new Map();
  private pluginName = "swiss.timeleap.admin.v1";

  constructor(private client: Client) {}

  static connect(client: Client): Admin {
    return new Admin(client);
  }

  private getMethod(
    method: string,
    timeout: number,
    fee: { currency: string; amount: number },
  ): Function {
    if (!this.methods.has(method)) {
      this.methods.set(
        method,
        this.client.method({
          plugin: this.pluginName,
          method,
          timeout,
          fee,
        }),
      );
    }
    return this.methods.get(method)!;
  }

  public async credit(sia: Sia, credit: Credit): Promise<Status> {
    encodeCredit(sia, credit);
    const method = this.getMethod("credit", 10000, {
      currency: "TLP",
      amount: 0,
    });
    const response = await method.populate(sia).invoke();
    const value = decodeStatus(response);
    return value;
  }

  public async updateSubnet(
    sia: Sia,
    updateSubnet: UpdateSubnet,
  ): Promise<Status> {
    encodeUpdateSubnet(sia, updateSubnet);
    const method = this.getMethod("updateSubnet", 10000, {
      currency: "TLP",
      amount: 0,
    });
    const response = await method.populate(sia).invoke();
    const value = decodeStatus(response);
    return value;
  }

  public async authorize(sia: Sia, authorize: Authorize): Promise<Status> {
    encodeAuthorize(sia, authorize);
    const method = this.getMethod("authorize", 10000, {
      currency: "TLP",
      amount: 0,
    });
    const response = await method.populate(sia).invoke();
    const value = decodeStatus(response);
    return value;
  }

  public async unAuthorize(
    sia: Sia,
    unAuthorize: UnAuthorize,
  ): Promise<Status> {
    encodeUnAuthorize(sia, unAuthorize);
    const method = this.getMethod("unAuthorize", 10000, {
      currency: "TLP",
      amount: 0,
    });
    const response = await method.populate(sia).invoke();
    const value = decodeStatus(response);
    return value;
  }
}
