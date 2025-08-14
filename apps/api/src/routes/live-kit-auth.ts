import config from '@/utils/config'
import { AccessToken } from 'livekit-server-sdk'
import { Router, type Request, type Response } from 'express'

const liveKitAuthRouter = Router()

liveKitAuthRouter.get('/token', async (req: Request, res: Response) => {
  const room = req.query.room as string
  const username = req.query.username as string
  if (!room) {
    return res.status(400).json({ error: 'Missing "room" query parameter' })
  } else if (!username) {
    return res.status(400).json({ error: 'Missing "username" query parameter' })
  }

  const apiKey = config.getConfig('liveKitApiKey')
  const apiSecret = config.getConfig('liveKitApiSecret')
  const wsUrl = config.getConfig('liveKitUrl')

  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    ttl: '1h',
  })
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true })

  return res
    .status(200)
    .header('Cache-Control', 'no-store')
    .json({ token: await at.toJwt() })
})

export default liveKitAuthRouter
