import type { IncomingMessage } from 'node:http'

type VercelStyleResponse = {
  setHeader(name: string, value: string | number | readonly string[]): void
  status(code: number): {
    json(body: unknown): void
    end(chunk?: string | Buffer): void
  }
}

declare const handler: (
  req: IncomingMessage,
  res: VercelStyleResponse,
) => Promise<void>

export default handler
