import { useState, useRef, useEffect } from 'react';
import {
    FileText,
    Upload,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    Clock,
    Zap,
    FileSearch,
    Camera,
    Image,
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
import { documentsApi } from '@/lib/api';
import type { DemoDocument } from '@/lib/api/documents';
import { FILE_ACCEPT, SUPPORTED_EXTENSIONS, isImageFile } from '@/lib/api/documents';
import { formatDate, getRiskBadgeVariant } from '@/lib/utils';
import type { DocumentAnalysisResponse } from '@/types/api';

export default function DocumentAnalysisPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzingDemo, setAnalyzingDemo] = useState<string | null>(null);
    const [currentResult, setCurrentResult] = useState<DocumentAnalysisResponse | null>(null);
    const [history, setHistory] = useState<DocumentAnalysisResponse[]>([]);
    const [demoDocuments, setDemoDocuments] = useState<DemoDocument[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load demo documents list on mount
    useEffect(() => {
        documentsApi.getDemoDocuments().then(setDemoDocuments).catch(console.error);
    }, []);

    const handleDemoAnalyze = async (fileName: string) => {
        setAnalyzingDemo(fileName);
        setIsAnalyzing(true);
        setError(null);
        setCurrentResult(null);
        setUploadedFileName(fileName);

        try {
            const result = await documentsApi.analyzeDemoDocument(fileName);
            setCurrentResult(result);
            setHistory((prev) => [result, ...prev]);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Failed to analyze demo document.';
            setError(message);
        } finally {
            setIsAnalyzing(false);
            setAnalyzingDemo(null);
        }
    };

    const handleFileUpload = async (file: File) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
            setError('Unsupported file type. Supported: PDF, TXT, JPG, PNG, WEBP, TIFF, GIF');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setCurrentResult(null);
        setUploadedFileName(file.name);

        try {
            const result = await documentsApi.analyze(file);
            setCurrentResult(result);
            setHistory((prev) => [result, ...prev]);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Failed to analyze document. Is the API running?';
            setError(message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => setDragActive(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const getRiskIcon = (risk: string) => {
        switch (risk.toLowerCase()) {
            case 'high':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'medium':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'low':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            default:
                return null;
        }
    };

    /** Check if the current result was processed via Gemini Vision */
    const isVisionResult = currentResult?.summary?.includes('[📷 Processed via AI Vision]');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Document Intelligence</h1>
                <p className="text-muted-foreground mt-1">
                    Upload title documents for AI-powered analysis — supports PDFs, text files,{' '}
                    <span className="font-medium text-primary">photos, and handwritten documents</span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Upload + History */}
                <div className="space-y-6">
                    {/* Upload Zone */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Upload Document
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                    <Camera className="h-3 w-3 mr-1" />
                                    Vision AI
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Drop a PDF, TXT, or photo of a document to analyze
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    dragActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted-foreground/25 hover:border-primary/50'
                                }`}
                            >
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                        <div>
                                            <p className="font-medium">
                                                {uploadedFileName && isImageFile(uploadedFileName)
                                                    ? 'Processing image via AI Vision...'
                                                    : 'Analyzing document...'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {uploadedFileName && isImageFile(uploadedFileName)
                                                    ? 'Gemini Vision is reading the image and extracting text'
                                                    : 'AI is extracting entities and assessing risk'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                            <Image className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                Drop file here or click to browse
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                PDF, TXT, JPG, PNG, WEBP, TIFF
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                📷 Photos &amp; handwritten docs processed via AI Vision
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={FILE_ACCEPT}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {error && (
                                <div className="mt-3 p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                    <XCircle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Demo Documents */}
                    {demoDocuments.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileSearch className="h-4 w-4" />
                                    Try Demo Documents
                                </CardTitle>
                                <CardDescription>
                                    Pre-built title documents with intentional defects
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {demoDocuments.map((doc) => (
                                    <Button
                                        key={doc.fileName}
                                        variant="outline"
                                        className="w-full justify-start text-left h-auto py-2"
                                        disabled={isAnalyzing}
                                        onClick={() => handleDemoAnalyze(doc.fileName)}
                                    >
                                        {analyzingDemo === doc.fileName ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                                        ) : (
                                            <Zap className="h-4 w-4 mr-2 shrink-0 text-amber-500" />
                                        )}
                                        <span className="truncate text-xs">
                                            {doc.displayName}
                                        </span>
                                    </Button>
                                ))}
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Same property, same transaction — cross-document risk detection
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Analysis History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Recent Analyses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No analyses yet. Upload a document to get started.
                                </p>
                            ) : (
                                <ScrollArea className="h-[300px]">
                                    <div className="space-y-2">
                                        {history.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setCurrentResult(item)}
                                                className={`w-full text-left p-3 rounded-md border transition-colors hover:bg-muted ${
                                                    currentResult?.id === item.id
                                                        ? 'border-primary bg-primary/5'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {item.summary?.includes('[📷') ? (
                                                            <Camera className="h-4 w-4 shrink-0 text-blue-500" />
                                                        ) : (
                                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        )}
                                                        <span className="text-sm font-medium truncate">
                                                            {item.fileName}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant={getRiskBadgeVariant(
                                                            item.riskLevel
                                                        )}
                                                        className="ml-2 shrink-0"
                                                    >
                                                        {item.riskLevel}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(item.analyzedAt)}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Analysis Results */}
                <div className="lg:col-span-2">
                    {isAnalyzing ? (
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-72 mt-2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {uploadedFileName && isImageFile(uploadedFileName) && (
                                    <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm">
                                        <Camera className="h-4 w-4 shrink-0" />
                                        <span>
                                            Processing image via <strong>Gemini Vision AI</strong> — extracting text from photo/scan...
                                        </span>
                                    </div>
                                )}
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ) : currentResult ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Eye className="h-5 w-5" />
                                            Analysis Results
                                            {isVisionResult && (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    <Camera className="h-3 w-3 mr-1" />
                                                    Vision AI
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {currentResult.fileName} •{' '}
                                            {currentResult.documentType}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getRiskIcon(currentResult.riskLevel)}
                                        <Badge
                                            variant={getRiskBadgeVariant(currentResult.riskLevel)}
                                            className="text-sm"
                                        >
                                            {currentResult.riskLevel} Risk
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Vision AI Banner */}
                                {isVisionResult && (
                                    <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm">
                                        <Camera className="h-4 w-4 shrink-0" />
                                        <span>
                                            This document was processed using <strong>Gemini Vision AI</strong> — 
                                            text was extracted from an image or scanned document using multimodal AI.
                                        </span>
                                    </div>
                                )}

                                {/* Summary */}
                                <div>
                                    <h3 className="font-semibold mb-2">Summary</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {currentResult.summary?.replace('[📷 Processed via AI Vision] ', '')}
                                    </p>
                                </div>

                                <Separator />

                                {/* Extracted Entities */}
                                <div>
                                    <h3 className="font-semibold mb-3">Extracted Entities</h3>
                                    {currentResult.entities.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {currentResult.entities.map((entity, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-2 p-2 rounded-md bg-muted"
                                                >
                                                    <Badge variant="outline" className="shrink-0">
                                                        {entity.type}
                                                    </Badge>
                                                    <span className="text-sm truncate">
                                                        {entity.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No entities extracted
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Title Defects */}
                                <div>
                                    <h3 className="font-semibold mb-3">Title Defects</h3>
                                    {currentResult.defects.length > 0 ? (
                                        <div className="space-y-3">
                                            {currentResult.defects.map((defect, i) => (
                                                <div
                                                    key={i}
                                                    className="p-3 rounded-md border"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-sm">
                                                            {defect.description}
                                                        </span>
                                                        <Badge
                                                            variant={getRiskBadgeVariant(
                                                                defect.severity
                                                            )}
                                                        >
                                                            {defect.severity}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-medium">
                                                            Suggested Action:{' '}
                                                        </span>
                                                        {defect.suggestedAction}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No defects found
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Risk Explanation */}
                                <div>
                                    <h3 className="font-semibold mb-2">Risk Explanation</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {currentResult.riskExplanation}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                                    <Camera className="h-12 w-12 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-lg font-medium">No Document Selected</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                    Upload a PDF, text file, or <strong>photo of a document</strong> to see AI-powered analysis results
                                </p>
                                <Button
                                    className="mt-4"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Document or Photo
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
