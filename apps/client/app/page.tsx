import Demo from './demo/page'
import { trpcCaller } from '@/trpc/server'
import { Button } from '@ototabi/ui/components/button'
import { Textarea } from '@ototabi/ui/components/textarea'
/**
 * Server React component that renders the home page and embeds server-fetched data.
 *
 * This async component uses trpcCaller to fetch a secret message and the current session on the server,
 * logs the fetched auth state to the server console, and renders a centered layout containing a heading,
 * the stringified fetched values, a small Button, a Textarea, and the Demo component.
 *
 * @returns The JSX element for the home page UI.
 */
export default async function Home() {
  const caller = await trpcCaller()
  const calls = await caller.auth.getSecretMessage()

  const authState = await caller.auth.getSession()
  console.log('authState', authState)

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
        {JSON.stringify(calls)}
        <br />
        {/* {JSON.stringify(accountInfo)} */}
        <br />
        {JSON.stringify(authState?.session)}
        <Button size="sm">Button</Button>
        <Textarea />
        <Demo />
      </div>
    </div>
  )
}
