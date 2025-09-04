import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, X, Send, Info, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const PRODUCT_CATEGORIES = [
  "5G", "Accessories", "All Categories (Global DB)", "Meshtastic", "Real-IoT-Solutions",
  "Software-APIs-and-Libraries", "Software-Tools", "WisBlock", "WisDuino", "WisDuo",
  "WisGate", "WisHat", "WisLink", "WisNode", "WisTrio",
];

const API_URL = "http://127.0.0.1:8180/api/chat";

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories (Global DB)");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: "Hello! I'm ready to help. Ask me a question about RAKwireless products." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), role: 'user', content: inputValue };
    const currentInput = inputValue;
    
    const historyToSend = [...messages, userMessage];

    setMessages(historyToSend);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentInput,
          category: selectedCategory,
          chat_history: historyToSend.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;
      const botResponseId = Date.now() + 1;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        if (isFirstChunk) {
          setMessages(prev => [...prev, { id: botResponseId, role: 'assistant', content: chunk }]);
          isFirstChunk = false;
        } else {
          setMessages(prev => prev.map(msg => 
            msg.id === botResponseId 
              ? { ...msg, content: msg.content + chunk } 
              : msg
          ));
        }
      }
    } catch (error) {
      console.error("API call failed:", error);
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "Sorry, I couldn't connect to the server. Please check that the backend is running and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const isThinking = isLoading && lastMessage?.role !== 'assistant';

  return (
    <>
      <Card className={cn("fixed bottom-20 right-5 w-96 h-[32rem] sm:w-[25rem] sm:h-[40rem] z-50 flex flex-col shadow-2xl rounded-xl transition-transform duration-300 ease-in-out", isOpen ? "transform-none opacity-100" : "transform-translate-y-4 opacity-0 pointer-events-none")}>
        <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-xl">
          <div className="flex items-center gap-2"> <Bot className="h-6 w-6" /> <h3 className="font-semibold">RAK Support Bot</h3> </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/80" onClick={toggleChat}> <X className="h-5 w-5" /> <span className="sr-only">Close chat</span> </Button>
        </CardHeader>
        
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b">
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-medium text-muted-foreground">Product Category</label>
              <Tooltip><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Selecting a specific category provides more accurate answers. Use "All Categories" if you're unsure where your product belongs.</p></TooltipContent></Tooltip>
            </div>
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger><SelectValue placeholder="Select a category to begin..." /></SelectTrigger>
              <SelectContent>{PRODUCT_CATEGORIES.map((category) => (<SelectItem key={category} value={category}>{category}</SelectItem>))}</SelectContent>
            </Select>
          </div>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex items-start gap-2.5", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (<div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Bot className="h-5 w-5 text-muted-foreground" /></div>)}
                <div className={cn("p-3 rounded-lg max-w-[85%]", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <div className={cn("prose prose-sm max-w-none", message.role === 'user' && "prose-invert")}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                </div>
                {message.role === 'user' && (<div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>)}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Bot className="h-5 w-5 text-muted-foreground" /></div>
                <div className="bg-muted p-3 rounded-lg"><TypingIndicator /></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>
        </div>
        
        <CardFooter className="p-3 border-t">
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input type="text" placeholder={selectedCategory ? `Ask about ${selectedCategory.split(' ')[0]}...` : "First, select a category"} className="flex-1" disabled={!selectedCategory || isLoading} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            <Button type="submit" size="icon" className="flex-shrink-0 bg-primary hover:bg-primary/90" disabled={!selectedCategory || isLoading || !inputValue.trim()}> <Send className="h-4 w-4" /> <span className="sr-only">Send message</span> </Button>
          </form>
        </CardFooter>
      </Card>

      <Button onClick={toggleChat} className={cn("fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-lg transition-transform duration-300 ease-in-out hover:scale-110 bg-primary hover:bg-primary/90", isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100")} aria-label="Open chat">
        <Bot className="h-7 w-7" />
      </Button>
    </>
  );
};

export default ChatbotWidget;