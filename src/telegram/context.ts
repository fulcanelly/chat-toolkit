import { Markup, Telegraf } from "telegraf";
import { AllStates, Context, GlobalSharedAppContext, LowLevelAction, RecordedEvent, SayParams, StateLibrary, SuggestIt, SwitchStateError } from "../state/state";
import { MessageStore, MsgWithText } from "@/utils/MessageStore";
import * as R from "ramda";
import { Message } from "telegraf/typings/core/types/typegram";
// import { MarkupType, mediaSender } from "./media-sender";



// export async function findOrCreateUser(user_id: number, first_name = ''): Promise<TelegramUserInstance> {
//   return await TelegramUser.findOne({ where: { id: user_id } })
//     || await TelegramUser.createOne({
//       id: user_id,
//       first_name,
//       created_at: Date.now()
//     })
// }

export type MarkupType = Parameters<Telegraf['telegram']['sendPhoto']>[2]


export function commonLowLevel<StateT, TransactionT>(): LowLevelAction {
  return {
    say(text: string, params?: SayParams): Promise<void> {
      throw new Error("Function not implemented.");
    },

    expectAny<T>(x: (a) => T): Promise<T> {
      throw new Error("Function not implemented.");
    },

    expect(): Promise<string> {
      throw new Error("Function not implemented.");
    },

    switchState(state, args): Promise<never> {
      throw new SwitchStateError(state as string, args)
    },

    async escape<T>(action: (user: any) => Promise<T> | T): Promise<T> {
      return action(null as any)
    },

    random: () => Promise.resolve(Math.random()),

    _disableRecording() {
      throw new Error("Function not implemented.");
    }
  }
}

// export async function createPrivateTelegramContext<T = StateLibrary>({ 
// <StateT, TransactionT>

type TelegramParams = {

}


type TelegramContextParams = {
  bot: Telegraf
  user_id: number
  allStates: AllStates,
  messageStore: MessageStore<MsgWithText>
  defaultState: string
  globalSharedAppContext: GlobalSharedAppContext
}


export type DbParams<User> = {
  findOrCreateUser(user_id: number): Promise<User>
  // switchState(): Promise<void>
  stateManager: (params: { currentUser: User, defaultState: string }) => Context['manage']
}


export async function createPrivateTelegramContext<User>({
  bot, user_id,
  allStates,
  messageStore,
  defaultState,
  globalSharedAppContext
}: TelegramContextParams,
  { findOrCreateUser, stateManager }: DbParams<User>): Promise<Context> {

  console.log({ findOrCreateUser })

  const currentUser = await findOrCreateUser(user_id)
  // const character = await currentUser._character().first()

  async function expectAny<T>(matcher: (it: Message) => T | undefined): Promise<T> {
    do {
      const message = await messageStore.getMessage(user_id)

      const matched = matcher(message)
      if (matched) {
        return matched
      } else {
        // TODO add warning 
      }

    } while (true)
  }

  async function expect(): Promise<string> {
    do {
      const message = await messageStore.getMessage(user_id)
      if (message.text) {
        return message.text
      }
    } while (true)
  }

  async function say(text: string, params?: SayParams): Promise<void> {
    let markup: MarkupType = {}

    if (params?.keyboard) {
      markup = Markup.keyboard(R.splitEvery(2, params?.keyboard))
        .oneTime()
        .resize()
    }

    if (params?.gifPath) {
      markup.caption = text
      // await mediaSender.sendAnimation(bot, user_id, params.gifPath, markup)

      throw new Error("TODO")
      //TODO
    } else if (params?.photoPath) {
      markup.caption = text
      // await mediaSender.sendPhotoByFilePath(bot, user_id, params.photoPath, markup)
      throw new Error("TODO")
      //TODO
    } else {
      await bot.telegram.sendMessage(user_id, text, markup)
    }
  }

  // TODO any -> T
  const escapeCtx = {
    user: currentUser as any,
    // character,
    sharedCtx: globalSharedAppContext
  }

  const escape: LowLevelAction['escape'] = async callback => {
    return callback(escapeCtx)
  }

  const implemntation: LowLevelAction = {
    ...commonLowLevel(),
    expect,
    say,
    escape,
    expectAny,
  }

  return {
    allStates, //TODO

    manage: stateManager({
      currentUser,
      defaultState, //TODO
    }),

    implemntation: implemntation as any
  }
}




//since it not only send but also await
// but await never happens

// dublicate sends happens

// need some sort of shyntetic action
// which would do both sepratly to db level but semlesly for user


/**
 *
 * i.e.
 *
 * low lever -> say, expect
 * middlware
 * proxy for saving
 * proxy for restoring
 * high level
 * suggest, suggestIt
 *
 */
//butterbrod
// async suggest<T extends string[]>(question: string, options: T): Promise<T[number]> {
//   const markup = Markup.keyboard([options])
//     .oneTime()
//     .resize()


//   await bot.telegram.sendMessage(user_id, question, markup)
//   ///

//   let result: string
//   do {
//     result = await expect()
//     if (options.includes(result)) {
//       return result
//     } else {
//       await bot.telegram.sendMessage(user_id, 'there is no such option', markup) // TODO localize
//     }
//   } while (true)

//   return 3 as any
// },
// suggestIt: function (promptText: string): SuggestIt {
//   throw new Error("Function not implemented.");
// },
