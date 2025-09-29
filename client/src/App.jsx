import React, { useEffect, useMemo, useRef, useState } from 'react'
import api from './api'
import { makeSocket } from './socket'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const login = async (displayName) => {
    const { data } = await api.post('/api/auth/login', { displayName })
    setToken(data.token); setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }
  const logout = () => { localStorage.clear(); setToken(''); setUser(null) }
  return { token, user, login, logout }
}

function Login({ onLogin }) {
  const [name, setName] = useState('')
  return (
    <div style={{display:'grid', placeItems:'center', height:'100vh'}}>
      <div style={{maxWidth:420, width:'100%', padding:24, border:'1px solid #e5e7eb', borderRadius:12}}>
        <h2>MediConnect</h2>
        <p>Enter your display name to continue.</p>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Dr. Smith" style={{width:'100%', padding:12, border:'1px solid #e5e7eb', borderRadius:8}}/>
        <button onClick={()=>onLogin(name)} style={{marginTop:12, padding:'10px 14px', borderRadius:8}}>Continue</button>
      </div>
    </div>
  )
}

function RoomList({ token, current, onSelect, onCreate }) {
  const [rooms, setRooms] = useState([])
  const [name, setName] = useState('')
  useEffect(()=>{
    api.get('/api/rooms', { headers:{ Authorization:`Bearer ${token}` }}).then(r=>setRooms(r.data))
  },[token])
  return (
    <div style={{padding:12, borderRight:'1px solid #e5e7eb', width:280}}>
      <h3>Rooms</h3>
      <div>
        {rooms.map(r=>(
          <div key={r._id} onClick={()=>onSelect(r)} style={{padding:8, borderRadius:8, background: current?._id===r._id ? '#eef2ff':'transparent', cursor:'pointer'}}>
            {r.name}
          </div>
        ))}
      </div>
      <div style={{marginTop:12}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Create room" style={{width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:8}}/>
        <button onClick={()=>{onCreate(name); setName('')}} style={{marginTop:8, padding:'8px 12px', borderRadius:8}}>Create</button>
      </div>
    </div>
  )
}

function MessageList({ messages }) {
  const ref = useRef(null)
  useEffect(()=>{ ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [messages])
  return (
    <div ref={ref} style={{flex:1, overflow:'auto', padding:12}}>
      {messages.map(m=> (
        <div key={m._id || m.tempId} style={{marginBottom:10}}>
          <div style={{fontSize:12, color:'#6b7280'}}>{m.senderName || m.sender}</div>
          <div style={{padding:10, border:'1px solid #e5e7eb', borderRadius:8}}>{m.body}</div>
        </div>
      ))}
    </div>
  )
}

function TypingIndicator({ typers, selfId }) {
  const others = typers.filter(id=>id!==selfId)
  if (others.length===0) return null
  return <div style={{fontSize:12, color:'#6b7280', padding:'4px 12px'}}>Typing: {others.join(', ')}</div>
}

export default function App() {
  const { token, user, login, logout } = useAuth()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [presence, setPresence] = useState([])
  const [typers, setTypers] = useState([])
  const [input, setInput] = useState('')
  const socket = useMemo(()=> token ? makeSocket(token) : null, [token])

  useEffect(()=>{
    if (!socket) return
    socket.on('connect', ()=>{})
    socket.on('presence:update', setPresence)
    socket.on('system', evt=>{
      // optional system messages
    })
    socket.on('typing:update', ({ userIds })=> setTypers(userIds))
    socket.on('message:new', msg=> setMessages(prev => [...prev, msg]))
    return () => socket.disconnect()
  }, [socket])

  async function selectRoom(r) {
    setRoom(r); setMessages([])
    await api.post(`/api/rooms/${r._id}/join`, {}, { headers:{ Authorization:`Bearer ${token}` }})
    const { data } = await api.get(`/api/messages/${r._id}`, { headers:{ Authorization:`Bearer ${token}` }})
    setMessages(data)
    socket.emit('room:join', r._id)
  }

  async function createRoom(name) {
    if (!name) return
    const { data } = await api.post('/api/rooms', { name }, { headers:{ Authorization:`Bearer ${token}` }})
    await selectRoom(data)
  }

  function send() {
    if (!input.trim() || !room) return
    const tempId = Math.random().toString(36).slice(2)
    setMessages(prev => [...prev, { tempId, room: room._id, sender: user.id, body: input }])
    socket.emit('message:send', { roomId: room._id, body: input, tempId })
    setInput('')
  }

  function onTyping(v) {
    setInput(v)
    if (room) socket.emit('typing', { roomId: room._id, isTyping: v.length>0 })
  }

  if (!token || !user) return <Login onLogin={login} />

  return (
    <div style={{display:'flex', height:'100vh'}}>
      <RoomList token={token} current={room} onSelect={selectRoom} onCreate={createRoom} />
      <div style={{display:'flex', flexDirection:'column', flex:1}}>
        <header style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom:'1px solid #e5e7eb'}}>
          <div>
            <strong>{room ? room.name : 'Select a room'}</strong>
            <div style={{fontSize:12, color:'#6b7280'}}>Online: {presence.length}</div>
          </div>
          <button onClick={logout} style={{padding:'8px 12px', borderRadius:8}}>Logout</button>
        </header>

        {room && <TypingIndicator typers={typers} selfId={user.id} />}
        <MessageList messages={messages} />
        <div style={{display:'flex', gap:8, padding:12}}>
          <input value={input} onChange={e=>onTyping(e.target.value)} onKeyDown={e=> e.key==='Enter' && send()}
            placeholder="Type a message..." style={{flex:1, padding:10, border:'1px solid #e5e7eb', borderRadius:8}} />
          <button onClick={send} style={{padding:'8px 14px', borderRadius:8}}>Send</button>
        </div>
      </div>
    </div>
  )
}
