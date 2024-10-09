import { runWithImplicitState } from "./implicit_state";
import { StateParams, SwitchStateError } from "../state/state";
import { commonLowLevel } from "../telegram/context";

import * as R from 'ramda';

class BlockingActionDetectedError extends Error { }

function blockingStateDetectionParams(): StateParams {
  return {
    ...commonLowLevel(),

    async say(): Promise<void> { },

    escape() {
      const proxy = new Proxy({}, {
        get(_, val) {
          if (val == 'then') {
            return
          }
          throw new BlockingActionDetectedError()
        }
      }) as any

      return Promise.resolve(proxy)
    },

    expect() {
      throw new BlockingActionDetectedError()
    },

    _onRestoreDoRun() {
      throw new Error("TODO")
    },

    suggest() {
      throw new BlockingActionDetectedError()
    },
    suggestIt() {
      throw new BlockingActionDetectedError()
    },
    random() {
      throw new BlockingActionDetectedError()
    }
  } as StateParams
}


// what is simple state ? 
// its state that is non blocking (in own sense)
// it means it not need any input 
// it only ouputs 
// there few criterias to detect it 

// 1) state only uses say()/switchState()
// 2) state dont depends on expect()
// 3) no returned from object escape() fields accesed


// what 'simple state' means ?
// it literally means state is simple i.e. 
/// 1) can be run fast enough so there is no need to persist it
/// 2) it's not interactive 
/// 3) it's 'pure' (with same input - always same ouput)

// so by running such states in other way makes 
// user expirience better
// adds room for optimizations

export const stateTypes = {
  blocking: new Array<string>(),
  unknown: new Array<string>(),
  simple: new Array<string>(),
}



// example
const fixtures = {
  requiredArgumentsByState: {
    itemSoldState: {

      count: 8,
      pricePerOne: 13
    }
  }
}

// TODO
export async function detectBlockingStates(allStates: Object) {

  console.log('Trying to detect simple states')
  const params = blockingStateDetectionParams()
  for (const stateName in allStates) {
    const state = allStates[stateName]
    // const args = fixtures.requiredArgumentsByState[stateName] ?? {}
    const args = {}

    try {
      // logger.silly(stateName)
      await runWithImplicitState(params, state, args)
    } catch (e) {
      if (e instanceof BlockingActionDetectedError) {
        stateTypes.blocking.push(stateName)

        // } else if (e instanceof SwitchStateError) {
        //   stateTypes.simple.push(stateName)

      } else {
        stateTypes.unknown.push(stateName)
      }
      continue
    }

    stateTypes.simple.push(stateName)
  }

  console.table(
    R.map(R.length, stateTypes)
  )
  console.log(
    stateTypes
  )
} 
