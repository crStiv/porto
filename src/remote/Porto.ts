import type * as RpcRequest from 'ox/RpcRequest'
import { createStore, type StoreApi } from 'zustand/vanilla'

import type * as Chains from '../core/Chains.js'
import type { ExactPartial, OneOf } from '../core/internal/types.js'
import * as UserAgent from '../core/internal/userAgent.js'
import * as Messenger from '../core/Messenger.js'
import * as Mode from '../core/Mode.js'
import * as Porto_ from '../core/Porto.js'
import type * as RpcSchema from '../core/RpcSchema.js'
import * as Storage from '../core/Storage.js'

const messenger = (() => {
  if (typeof window === 'undefined') return Messenger.noop()

  const url = new URL(window.location.href)
  const relayUrl = url.searchParams.get('relayUrl')
  if (relayUrl) return Messenger.cliRelay({ relayUrl })

  return Messenger.bridge({
    from: Messenger.fromWindow(window),
    to: Messenger.fromWindow(window.opener ?? window.parent),
  })
})() as Messenger.Bridge | Messenger.Messenger

export const defaultConfig = {
  ...Porto_.defaultConfig,
  messenger,
  methodPolicies: [
    {
      method: 'eth_requestAccounts',
      modes: {
        dialog: true,
        headless: {
          sameOrigin: true,
        },
      },
      requireConnection: false,
      requireUpdatedAccount: false,
    },
    {
      method: 'wallet_getAccountVersion',
      modes: {
        headless: true,
      },
    },
    {
      method: 'wallet_getKeys',
      modes: {
        headless: true,
      },
    },
    {
      method: 'wallet_getPermissions',
      modes: {
        headless: true,
      },
    },
    {
      method: 'wallet_grantAdmin',
      modes: {
        dialog: {
          sameOrigin: true,
        },
      },
    },
    {
      method: 'wallet_revokeAdmin',
      modes: {
        dialog: {
          sameOrigin: true,
        },
      },
    },
    {
      method: 'wallet_upgradeAccount',
      modes: {
        headless: true,
      },
    },
    {
      method: 'wallet_updateAccount',
      requireUpdatedAccount: false,
    },
    {
      method: 'wallet_connect',
      modes: {
        dialog: true,
        headless: !UserAgent.isSafari()
          ? {
              sameOrigin: true,
            }
          : undefined,
      },
      requireConnection: false,
      requireUpdatedAccount: false,
    },
    {
      method: 'wallet_getCallsStatus',
      modes: {
        headless: true,
      },
    },
    {
      method: 'wallet_getCapabilities',
      modes: {
        headless: true,
      },
    },
    {
      method: 'wallet_prepareCalls',
      modes: {
        headless: true,
      },
    },
    {
      method: 'wallet_sendPreparedCalls',
      modes: {
        headless: true,
      },
    },
  ],
  mode: Mode.contract(),
  storage: Storage.localStorage(),
} as const satisfies Config

/**
 * Instantiates an Porto instance to be used in a remote context (e.g. an iframe or popup).
 *
 * @example
 * ```ts twoslash
 * import { Porto } from 'porto/remote'
 * const porto = Porto.create()
 * ```
 */
export function create<
  const chains extends readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ] = typeof defaultConfig.chains,
>(parameters?: ExactPartial<Config<chains>> | undefined): Porto<chains>
export function create(
  parameters: ExactPartial<Config> | undefined = {},
): Porto {
  const {
    chains = defaultConfig.chains,
    feeToken,
    mode = defaultConfig.mode,
    messenger = defaultConfig.messenger,
    methodPolicies = defaultConfig.methodPolicies,
    merchantRpcUrl,
    storage = defaultConfig.storage,
    storageKey = defaultConfig.storageKey,
    transports = defaultConfig.transports,
  } = parameters

  const porto = Porto_.create({
    announceProvider: false,
    chains,
    feeToken,
    merchantRpcUrl,
    mode,
    storage,
    storageKey,
    transports,
  })

  const remoteStore = createStore<RemoteState>(() => ({
    requests: [],
  }))

  return {
    ...porto,
    _internal: {
      ...porto._internal,
      remoteStore,
    },
    messenger,
    methodPolicies,
    mode,
    ready() {
      const { chainId, feeToken } = porto._internal.store.getState()
      if (!('ready' in messenger)) return
      return (messenger as Messenger.Bridge).ready({
        chainId,
        feeToken,
        methodPolicies,
      })
    },
  } as unknown as Porto
}

export type Porto<
  chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ],
> = Porto_.Porto<chains> & {
  mode: Mode.Mode
  messenger: OneOf<Messenger.Bridge | Messenger.Messenger>
  methodPolicies?: MethodPolicies | undefined
  ready: () => void
  _internal: Porto_.Porto<chains>['_internal'] & {
    remoteStore: StoreApi<RemoteState>
  }
}

export type Config<
  chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ],
> = Porto_.Config<chains> & {
  messenger?: OneOf<Messenger.Bridge | Messenger.Messenger> | undefined
  methodPolicies?: MethodPolicies | undefined
}

export type MethodPolicy = {
  method: string
  modes?:
    | {
        headless?:
          | true
          | {
              sameOrigin?: boolean | undefined
            }
          | undefined
        dialog?:
          | true
          | {
              sameOrigin?: boolean | undefined
            }
          | undefined
      }
    | undefined
  requireConnection?: boolean | undefined
  requireUpdatedAccount?: boolean | undefined
}
export type MethodPolicies = readonly MethodPolicy[]

export type State<
  chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ],
> = Porto_.State<chains>

export type RemoteState = {
  requests: readonly (Porto_.QueuedRequest & {
    request: RpcRequest.RpcRequest<RpcSchema.Schema>
  })[]
}
