import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — OtoTabi Studio',
  description: 'Configure your OtoTabi Studio preferences and account settings.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
