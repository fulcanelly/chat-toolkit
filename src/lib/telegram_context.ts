import { Markup, Telegraf } from "telegraf";
import { Context, GlobalSharedAppContext, LowLevelAction, RecordedEvent, SayParams, StateLibrary, SuggestIt, SwitchStateError } from "../state/state";
import { MessageStore, MsgWithText } from "@/utils/MessageStore";
import { defaultNeo4jTelegramManageImplemenation } from "../state/states_n_events";
import * as R from "ramda";
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


export function commonLowLevel<StateT, TransactionT>(): LowLevelAction<StateT, TransactionT> {
  return {
    say(text: string, params?: SayParams): Promise<void> {
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

type TelegramContextParams<StateT, TransactionT> = {
  bot: Telegraf
  user_id: number
  // allStates: T
  messageStore: MessageStore<MsgWithText>
  // defaultState: keyof T
  globalSharedAppContext: GlobalSharedAppContext<StateT, TransactionT>
}


export type DbParams<User, StateT, TransactionT> = {
  findOrCreateUser(user_id: number): Promise<User>

  stateManager: (params: { currentUser: User, defaultState: string }) => Context<StateT, TransactionT>['manage']
}


function defaultPrismaStateManagerImplementation() {

}

export async function createPrivateTelegramContext<StateT, TransactionT>({
  bot, user_id,
  //  allStates,
  messageStore,
  // defaultState,
  globalSharedAppContext
}: TelegramContextParams<StateT, TransactionT>,
  { findOrCreateUser, stateManager }: DbParams<{}, StateT, TransactionT>): Promise<Context<StateT, TransactionT>> {

  const currentUser = await findOrCreateUser(user_id)
  // const character = await currentUser._character().first()

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

  const escapeCtx = {
    user: currentUser,
    // character,
    sharedCtx: globalSharedAppContext
  }

  const escape: LowLevelAction<StateT, TransactionT>['escape'] = async callback => {
    return callback(escapeCtx)
  }

  const implemntation: LowLevelAction<StateT, TransactionT> = {
    ...commonLowLevel(),
    expect,
    say,
    escape
  }

  return {
    allStates: undefined as any, //TODO
    
    manage: stateManager({
      currentUser,
      defaultState: undefined as any //TODO
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
