import {ClientApplication, User} from 'discord.js'
import {_testWithClient, testWithClient} from './utils'

describe('fetchApplication', () => {
  testWithClient('default application', async client =>
    expect(await client.fetchApplication()).toBeInstanceOf(ClientApplication)
  )

  describe('custom application', () => {
    const name = 'Application Name'
    const ownerUsername = 'app owner'
    _testWithClient(
      async client => {
        const application = await client.fetchApplication()
        expect(application).toBeInstanceOf(ClientApplication)
        expect(application.name).toBe(name)
        expect(application.owner).toBeInstanceOf(User)
        expect((application.owner as User).username).toBe(ownerUsername)
      },
      {clientData: {application: {name, owner: {username: ownerUsername}}}}
    )
  })
})
