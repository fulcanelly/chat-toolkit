import { createTelegramHandler } from "@/telegram/handler";

export type Handler = ReturnType<typeof createTelegramHandler>;
