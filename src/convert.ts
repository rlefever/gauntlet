import {clientUserId} from './utils'
import type {
  APIApplication,
  APIChannel,
  APIEmoji,
  APIGuild,
  APIGuildMember,
  APIMessage,
  APIOverwrite,
  APIRole,
  APITemplate,
  Snowflake
} from 'discord-api-types/v9'
import type {Backend} from './Backend'
import type {
  Application,
  Guild,
  GuildChannel,
  GuildEmoji,
  GuildMember,
  GuildPresence,
  GuildTemplate,
  Message,
  Overwrite,
  Role
} from './types'
import type {GatewayPresenceUpdate} from './types/patches'
import type {Override, UnUnion} from './utils'

export const application = (
  {users}: Backend,
  app: Application
): APIApplication => ({
  ...app,
  owner: app.owner_id === undefined ? undefined : users.get(app.owner_id)
})

const addGuildId = <T>(
  guild: Guild,
  obj: T
): Override<T, {guild_id: Snowflake}> => ({
  ...obj,
  guild_id: guild.id
})

export const guildEmoji =
  ({allUsers}: Backend) =>
  ({
    id,
    name,
    roles,
    user_id,
    require_colons,
    managed,
    animated,
    available
  }: GuildEmoji): APIEmoji => ({
    id,
    name,
    roles,
    user: allUsers.get(user_id)!,
    require_colons,
    managed,
    animated,
    available
  })

export const guildMember =
  ({allUsers}: Backend, guild: Guild, includePending = false) =>
  ({
    id,
    nick,
    roles,
    joined_at,
    premium_since,
    pending
  }: GuildMember): APIGuildMember => {
    const {deaf, mute} = guild.voice_states.find(
      ({user_id}) => user_id === id
    ) ?? {deaf: false, mute: false}
    return {
      user: allUsers.get(id)!,
      nick,
      roles,
      joined_at,
      premium_since,
      deaf,
      mute,
      ...(includePending ? {pending} : {})
    }
  }

export const role = ({permissions, ...rest}: Role): APIRole => ({
  ...rest,
  permissions: `${permissions}` as const
})

export const overwrite = ({allow, deny, ...rest}: Overwrite): APIOverwrite => ({
  allow: `${allow}` as const,
  deny: `${deny}` as const,
  ...rest
})

export const guildChannel =
  (guild: Guild) =>
  ({
    members,
    messages,
    permission_overwrites,
    ...rest
  }: UnUnion<GuildChannel>): APIChannel =>
    addGuildId(guild, {
      permission_overwrites: permission_overwrites?.map(overwrite),
      ...rest
    })

export const guildPresence =
  ({allUsers}: Backend, guild: Guild) =>
  ({user_id, ...rest}: GuildPresence): GatewayPresenceUpdate =>
    addGuildId(guild, {user: allUsers.get(user_id)!, ...rest})

/**
 * Converts a `Guild` into an `APIGuild`. This does not include fields only sent
 * in `GUILD_CREATE`, Get Current User Guilds, Get Guild without `with_counts`,
 * and in an `APIInvite`.
 *
 * @param backend The backend.
 * @returns A function for converting a guild object in the backend
 * representation into a guild for returning from the mocked API.
 */
export const guild =
  (backend: Backend) =>
  ({
    id,
    name,
    icon,
    splash,
    discovery_splash,
    owner_id,
    region,
    afk_channel_id,
    afk_timeout,
    widget_enabled,
    widget_channel_id,
    verification_level,
    default_message_notifications,
    explicit_content_filter,
    roles,
    emojis,
    features,
    mfa_level,
    application_id,
    system_channel_id,
    system_channel_flags,
    rules_channel_id,
    max_presences,
    max_members,
    vanity_url_code,
    description,
    banner,
    premium_tier,
    premium_subscription_count,
    preferred_locale,
    public_updates_channel_id,
    max_video_channel_users,
    nsfw_level,
    stickers
  }: Guild): APIGuild => ({
    id,
    name,
    icon,
    splash,
    discovery_splash,
    owner_id,
    region,
    afk_channel_id,
    afk_timeout,
    widget_enabled,
    widget_channel_id,
    verification_level,
    default_message_notifications,
    explicit_content_filter,
    roles: roles.map(role),
    emojis: emojis.map(guildEmoji(backend)),
    features,
    mfa_level,
    application_id,
    system_channel_id,
    system_channel_flags,
    rules_channel_id,
    max_presences,
    max_members,
    vanity_url_code,
    description,
    banner,
    premium_tier,
    premium_subscription_count,
    preferred_locale,
    public_updates_channel_id,
    max_video_channel_users,
    nsfw_level,
    stickers: stickers.array()
  })

/**
 * {@linkcode guild} but includes fields only sent in `GUILD_CREATE`.
 *
 * @param backend The backend.
 * @param applicationId The id of the application of the bot.
 * @returns A function for converting a guild object in the backend
 * representation into a guild for returning from the mocked API.
 */
export const guildCreateGuild =
  (backend: Backend, applicationId: Snowflake) =>
  (backendGuild: Guild, convertedGuild?: APIGuild): APIGuild => {
    const {large, unavailable, members, channels, presences} = backendGuild
    const userId = clientUserId(backend, applicationId)
    return {
      ...(convertedGuild ?? guild(backend)(backendGuild)),
      joined_at: members.find(({id}) => id === userId)?.joined_at,
      large,
      unavailable,
      member_count: members.size,
      members: members.map(guildMember(backend, backendGuild, true)),
      channels: channels.map(guildChannel(backendGuild)),
      presences: presences.map(guildPresence(backend, backendGuild))
    }
  }

export const template =
  ({allUsers}: Backend) =>
  (_guild: Guild, _template: GuildTemplate): APITemplate => ({
    ..._template,
    creator: allUsers.get(_template.creator_id)!,
    source_guild_id: _guild.id
  })

export const message =
  (backend: Backend, channelId: Snowflake, guildId?: Snowflake) =>
  ({
    application_id,
    author_id,
    mentions,
    mention_channels,
    message_reference,
    referenced_message,
    thread_id,
    stickers,
    ...rest
  }: Message): APIMessage => {
    const {allUsers, applications, guilds, standardStickers} = backend
    let thread: APIChannel | undefined
    if (thread_id !== undefined) {
      const threadGuild = guilds.get(guildId!)!
      thread = guildChannel(threadGuild)(threadGuild.channels.get(thread_id)!)
    }
    return {
      ...rest,
      application:
        application_id === undefined
          ? undefined
          : applications.get(application_id)!,
      author: allUsers.get(author_id)!,
      channel_id: channelId,
      mentions: mentions.map(id => allUsers.get(id)!),
      mention_channels: mention_channels?.map(({id, guild_id}) => {
        const {name, type} = guilds
          .get(guild_id)!
          .channels.find(chan => chan.id === id)!
        return {id, guild_id, name, type}
      }),
      message_reference,
      referenced_message: referenced_message
        ? message(
            backend,
            message_reference!.channel_id,
            message_reference!.guild_id
          )(referenced_message)
        : undefined,
      // thread property must not be present if undefined https://github.com/discordjs/discord.js/blob/master/src/structures/Message.js#L104
      ...(thread ? {thread} : {}),
      sticker_items: stickers.map(
        ([id, stickerGuildId]) =>
          (stickerGuildId === undefined
            ? standardStickers
            : guilds.get(stickerGuildId)!.stickers
          ).get(id)!
      )
    }
  }
