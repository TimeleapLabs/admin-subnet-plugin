import { Wallet, JsonRpcProvider, ethers } from "ethers";
import { Identity } from "@timeleap/client";
import { logger } from "./logging.js";

import * as sdk from "@timeleap/subnet-contracts-sdk";

import type { Manager, Linker } from "@timeleap/subnet-contracts-sdk/typechain";

import {
  Manager__factory,
  Linker__factory,
} from "@timeleap/subnet-contracts-sdk/typechain";

const privateKey = process.env.EVM_PRIVATE_KEY;

const providerAddress =
  process.env.EVM_RPC_ADDRESS || "https://arb1.arbitrum.io/rpc";

const managerAddress =
  process.env.MANAGER_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

const linkerAddress =
  process.env.LINKER_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

export const getManager = async (): Promise<Manager> => {
  if (!providerAddress || !privateKey) {
    throw new Error("EVM_RPC_ADDRESS and EVM_PRIVATE_KEY must be set");
  }

  const provider = new JsonRpcProvider(providerAddress);
  const wallet = new Wallet(privateKey, provider);

  const manager = Manager__factory.connect(managerAddress, wallet);
  return manager;
};

export const getLinker = async (): Promise<Linker> => {
  if (!providerAddress || !privateKey) {
    throw new Error("EVM_RPC_ADDRESS and EVM_PRIVATE_KEY must be set");
  }

  const provider = new JsonRpcProvider(providerAddress);
  const wallet = new Wallet(privateKey, provider);

  const linker = Linker__factory.connect(linkerAddress, wallet);
  return linker;
};

/**
 * Stake KNS tokens for a specified duration.
 * @param amount - The amount of KNS tokens to stake.
 * @param days - The duration in days for which to stake the tokens.
 * @param nftId - Optional NFT ID to stake with. If provided, the tokens will be staked with the specified NFT.
 * @returns {Promise<void>} A promise that resolves when the staking is complete.
 * @throws {Error} If the amount is invalid or the duration is less than 60 days.
 */
export const stake = async (
  amount: string,
  days: number,
  nftId?: number,
): Promise<void> => {
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error("Invalid stake amount");
  }

  if (!days || isNaN(Number(days)) || Number(days) <= 60) {
    throw new Error("Invalid stake duration in days");
  }

  const manager = await getManager();

  const stakeAmount = ethers.parseUnits(amount, 18);
  const stakeDuration = days * 24 * 60 * 60; // Convert days to seconds
  const params = { amount: stakeAmount, duration: stakeDuration };

  if (nftId) {
    await sdk.stakeWithNft(manager, { ...params, nftId: BigInt(nftId) });
  } else {
    await sdk.stake(manager, params);
  }

  logger.info(
    `Successfully staked ${amount} KNS for ${days} days${
      nftId ? ` with NFT ID ${nftId}` : ""
    }`,
  );
};

/**
 * Unstake KNS tokens.
 * This function withdraws the staked tokens from the manager contract.
 * @returns {Promise<void>} A promise that resolves when the unstaking is complete.
 */
export const unstake = async (): Promise<void> => {
  const manager = await getManager();
  await sdk.unstake(manager);

  logger.info("Successfully withdrew staked tokens");
};

/**
 * Link the current subnet to another subnet.
 * @param subnetId - The ID of the subnet to link to.
 * @returns {Promise<void>} A promise that resolves when the linking is complete.
 * @throws {Error} If the subnet ID is invalid or the linking fails.
 */
export const link = async (subnetId: string): Promise<void> => {
  const linker = await getLinker();
  const subnet = await Identity.fromBase58(subnetId);

  if (subnet.publicKey.length !== 32) {
    throw new Error("Invalid subnet ID length");
  }

  await sdk.link(linker, { to: subnet.publicKey });

  logger.info(`Successfully linked to subnet ${subnetId}`);
};
