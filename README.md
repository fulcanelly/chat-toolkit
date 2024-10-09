# What is it ?

it's library for easier chat-bot state managment/peristion

currently only telegram API supported, further extension for discrod API possible

## Adding new state


Describe state using actions like `say`, `expect`, `switchState` and others

```ts

export async function mainState() {

  await say('Enter a')

  const a = Number(await expect_())

  await say('Enter b')

  const b = Number(await expect_())

  await say("Reuslt is " + (a + b))
  
  await switchState('mainState')
}
```

And then add that state to AllStates to safe typing

```ts
declare module 'chat-toolkit' {
  interface AllStates {
    mainState: typeof mainState
  }
}
```


# Modifing actions 

# TODO

### Adjusting global state


# TODO

```ts
declare module 'chat-toolkit' {
  interface GlobalSharedAppContext {
   
  }
}
```


## TODO 
- [ ] Notifications
- [ ] Custom expects
