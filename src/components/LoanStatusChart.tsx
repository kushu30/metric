"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the Loan type, matching the one in the dashboard
interface Loan {
  status: "pending" | "funded" | "repaid" | "defaulted";
  [key: string]: any; // Allow other properties
}

interface LoanStatusChartProps {
  loans: Loan[];
}

export default function LoanStatusChart({ loans }: LoanStatusChartProps) {
  // Process the loan data to count statuses
  const statusCounts = loans.reduce((acc, loan) => {
    acc[loan.status] = (acc[loan.status] || 0) + 1;
    return acc;
  }, {} as Record<Loan["status"], number>);
  
  const chartData = [
    { name: "Pending", count: statusCounts.pending || 0 },
    { name: "Funded", count: statusCounts.funded || 0 },
    { name: "Repaid", count: statusCounts.repaid || 0 },
    { name: "Defaulted", count: statusCounts.defaulted || 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan History Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Number of Loans" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}