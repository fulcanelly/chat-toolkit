import { Duration, duration } from 'moment'
import './bot'
import './commands/bonus'

export namespace config {

  interface JobConfigs {

  }
  export interface Config {
    modules: JobConfigs & {
      pvp_zone: {
        enabled: boolean
        timeout: Duration
      }
    }
  }
}



declare module './config' {
  namespace config {
    interface JobConfigs {
      tg_photo_transfer: {
        file_id_invalidation_in: Duration
      }
    }
  }
}

export const xxxxx: config.Config = {
  modules: undefined
}
