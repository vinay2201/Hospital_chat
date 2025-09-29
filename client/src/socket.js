import { io } from 'socket.io-client'
export function makeSocket(token) {
  const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
  return io(url, { auth: { token } })
}
