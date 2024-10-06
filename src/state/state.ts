


import { Ref } from "src/utils/Ref"
import { runWithImplicitState } from "../lib/implicit_state"

import { MessageStoreCancelationError } from "src/utils/MessageStore"



export type GlobalSharedAppContext<StateT, TransactionT> = {
  userContextStore: Map<number, Context<StateT, TransactionT>>
  // pendingFights: Array<OnlineFight>
  // bot: Telegraf
}


export type EscapeData<StateT, TransactionT> = {
  // user: TelegramUserInstance
  // character?: MoscalCharacterInstance | undefined,
  sharedCtx: GlobalSharedAppContext<StateT, TransactionT>
}

export type Media
  = {
    gifPath?: string
    photoPath?: string
  }

export type GetArguments<T> = T extends ((...args: infer G) => any) ? G : never

export type SecondArgument<T> = T extends (any, second: infer G) => any ? G : never
export type SayParams
  = ({
    keyboard?: string[] | undefined
  } & Media)
  | undefined


export type LowLevelAction<StateT, TransactionT> = {

  say: (text: string, params?: SayParams) => Promise<void>
  expect: () => Promise<string>
  switchState: <T>(state: T, args?: SecondArgument<T>) => Promise<never>
  escape: <T>(action: (user: EscapeData<StateT, TransactionT>) => Promise<T> | T) => Promise<T>
  random: () => Promise<number>

  _disableRecording(): Promise<void>
}

export type HighLevelActions = {
  // This action needed to know when state is runs not for the first time 
  // i.e. when state - restored
  _onRestoreDoRun(callback: () => Promise<void>): Promise<void>
  // Suggests options to answer - telegram keyboard
  suggest: <T extends string[]>(question: string, options: T, extraOptions?: Media) => Promise<T[number]>
  // High level version of suggest  
  suggestIt: SuggestItFunction
}




//todo make it more generic not so coupled

export const allStates = {

}



export type SuggestIt<T> = {
  option: (text: string, action: () => T | Promise<T>) => SuggestIt<T>;
  extra: (e: Media) => SuggestIt<T>
  exec: () => Promise<T>;

};



export type Actions<StateT, TransactionT> = HighLevelActions & LowLevelAction<StateT, TransactionT>



export type StateParams<StateT, TransactionT> = Actions<StateT, TransactionT>

export type State<StateT, TransactionT> = (x: StateParams<StateT, TransactionT>, args?: any) => Promise<void>


export type StateLibrary<StateT, TransactionT> = { [k: string]: State<StateT, TransactionT> }


export type SuggestItFunction = <T>(promptText: string) => SuggestIt<T>;

export type RecordedEvent<StateT, TransactionT> = { eventName: keyof StateParams<StateT, TransactionT>, data: Object | undefined }

export type Context<StateT, TransactionT> = {
  allStates: StateLibrary<StateT, TransactionT>

  implemntation: StateParams<StateT, TransactionT>,

  // currentFight?: OnlineFight,

  manage: {
    state?: {
      save(state: string, args: any, p?: { session: TransactionT }): Promise<void>
      current(): Promise<string | undefined>
      currentFull(): Promise<StateT | undefined>
      default(): string
      delete(p?: { session: TransactionT }): Promise<void>
    },
    events: {
      save(event: RecordedEvent<StateT, TransactionT>): Promise<void>
      loadAll(): Promise<RecordedEvent<StateT, TransactionT>[]>
      deleteAll(p?: { session: TransactionT }): Promise<void>
    }
  }
  // loadEvents: () => Promise<RecordedEvent[]>
  // saveEvent: (event: RecordedEvent) => Promise<void>
  // deleteEvents: () => Promise<void>
}


function makeContextRecordable<State, Transaction>(context: Context<State, Transaction>) {
  const originalContext = context.implemntation
  let disabled = false

  context.implemntation = new Proxy(originalContext, {
    get(target, key: string, receiver) {
      if (disabled) {
        return originalContext[key]
      }

      if (key == '_disableRecording') {
        return () => {
          disabled = true
        }
      }

      return async (...args) => {
        const result = await originalContext[key](...args)
        await context.manage.events.save({
          eventName: key as any,
          data: result
        })
        return result
      }

    }
  })
}


async function makeContextRestorable<State, Transaction>(context: Context<State, Transaction>) {
  const events = [
    ...await context.manage.events.loadAll()
  ]

  const originalContext = context.implemntation
  context.implemntation = new Proxy(originalContext, {
    get(_, key: string) {


      return (...args) => {
        const current = events.shift()

        if (!current) {
          return originalContext[key](...args)
        }

        if (current.eventName != key) {
          throw new RestoreError(`unknown key '${key}', expected '${current.eventName}'`)
        }

        return current.data
      }
    }
  })
}


export class RestoreError extends Error { }
// export class RestartStateError extends Error { }
export class SwitchStateError extends Error {
  constructor(readonly stateToSwitch: string, readonly state_arguments: any) {
    super('switching state')
  }
}



export async function executeContext<StateT extends UserPersistedState, Transaction>(context: Context<StateT, Transaction>, id?: number): Promise<void> {
  const found = await dispatchState(context)
  console.table(found)
  await executeState(context, found.state, found.args)
}



type Arguments = any


export type UserPersistedState
  = {

    state: string
    arguments: string | undefined

    on_return_switch_to: string | undefined
    on_return_switch_args: string | undefined
  }



