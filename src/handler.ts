import { MiddlewareFn, Telegraf } from "telegraf";
import * as state from "./state/state";
import { createPrivateTelegramContext } from "./lib/telegram_context";
import { MessageStore, MsgWithText } from "./utils/MessageStore";


type Midlware = Parameters<Telegraf['start']>[0]
export type ExtractContext<R> = R extends MiddlewareFn<infer T> ? T : never
export type BotContext = ExtractContext<Midlware>


type HandlerParams<T> = {
  bot: Telegraf
  allStates: T
  defaultState: keyof T
}

export type AppHandlerT = ReturnType<typeof createTelegramHandler>

export function createTelegramHandler<T>(params: HandlerParams<T>) {

  const { bot, allStates, defaultState } = params


  //blocking queue of messages
  // but why?
  const messageStore = new MessageStore<MsgWithText>();
 
  // in case if two events for same user happen nearly at the same tame
  // to prevent running two state for one user
  const stateMutex = new Set<number>()
  
  // shows running states
  const runningStates = new Map<number, Promise<void>>()

  // heelps running states communication
  // passing data between active user states'

  const privateContextStore = new Map<number, state.Context>()

  async function cancelContext(user_id: number) {
    console.log({ what: 'canceling', user_id })

    const context = privateContextStore.get(user_id)

    if (!context) {
      return
    }

    messageStore.cancell(user_id)
    await runningStates[user_id]

    privateContextStore.delete(user_id)
    stateMutex.delete(user_id)
    delete runningStates[user_id]
  }

  async function startStateByUserId(user_id: number) {
    if (!privateContextStore.get(user_id) && !stateMutex.has(user_id)) {
      stateMutex.add(user_id)
      console.log('creating context')
      const newContext = await obtainContext(user_id)
      privateContextStore.set(user_id, newContext)
      runningStates[user_id] = state.executeContext(newContext)
        .catch(e => {
          console.error(e)
          console.error("FAILED THING")
        })
    }
  }

  async function handlePrivateMessage(ctx: BotContext, skipMessage?: boolean) {
    const message = ctx.message
    const chat = message.chat
    const user_id = chat.id


    if (ctx.message.chat.type != 'private') {
      console.log('skipping non private')
      return
    }

    await startStateByUserId(user_id)

    if (!skipMessage) {
      console.log('giving message')
      messageStore.addMessage(user_id, message)
    }
  }

  const globalContext: state.GlobalSharedAppContext = {
    bot,
    userContextStore: privateContextStore,
    pendingFights: []
  }

  function obtainContext(user_id: number) {
    return createPrivateTelegramContext({
      bot,
      messageStore,
      user_id,
      allStates,
      defaultState,
      globalSharedAppContext: globalContext
    })
  }

  return {
    messageStore,
    privateContextStore,
    cancelContext,
    handlePrivateMessage,
    obtainContext,
    startStateByUserId,
    runningStates
  }

}
