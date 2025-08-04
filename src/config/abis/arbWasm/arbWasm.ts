/**
 * ArbWasm Precompile ABI
 *
 * Precompiled contract that exists in every Arbitrum chain at 0x0000000000000000000000000000000000000071
 * Methods for managing user programs (Stylus WASM contracts)
 *
 * @see https://github.com/OffchainLabs/nitro-precompile-interfaces/blob/main/src/ArbWasm.sol
 */

export const ARB_WASM_ABI = [
  {
    type: 'function',
    name: 'programTimeLeft',
    stateMutability: 'view',
    inputs: [{ name: 'program', type: 'address' }],
    outputs: [{ type: 'uint64' }],
  },
  {
    type: 'function',
    name: 'programVersion',
    stateMutability: 'view',
    inputs: [{ name: 'program', type: 'address' }],
    outputs: [{ type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'activateProgram',
    stateMutability: 'payable',
    inputs: [{ name: 'program', type: 'address' }],
    outputs: [
      { name: 'version', type: 'uint16' },
      { name: 'dataFee', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'stylusVersion',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'version', type: 'uint16' }],
  },
] as const;

export const ARB_WASM_PRECOMPILE =
  '0x0000000000000000000000000000000000000071' as const;
