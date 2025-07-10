'use client'
import React from 'react'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'

const Demo = () => {
  const trpc = useTRPC()

  const data = useQuery(trpc.hello.queryOptions({ text: 'hi' }))
  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1>{data.isLoading && 'Loading...'}</h1>
      {data.data && <p>{JSON.stringify(data.data, null, 2)}</p>}
    </div>
  )
}

export default Demo
