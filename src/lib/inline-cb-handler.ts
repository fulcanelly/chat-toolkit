import { randomUUID } from "crypto"
import { MiddlewareFn, Telegraf } from 'telegraf'
import { Duration, duration } from 'moment'
import { superjson } from "./superjson"
import Redis from "ioredis"


type Midlware = Parameters<Telegraf['start']>[0]
export type ExtractContext<R> = R extends MiddlewareFn<infer T> ? T : never
export type BotContext = ExtractContext<Midlware>
export type ActionCtx = Parameters<typeof Telegraf.action>[1]

const ivalidateIn = duration(1, 'day')



export function createRedisInlineKeyboardHandler({
  redis,
  projectName,
  ivalidateIn = duration(1, 'day'),
}: {
  redis: Redis,
  ivalidateIn: Duration,
  projectName: string
}) {

  function createCallbackHandle<
    H extends (ctx: ExtractContext<ActionCtx>) => { [k: (string | symbol)]: (args: any) => any }
  >({ namespace, handler }: { namespace: string; handler: H }):
    { [M in keyof ReturnType<H>]: (arg: Parameters<ReturnType<H>[M]>[0]) => Promise<string> } {

    if (handlerObjectByNamespace[namespace]) {
      throw new Error(`namespace ${namespace} already exists`)
    }

    handlerObjectByNamespace[namespace] = handler;

    type T = ReturnType<H>

    return new Proxy({} as { [M in keyof T]: (arg: Parameters<T[M]>[0]) => Promise<string> }, {
      get(_, method: keyof T) {
        return async (args: Parameters<T[typeof method]>[0]) => {
          const uuid = randomUUID();

          const key = `${projectName}:callbackquery:${uuid}`;
          const value = superjson.stringify({ method, namespace, args });

          await redis.set(key, value, 'EX', ivalidateIn.asSeconds());

          return uuid;
        };
      }
    }) as any; // Using 'as any' at the end for type assertion
  }

  async function executeByUUID(uuid: string, ctx: ExtractContext<ActionCtx>, object: object) {
    const data = await redis.get(`watermark:callbackquery:${uuid}`)
    if (!data) {
      return //TODO handler of unknown button
    }
    const parsedData = superjson.parse(data) as any
    return object[parsedData.namespace](ctx)[parsedData.method](parsedData.args)
  }


  const handlerObjectByNamespace = {}

  function setupCallbackHandler(bot: Telegraf) {

    bot.action(/.*/, async ctx => {
      // await ctx.answerCbQuery();

      const data = (ctx.callbackQuery as any).data

      await executeByUUID(data, ctx, handlerObjectByNamespace)
    })
  }

  return {
    createCallbackHandle,
    setupCallbackHandler,
  }
}
