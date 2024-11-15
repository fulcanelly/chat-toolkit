# What is it ?

it's library/toolkit for easier chat-bot state managment/persistion

currently only telegram API supported, further extension for discrod API possible


# Content tree (TODO) 
  - How to use
    - [Adding new state](#adding-new-state)
    - Set default / Main state (TODO)
  - [Setup](#setup)
    - [Ensure prisma config and file structure is right](#ensure-prisma-config-and-file-structure-is-right)
    - [Generate models](#generate-models)
    - [Apply prisma migrations](#apply-prisma-migrations)
    - [Adjust code to supply events to handler](#adjust-code-to-supply-events-to-handler)
  - Actions
    - Avaliable actions
    - Modifing actions 
  - Other features 
    - Notification / Interrupt state (TODO)
    - 
    - Adjusting global state

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
  // or 
  await stateSwitcher.mainState()

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

## Default / Main state

// TODO 

## Setup 
Currently this npm relies on prisma (in future planned ability to chose over other orms) 
and supposes you have enabled your `prismaSchemaFolder` in `schema.prisma` and it lies in `prisma/schema/` folder

### Ensure prisma config and file structure is right
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["typedSql", "prismaSchemaFolder"]
}
```

### Generate models 
Then you need to run 

```bash
npx chat-toolkit setup 
```
which would create needed models in your project folder

### Apply prisma migrations

After that you'll have to apply migration migrate 

```bash
yarn prisma migrate dev  --name add_chat_toolkit_models
```
### Adjust code to supply events to handler

Example with Telegraf:

```js 

const bot = new Telegraf(process.env.TG_TOKEN)
const prisma = new PrismaClient()

const dbParams = {
  findOrCreateUser: findOrCreateUserPrisma(prisma),
  stateManager: defaultPrismaStateManagerImplementation(prisma)
}

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

```
## Avaliable actions

  suggestIt,
  _disableRecording,
  _onRestoreDoRun,
  escape_,
  say,
  random,
  suggest,
  switchState,
  expect_
  
# Modifing actions 

# TODO


# Notification / Interrupt state

# TODO 

### Adjusting global state


# TODO

```ts
declare module 'chat-toolkit' {
  interface GlobalSharedAppContext {
   
  }
}
```

### Adjusting escape ctx 
```ts
declare module 'chat-toolkit' {
  interface EscapeData {
    user: User
  }
}
```


## TODO 
- [ ] Notifications
- [ ] Custom expects
- [ ] GC
