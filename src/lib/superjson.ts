import type SuperJSON from "superjson";
export let superjson: SuperJSON;

void (async () => {
  superjson = await import('superjson') as any;
})()   
