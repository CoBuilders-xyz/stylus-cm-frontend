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
  // Typed errors so viem decodes the revert reason (instead of leaving us with
  // a raw 4-byte selector). Names match the precompile interface in
  // OffchainLabs/nitro-precompile-interfaces.
  { type: 'error', name: 'ProgramNotActivated', inputs: [] },
  {
    type: 'error',
    name: 'ProgramExpired',
    inputs: [{ name: 'ageInSeconds', type: 'uint64' }],
  },
  {
    type: 'error',
    name: 'ProgramNeedsUpgrade',
    inputs: [
      { name: 'version', type: 'uint16' },
      { name: 'stylusVersion', type: 'uint16' },
    ],
  },
  {
    type: 'error',
    name: 'ProgramInsufficientValue',
    inputs: [
      { name: 'have', type: 'uint256' },
      { name: 'want', type: 'uint256' },
    ],
  },
] as const;

export const ARB_WASM_PRECOMPILE =
  '0x0000000000000000000000000000000000000071' as const;
