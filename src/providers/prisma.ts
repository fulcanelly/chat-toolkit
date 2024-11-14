import { Context, RecordedEvent, TransactionT } from "@/state/state";
import { superjson } from "../lib/superjson";
import { PrismaClient, User } from "@prisma/client";

type DefaultPrismaStateManagerImplementation = (prisma: PrismaClient) => (params: { currentUser: User; defaultState: string; }) => Context['manage']
type FindOrCreateUserPrisma = (prisma: PrismaClient) => (user_id: any, first_name?: any) => Promise<User>

export const defaultPrismaStateManagerImplementation: DefaultPrismaStateManagerImplementation
  = prisma => params => {
    const { currentUser, defaultState } = params;

    const cachedCurrentState = {
      async set(state: string, args: any, session?: TransactionT) {
        console.warn("CREATE STATE")

        await prisma.state.create({
          data: {
            state: state,
            arguments: superjson.stringify(args),
            created_at: new Date(),
            userId: currentUser.id
          }
        });
      },

      async get(it?: TransactionT) {
        console.log("Getting current state");
        return await findCurrentState(it);
      }
    };

    const findCurrentState = (session?: TransactionT) => prisma.state.findFirst({ where: { userId: currentUser.id } });

    const state: Context['manage']['state'] = {
      async save(state: string, args: any, params): Promise<void> {
        await cachedCurrentState.set(state, args, params?.session);
      },

      default(): string {
        return defaultState;
      },

      async current(): Promise<string | undefined> {
        const result = await cachedCurrentState.get();
        return result?.state;
      },

      async currentFull(): Promise<any | undefined> {
        return await cachedCurrentState.get();
      },

      async delete(params): Promise<void> {
        await prisma.state.delete({
          where: {
            userId: currentUser.id
          }
        });
      },
    };

    const events: Context['manage']['events'] = {
      async loadAll() {
        console.warn("load all events")

        const currenState = await cachedCurrentState.get();

        const all = await prisma.event.findMany({
          where: {
            stateId: currenState.id
          },
          orderBy: {
            created_at: 'asc'
          }
        });

        return all.map(({ eventName, data }) => ({ eventName, data: data ? superjson.parse(data) : undefined })) as RecordedEvent[];
      },

      async save(event) {
        console.warn("save event")

        const state = await cachedCurrentState.get();

        await prisma.event.create({
          data: {
            eventName: event.eventName,
            data: superjson.stringify(event.data),
            created_at: new Date(),
            stateId: state.id,
          }
        });
      },

      async deleteAll(params) {
        console.warn("DELETE ALL events")
        const state = await cachedCurrentState.get();

        await prisma.event.deleteMany({
          where: { stateId: state.id }
        });
      }
    };

    return {
      state,
      events
    };
  }


export const findOrCreateUserPrisma: FindOrCreateUserPrisma
  = (prisma) => (user_id: any, first_name = '') =>
    prisma.user.upsert({
      create: {
        id: user_id,
        first_name,
      },
      update: {
        first_name
      },
      where: {
        id: user_id
      }
    })

