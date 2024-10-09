import { expect_, say, switchState } from "chat-toolkit"


declare module 'chat-toolkit' {
  interface AllStates {
    mainState: typeof mainState
  }
}


export async function mainState() {

  await say('Enter a')

  const a = Number(await expect_())

  await say('Enter b')

  const b = Number(await expect_())

  await say("Reuslt is " + (a + b))

  await switchState('mainState')
}
