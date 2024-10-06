import { AsyncLocalStorage } from "async_hooks";
import { StateParams } from "../state/state";
import { stat } from "fs";


const implicitState = new AsyncLocalStorage<StateParams>()

function makeImplicitProxy<T extends keyof StateParams>(name: T): StateParams[T] {
    return (...args) => (implicitState.getStore()![name] as any)(...args)
}

export const suggestIt: StateParams['suggestIt'] = makeImplicitProxy('suggestIt')
export const _disableRecording: StateParams['_disableRecording'] = makeImplicitProxy('_disableRecording')
export const _onRestoreDoRun: StateParams['_onRestoreDoRun'] = makeImplicitProxy('_onRestoreDoRun')
export const escape_: StateParams['escape'] = makeImplicitProxy('escape')
export const say: StateParams['say'] = makeImplicitProxy('say')
export const random: StateParams['random'] = makeImplicitProxy('random')
export const suggest: StateParams['suggest'] = makeImplicitProxy('suggest')
export const switchState: StateParams['switchState'] = makeImplicitProxy('switchState')
export const expect_: StateParams['expect'] = makeImplicitProxy('expect')


export async function runWithImplicitState(params: StateParams, state: (...args: any[]) => Promise<void>, args: any) {
    await implicitState.run(params, state, args)
}


