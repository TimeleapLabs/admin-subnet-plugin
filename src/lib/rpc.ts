import {
  Authorize,
  Credit,
  Debit,
  Expire,
  Refund,
  UnAuthorize,
  UpdateSubnet,
} from "@/model/admin.js";
import {
  getClient,
  incUserBalance,
  recordCredit,
  recordDebit,
  safeDecUserBalance,
  safeRecordRefund,
  addDelegateToSubnet,
  removeDelegateFromSubnet,
  addAuthorizeDelegationRecord,
  addUnAuthorizeDelegationRecord,
  upsertSubnet,
  addUpdateSubnetRecord,
  resetUserBalance,
  recordExpire,
} from "@lib/db.js";
import { checkSigner } from "@lib/check.js";
import { getLink } from "./blockchain.js";

/**
 * @description Credit user balance
 * @param credit Credit transaction
 * @param uuid Unique identifier for the transaction
 * @param signer Signer of the credit request
 * @notes This function is used to credit a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const credit = async (
  credit: Credit,
  uuid: Uint8Array,
  signer: Uint8Array,
  signature: Uint8Array,
) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(credit.subnet, signer, session);

      await incUserBalance(
        credit.user,
        credit.currency,
        credit.subnet,
        credit.amount,
        session,
      );

      await recordCredit(credit, uuid, signer, signature, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Debit user balance
 * @param debit Debit transaction
 * @param uuid Unique identifier for the transaction
 * @param signer Signer of the debit request
 * @notes This function is used to debit a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const debit = async (
  debit: Debit,
  uuid: Uint8Array,
  signer: Uint8Array,
  signature: Uint8Array,
) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(debit.subnet, signer, session);

      await safeDecUserBalance(
        debit.user.signer,
        debit.currency,
        debit.subnet,
        debit.amount,
        session,
      );

      await recordDebit(debit, uuid, signer, signature, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Debit user balance
 * @param expire Expire transaction
 * @param uuid Unique identifier for the transaction
 * @param signer Signer of the expire request
 * @notes This function is used to expire a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const expire = async (
  expire: Expire,
  uuid: Uint8Array,
  signer: Uint8Array,
  signature: Uint8Array,
) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(expire.subnet, signer, session);

      await resetUserBalance(
        expire.user,
        expire.currency,
        expire.subnet,
        session,
      );

      await recordExpire(expire, uuid, signer, signature, session);
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Refund user balance
 * @param refund Refund transaction
 * @param uuid Unique identifier for the transaction
 * @param signer Signer of the refund request
 * @notes This function is used to refund a user's balance in the database.
 *        It uses a MongoDB transaction to ensure that both the balance update
 *        and the transaction record are atomic. If either operation fails,
 *        the entire transaction is rolled back.
 */
export const refund = async (
  refund: Refund,
  uuid: Uint8Array,
  signer: Uint8Array,
  signature: Uint8Array,
) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(refund.subnet, signer, session);
      await safeRecordRefund(refund, uuid, signer, signature, session);

      await incUserBalance(
        refund.user,
        refund.currency,
        refund.subnet,
        refund.amount,
        session,
      );
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Authorize user for a subnet
 * @param request Authorize request
 * @param signer Signer of the request
 * @notes This function is used to authorize a user for a specific subnet.
 *        It adds a delegation entry in the database.
 */
export const authorize = async (
  request: Authorize,
  uuid: Uint8Array,
  signer: Uint8Array,
  signature: Uint8Array,
) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(request.subnet, signer, session);
      await addDelegateToSubnet(request.subnet, request.user, session);
      await addAuthorizeDelegationRecord(
        request,
        uuid,
        signer,
        signature,
        session,
      );
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Remove user authorization for a subnet
 * @param unauthorize UnAuthorize request
 * @param signer Signer of the request
 * @notes This function is used to remove a user's authorization for a specific subnet.
 *        It removes the delegation entry from the database.
 */
export const unauthorize = async (
  unauthorize: UnAuthorize,
  uuid: Uint8Array,
  signer: Uint8Array,
  signature: Uint8Array,
) => {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await checkSigner(unauthorize.subnet, signer, session);
      await removeDelegateFromSubnet(
        unauthorize.subnet,
        unauthorize.user,
        session,
      );
      await addUnAuthorizeDelegationRecord(
        unauthorize,
        uuid,
        signer,
        signature,
        session,
      );
    });
  } finally {
    session.endSession();
  }
};

/**
 * @description Update subnet information
 * @param updateSubnet Update subnet request
 * @param signer Signer of the request
 * @notes This function is used to update the subnet information in the database.
 *        It checks if the signer is authorized and updates the subnet details.
 */
export const updateSubnet = async (
  updateSubnet: UpdateSubnet,
  uuid: Uint8Array,
  signer: Uint8Array,
  signature: Uint8Array,
) => {
  const user = "0x" + Buffer.from(updateSubnet.stakeUser).toString("hex");
  const link = await getLink(user);

  if (link !== Buffer.from(updateSubnet.subnet).toString("hex")) {
    throw new Error("Invalid subnet link");
  }

  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await addUpdateSubnetRecord(
        updateSubnet,
        uuid,
        signer,
        signature,
        session,
      );
      await upsertSubnet(updateSubnet, signer);
    });
  } finally {
    session.endSession();
  }
};
