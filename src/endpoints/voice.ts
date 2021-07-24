import {clone} from '../utils'
import type {RESTGetAPIGuildVoiceRegionsResult} from 'discord-api-types/v9'
import type {ResolvedData} from '../types'

export interface Voice {
  regions: {get: () => Promise<RESTGetAPIGuildVoiceRegionsResult>}
}

export const voice = (data: ResolvedData): Voice => ({
  regions: {
    // https://discord.com/developers/docs/topics/oauth2#get-current-application-information
    get: async () => clone(data.voice_regions.array())
  }
})
