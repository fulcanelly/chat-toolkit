# Chat toolkit 

![GitHub Tag](https://img.shields.io/github/v/tag/fulcanelly/chat-toolkit)
<a href="https://www.npmjs.com/package/chat-toolkit"><img alt="NPM Downloads" src="https://img.shields.io/npm/dy/chat-toolkit?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fchat-toolkit"></a>
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/fulcanelly/chat-toolkit/linter.yml?branch=master)


### What is it ?

it's library/toolkit for easier chat-bot state managment/persistion

currently only telegram API supported, further extension for discrod API possible


# Content tree
  - How to use
    - [Adding new state](#adding-new-state)
    - [Set default / Main state](#default--main-state)
  - [Setup](#setup)
    - [Ensure prisma config and file structure is right](#ensure-prisma-config-and-file-structure-is-right)
    - [Generate models](#generate-models)
    - [Apply prisma migrations](#apply-prisma-migrations)
    - [Adjust code to supply events to handler](#adjust-code-to-supply-events-to-handler)
  - How it works
    - How changes in state handled 
  - Actions
    - Avaliable actions
    - Modifing actions 
  - Other features 
    - Notification / Interrupt state (TODO)
    - [Inline keyboard handler](#inline-keyboard-handler) 
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

You need to specify what is the entry point state and what should run first

that's done at setup, see [this](#adjust-code-to-supply-events-to-handler) for details

```js
const handler
  = createTelegramHandler({
    bot,
    allStates,
    defaultState: 'mainState'
  }, dbParams)
```


## Setup 

### Ensure prisma config and file structure is right

Currently this npm relies on prisma (in future planned ability to chose over other orms) 
and it assumes you have enabled your `prismaSchemaFolder` in `schema.prisma` and it lies in `prisma/schema/` folder


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
yarn prisma migrate dev --name add_chat_toolkit_models
```
### Adjust code to supply events to handler

Example with Telegraf:

```ts

const bot = new Telegraf(process.env.TG_TOKEN)
const prisma = new PrismaClient()

const dbParams = {
  findOrCreateUser: findOrCreateUserPrisma(prisma as any), 
  stateManager: defaultPrismaStateManagerImplementation(prisma as any),
  // unfrotunatelly cast to any needed, since local prisma is not the same as chat-toolkits 
  // right now idk how to avoid this but it's works just fine
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
## Actions

### Avaliable actions
```hs
say :: String -> Effect ()
```
^ Just sends text message to user


```hs
expect_ :: () -> Effect (String)
```
^ Expects text message from user 

```hs
expectAny :: (Message -> a) -> Effect a 
```
^ In case if if need to wait for specific user message or combined

for example
```ts
await expectAny(msg => {
  if ('photo' in msg) {
    return msg.photo[0]
  }
  if ('text' in msg) {
    return msg.text
  }
})
```


```hs
random :: () -> Effect (Number)
``` 
^ since states can do anything it's better not to use Math.random directly so it's just wrapper over it (needed for restoring state)


#### TODO:
suggest 

suggestIt

_disableRecording
_onRestoreDoRun
  

switchState
escape_
  
# Modifing actions 

# TODO


# Notification / Interrupt state

# TODO 

# Inline keyboard handler 

Suppose case when you need inline keyboard for example [like, dislike]

then each button should execute some kind of logic 

in this case you can get use of `createCallbackHandle`:

```ts
await bot.sendMessage('you liked that post?', {
  reply_markup: { 
    inline_keyboard: [[
      {
        text: "Like",
        callback_data: await recordingObject.like({post_id: post.id}),
      },
      {
        text: "Dislike",
        callback_data: await recordingObject.dislike({post_id: post.id}),
      }
    ]]
  }
}) 
```
where `recordingObject` would be defined like this:
```ts
const recordingObject = createCallbackHandle({
  namespace: 'post-likes',
  handler: ctx => ({
    async like({post_id}: { post_id: number }) {
      const user = await User.find(ctx.from.id)
      await Post.find(post_id).likeBy(user)
      await ctx.editMessageText //...
    },

    dislike({post_id}: { post_id: number }) {
      const user = await User.find(ctx.from.id)
      await Post.find(post_id).likeBy(user)
      await ctx.editMessageText //...
    }
  })
}) 
```

To use this you need to enable handler
```ts
const redis = new Redis() // from ioredis npm
const bot = new Telegraf(process.env.TG_TOKEN)

/// ...

export const { 
  setupCallbackHandler, 
  createCallbackHandle,
 } = createRedisInlineKeyboardHandler({
  redis,
  projectName: 'mybot', 
  ivalidateIn: duration(1, 'day'),
 })

// ...

setupCallbackHandler(bot)

``` 
 

Each call to recordingObject generates a UUID that is stored in `callback_data` on the Telegram side.
When a button is pressed, the corresponding function is invoked. 
 
On our end, the arguments for the handler function are stored 
in **Redis** under the key `${projectName}:callbackquery:${uuid}` for 24 hours 
(this is the default duration and covers 99% of use cases).



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
- [ ] Detect long states
- [ ] Error handling strategy
