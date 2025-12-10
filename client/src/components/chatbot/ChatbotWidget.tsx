import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Send, X, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatePresence, motion } from 'framer-motion';
import { DotLottiePlayer } from '@dotlottie/react-player';

// --- CONFIGURATION ---
const ROBOT_ANIMATION_SRC = "/robot.json"; 

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const PRODUCT_CATEGORIES = [
  "All Categories", "5G", "WisBlock", "WisGate", "Meshtastic", "Software-Tools"
];

const SUGGESTED_QUESTIONS = [
  "How do I set up my WisGate?",
  "What is WisBlock?",
  "Meshtastic configuration guide"
];

const API_URL = "http://localhost:8180/api/chat";

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCallout, setShowCallout] = useState(false); 
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  
  const [messages, setMessages] = useState<Message[]>([
     { id: 1, role: 'assistant', content: "Hello! I'm ready to help. Ask me a question about RAKwireless products." }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesStartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => {
            messagesStartRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), role: 'user', content: text };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    const backendCategory = selectedCategory === "All Categories" 
      ? "All Categories (Global DB)" 
      : selectedCategory;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          category: backendCategory,
          chat_history: newHistory.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;
      const botResponseId = Date.now() + 1;

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          if (isFirstChunk) {
            setMessages(prev => [...prev, { id: botResponseId, role: 'assistant', content: chunk }]);
            isFirstChunk = false;
          } else {
            setMessages(prev => prev.map(msg => 
              msg.id === botResponseId ? { ...msg, content: msg.content + chunk } : msg
            ));
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "I'm having trouble reaching the knowledge base. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const lastMessage = messages[messages.length - 1];
  const isThinking = isLoading && lastMessage?.role !== 'assistant';

  return (
    <div className="fixed bottom-[2vh] right-[2vw] z-[100] flex flex-col items-end gap-2.5 font-sans pointer-events-none">
      
      {/* 1. The "Talk to me" Speech Bubble */}
      <AnimatePresence>
        {(showCallout || isHovered) && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0,
              y: [0, -5, 0] // Bobbing animation
            }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ 
              y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
              default: { type: "spring", stiffness: 300, damping: 25 }
            }}
            className="pointer-events-auto mr-1 mb-2 relative origin-bottom-right z-50"
          >
            {/* FIX: Switched from Black to White with strong border/shadow 
               Matches the card aesthetic (Glass/Clean)
            */}
            <div className="bg-white dark:bg-zinc-800 text-foreground px-5 py-3 rounded-2xl rounded-br-sm shadow-xl border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold whitespace-nowrap">
              Need a hand? Ask RAK Bot!
            </div>
            
            {/* Tail color matched to white */}
            <div className="absolute -bottom-[6px] right-0 w-4 h-4 bg-white dark:bg-zinc-800 border-b border-r border-zinc-200 dark:border-zinc-700 transform rotate-45 rounded-sm"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. The Main Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="origin-bottom-right relative pointer-events-auto"
          >
            {/* ROBOT PEEKING */}
            <div className="absolute -top-[12vh] sm:-top-20 left-0 w-full flex justify-center pointer-events-none z-20">
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="w-[min(120px,20vh)] h-[min(120px,20vh)] filter drop-shadow-xl"
                >
                    <DotLottiePlayer src={ROBOT_ANIMATION_SRC} loop autoplay />
                </motion.div>
            </div>

            {/* CARD */}
            <Card className="w-[min(350px,90vw)] h-[min(580px,65vh)] flex flex-col shadow-2xl rounded-[30px] overflow-hidden border border-zinc-200/80 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
              
              {/* Header */}
              <div className="relative z-10 flex flex-col items-center justify-center pt-10 pb-3 bg-gradient-to-b from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent border-b border-white/50 dark:border-zinc-800">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-md transition-colors" 
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>

                <h3 className="font-bold text-lg text-foreground">RAK Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Online & Ready</span>
                </div>

                <div className="mt-4 w-[60%]">
                   <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full h-8 text-xs bg-white dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-full focus:ring-0 shadow-sm backdrop-blur-sm hover:bg-white/80 transition-all flex justify-between px-3"
                      >
                         <div className="flex items-center overflow-hidden">
                           <Sparkles className="w-3 h-3 mr-2 text-primary flex-shrink-0" />
                           <span className="truncate">{selectedCategory}</span>
                         </div>
                         <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-[200] w-56" align="center">
                      {PRODUCT_CATEGORIES.map(cat => (
                        <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)} className="text-sm">
                          {cat}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Chat Content */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-slate-50/50 dark:bg-black/20">
                <div ref={messagesStartRef} />

                {messages.map((message) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={message.id} 
                    className={cn("flex flex-col gap-1 max-w-[85%]", message.role === 'user' ? 'ml-auto items-end' : 'items-start')}
                  >
                    <div className={cn(
                      "p-3.5 text-sm shadow-sm relative",
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                        : 'bg-white dark:bg-zinc-800 text-foreground border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-tl-sm'
                    )}>
                      <div className={cn("prose prose-sm max-w-none leading-relaxed", message.role === 'user' ? "prose-invert" : "dark:prose-invert")}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                    {message.role === 'assistant' && (
                        <span className="text-[10px] text-muted-foreground pl-1">RAK Bot</span>
                    )}
                  </motion.div>
                ))}

                {isThinking && (
                  <div className="flex items-start">
                     <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                       <TypingIndicator />
                     </div>
                  </div>
                )}

                {/* Suggested Questions Chips */}
                {messages.length < 3 && !isLoading && (
                  <div className="grid gap-2 pt-3">
                    <p className="text-xs text-center text-muted-foreground font-medium mb-1 opacity-70">Suggested topics</p>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        onClick={() => handleSendMessage(q)}
                        className="text-left text-xs sm:text-sm p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all flex items-center justify-between group"
                      >
                        <span>{q}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Footer */}
              <CardFooter className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                <form onSubmit={handleSubmit} className="flex w-full items-end gap-2 relative">
                  <Input 
                    className="flex-1 bg-slate-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 focus:border-primary/30 focus:bg-background rounded-2xl pl-4 pr-12 py-6 text-sm shadow-sm transition-all resize-none"
                    placeholder="Ask a question..." 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className={cn(
                      "absolute right-2 top-2 h-8 w-8 rounded-full transition-all duration-300 shadow-sm", 
                      inputValue.trim() ? "bg-primary text-primary-foreground scale-100" : "bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 scale-90"
                    )}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    {isLoading ? <span className="animate-spin">⟳</span> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. The Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsOpen(true)}
                className="pointer-events-auto relative w-16 h-16 sm:w-[90px] sm:h-[90px] flex items-center justify-center focus:outline-none group"
            >
                <div className="absolute inset-5 bg-blue-100/50 dark:bg-blue-900/20 blur-xl rounded-full opacity-100 group-hover:opacity-100 group-hover:bg-blue-200/60 transition-all duration-500"></div>
                
                <div className="w-full h-full drop-shadow-2xl relative z-10">
                    <DotLottiePlayer src={ROBOT_ANIMATION_SRC} loop autoplay />
                </div>
            </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatbotWidget;