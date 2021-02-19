import * as D from 'discord.js'
import * as DM from '../src'
import type {AnyFunction} from '../src/utils'

/* eslint-disable @typescript-eslint/ban-types -- any object */
type ObjectDeepPartialOmit<T extends object, O extends PropertyKey> = {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- recursive
  [K in keyof T as Exclude<K, O>]?: DeepPartialOmit<T[K], O>
}

export type DeepPartialOmit<
  T,
  O extends PropertyKey = never
> = T extends readonly (infer U)[]
  ? number extends T['length']
    ? T extends unknown[]
      ? DeepPartialOmit<U>[] // ordinary mutable array
      : readonly DeepPartialOmit<U>[] // ordinary readonly array
    : ObjectDeepPartialOmit<T, O> // tuple
  : T extends AnyFunction
  ? T
  : T extends Map<infer K, infer V>
  ? Map<DeepPartialOmit<K, O>, DeepPartialOmit<V, O>>
  : T extends object
  ? ObjectDeepPartialOmit<T, O>
  : T
/* eslint-enable @typescript-eslint/ban-types */

// Omitting valueOf because ({...}).valueOf() is Object, whereas
// (guild as D.Guild).valueOf() is string
export type MatchObjectGuild = DeepPartialOmit<D.Guild, 'valueOf'>

interface TestWithClientOptions {
  intents?: D.ClientOptions['intents']
  data?: DM.Data
  clientData?: DM.ClientData
}

/* eslint-disable jest/expect-expect, jest/require-top-level-describe, jest/valid-title -- helper fns */
export const _testWithClient = (
  fn: (client: D.Client) => Promise<void>,
  {
    intents = D.Intents.NON_PRIVILEGED,
    data,
    clientData
  }: TestWithClientOptions = {}
): void => {
  test('mockClient', async () => {
    const client = new D.Client({intents})
    DM.mockClient(client, clientData, new DM.Backend(data))
    await fn(client)
  })

  test('new DM.Client()', async () =>
    fn(new DM.Client({intents}, clientData, new DM.Backend(data))))
}

export const testWithClient = (
  name: string,
  fn: (client: D.Client) => Promise<void>,
  options?: TestWithClientOptions
): void => describe(name, () => _testWithClient(fn, options))
/* eslint-enable jest/expect-expect, jest/require-top-level-describe, jest/valid-title -- helper fns */
