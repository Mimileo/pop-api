// Calculate portfolio diversification (e.g., number of unique stocks)
export const calculateDiversification = (transactions) => {
    const uniqueStocks = new Set(transactions.map(t => t.stock_id));
    return uniqueStocks.size;
};

// Calculate Sharpe Ratio (this is a simplified version based on portfolio return and risk)
export const calculateSharpeRatio = (transactions) => {
    const returns = transactions.map(t => t.price * t.quantity); // Simplified returns

    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);

    const riskFreeRate = 0.01; // Assuming a 1% risk-free rate for simplicity
    return (avgReturn - riskFreeRate) / stdDev;
};
