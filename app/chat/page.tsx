import { AIChat } from "@/components/ai-chat"

export default function ChatPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Asistente Virtual</h1>
      <div className="max-w-md mx-auto">
        <AIChat />
      </div>
    </div>
  )
}
