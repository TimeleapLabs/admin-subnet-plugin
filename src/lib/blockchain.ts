import { Wallet, JsonRpcProvider } from "ethers";

import {
  Manager__factory,
  Linker__factory,
} from "@timeleap/subnet-contracts-sdk/typechain";

import type { Manager, Linker } from "@timeleap/subnet-contracts-sdk/typechain";

const providerAddress = process.env.EVM_RPC_ADDRESS;
const privateKey = process.env.EVM_PRIVATE_KEY;

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
