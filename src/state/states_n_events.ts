import { Context, RecordedEvent } from "./state";

import { logger } from "@/modules/logger";


export function defaultNeo4jTelegramManageImplemenation(params: { currentUser: TelegramUserInstance, defaultState: string }): Context['manage'] {
  const { currentUser, defaultState } = params

  const cachedCurrentState = {
    async set(state: string, args: any, session?: Runnable) {
      await currentUser._state().create({
        arguments: JSON.stringify(args),
        uuid: uuidv4(),
        state,
        created_at: Date.now()
      }, { session: session })
    },

    async get(it?: Runnable) {
      logger.silly("Getting current state")
      return await findCurrentState(it);
    }
  }

  const findCurrentState = (session?: Runnable) => currentUser._state().first({ session: session })

  const allCurrentEvents = async () => {
    const state = await cachedCurrentState.get()
    return await state!._events().orderBy('created_at', 'ASC').loadAll()
  }

  const state: Context['manage']['state'] = {
    async save(state: string, args: any, params): Promise<void> {
      await cachedCurrentState.set(state, args, params?.session)
    },

    default(): string {
      return defaultState
    },

    async current(): Promise<string | undefined> {
      const result = await cachedCurrentState.get()
      return result?.state
    },

    async currentFull(): Promise<TelegramUserStateInstance | undefined> {
      return await cachedCurrentState.get()
    },

    async delete(params): Promise<void> {
      const current = await findCurrentState(params?.session)

      if (current) {
        if (params?.session) {
          current.__setCallbackTransaction(params?.session)
        }
        await current.delete({ detach: true, session: params?.session })
      }
    },
  }

  const events: Context['manage']['events'] = {
    async loadAll() {
      const all = await allCurrentEvents()
      return all.map(({ eventName, data }) => ({ eventName, data: data ? JSON.parse(data) : undefined }) as RecordedEvent)
    },

    async save(event) {
      const state = await cachedCurrentState.get()

      await state?._events().create({
        uuid: uuidv4(),
        created_at: Date.now(),
        eventName: event.eventName,
        data: JSON.stringify(event.data)
      })
    },

    async deleteAll(params) {
      const state = await cachedCurrentState.get()
      await state!._events().deleteAll({ detach: true, session: params?.session })
    }
  }

  return {
    state,
    events
  }
}


