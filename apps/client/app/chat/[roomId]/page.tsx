import { Button } from '@ototabi/ui/components/button'
import { Textarea } from '@ototabi/ui/components/textarea'

/**
 * Renders the chat page with a send button and a textarea for user input.
 *
 * Displays a simple interface containing a label, a button labeled "Send", and a textarea component for entering messages.
 */
export default function ChatPage() {
  return (
    <div>
      chat page
      <Button>Send</Button>
      <Textarea />
    </div>
  )
}
