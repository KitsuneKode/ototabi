import Demo from './demo/page'
import { trpcCaller } from '@/trpc/server'
import { Button } from '@ototabi/ui/components/button'
import { Textarea } from '@ototabi/ui/components/textarea'
/**
 * Renders the home page with a centered layout containing a heading, a button, and a textarea.
 *
 * Displays a "Hello World" heading, a small button, and a textarea input, all centered vertically and horizontally on the page.
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
