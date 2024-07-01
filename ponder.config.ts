import { ponder } from "@/generated";
import { createConfig } from "@ponder/core";
import {
  formatEther,
  decodeAbiParameters,
  parseEther,
  decodeFunctionData,
  decodeEventLog,
} from "viem";
import { computePositionId, ethWeiToPoints } from "./src/utils";
import { erc20ABI } from "./abis/erc20ABI";
import { factoryABI } from "./abis/factoryABI";
import { http } from "viem";

export default createConfig({
  networks: {
    ethereum: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_MAINNET),
      pollingInterval: 15_000,
    },
    arbitrum: {
      chainId: 42161,
      transport: http(process.env.PONDER_RPC_URL_42161),
    },
    anvil: {
      chainId: 31337,
      transport: http(process.env.PONDER_RPC_URL_8545),
    },
  },
  contracts: {
    Numo: {
      maxBlockRange: 500,
      abi: factoryABI,
      network: {
        ethereum: {
          startBlock: 17012204,
        },
        arbitrum: {
          address: "0x32353A6C91143bfd6C7d363B546e62a9A2489A20",
          startBlock: 13142655,
          endBlock: 13150000,
        },
        anvil: {
          startBlock: 0,
        },
      },
    },
  },
});