export async function dispatchState<T, StateT extends UserPersistedState, TransactionT>(
  context: Context<StateT, TransactionT>
): Promise<{ state: State<StateT, TransactionT>, args: Arguments }> {
  const states = context.manage.state!
  const current = await states.currentFull()
  const stateName = current?.state!

  console.error("stateName")
  console.log(stateName)
  if (current) {
    return {
      state: context.allStates[stateName] as State<StateT, TransactionT>,
      args: current.arguments ? JSON.parse(current.arguments) : null
    }
  } else {
    const result = states.default()
    await states.save(result, undefined)
    return {
      state: context.allStates[result] as State<StateT, TransactionT>,
      args: undefined
    }
  }
}

export function addHighLevel<T, StateT, TransactionT>(original: StateParams<StateT, TransactionT>, mapped: Context<StateT, TransactionT>) {

  const mappedImplementation = mapped.implemntation

  async function expectOrCancellText(question: string): Promise<string | undefined> {
    const cancellOption = 'Відміна'
    await mappedImplementation.say(question, { keyboard: [cancellOption] })


    return
  }

  async function suggest<T extends string[]>(question: string, options: T, extra?: Media): Promise<T[number]> {
    const params = {
      keyboard: options,
      ...extra
    }

    await mappedImplementation.say(question, params)

    let result: string

    return await mappedImplementation.escape(async _ => {
      do {
        result = await original.expect()
        if (options.includes(result)) {
          return result
        } else {
          await original.say('there is no such option', {
            keyboard: options
          }) // TODO localize
        }
      } while (true)
    })
  }

  async function _onRestoreDoRun(callback: () => Promise<void>): Promise<void> {
    const ref: Ref<1> = { value: undefined }
    await mappedImplementation.escape(_ => ref.value = 1)

    if (!ref.value) {
      await callback()
    }
  }

  function suggestIt(promptText: string) {
    const options: { text: string, action: () => Promise<void> }[] = [];
    let extra: Media = {}

    return {
      option(text: string, action: () => Promise<void>) {
        options.push({ text, action });
        return this;
      },

      extra(extra_: Media) {
        extra = extra_
        return this
      },

      async exec() {
        const selectedOption = await suggest(promptText, options.map(o => o.text), extra);
        const selectedAction = options.find(o => o.text === selectedOption)?.action;
        if (selectedAction) {
          return await selectedAction();
        }
      }
    };
  }

  const highLevel = {
    suggest,
    suggestIt,
    _onRestoreDoRun
  } as HighLevelActions

  mapped.implemntation = {
    ...mappedImplementation,
    ...highLevel
  }
}

export async function simpleStateExecute<T, StateT, TransactionT>(context: Context<StateT, TransactionT>, state: State<StateT, TransactionT>, args?: Arguments): Promise<void> {

  await runWithImplicitState(context.implemntation, state, args)
}


export async function executeState<T, StateT extends UserPersistedState, TransactionT>(context: Context<StateT, TransactionT>, state: State<StateT, TransactionT>, args?: Arguments): Promise<void> {
  const originalImp = context.implemntation

  makeContextRecordable(context)
  await makeContextRestorable(context)
  addHighLevel(originalImp, context)

  let currentState = state

  while (true) {

    try {
      await runWithImplicitState(context.implemntation, currentState, args)
      const state = await context.manage.state?.currentFull()

      if (state?.on_return_switch_to) {
        const args = state.on_return_switch_args ? JSON.parse(state.on_return_switch_args) : undefined

        throw new SwitchStateError(state.on_return_switch_to, args)
      }

      return
    } catch (e) {
      // console.log(e)
      if (e instanceof SwitchStateError) {
        await handleStateSwitch(e, context, (state, arg) => {
          currentState = state
          args = arg
        });

      } else if (e instanceof RestoreError) {
        await context.manage.events.deleteAll()
        context.implemntation = originalImp
        makeContextRecordable(context)
        await makeContextRestorable(context)
        addHighLevel(originalImp, context)

        //TODO - same state fails twice with RestoreError, what to do ?
        //TODO
      } else if (e instanceof MessageStoreCancelationError) {
        console.log("FORCED STATE EXIT")
        return
      } else {
        console.error(e)
        console.error("VERY BAD ERROR, trying to repair")
        // TODO opt: current() !=e.stateToSwitch

        const state = await context.manage.state?.currentFull()

        if (state?.on_return_switch_to) {
          const switchTo = new SwitchStateError(state.on_return_switch_to, JSON.parse(state.on_return_switch_args ?? '{}'))
          await handleStateSwitch(switchTo, context, (state, arg) => {
            currentState = state
            args = arg
          })
        } else {
          await context.manage.events.deleteAll()
          await context.manage.state?.delete()
          throw e
        }
      }
    }
  }

}

async function handleStateSwitch<StateT, TransactionT>(e: SwitchStateError, context: Context<StateT, TransactionT>, setStateData: (state, args) => void) {
  const session = neogma.driver.session()
  const transaction = await session.beginTransaction()

  try {

    console.log("Switching state", {
      targetState: e.stateToSwitch
    })

    await Promise.all([
      context.manage.events.deleteAll({ session: transaction }),
      context.manage.state?.delete({ session: transaction }),
    ])

    await context.manage.state?.save(e.stateToSwitch, e.state_arguments, { session: transaction }) // tests dont seem to cover this case

    setStateData(context.allStates[e.stateToSwitch] as any, e.state_arguments)

    await transaction.commit()
  } catch (e) {
    console.error(e)
    await transaction.rollback()
  }

  await session.close()
}
