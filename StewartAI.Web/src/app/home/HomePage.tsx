import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Brain, FileText, MessageSquare, BarChart3, ArrowRight, Camera, Zap, Database, CheckCircle, AlertTriangle, TrendingUp, Cpu, Clock, DollarSign, Target, ArrowDown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { AnimatedHeroStats } from '@/components/ui/animated-hero';
import { FeatureComparison } from '@/components/ui/feature-comparison';
import { healthApi } from '@/lib/api';

export default function HomePage() {
    const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    useEffect(() => { healthApi.check().then(() => setApiStatus('online')).catch(() => setApiStatus('offline')); }, []);

    return (
        <div>
            {/* Hero with 3D Scroll Animation */}
            <div className="flex flex-col overflow-hidden relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(to bottom, #001a33 0%, #002244 15%, #003366 30%, #003366 50%, #002a52 60%, rgba(0,51,102,0.5) 75%, rgba(0,51,102,0.15) 90%, transparent 100%)' }}>
                <ContainerScroll
                    titleComponent={
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-stewart-blue shadow-xl shadow-stewart-blue/20">
                                        <Brain className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#1a3a5c]">
                                        <Sparkles className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-[6rem] font-bold tracking-tight mb-4 leading-none text-white">
                                Stewart Title <span className="text-blue-300">Intelligence Platform</span>
                            </h1>
                            <p className="text-lg md:text-xl text-blue-200/70 max-w-3xl mx-auto mb-3">
                                AI-powered document analysis, knowledge assistance, and risk assessment for the title insurance industry — built on Google Gemini 2.5 Flash.
                            </p>
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Badge variant="secondary" className="text-xs px-3 py-1 bg-white/10 text-white border-white/20">🏆 Stewart India AI Ideathon 2026</Badge>
                                <Badge variant="secondary" className="text-xs px-3 py-1 bg-white/10 text-white border-white/20">🤖 Google Gemini 2.5 Flash</Badge>
                                <Badge variant={apiStatus === 'online' ? 'success' : apiStatus === 'offline' ? 'destructive' : 'default'} className="text-xs px-3 py-1">
                                    {apiStatus === 'checking' && '⏳ Checking...'}{apiStatus === 'online' && '✅ API Online'}{apiStatus === 'offline' && '❌ API Offline'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <Link to="/documents"><Button size="lg" className="bg-white text-stewart-blue hover:bg-blue-50 shadow-lg font-semibold">Try Document Analysis <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
                                <Link to="/chat"><Button size="lg" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">Knowledge Assistant</Button></Link>
                                <Link to="/dashboard"><Button size="lg" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">Risk Dashboard</Button></Link>
                            </div>
                        </>
                    }
                >
                    {/* Platform Preview inside the 3D card */}
                    <div className="h-full w-full bg-white dark:bg-zinc-900 p-4 md:p-8 overflow-hidden">
                        <div className="grid grid-cols-3 gap-4 h-full">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-stewart-blue flex items-center justify-center"><FileText className="h-4 w-4 text-white" /></div>
                                    <span className="font-bold text-sm text-gray-900">Document Intelligence</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 space-y-2">
                                    <div className="h-2 bg-stewart-blue/20 rounded w-3/4" />
                                    <div className="h-2 bg-stewart-blue/20 rounded w-full" />
                                    <div className="h-2 bg-stewart-blue/20 rounded w-2/3" />
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                                    <div className="flex items-center gap-1 mb-1"><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-[10px] font-medium text-green-700">Low Risk</span></div>
                                    <div className="h-2 bg-green-200 rounded w-full" />
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 space-y-1">
                                    <div className="text-[10px] font-semibold text-gray-700">Entities Found: 5</div>
                                    <div className="text-[10px] font-semibold text-gray-700">Defects: 1 (Minor)</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-white" /></div>
                                    <span className="font-bold text-sm text-gray-900">Knowledge Assistant</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                                    <div className="bg-stewart-blue/10 rounded-lg p-2 mb-2"><div className="h-2 bg-stewart-blue/30 rounded w-full" /><div className="h-2 bg-stewart-blue/30 rounded w-2/3 mt-1" /></div>
                                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2"><div className="h-2 bg-emerald-300 rounded w-full" /><div className="h-2 bg-emerald-300 rounded w-4/5 mt-1" /><div className="h-2 bg-emerald-300 rounded w-3/4 mt-1" /></div>
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                                    <div className="text-[10px] font-semibold text-gray-700 mb-1">Sources:</div>
                                    <div className="flex gap-1"><span className="text-[8px] bg-blue-100 text-blue-800 font-medium px-1.5 py-0.5 rounded">title-defects.txt</span><span className="text-[8px] bg-blue-100 text-blue-800 font-medium px-1.5 py-0.5 rounded">alta-policies.txt</span></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-white" /></div>
                                    <span className="font-bold text-sm text-gray-900">Risk Dashboard</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 flex items-end gap-1 h-20">
                                    <div className="bg-green-400 rounded-sm w-full" style={{ height: '30%' }} />
                                    <div className="bg-green-400 rounded-sm w-full" style={{ height: '45%' }} />
                                    <div className="bg-yellow-400 rounded-sm w-full" style={{ height: '60%' }} />
                                    <div className="bg-amber-400 rounded-sm w-full" style={{ height: '75%' }} />
                                    <div className="bg-red-400 rounded-sm w-full" style={{ height: '40%' }} />
                                    <div className="bg-green-400 rounded-sm w-full" style={{ height: '25%' }} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center"><div className="text-lg font-bold text-green-600">12</div><div className="text-[8px] font-semibold text-gray-600">Low Risk</div></div>
                                    <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2 text-center"><div className="text-lg font-bold text-red-600">3</div><div className="text-[8px] font-semibold text-gray-600">High Risk</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ContainerScroll>

            {/* Animated Impact Marquee - inside dark wrapper for smooth transition */}
            <section className="overflow-hidden py-4 pb-16 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        <span className="text-white/90">Title Insurance, but </span>
                        <span className="text-stewart-blue font-extrabold"><AnimatedHeroStats /></span>
                    </h2>
                </div>
                <div className="relative">
                    <motion.div
                        className="flex gap-6"
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                        {[...Array(2)].map((_, setIdx) => (
                            <div key={setIdx} className="flex gap-6 shrink-0">
                                <Card className="text-center border-stewart-blue/20 bg-stewart-blue/5 min-w-[280px] shrink-0">
                                    <CardContent className="pt-6 pb-4">
                                        <Clock className="h-8 w-8 text-stewart-blue mx-auto mb-2" />
                                        <p className="text-3xl font-bold text-stewart-blue">45-60</p>
                                        <p className="text-sm text-muted-foreground">Minutes per document review</p>
                                        <p className="text-xs text-red-500 font-medium mt-1">Current manual process</p>
                                    </CardContent>
                                </Card>
                                <Card className="text-center border-emerald-200 bg-emerald-50/50 min-w-[280px] shrink-0">
                                    <CardContent className="pt-6 pb-4">
                                        <Zap className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                                        <p className="text-3xl font-bold text-emerald-600">&lt; 30</p>
                                        <p className="text-sm text-muted-foreground">Seconds with AI analysis</p>
                                        <p className="text-xs text-emerald-600 font-medium mt-1">90x faster processing</p>
                                    </CardContent>
                                </Card>
                                <Card className="text-center border-amber-200 bg-amber-50/50 min-w-[280px] shrink-0">
                                    <CardContent className="pt-6 pb-4">
                                        <DollarSign className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                                        <p className="text-3xl font-bold text-amber-600">$22B</p>
                                        <p className="text-sm text-muted-foreground">US title insurance market</p>
                                        <p className="text-xs text-amber-600 font-medium mt-1">Massive efficiency opportunity</p>
                                    </CardContent>
                                </Card>
                                <Card className="text-center border-purple-200 bg-purple-50/50 min-w-[280px] shrink-0">
                                    <CardContent className="pt-6 pb-4">
                                        <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                        <p className="text-3xl font-bold text-purple-600">3-in-1</p>
                                        <p className="text-sm text-muted-foreground">Unified AI platform</p>
                                        <p className="text-xs text-purple-600 font-medium mt-1">Document + Knowledge + Risk</p>
                                    </CardContent>
                                </Card>
                                <Card className="text-center border-blue-200 bg-blue-50/50 min-w-[280px] shrink-0">
                                    <CardContent className="pt-6 pb-4">
                                        <Camera className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                        <p className="text-3xl font-bold text-blue-600">Vision AI</p>
                                        <p className="text-sm text-muted-foreground">Multimodal document processing</p>
                                        <p className="text-xs text-blue-600 font-medium mt-1">Photos &amp; handwritten docs</p>
                                    </CardContent>
                                </Card>
                                <Card className="text-center border-rose-200 bg-rose-50/50 min-w-[280px] shrink-0">
                                    <CardContent className="pt-6 pb-4">
                                        <Database className="h-8 w-8 text-rose-600 mx-auto mb-2" />
                                        <p className="text-3xl font-bold text-rose-600">RAG</p>
                                        <p className="text-sm text-muted-foreground">Self-learning knowledge base</p>
                                        <p className="text-xs text-rose-600 font-medium mt-1">Grows smarter with every doc</p>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>
            </div>
            {/* End of dark hero wrapper */}

            {/* Gradual white-to-blue background for lower sections */}
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-16 -mb-6" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(0,51,102,0.05) 15%, rgba(0,51,102,0.12) 30%, rgba(0,51,102,0.25) 50%, rgba(0,51,102,0.45) 70%, rgba(0,51,102,0.7) 85%, #003366 100%)' }}>
            <div className="space-y-16">

            {/* The Challenge & How We Solve It — Interactive Comparison */}
            <section>
                <div className="text-center mb-10">
                    <Badge variant="outline" className="mb-3 text-xs border-stewart-blue/30 text-white bg-stewart-blue">THE CHALLENGE &amp; OUR ANSWER</Badge>
                    <h2 className="text-3xl font-bold mb-3 text-stewart-blue">Drag to Compare: Before vs After</h2>
                    <p className="text-gray-700 max-w-3xl mx-auto text-lg">Slide to see how our AI platform transforms title insurance operations.</p>
                </div>
                <div className="max-w-5xl mx-auto">
                <FeatureComparison
                    beforeLabel="⏳ BEFORE — Manual Process"
                    afterLabel="⚡ AFTER — AI-Powered"
                    beforeContent={
                        <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-8 md:p-12 flex items-center justify-center">
                            <div className="max-w-md mx-auto text-center">
                                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-6">The Old Way</h3>
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <AlertTriangle className="h-8 w-8 text-red-500" />
                                        <p className="font-semibold text-red-700 dark:text-red-400">Manual Document Review</p>
                                        <p className="text-xs text-red-600/70">45-60 min per document • Human error prone</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Database className="h-8 w-8 text-yellow-500" />
                                        <p className="font-semibold text-yellow-700 dark:text-yellow-400">Knowledge Silos</p>
                                        <p className="text-xs text-yellow-600/70">Months to train • Expert departure = loss</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <TrendingUp className="h-8 w-8 text-orange-500" />
                                        <p className="font-semibold text-orange-700 dark:text-orange-400">Reactive Risk Management</p>
                                        <p className="text-xs text-orange-600/70">Claims discovered too late • No visibility</p>
                                    </div>
                                    <Separator className="bg-red-200 dark:bg-red-800" />
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div><p className="text-2xl font-bold text-red-600">45-60</p><p className="text-[10px] text-red-500">min/document</p></div>
                                        <div><p className="text-2xl font-bold text-red-600">3-6</p><p className="text-[10px] text-red-500">months training</p></div>
                                        <div><p className="text-2xl font-bold text-red-600">$22B</p><p className="text-[10px] text-red-500">market at risk</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                    afterContent={
                        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 p-8 md:p-12 flex items-center justify-center">
                            <div className="max-w-md mx-auto text-center">
                                <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-6">The AI Way</h3>
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <FileText className="h-8 w-8 text-stewart-blue" />
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">AI Document Intelligence</p>
                                        <p className="text-xs text-emerald-600/70">&lt;30 sec • Vision AI • Auto extraction</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <MessageSquare className="h-8 w-8 text-emerald-500" />
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">RAG Knowledge Assistant</p>
                                        <p className="text-xs text-emerald-600/70">Instant answers • Self-learning KB</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <BarChart3 className="h-8 w-8 text-blue-500" />
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Proactive Risk Dashboard</p>
                                        <p className="text-xs text-emerald-600/70">AI scoring 0-100 • All 50 states</p>
                                    </div>
                                    <Separator className="bg-emerald-200 dark:bg-emerald-800" />
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div><p className="text-2xl font-bold text-emerald-600">&lt;30</p><p className="text-[10px] text-emerald-500">sec/document</p></div>
                                        <div><p className="text-2xl font-bold text-emerald-600">90x</p><p className="text-[10px] text-emerald-500">faster processing</p></div>
                                        <div><p className="text-2xl font-bold text-emerald-600">3-in-1</p><p className="text-[10px] text-emerald-500">unified platform</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />
                </div>
            </section>

            {/* 3 AI Features */}
            <section>
                <div className="text-center mb-10">
                    <Badge variant="outline" className="mb-3 text-xs border-white/40 text-stewart-blue bg-white/60">OUR SOLUTION</Badge>
                    <h2 className="text-3xl font-bold mb-3 text-stewart-blue">3 AI-Powered Features, 1 Unified Platform</h2>
                    <p className="text-gray-700 max-w-3xl mx-auto text-lg">A unified platform connecting document intelligence, knowledge management, and risk analytics — all powered by Google Gemini 2.5 Flash.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-xl border-white/50">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-stewart-blue" />
                        <CardHeader>
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-stewart-blue/10 mb-3"><FileText className="h-7 w-7 text-stewart-blue" /></div>
                            <CardTitle className="text-xl">Document Intelligence</CardTitle>
                            <CardDescription>Upload any title document — PDF, text, or photo of a handwritten deed — and get instant AI analysis.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Automatic document type classification</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Entity extraction (parties, amounts, dates)</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Title defect detection with severity scoring</span></div>
                                <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-blue-500 shrink-0" /><span className="font-medium">Multimodal Vision: photos &amp; handwritten docs</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Scanned PDF detection with auto-OCR fallback</span></div>
                            </div>
                            <div className="bg-stewart-blue/5 rounded-lg p-3 text-xs text-muted-foreground"><strong>Supported:</strong> PDF, TXT, JPG, PNG, WEBP, TIFF, GIF (up to 15MB)</div>
                            <Link to="/documents"><Button className="w-full bg-stewart-blue hover:bg-stewart-blue/90">Try Document Analysis <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-xl border-white/50">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                        <CardHeader>
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 mb-3"><MessageSquare className="h-7 w-7 text-emerald-600" /></div>
                            <CardTitle className="text-xl">Knowledge Assistant</CardTitle>
                            <CardDescription>Ask any question about title insurance and get accurate answers backed by source citations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>10+ knowledge base documents pre-loaded</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>RAG: chunk → embed → cosine similarity → generate</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Source citations with every answer</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Conversation history with multi-turn context</span></div>
                                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-500 shrink-0" /><span className="font-medium">Self-learning: auto-ingests analyzed docs</span></div>
                            </div>
                            <div className="bg-emerald-500/5 rounded-lg p-3 text-xs text-muted-foreground"><strong>Try:</strong> &quot;What are common title defects in Texas?&quot;</div>
                            <Link to="/chat"><Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Ask a Question <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-xl border-white/50">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
                        <CardHeader>
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 mb-3"><BarChart3 className="h-7 w-7 text-amber-600" /></div>
                            <CardTitle className="text-xl">Risk Dashboard</CardTitle>
                            <CardDescription>Proactive risk management with AI scoring, state-level analytics, and actionable recommendations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>AI-powered risk scoring (0-100 scale)</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>State-by-state risk breakdown with charts</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Auto-populated from document analysis</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Risk factors with severity &amp; recommendations</span></div>
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /><span>Synthetic data seeding for demo scenarios</span></div>
                            </div>
                            <div className="bg-amber-500/5 rounded-lg p-3 text-xs text-muted-foreground"><strong>Covers:</strong> All 50 US states, residential &amp; commercial</div>
                            <Link to="/dashboard"><Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">View Risk Dashboard <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* The Intelligence Loop */}
            <section>
                <div className="text-center mb-10">
                    <Badge variant="outline" className="mb-3 text-xs border-white/40 text-stewart-blue bg-white/60">WHY WE WIN</Badge>
                    <h2 className="text-3xl font-bold mb-3 text-white">The Intelligence Loop</h2>
                    <p className="text-white/80 max-w-3xl mx-auto text-lg">Our key differentiator: all three features are interconnected. Analyzing a document automatically feeds the risk dashboard <strong>and</strong> enriches the knowledge base.</p>
                </div>
                <Card className="max-w-5xl mx-auto overflow-hidden bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                            <div className="flex flex-col items-center text-center max-w-[180px]">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stewart-blue text-white mb-3 shadow-lg shadow-stewart-blue/20"><FileText className="h-8 w-8" /></div>
                                <p className="text-sm font-bold text-white">1. Upload Document</p>
                                <p className="text-xs text-white/60 mt-1">PDF, TXT, photo, or scan</p>
                            </div>
                            <div className="hidden md:flex flex-col items-center"><ArrowRight className="h-8 w-8 text-white/70" /><span className="text-[10px] text-white/50 mt-1">auto</span></div>
                            <ArrowDown className="h-6 w-6 text-white/70 md:hidden" />
                            <div className="flex flex-col items-center text-center max-w-[180px]">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stewart-blue text-white mb-3 shadow-lg shadow-stewart-blue/20"><Cpu className="h-8 w-8" /></div>
                                <p className="text-sm font-bold text-white">2. AI Analyzes</p>
                                <p className="text-xs text-white/60 mt-1">Entities, defects, risk level</p>
                            </div>
                            <div className="hidden md:flex flex-col items-center"><ArrowRight className="h-8 w-8 text-amber-400" /><span className="text-[10px] text-white/50 mt-1">auto</span></div>
                            <ArrowDown className="h-6 w-6 text-amber-400 md:hidden" />
                            <div className="flex flex-col items-center text-center max-w-[180px]">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white mb-3 shadow-lg shadow-amber-500/20"><BarChart3 className="h-8 w-8" /></div>
                                <p className="text-sm font-bold text-white">3. Risk Dashboard</p>
                                <p className="text-xs text-white/60 mt-1">Auto-creates risk record</p>
                            </div>
                            <div className="hidden md:flex flex-col items-center"><ArrowRight className="h-8 w-8 text-emerald-400" /><span className="text-[10px] text-white/50 mt-1">auto</span></div>
                            <ArrowDown className="h-6 w-6 text-emerald-400 md:hidden" />
                            <div className="flex flex-col items-center text-center max-w-[180px]">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white mb-3 shadow-lg shadow-emerald-500/20"><MessageSquare className="h-8 w-8" /></div>
                                <p className="text-sm font-bold text-white">4. Knowledge Base</p>
                                <p className="text-xs text-white/60 mt-1">Auto-ingests for RAG</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
            </div>
            </div>
        </div>
    );
}
