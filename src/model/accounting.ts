import { Sia } from "@timeleap/sia";

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

export interface Credit {
  uuid: Uint8Array | Buffer;
  amount: number;
  currency: string;
  user: Uint8Array | Buffer;
  subnet: Signature;
}

export function encodeCredit(sia: Sia, credit: Credit): Sia {
  sia.addByteArray8(credit.uuid);
  sia.addUInt64(credit.amount);
  sia.addString8(credit.currency);
  sia.addByteArrayN(credit.user);
  encodeSignature(sia, credit.subnet);
  return sia;
}

export function decodeCredit(sia: Sia): Credit {
  return {
    uuid: sia.readByteArray8(),
    amount: sia.readUInt64(),
    currency: sia.readString8(),
    user: sia.readByteArrayN(32),
    subnet: decodeSignature(sia),
  };
}

export interface Debit {
  uuid: Uint8Array | Buffer;
  amount: number;
  currency: string;
  user: Signature;
  subnet: Signature;
}

export function encodeDebit(sia: Sia, debit: Debit): Sia {
  sia.addByteArray8(debit.uuid);
  sia.addUInt64(debit.amount);
  sia.addString8(debit.currency);
  encodeSignature(sia, debit.user);
  encodeSignature(sia, debit.subnet);
  return sia;
}

export function decodeDebit(sia: Sia): Debit {
  return {
    uuid: sia.readByteArray8(),
    amount: sia.readUInt64(),
    currency: sia.readString8(),
    user: decodeSignature(sia),
    subnet: decodeSignature(sia),
  };
}

export interface Refund {
  uuid: Uint8Array | Buffer;
  subnet: Signature;
}

export function encodeRefund(sia: Sia, refund: Refund): Sia {
  sia.addByteArray8(refund.uuid);
  encodeSignature(sia, refund.subnet);
  return sia;
}

export function decodeRefund(sia: Sia): Refund {
  return {
    uuid: sia.readByteArray8(),
    subnet: decodeSignature(sia),
  };
}

export interface Authorize {
  address: Uint8Array | Buffer;
  subnet: Signature;
}

export function encodeAuthorize(sia: Sia, authorize: Authorize): Sia {
  sia.addByteArrayN(authorize.address);
  encodeSignature(sia, authorize.subnet);
  return sia;
}

export function decodeAuthorize(sia: Sia): Authorize {
  return {
    address: sia.readByteArrayN(32),
    subnet: decodeSignature(sia),
  };
}

export interface UnAuthorize {
  address: Uint8Array | Buffer;
  subnet: Signature;
}

export function encodeUnAuthorize(sia: Sia, unAuthorize: UnAuthorize): Sia {
  sia.addByteArrayN(unAuthorize.address);
  encodeSignature(sia, unAuthorize.subnet);
  return sia;
}

export function decodeUnAuthorize(sia: Sia): UnAuthorize {
  return {
    address: sia.readByteArrayN(32),
    subnet: decodeSignature(sia),
  };
}
