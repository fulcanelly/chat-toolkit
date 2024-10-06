import { createTelegramHandler } from "@/handler";

export type Handler = ReturnType<typeof createTelegramHandler>;
