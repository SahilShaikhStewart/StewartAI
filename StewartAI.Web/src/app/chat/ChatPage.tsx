import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User,
    Upload,
    BookOpen,
    Loader2,
    Database,
    Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { chatApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ChatMessage, SourceCitation } from '@/types/api';

interface DisplayMessage extends ChatMessage {
    sources?: SourceCitation[];
}

export default function ChatPage() {
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | undefined>();
    const [kbStats, setKbStats] = useState<{ totalChunks: number } | null>(null);
    const [isIngesting, setIsIngesting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load KB stats on mount
    useEffect(() => {
        chatApi.getKnowledgeBaseStats().then(setKbStats).catch(console.error);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: DisplayMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatApi.ask({
                message: userMessage.content,
                conversationId,
            });

            setConversationId(response.conversationId);

            const assistantMessage: DisplayMessage = {
                role: 'assistant',
                content: response.answer,
                timestamp: response.timestamp,
                sources: response.sources,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            const errorMessage: DisplayMessage = {
                role: 'assistant',
                content:
                    'Sorry, I encountered an error. Please make sure the API is running and try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleIngest = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsIngesting(true);
        try {
            const result = await chatApi.ingestDocument(file);
            setKbStats({ totalChunks: result.totalChunks });

            const systemMessage: DisplayMessage = {
                role: 'assistant',
                content: `📚 Knowledge base updated! "${file.name}" has been ingested. Total knowledge chunks: ${result.totalChunks}`,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, systemMessage]);
        } catch {
            const errorMessage: DisplayMessage = {
                role: 'assistant',
                content: 'Failed to ingest document. Please check the file and try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsIngesting(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setConversationId(undefined);
    };

    const suggestedQuestions = [
        'What is title insurance and why is it important?',
        'What are common title defects in residential transactions?',
        'Explain the difference between owner and lender title policies',
        'What is a title commitment and what does it contain?',
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Knowledge Assistant</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-powered RAG chatbot trained on title insurance knowledge
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleNewChat}>
                        <Sparkles className="h-4 w-4 mr-1" />
                        New Chat
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Knowledge Base */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Knowledge Base
                            </CardTitle>
                            <CardDescription>
                                {kbStats
                                    ? `${kbStats.totalChunks} knowledge chunks indexed`
                                    : 'Loading...'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isIngesting}
                            >
                                {isIngesting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                )}
                                {isIngesting ? 'Ingesting...' : 'Ingest Document'}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleIngest}
                                className="hidden"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Upload PDF or TXT files to expand the knowledge base
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Try Asking
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(q)}
                                        className="w-full text-left text-xs p-2 rounded-md border hover:bg-muted transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-3">
                    <Card className="flex flex-col h-[calc(100vh-220px)]">
                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-medium">
                                        Stewart AI Knowledge Assistant
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                        Ask questions about title insurance, underwriting
                                        guidelines, or any topic in the knowledge base. I use RAG
                                        to provide accurate, sourced answers.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-3 ${
                                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stewart-blue">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] ${
                                                msg.role === 'user'
                                                    ? 'chat-user'
                                                    : 'chat-assistant'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-3 pt-2 border-t border-border/50">
                                                    <p className="text-xs font-medium mb-1">
                                                        Sources:
                                                    </p>
                                                    {msg.sources.map((src, j) => (
                                                        <div
                                                            key={j}
                                                            className="text-xs text-muted-foreground mt-1"
                                                        >
                                                            <Badge
                                                                variant="outline"
                                                                className="mr-1"
                                                            >
                                                                {src.documentName}
                                                            </Badge>
                                                            <span className="opacity-70">
                                                                (
                                                                {(
                                                                    src.relevanceScore * 100
                                                                ).toFixed(0)}
                                                                % match)
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-[10px] opacity-50 mt-1">
                                                {formatDate(msg.timestamp)}
                                            </p>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                                <User className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stewart-blue">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="chat-assistant">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Input Area */}
                        <div className="p-4">
                            <div className="flex gap-2">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about title insurance, underwriting, or any topic..."
                                    className="min-h-[44px] max-h-[120px] resize-none"
                                    rows={1}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    size="icon"
                                    className="shrink-0 h-[44px] w-[44px]"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 text-center">
                                Powered by Google Gemini + RAG • Responses may not always be
                                accurate
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
