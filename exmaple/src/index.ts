import { PrismaClient } from '@prisma/client'
import { defaultPrismaStateManagerImplementation, findOrCreateUser } from './state-mng'
import { createTelegramHandler } from 'chat-toolkit'
import { Telegraf } from 'telegraf'
import 'dotenv/config'
import { mainState } from './main.state'

export const prisma = new PrismaClient({
  log: ['error', 'info', 'query', 'warn']
})

const dbParams = {
  findOrCreateUser,
  stateManager: defaultPrismaStateManagerImplementation
}

const bot = new Telegraf(process.env.TG_TOKEN)

const allStates = {
  mainState
}

const handler
  = createTelegramHandler({
    bot,
    allStates,
    defaultState: 'mainState'
  }, dbParams)


bot.start(async ctx => {
  await handler.handlePrivateMessage(ctx, true)
})


bot.on('message', async ctx => {
  await handler.handlePrivateMessage(ctx as any, false)
})


export const { privateContextStore, cancelContext, handlePrivateMessage } = handler

void bot.launch(() => {
  console.log("BOT STARTED")
})
