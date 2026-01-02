import FinanceScoreCard from "@/components/finance-score-card"

export const metadata = {
  title: "Finance Score | Finora",
  description: "View your financial health score and insights"
}

export default function FinanceScorePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Finance Health Score</h1>
        <p className="text-muted-foreground mt-2">
          Understand your financial health with our comprehensive scoring system
        </p>
      </div>
      <FinanceScoreCard />
    </div>
  )
}
