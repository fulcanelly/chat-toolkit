// import * as tctx from './telegram/context'
import { Context } from './state/state'
import { createPrivateTelegramContext } from './telegram/context'
import { createTelegramHandler } from './telegram/handler'



export { Context }

export interface Test {
  a: number
}

// export const createPrivateTelegramContext = tctx.createPrivateTelegramContext

export { createPrivateTelegramContext,  createTelegramHandler } 
