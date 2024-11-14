import { AllStates } from "@/state/state"
import { switchState } from "./implicit_state"

export const stateSwitcher: AllStates = new Proxy({} as any, {
  get(_, name: string) {
    return args => (switchState as any)(name as any, args)
  }
})
