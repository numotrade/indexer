import { ponder } from "@/generated";
import { formatEther } from "viem";
import { erc20ABI } from "../abis/erc20ABI";
import { factoryABI } from '../abis/factoryABI';

ponder.on("Numo:Swap", async ({ event, context }) => {
  const { Swap, Account } = context.db;

  await Swap.create({
    id: event.transaction.hash,
    data: {
      poolId: event.args.poolId,
      sender: event.args.account,
      amountIn: parseFloat(formatEther(event.args.inputAmount)),
      amountInWad: event.args.inputAmount,
      amountOut: parseFloat(formatEther(event.args.outputAmount)),
      amountOutWad: event.args.outputAmount,
      tokenIn: event.args.tokenIn,
      tokenOut: event.args.tokenOut,
      timestamp: event.block.timestamp,
      block: event.block.number,
    },
  });

  // Create or update sender's account balance
  await Account.upsert({
    id: event.args.from,
    create: {
      balance: BigInt(0),
      isOwner: false,
    },
    update: ({ current }) => ({
      balance: current.balance - event.args.inputAmount,
    }),
  });

  // Create or update recipient's account balance
  await Account.upsert({
    id: event.args.to,
    create: {
      balance: event.args.outputAmount,
      isOwner: false,
    },
    update: ({ current }) => ({
      balance: current.balance + event.args.outputAmount,
    }),
  });

  const swap = await Swap.findUnique({ id: event.transaction.hash });
  console.log(swap);
});

ponder.on("Numo2:Mint", async ({ event, context }) => {
  const { Mint, Position, Pool } = context.db;

  const _pool = await Pool.findUnique({ id: event.args.poolId });

  const lptSupply = await context.client.readContract({
    abi: erc20ABI,
    address: _pool.lpToken,
    functionName: "totalSupply",
  });

  await Mint.create({
    id: event.transaction.hash,
    data: {
      poolId: event.args.poolId,
      sender: event.args.account,
      deltas: event.args.deltas.map((d) => parseFloat(formatEther(d))),
      deltasWad: event.args.deltas,
      deltaLiquidity: parseFloat(formatEther(event.args.deltaL)),
      deltaLiquidityWad: event.args.deltaL,
      timestamp: event.block.timestamp,
      block: event.block.number,
    },
  });

  await Pool.update({
    id: event.args.poolId,
    data: ({ current }) => ({
      reserves: current.reserves.map((r, i) => r + parseFloat(formatEther(event.args.deltas[i] ?? 0n))),
      reservesWad: current.reservesWad.map((r, i) => r + (event.args.deltas[i] ?? 0n)),
      liquidityWad: current.liquidityWad + event.args.deltaL,
      liquidity: parseFloat(formatEther(current.liquidityWad + event.args.deltaL)),
      liquidityTokenSupply: parseFloat(formatEther(lptSupply)),
      liquidityTokenSupplyWad: lptSupply,
    }),
  });

  await Position.upsert({
    id: computePositionId(event.args.poolId, event.args.account),
    create: {
      liquidityWad: event.args.deltaL,
      liquidity: parseFloat(formatEther(event.args.deltaL)),
      accountId: event.args.account,
      poolId: event.args.poolId,
    },
    update: ({ current }) => ({
      liquidityWad: current.liquidityWad + event.args.deltaL,
      liquidity: parseFloat(current.liquidity.toString()) + parseFloat(formatEther(event.args.deltaL)),
    }),
  });
});
