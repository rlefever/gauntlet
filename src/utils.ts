import {Collection, SnowflakeUtil} from 'discord.js'
import type {Snowflake} from 'discord-api-types/v8'
import type {ResolvedClientData, ResolvedData} from './types'

declare global {
  interface ArrayConstructor {
    isArray(arg: unknown | readonly unknown[]): arg is readonly unknown[]
  }
}

export type NonEmptyArray<T> = [T, ...T[]]
export type ReadonlyNonEmptyArray<T> = Readonly<NonEmptyArray<T>>

/**
 * An intersection between `T` and `U`, but the properties of `U` override the
 * properties of `T`.
 */
export type Override<T, U> = Omit<T, keyof U> & U

/** Make some keys required. */
export type RequireKeys<T, K extends keyof T> = Required<Pick<T, K>> & T

/** Get the keys matching a value in an object. */
export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T]

type ValueOf<T> = T[keyof T]

type Equals<T, U, True = true, False = false> = T extends U
  ? U extends T
    ? True
    : False
  : False

export type CommonProperties<T, U> = Pick<
  T,
  ValueOf<{[K in Extract<keyof U, keyof T>]: Equals<T[K], U[K], K, never>}>
>

export type AnyFunction =
  | ((...args: never[]) => unknown)
  | (new (...args: never[]) => unknown)

export type Fn1<A extends readonly [never] = readonly [never], B = unknown> = (
  ...args: A
) => B

const isObject = <T>(x: T): x is T & object =>
  typeof x == 'object' && x !== null

/**
 * Deep clones an object.
 *
 * @param object The object to clone.
 * @returns The cloned object.
 */
export const clone = <T extends object>(object: T): T => {
  const _clone = <U>(x: U): U =>
    (Array.isArray(x)
      ? x.map(_clone)
      : typeof x == 'object' && ((x as unknown) as object | null)
      ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, _clone(v)]))
      : x) as U
  return _clone(object)
}

/**
 * Removes `undefined` values from an object.
 *
 * This doesn't have an `object` constraint on `T` because of issues like
 * `DataPartialDeep<T>` not being assignable to `object`.
 *
 * WARNING: This is technically ill-typed. For example:
 *
 * ```ts
 * interface A {
 *   a: undefined
 * }
 * const a: A = {a: undefined}
 * // has type A but at runtime is {}, which lacks the a property
 * const bad = removeUndefined(a)
 * ```
 *
 * @param object The object to remove undefined values form.
 * @returns The object without the undefined values, or simply `object` if
 * `object` is not an object (e.g. `undefined`).
 */
export const removeUndefined = <T>(object: T): T =>
  isObject(object)
    ? (Object.fromEntries(
        Object.entries(object).filter(([, v]) => v !== undefined)
      ) as T)
    : object

/**
 * Resolves an array of data to a collection.
 *
 * @param array The array to be resolved.
 * @param key The property of the values to use as the collection key.
 * @param mapper A function to resolve each value in `array` to a new value for
 * collection. Defaults to the identity function.
 * @returns The resolved collection.
 */
export const resolveCollection: {
  <V extends object, K extends keyof V>(
    array: readonly V[] | undefined,
    key: K
  ): Collection<V[K], V>
  <V extends object, U extends V, K extends keyof U>(
    array: readonly V[] | undefined,
    key: K,
    mapper: (value: V) => U
  ): Collection<U[K], U>
} = <V extends object, U extends V, K extends keyof U>(
  array: readonly V[] | undefined,
  key: K,
  mapper = (value: V): U => value as U
): Collection<U[K], U> =>
  new Collection<U[K], U>(
    array?.map(item => {
      const mapped = mapper(item)
      return [mapped[key], mapped]
    })
  )

export const timestamp = (date?: Date | number): string =>
  (date instanceof Date
    ? date
    : typeof date == 'number'
    ? new Date(date)
    : new Date()
  ).toISOString()

export const snowflake = SnowflakeUtil.generate as () => Snowflake

export const clientUserID = (
  {integration_applications}: ResolvedData,
  {application}: ResolvedClientData
): Snowflake => integration_applications.get(application.id)!.bot!.id
