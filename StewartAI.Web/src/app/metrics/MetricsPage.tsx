import { useState, useEffect } from 'react';
import {
    Activity,
    FileText,
    MessageSquare,
    Database,
    Shield,
    RefreshCw,
    Camera,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Cpu,
    Clock,
    BarChart3,
    TrendingUp,
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { healthApi } from '@/lib/api';
import type { PlatformMetrics } from '@/lib/api/health';
import { formatDate, getRiskBadgeVariant } from '@/lib/utils';

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await healthApi.getMetrics();
            setMetrics(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    const getRiskIcon = (risk: string) => {
        switch (risk.toLowerCase()) {
            case 'high':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'medium':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'low':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8" />
                        Platform Metrics &amp; Audit Trail
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time processing statistics, AI operations log, and system health
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadMetrics} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))
                ) : metrics ? (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Documents Analyzed</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.documentAnalysis.totalDocuments}</div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.documentAnalysis.recentDocuments.filter(d => d.isVision).length} via Vision AI
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Knowledge Chunks</CardTitle>
                                <Database className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.knowledgeBase.totalChunks}</div>
                                <p className="text-xs text-muted-foreground">
                                    from {metrics.knowledgeBase.uniqueDocuments} documents
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Chat Conversations</CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.chat.totalConversations}</div>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.chat.totalMessages} total messages
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Risk Records</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics.risk.totalRiskRecords}</div>
                                <p className="text-xs text-muted-foreground">
                                    avg score: {metrics.risk.averageRiskScore} • {metrics.risk.claimCount} claims
                                </p>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Document Audit Trail */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Document Analyses */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Document Analysis Audit Trail
                            </CardTitle>
                            <CardDescription>
                                Complete log of all AI-processed documents
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : metrics && metrics.documentAnalysis.recentDocuments.length > 0 ? (
                                <ScrollArea className="h-[400px]">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-background">
                                            <tr className="border-b">
                                                <th className="text-left py-2 font-medium">Document</th>
                                                <th className="text-left py-2 font-medium">Type</th>
                                                <th className="text-center py-2 font-medium">Risk</th>
                                                <th className="text-center py-2 font-medium">Mode</th>
                                                <th className="text-right py-2 font-medium">Processed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {metrics.documentAnalysis.recentDocuments.map((doc) => (
                                                <tr key={doc.id} className="border-b hover:bg-muted/50">
                                                    <td className="py-2">
                                                        <div className="flex items-center gap-2">
                                                            {doc.isVision ? (
                                                                <Camera className="h-4 w-4 text-blue-500 shrink-0" />
                                                            ) : (
                                                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                            )}
                                                            <span className="truncate max-w-[200px]">{doc.fileName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {doc.documentType}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {getRiskIcon(doc.riskLevel)}
                                                            <Badge variant={getRiskBadgeVariant(doc.riskLevel)} className="text-[10px]">
                                                                {doc.riskLevel}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 text-center">
                                                        {doc.isVision ? (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                <Camera className="h-3 w-3 mr-1" />
                                                                Vision
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px]">
                                                                <Cpu className="h-3 w-3 mr-1" />
                                                                Text
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-right text-xs text-muted-foreground">
                                                        {formatDate(doc.analyzedAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No documents analyzed yet. Go to Document Analysis to get started.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Chat Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Chat Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : metrics && metrics.chat.recentConversations.length > 0 ? (
                                <div className="space-y-2">
                                    {metrics.chat.recentConversations.map((conv) => (
                                        <div key={conv.id} className="flex items-center justify-between p-2 rounded-md border">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-mono text-xs">{conv.id.slice(0, 8)}...</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {conv.messageCount} messages
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(conv.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No conversations yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Breakdowns */}
                <div className="space-y-6">
                    {/* System Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Cpu className="h-5 w-5" />
                                System Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-6 w-full" />
                                    ))}
                                </div>
                            ) : metrics ? (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Platform</span>
                                        <span className="font-medium">{metrics.platform.name}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Version</span>
                                        <Badge variant="outline">{metrics.platform.version}</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">AI Model</span>
                                        <Badge variant="secondary">{metrics.platform.aiModel}</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Embedding</span>
                                        <Badge variant="secondary">{metrics.platform.embeddingModel}</Badge>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <span className="text-xs">{formatDate(metrics.timestamp)}</span>
                                    </div>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Document Type Breakdown */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Documents by Type
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-6 w-full" />
                                    ))}
                                </div>
                            ) : metrics && metrics.documentAnalysis.documentsByType.length > 0 ? (
                                <div className="space-y-2">
                                    {metrics.documentAnalysis.documentsByType.map((item) => (
                                        <div key={item.type} className="flex items-center justify-between">
                                            <span className="text-sm">{item.type}</span>
                                            <Badge variant="outline">{item.count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">No data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Risk Distribution */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Risk Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-6 w-full" />
                                    ))}
                                </div>
                            ) : metrics && metrics.documentAnalysis.documentsByRisk.length > 0 ? (
                                <div className="space-y-2">
                                    {metrics.documentAnalysis.documentsByRisk.map((item) => (
                                        <div key={item.level} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getRiskIcon(item.level)}
                                                <span className="text-sm">{item.level}</span>
                                            </div>
                                            <Badge variant={getRiskBadgeVariant(item.level)}>{item.count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">No data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Knowledge Base Documents */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Knowledge Base Sources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-5 w-full" />
                                    ))}
                                </div>
                            ) : metrics && metrics.knowledgeBase.documentNames.length > 0 ? (
                                <ScrollArea className="h-[200px]">
                                    <div className="space-y-1">
                                        {metrics.knowledgeBase.documentNames.map((name) => (
                                            <div key={name} className="flex items-center gap-2 text-xs p-1">
                                                <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                                                <span className="truncate">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">No documents ingested</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
