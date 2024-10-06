// const originalR4equire = global.require


// global.require = Object.assign((args) => {
//   console.log('required')
//   return originalR4equire(args)

// }, originalR4equire)

import 'tsconfig-paths/register'
import '@/modules/neo4j'

import '@/models/__relations'
import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import 'neogma'
import { findOrCreateUser } from '@/lib/telegram_context';
import { allStates } from '@/lib/state';
import { createTelegramHandler, ExtractContext } from './handler';

import '@/jobs/hunger'
import '@/states/callback_execution'
import { setupNotificationHandler } from '@/jobs/notifications';
import { Ref } from '@/utils/Ref';
import { executeByUUID } from '@/states/callback_execution';
import { setupSleep } from '@/jobs/sleep';

import { setupCallbackQueryHandling } from '@/states/hunger';
import { setupFamilyCallbackQueryHandling } from '@/lib/referal/states/familty';
import { setupCommands } from '@/commands/@setup';
import { setupBonusNotifications } from './jobs/bonus';
import { setupIndexesAndUniq } from './modules/neo4j';
import { setupMarketCallbackQueryHandling } from './states/market/inline-keyboard';
import { setupInventoryCallbackQueryHandling } from './states/inventory/inline-keyboard';
import { logger } from './modules/logger';
import { detectBlockingStates } from './lib/detect-blocking-states';


dotenv.config();

console.log({
  TG_BOT_API_TOKEN: process.env.TG_BOT_API_TOKEN
})



export const bot = new Telegraf(process.env.TG_BOT_API_TOKEN as string)



const handler
  = createTelegramHandler({
    bot,
    allStates,
    defaultState: 'startingState'
  })

export const { privateContextStore, cancelContext, handlePrivateMessage } = handler


// bot

bot.use(async (ctx, next) => {
  if (!ctx.from) {
    return
  }

  const { id, first_name } = ctx.from

  await findOrCreateUser(id, first_name)
  await next()
})


// Should run after handlePrivateMessage to be sure that user exists in db



bot.action(/.*/, async ctx => {
  await ctx.answerCbQuery();

  const mid = ctx.callbackQuery.message?.message_id

  const data = (ctx.callbackQuery as any).data

  await executeByUUID(data, {
    ...await setupInventoryCallbackQueryHandling(ctx),
    ...setupCallbackQueryHandling(ctx),
    ...await setupFamilyCallbackQueryHandling(ctx),
    ...await setupMarketCallbackQueryHandling(ctx),
  })

})


type c = ExtractContext<Parameters<typeof bot.on<'message'>>[1]>

const onMessage = async (ctx: c) => {

  console.log(ctx.message)

  if (ctx.message.chat.type != 'private') {
    logger.warn('skipping non private')
    return
  }

  await handlePrivateMessage(ctx as any)

}


bot.catch((err) => console.error(err))

export interface SharedCtxState {
  botUsername?: string
}


export const sharedCtxRef: Ref<SharedCtxState> = { value: {} }

async function start() {

  await detectBlockingStates()

  await setupCommands(bot, handler)
  bot.on('message', onMessage)

  await setupIndexesAndUniq()
  setupNotificationHandler(handler)
  setupBonusNotifications()
  setupSleep()

  const me = await bot.telegram.getMe()

  sharedCtxRef.value!.botUsername = me.username!

  await bot.launch(() => {
    logger.info(`Startd bot - t.me/${me.username}`)
  })
}

if (require.main === module) {
  void start()
}


