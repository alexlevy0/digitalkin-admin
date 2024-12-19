import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { format } from 'date-fns'
import {
  IconArrowLeft,
  IconDotsVertical,
  IconEdit,
  IconMessages,
  IconPaperclip,
  IconPhone,
  IconPhotoPlus,
  IconPlus,
  IconSearch,
  IconSend,
  IconVideo,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type Message = {
  message: string
  sender: string
  timestamp: string
}

type ChatUser = {
  id: string
  profile: string
  username: string
  fullName: string
  title: string
  messages: Message[]
}

// Initial conversations
const initialConversations: ChatUser[] = [
  {
    id: '1',
    profile: '/avatar1.png',
    username: 'AI1',
    fullName: 'General Assistant',
    title: 'General Conversation',
    messages: []
  },
  {
    id: '2',
    profile: '/avatar2.png',
    username: 'AI2',
    fullName: 'Code Assistant',
    title: 'Code Helper',
    messages: []
  },
  {
    id: '3',
    profile: '/avatar3.png',
    username: 'AI3',
    fullName: 'Math Assistant',
    title: 'Math Helper',
    messages: []
  }
]

export default function Chats() {
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState<ChatUser[]>(initialConversations)
  const [selectedUser, setSelectedUser] = useState<ChatUser>(conversations[0])
  const [mobileSelectedUser, setMobileSelectedUser] = useState<ChatUser | null>(null)

  const createNewConversation = () => {
    const newId = (conversations.length + 1).toString()
    const newConversation: ChatUser = {
      id: newId,
      profile: '/avatar.png',
      username: `AI${newId}`,
      fullName: `New Chat ${newId}`,
      title: 'Virtual Assistant',
      messages: []
    }
    setConversations([newConversation, ...conversations])
    setSelectedUser(newConversation)
    setMobileSelectedUser(newConversation)
  }

  const send = async () => {
    if (!input.trim()) return

    try {
      // Add user message to chat
      const userMessage: Message = {
        message: input,
        sender: 'You',
        timestamp: new Date().toISOString()
      }

      // Make API call to AI
      const response = await fetch(`http://localhost:11434/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1",
          messages: [
            {
              role: "system",
              content: `Répond 10 mots maximum et dans la meme langue que celle de la question et reprends les mots de la question.`
            },
            { role: "user", content: input }
          ],
          stream: false
        })
      })

      const { message: { content } } = await response.json()

      // Add AI response to chat
      const aiMessage: Message = {
        message: content,
        sender: 'AI',
        timestamp: new Date().toISOString()
      }

      // Update messages in the specific conversation
      const updatedConversations = conversations.map(conv => {
        if (conv.id === selectedUser.id) {
          return {
            ...conv,
            messages: [aiMessage, userMessage, ...conv.messages]
          }
        }
        return conv
      })

      setConversations(updatedConversations)
      setSelectedUser(updatedConversations.find(conv => conv.id === selectedUser.id)!)
      setInput('')

    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Filter conversations based on search
  const filteredConversations = conversations.filter(({ fullName }) =>
    fullName.toLowerCase().includes(search.trim().toLowerCase())
  )

  // Group messages by date
  const currentMessage = selectedUser.messages.reduce(
    (acc: Record<string, Message[]>, obj) => {
      const key = format(obj.timestamp, 'd MMM, yyyy')
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(obj)
      return acc
    },
    {}
  )

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className='flex h-full gap-6'>
          {/* Left Side - Chat List */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex gap-2'>
                  <h1 className='text-2xl font-bold'>Chat</h1>
                  <IconMessages size={20} />
                </div>
                <Button
                  size='icon'
                  variant='ghost'
                  className='rounded-lg'
                  onClick={createNewConversation}
                >
                  <IconEdit size={24} className='stroke-muted-foreground' />
                </Button>
              </div>

              <label className='flex h-12 w-full items-center space-x-0 rounded-md border border-input pl-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring'>
                <IconSearch size={15} className='mr-2 stroke-slate-500' />
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-none'
                  placeholder='Search conversations...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            <ScrollArea className='-mx-3 h-full p-3'>
              {filteredConversations.map((conv) => (
                <Fragment key={conv.id}>
                  <button
                    type='button'
                    className={cn(
                      '-mx-1 flex w-full rounded-md px-2 py-2 text-left text-sm hover:bg-secondary/75',
                      selectedUser.id === conv.id && 'sm:bg-muted'
                    )}
                    onClick={() => {
                      setSelectedUser(conv)
                      setMobileSelectedUser(conv)
                    }}
                  >
                    <div className='flex gap-2'>
                      <Avatar>
                        <AvatarImage src={conv.profile} alt={conv.username} />
                        <AvatarFallback>{conv.username}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className='col-start-2 row-span-2 font-medium'>
                          {conv.fullName}
                        </span>
                        <span className='col-start-2 row-span-2 row-start-2 line-clamp-2 text-ellipsis text-muted-foreground'>
                          {conv.messages[0]?.message || 'Start a new conversation'}
                        </span>
                      </div>
                    </div>
                  </button>
                  <Separator className='my-1' />
                </Fragment>
              ))}
            </ScrollArea>
          </div>

          {/* Right Side - Chat Window */}
          <div className={cn(
            'absolute inset-0 hidden left-full z-50 w-full flex-1 flex-col rounded-md border bg-primary-foreground shadow-sm transition-all duration-200 sm:static sm:z-auto sm:flex',
            mobileSelectedUser && 'left-0 flex'
          )}>
            {/* Chat Header */}
            <div className='mb-1 flex flex-none justify-between rounded-t-md bg-secondary p-4 shadow-lg'>
              <div className='flex gap-3'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='-ml-2 h-full sm:hidden'
                  onClick={() => setMobileSelectedUser(null)}
                >
                  <IconArrowLeft />
                </Button>
                <div className='flex items-center gap-2 lg:gap-4'>
                  <Avatar className='size-9 lg:size-11'>
                    <AvatarImage
                      src={selectedUser.profile}
                      alt={selectedUser.username}
                    />
                    <AvatarFallback>{selectedUser.username}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className='col-start-2 row-span-2 text-sm font-medium lg:text-base'>
                      {selectedUser.fullName}
                    </span>
                    <span className='col-start-2 row-span-2 row-start-2 line-clamp-1 block max-w-32 text-ellipsis text-nowrap text-xs text-muted-foreground lg:max-w-none lg:text-sm'>
                      {selectedUser.title}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className='flex flex-1 flex-col gap-2 rounded-md px-4 pb-4 pt-0'>
              <div className='flex size-full flex-1'>
                <div className='chat-text-container relative -mr-4 flex flex-1 flex-col overflow-y-hidden'>
                  <div className='chat-flex flex h-40 w-full flex-grow flex-col-reverse justify-start gap-4 overflow-y-auto py-2 pb-4 pr-4'>
                    {currentMessage &&
                      Object.keys(currentMessage).map((key) => (
                        <Fragment key={key}>
                          {currentMessage[key].map((msg, index) => (
                            <div
                              key={`${msg.sender}-${msg.timestamp}-${index}`}
                              className={cn(
                                'chat-box max-w-72 break-words px-3 py-2 shadow-lg',
                                msg.sender === 'You'
                                  ? 'self-end rounded-[16px_16px_0_16px] bg-primary/85 text-primary-foreground/75'
                                  : 'self-start rounded-[16px_16px_16px_0] bg-secondary'
                              )}
                            >
                              {msg.message}
                              <span className={cn(
                                'mt-1 block text-xs font-light italic text-muted-foreground',
                                msg.sender === 'You' && 'text-right'
                              )}>
                                {format(msg.timestamp, 'h:mm a')}
                              </span>
                            </div>
                          ))}
                          <div className='text-center text-xs'>{key}</div>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <form className='flex w-full flex-none gap-2' onSubmit={(e) => { e.preventDefault(); send(); }}>
                <div className='flex flex-1 items-center gap-2 rounded-md border border-input px-2 py-1 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring lg:gap-4'>
                  <div className='space-x-1'>
                    <Button
                      size='icon'
                      type='button'
                      variant='ghost'
                      className='h-8 rounded-md'
                    >
                      <IconPlus size={20} className='stroke-muted-foreground' />
                    </Button>
                    <Button
                      size='icon'
                      type='button'
                      variant='ghost'
                      className='hidden h-8 rounded-md lg:inline-flex'
                    >
                      <IconPhotoPlus
                        size={20}
                        className='stroke-muted-foreground'
                      />
                    </Button>
                    <Button
                      size='icon'
                      type='button'
                      variant='ghost'
                      className='hidden h-8 rounded-md lg:inline-flex'
                    >
                      <IconPaperclip
                        size={20}
                        className='stroke-muted-foreground'
                      />
                    </Button>
                  </div>
                  <label className='flex-1'>
                    <span className='sr-only'>Chat Text Box</span>
                    <input
                      type='text'
                      placeholder='Type your message...'
                      className='h-8 w-full bg-inherit focus-visible:outline-none'
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </label>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='hidden sm:inline-flex'
                    onClick={() => send()}
                    type="button"
                  >
                    <IconSend size={20} />
                  </Button>
                </div>
                <Button className='h-full sm:hidden' onClick={() => send()} type="button">
                  <IconSend size={18} /> Send
                </Button>
              </form>
            </div>
          </div>
        </section>
      </Main>
    </>
  )
}