/**
 * Copyright 2020, Optimism PBC
 * MIT License
 * https://github.com/ethereum-optimism
 */

import './setup'

/* Imports: External */
import { Web3Provider } from '@ethersproject/providers'
import ganache from 'ganache-core'
import { verifyMessage } from '@ethersproject/wallet'
import { parse } from '@ethersproject/transactions'
import { SignatureLike, joinSignature } from '@ethersproject/bytes'

/* Imports: Internal */
import { OptimismProvider, sighashEthSign } from '../src/index'
import { mnemonic } from './common'

describe('sendTransaction', () => {
  let provider

  const handlers = {
    eth_chainId: () => '0x1',
  }

  before(async () => {
    const web3 = new Web3Provider(
      ganache.provider({
        mnemonic,
      })
    )
    provider = new OptimismProvider('http://127.0.0.1:3002', web3)
  })

  it('should sign transaction', async () => {
    const tx = {
      to: '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c',
      nonce: 0,
      gasLimit: 0,
      gasPrice: 0,
      data: '0x00',
      value: 0,
      chainId: 1,
    }

    const signer = provider.getSigner()
    // Get the address represting the keypair used to sign the tx
    const address = await signer.getAddress()
    // Sign tx, get a RLP encoded hex string of the signed tx
    const signed = await signer.signTransaction(tx)
    // Decode the signed transaction
    const parsed = parse(signed)
    // Join the r, s and v values
    const sig = joinSignature(parsed as SignatureLike)
    // Hash the transaction using the EthSign serialization
    const hash = sighashEthSign(tx)
    // ecrecover and assert the addresses match
    // this concats the prefix and hashes the message
    const recovered = verifyMessage(hash, sig)
    address.should.eq(recovered)
  })
})
