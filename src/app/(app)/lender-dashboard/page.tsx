// src/app/(app)/lender-dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Landmark, Wallet, RefreshCw, SlidersHorizontal, ShieldCheck, Users } from "lucide-react";
import InsurancePoolCard from "@/components/InsurancePoolCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";


interface Loan {
    _id: string;
    amount: number;
    duration: number;
    creditScore: number;
    interestRate: number;
    borrowerIdentifier: string;
    status: "pending" | "funded" | "repaid" | "defaulted";
    anonAadhaarVerified: boolean;
    socialProofVerified: boolean;
}

interface UserProfile {
    balance: number;
}

export default function LenderDashboard() {
    const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
    const [fundedLoans, setFundedLoans] = useState<Loan[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fundingLoanId, setFundingLoanId] = useState<string | null>(null);
    const [filters, setFilters] = useState({ score: '', rate: '', amount: '' });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [pendingRes, fundedRes, profileRes] = await Promise.all([
                fetch("/api/loans/pending"),
                fetch("/api/loans/funded-by-me"),
                fetch("/api/user/profile"),
            ]);

            if (!pendingRes.ok) throw new Error("Failed to fetch pending loans.");
            if (!fundedRes.ok) throw new Error("Failed to fetch your funded loans.");
            if (!profileRes.ok) throw new Error("Failed to fetch profile data.");

            const [pendingData, fundedData, profileData] = await Promise.all([
                pendingRes.json(),
                fundedRes.json(),
                profileRes.json(),
            ]);

            setPendingLoans(pendingData);
            setFundedLoans(fundedData);
            setProfile(profileData);
        } catch (error: any) {
            toast.error("Error loading lender dashboard", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFundLoan = async (loanId: string) => {
        setFundingLoanId(loanId);
        try {
            const response = await fetch("/api/loans/fund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loanId }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Funding failed.");
            }
            toast.success("Loan funded successfully!");
            fetchData();
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setFundingLoanId(null);
        }
    };

    const filteredLoans = useMemo(() => {
        return pendingLoans.filter(loan => {
            return (
                (filters.score === '' || loan.creditScore >= parseInt(filters.score)) &&
                (filters.rate === '' || loan.interestRate >= parseInt(filters.rate)) &&
                (filters.amount === '' || loan.amount <= parseInt(filters.amount))
            );
        });
    }, [pendingLoans, filters]);

    const getRiskBadge = (score: number) => {
        if (score >= 750) return <Badge variant="secondary" className="bg-green-100 text-green-800">Low Risk</Badge>;
        if (score >= 600) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
        return <Badge variant="destructive">High Risk</Badge>;
    };

    const getTrustTier = (loan: Loan) => {
        if (loan.anonAadhaarVerified && loan.socialProofVerified) {
            return <Badge className="bg-blue-500">Tier 3</Badge>;
        }
        if (loan.anonAadhaarVerified) {
            return <Badge className="bg-blue-300 text-blue-800">Tier 2</Badge>;
        }
        return <Badge variant="outline">Tier 1</Badge>;
    }

    if (isLoading) {
        return <div className="text-white/70">Loading Lender Overview...</div>;
    }
    
    const totalFunded = fundedLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const potentialReturns = fundedLoans.reduce((sum, loan) => {
        const durationInMonths = loan.duration || 1;
        const interestFraction = loan.interestRate / 100;
        const interestEarned = loan.amount * interestFraction * (durationInMonths / 12);
        return sum + interestEarned;
    }, 0);
    const avgAnnualizedROI =
        fundedLoans.length > 0
            ? fundedLoans.reduce((sum, loan) => {
                const durationInMonths = loan.duration || 1;
                const annualizedRate = (loan.interestRate * (12 / durationInMonths));
                return sum + annualizedRate;
            }, 0) / fundedLoans.length
            : 0;

    const getStatusBadge = (status: Loan['status']) => {
        switch (status) {
            case 'funded': return <Badge variant="default" className="bg-blue-500">Active</Badge>;
            case 'repaid': return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
            case 'defaulted': return <Badge variant="destructive">Defaulted</Badge>;
            default: return <Badge variant="outline">Pending</Badge>;
        }
    };
    

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Lender Overview</h1>
                <Button onClick={fetchData} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-white/10 bg-white/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/80">Wallet Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-white/50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${profile?.balance?.toLocaleString() || "0"}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/80">Total Value Funded</CardTitle>
                        <Landmark className="h-4 w-4 text-white/50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalFunded.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/80">Potential Returns</CardTitle>
                        <TrendingUp className="h-4 w-4 text-white/50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${potentialReturns.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-white/60">
                            Avg Annualized ROI: {avgAnnualizedROI.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
                <InsurancePoolCard />
            </div>

            <Card className="border-white/10 bg-white/[0.02]">
                <CardHeader>
                    <CardTitle className="text-white/80">Loan Marketplace</CardTitle>
                    <CardDescription className="text-white/60">Browse and fund pending loan requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4 mb-4 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                        <SlidersHorizontal className="h-5 w-5 text-white/60" />
                        <Input placeholder="Min Score" value={filters.score} onChange={e => setFilters({...filters, score: e.target.value})} className="max-w-xs" />
                        <Input placeholder="Min Rate (%)" value={filters.rate} onChange={e => setFilters({...filters, rate: e.target.value})} className="max-w-xs" />
                        <Input placeholder="Max Amount ($)" value={filters.amount} onChange={e => setFilters({...filters, amount: e.target.value})} className="max-w-xs" />
                    </div>
                    {filteredLoans.length === 0 ? (
                        <p>No matching loan requests.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Borrower</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Interest</TableHead>
                                    <TableHead>Risk</TableHead>
                                    <TableHead>Trust Tier</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLoans.map((loan) => (
                                    <TableRow key={loan._id}>
                                        <TableCell className="truncate max-w-[150px]">{loan.borrowerIdentifier}</TableCell>
                                        <TableCell>${loan.amount.toLocaleString()}</TableCell>
                                        <TableCell>{loan.interestRate}%</TableCell>
                                        <TableCell>{getRiskBadge(loan.creditScore)}</TableCell>
                                        <TableCell>{getTrustTier(loan)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => handleFundLoan(loan._id)}
                                                disabled={fundingLoanId === loan._id}
                                            >
                                                {fundingLoanId === loan._id ? "Funding..." : "Fund Loan"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Portfolio</CardTitle>
                    <CardDescription>Track your funded loans.</CardDescription>
                </CardHeader>
                <CardContent>
                    {fundedLoans.length === 0 ? (
                        <p>You have not funded any loans yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Borrower</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Interest</TableHead>
                                    <TableHead>Duration</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fundedLoans.map((loan) => (
                                    <TableRow key={loan._id}>
                                        <TableCell className="truncate max-w-[150px]">{loan.borrowerIdentifier}</TableCell>
                                        <TableCell>${loan.amount.toLocaleString()}</TableCell>
                                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                        <TableCell>{loan.interestRate}%</TableCell>
                                        <TableCell>{loan.duration} months</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}