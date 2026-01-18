import FinanceScoreCard from "@/components/finance-score-card"

export const metadata = {
  title: "Finance Score | Finora",
  description: "View your financial health score and insights"
}

export default function FinanceScorePage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Finance Health Score</h1>
        <p className="page-subtitle">Understand your financial health with our comprehensive scoring system</p>
      </div>
      <FinanceScoreCard />
    </div>
  )
}
