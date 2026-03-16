import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    Shield,
    Loader2,
    RefreshCw,
    MapPin,
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { riskApi } from '@/lib/api';
import { getRiskBadgeVariant } from '@/lib/utils';
import type {
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskSummaryResponse,
    StateRiskResponse,
} from '@/types/api';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming',
];

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed-Use'];
const TRANSACTION_TYPES = ['Purchase', 'Refinance', 'Construction', 'Home Equity'];

export default function RiskDashboardPage() {
    const [summary, setSummary] = useState<RiskSummaryResponse | null>(null);
    const [stateRisks, setStateRisks] = useState<StateRiskResponse[]>([]);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
    const [isAssessing, setIsAssessing] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<RiskAssessmentResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formState, setFormState] = useState('');
    const [formCounty, setFormCounty] = useState('');
    const [formPropertyType, setFormPropertyType] = useState('');
    const [formTransactionType, setFormTransactionType] = useState('');
    const [formPurchasePrice, setFormPurchasePrice] = useState('');
    const [formLoanAmount, setFormLoanAmount] = useState('');
    const [formContext, setFormContext] = useState('');

    const loadDashboard = async () => {
        setIsLoadingDashboard(true);
        try {
            const [summaryData, stateData] = await Promise.all([
                riskApi.getSummary(),
                riskApi.getByState(),
            ]);
            setSummary(summaryData);
            setStateRisks(stateData);
        } catch {
            console.error('Failed to load dashboard data');
        } finally {
            setIsLoadingDashboard(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            await riskApi.seedData();
            await loadDashboard();
        } catch {
            setError('Failed to seed data');
        } finally {
            setIsSeeding(false);
        }
    };

    const handleAssess = async () => {
        if (!formState) {
            setError('State is required');
            return;
        }

        setIsAssessing(true);
        setError(null);
        setAssessmentResult(null);

        const request: RiskAssessmentRequest = {
            state: formState,
            county: formCounty,
            propertyType: formPropertyType,
            transactionType: formTransactionType,
            purchasePrice: Number(formPurchasePrice) || 0,
            loanAmount: Number(formLoanAmount) || 0,
            additionalContext: formContext || undefined,
        };

        try {
            const result = await riskApi.assess(request);
            setAssessmentResult(result);
        } catch {
            setError('Failed to assess risk. Is the API running?');
        } finally {
            setIsAssessing(false);
        }
    };

    // Chart data
    const doughnutData = summary
        ? {
              labels: ['High Risk', 'Medium Risk', 'Low Risk'],
              datasets: [
                  {
                      data: [summary.highRiskCount, summary.mediumRiskCount, summary.lowRiskCount],
                      backgroundColor: ['#ef4444', '#eab308', '#22c55e'],
                      borderWidth: 0,
                  },
              ],
          }
        : null;

    const topStates = [...stateRisks].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
    const barData = {
        labels: topStates.map((s) => s.stateCode),
        datasets: [
            {
                label: 'Risk Score',
                data: topStates.map((s) => s.riskScore),
                backgroundColor: topStates.map((s) =>
                    s.riskScore >= 70 ? '#ef4444' : s.riskScore >= 40 ? '#eab308' : '#22c55e'
                ),
                borderRadius: 4,
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Risk Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-powered title insurance risk analytics and assessment
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadDashboard}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSeedData}
                        disabled={isSeeding}
                    >
                        {isSeeding ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <BarChart3 className="h-4 w-4 mr-1" />
                        )}
                        {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoadingDashboard ? (
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
                ) : summary ? (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.totalRecords}</div>
                                <p className="text-xs text-muted-foreground">
                                    Title insurance records analyzed
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.averageRiskScore.toFixed(1)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Out of 100 (lower is better)
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {summary.highRiskCount}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Records flagged as high risk
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Claim Rate</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(summary.claimRate * 100).toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {summary.claimCount} claims out of {summary.totalRecords}
                                </p>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className="col-span-full">
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                                No data available. Click "Seed Demo Data" to populate the dashboard.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Risk Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Risk Distribution</CardTitle>
                                <CardDescription>
                                    Breakdown by risk level
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {doughnutData ? (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <Doughnut
                                            data={doughnutData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: 'bottom' },
                                                },
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <p className="text-sm text-muted-foreground">
                                            No data to display
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Top Risk States</CardTitle>
                                <CardDescription>
                                    Highest risk scores by state
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {topStates.length > 0 ? (
                                    <div className="h-[250px]">
                                        <Bar
                                            data={barData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false },
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        max: 100,
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <p className="text-sm text-muted-foreground">
                                            No data to display
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* State Risk Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Risk by State
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stateRisks.length > 0 ? (
                                <ScrollArea className="h-[300px]">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-background">
                                            <tr className="border-b">
                                                <th className="text-left py-2 font-medium">State</th>
                                                <th className="text-right py-2 font-medium">Risk Score</th>
                                                <th className="text-right py-2 font-medium">Files</th>
                                                <th className="text-right py-2 font-medium">Claims</th>
                                                <th className="text-right py-2 font-medium">Claim Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stateRisks
                                                .sort((a, b) => b.riskScore - a.riskScore)
                                                .map((state) => (
                                                    <tr key={state.stateCode} className="border-b">
                                                        <td className="py-2">
                                                            <span className="font-medium">
                                                                {state.stateCode}
                                                            </span>{' '}
                                                            <span className="text-muted-foreground">
                                                                {state.state}
                                                            </span>
                                                        </td>
                                                        <td className="text-right py-2">
                                                            <Badge
                                                                variant={getRiskBadgeVariant(
                                                                    state.riskScore >= 70
                                                                        ? 'High'
                                                                        : state.riskScore >= 40
                                                                          ? 'Medium'
                                                                          : 'Low'
                                                                )}
                                                            >
                                                                {state.riskScore.toFixed(1)}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-right py-2">
                                                            {state.totalFiles}
                                                        </td>
                                                        <td className="text-right py-2">
                                                            {state.claimCount}
                                                        </td>
                                                        <td className="text-right py-2">
                                                            {(state.claimRate * 100).toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No state data available
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Risk Assessment Form */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">AI Risk Assessment</CardTitle>
                            <CardDescription>
                                Get an AI-powered risk assessment for a property transaction
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>State *</Label>
                                <Select value={formState} onValueChange={setFormState}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {US_STATES.map((state) => (
                                            <SelectItem key={state} value={state}>
                                                {state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>County</Label>
                                <Input
                                    value={formCounty}
                                    onChange={(e) => setFormCounty(e.target.value)}
                                    placeholder="e.g. Harris County"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Property Type</Label>
                                <Select
                                    value={formPropertyType}
                                    onValueChange={setFormPropertyType}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Transaction Type</Label>
                                <Select
                                    value={formTransactionType}
                                    onValueChange={setFormTransactionType}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRANSACTION_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Purchase Price</Label>
                                    <Input
                                        type="number"
                                        value={formPurchasePrice}
                                        onChange={(e) => setFormPurchasePrice(e.target.value)}
                                        placeholder="350000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Loan Amount</Label>
                                    <Input
                                        type="number"
                                        value={formLoanAmount}
                                        onChange={(e) => setFormLoanAmount(e.target.value)}
                                        placeholder="280000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Additional Context</Label>
                                <Textarea
                                    value={formContext}
                                    onChange={(e) => setFormContext(e.target.value)}
                                    placeholder="Any additional details about the transaction..."
                                    rows={2}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleAssess}
                                disabled={isAssessing}
                            >
                                {isAssessing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Shield className="h-4 w-4 mr-2" />
                                )}
                                {isAssessing ? 'Assessing...' : 'Assess Risk'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Assessment Result */}
                    {assessmentResult && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Assessment Result</CardTitle>
                                    <Badge
                                        variant={getRiskBadgeVariant(assessmentResult.overallRisk)}
                                        className="text-sm"
                                    >
                                        {assessmentResult.overallRisk} Risk (
                                        {assessmentResult.riskScore.toFixed(0)}/100)
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    {assessmentResult.summary}
                                </p>

                                <Separator />

                                <div>
                                    <h4 className="font-medium text-sm mb-2">Risk Factors</h4>
                                    <div className="space-y-2">
                                        {assessmentResult.riskFactors.map((factor, i) => (
                                            <div
                                                key={i}
                                                className="p-2 rounded-md bg-muted text-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">
                                                        {factor.category}
                                                    </span>
                                                    <Badge
                                                        variant={getRiskBadgeVariant(factor.impact)}
                                                    >
                                                        {factor.impact}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground mt-1">
                                                    {factor.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                                    <ul className="space-y-1">
                                        {assessmentResult.recommendations.map((rec, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-muted-foreground flex items-start gap-2"
                                            >
                                                <span className="text-primary mt-0.5">•</span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
