import * as Schema from 'effect/Schema'
import * as Primitive from './primitive.js'
import { OneOf } from './schema.js'

export const Base = Schema.Struct({
  /** The expiry of the key. */
  expiry: Primitive.Number,
  /** The hash of the key. */
  hash: Primitive.Hex,
  /** The id of the key. */
  id: Primitive.Hex,
  /** Whether digests should be prehashed. */
  prehash: Schema.optional(Schema.Boolean),
  /** Public key. */
  publicKey: Primitive.Hex,
  /** Role. */
  role: Schema.Literal('admin', 'session'),
  /** Key type. */
  type: Schema.Literal('address', 'p256', 'secp256k1', 'webauthn-p256'),
})
export type Base = typeof Base.Type

export const CallPermissions = Schema.Array(
  OneOf(
    Schema.Struct({
      signature: Schema.String,
      to: Primitive.Address,
    }),
    Schema.Struct({
      signature: Schema.String,
    }),
    Schema.Struct({
      to: Primitive.Address,
    }),
  ),
).pipe(Schema.minItems(1))
export type CallPermissions = typeof CallPermissions.Type

export const SignatureVerificationPermission = Schema.Struct({
  addresses: Schema.Array(Primitive.Address),
})
export type SignatureVerificationPermission =
  typeof SignatureVerificationPermission.Type

export const SpendPermissions = Schema.Array(
  Schema.Struct({
    limit: Primitive.BigInt,
    period: Schema.Literal('minute', 'hour', 'day', 'week', 'month', 'year'),
    token: Schema.optional(Primitive.Address),
  }),
)
export type SpendPermissions = typeof SpendPermissions.Type

export const Permissions = Schema.Struct({
  calls: Schema.optional(CallPermissions),
  signatureVerification: Schema.optional(SignatureVerificationPermission),
  spend: Schema.optional(SpendPermissions),
})
export type Permissions = typeof Permissions.Type

export const WithPermissions = Schema.extend(
  Base,
  Schema.Struct({
    permissions: Schema.optional(Permissions),
  }),
)
export type WithPermissions = typeof WithPermissions.Type
