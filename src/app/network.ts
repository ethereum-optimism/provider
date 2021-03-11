/**
 * Copyright 2020, Optimism PBC
 * MIT License
 * https://github.com/ethereum-optimism
 *
 * This code is based on ethers.js
 * Copyright (c) 2019 Richard Moore
 * MIT License
 * https://github.com/ethers-io/ethers.js
 */

/**
 * This file is copied from ethers and implements a custom `network` list.
 * As Optimism is available on more networks, add additional entries to
 * the `network` list below.
 */

import { Network, Networkish } from '@ethersproject/networks'
import { Logger } from '@ethersproject/logger'
import { ConnectionInfo } from '@ethersproject/web'
import { isUrl } from './utils'

const logger = new Logger('')

type DefaultProviderFunc = (providers: any, options?: any) => any

interface Renetworkable extends DefaultProviderFunc {
  renetwork: (network: Network) => DefaultProviderFunc
}

function isRenetworkable(value: any): value is Renetworkable {
  return value && typeof value.renetwork === 'function'
}

export const homestead: Network = {
  chainId: 1,
  ensAddress: null,
  name: 'homestead',
  _defaultProvider: null,
}

// TODO(mark): add each supported Network to this list
const networks = [homestead]

/**
 *  getNetwork
 *
 *  Converts a named common networks or chain ID (network ID) to a Network
 *  and verifies a network is a valid Network..
 */
export function getNetwork(network: Networkish): Network {
  // No network (null)
  if (network == null) {
    return null
  }

  if (typeof network === 'number') {
    for (const name of Object.keys(networks)) {
      // tslint:disable-next-line:no-shadowed-variable
      const standard = networks[name]
      if (standard.chainId === network) {
        return {
          name: standard.name,
          chainId: standard.chainId,
          ensAddress: standard.ensAddress || null,
          _defaultProvider: standard._defaultProvider || null,
        }
      }
    }

    return {
      chainId: network,
      name: 'unknown',
    }
  }

  if (typeof network === 'string') {
    // tslint:disable-next-line:no-shadowed-variable
    const standard = networks[network]
    if (standard == null) {
      return null
    }
    return {
      name: standard.name,
      chainId: standard.chainId,
      ensAddress: standard.ensAddress,
      _defaultProvider: standard._defaultProvider || null,
    }
  }

  const standard = networks[network.name]

  // Not a standard network; check that it is a valid network in general
  if (!standard) {
    if (typeof network.chainId !== 'number') {
      logger.throwArgumentError('invalid network chainId', 'network', network)
    }
    return network
  }

  // Make sure the chainId matches the expected network chainId (or is 0; disable EIP-155)
  if (network.chainId !== 0 && network.chainId !== standard.chainId) {
    logger.throwArgumentError('network chainId mismatch', 'network', network)
  }

  // @TODO: In the next major version add an attach function to a defaultProvider
  // class and move the _defaultProvider internal to this file (extend Network)
  let defaultProvider: DefaultProviderFunc = network._defaultProvider || null
  if (defaultProvider == null && standard._defaultProvider) {
    // tslint:disable-next-line:prefer-conditional-expression
    if (isRenetworkable(standard._defaultProvider)) {
      defaultProvider = standard._defaultProvider.renetwork(network)
    } else {
      defaultProvider = standard._defaultProvider
    }
  }

  // Standard Network (allow overriding the ENS address)
  return {
    name: network.name,
    chainId: standard.chainId,
    ensAddress: network.ensAddress || standard.ensAddress || null,
    _defaultProvider: defaultProvider,
  }
}

// Based on the newtork, return the public URL of the optimism nodes
// TODO(mark): add public urls here
export function getUrl(
  network: Network,
  extra: Networkish
): string | ConnectionInfo {
  let host: string = null

  // Allow for custom urls to be passed in
  if (typeof extra === 'string' && isUrl(extra)) {
    return { url: extra }
  }

  // List of publically available urls to use
  // TODO(mark): in this case, turn off calls for `eth_getChainId`
  switch (network ? network.name : 'unknown') {
    case 'goerli':
      host = 'goerli.optimism.io'
      break
    case 'main':
    default:
      logger.throwError('unsupported network', Logger.errors.INVALID_ARGUMENT, {
        argument: 'network',
        value: network,
      })
  }

  const connection: ConnectionInfo = {
    url: `https://${host}`,
  }

  return connection
}
