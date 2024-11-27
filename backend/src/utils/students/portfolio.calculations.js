
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

// get the portfolio value
// get the transactions and current price
export const calculatePortfolioValue = (transactions, currentPrice) => {
    const sharesHeld = transactions.reduce((acc, transaction) => {
        return transaction.type === 'buy'
            ? acc + transaction.quantity
            : acc - transaction.quantity;
    }, 0);

    return sharesHeld * currentPrice;
};


export const calculateProfitLossFIFO = (transactions) => {
    const shares = []; // Array to hold shares bought
    let totalProfit = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'buy') {
            shares.push({
                quantity: transaction.quantity,
                price: transaction.price,
            });
        } else if (transaction.type === 'sell') {
            let quantityToSell = transaction.quantity;

            while (quantityToSell > 0 && shares.length > 0) {
                const { quantity, price } = shares[0];

                if (quantity > quantityToSell) {
                    // Sell part of the first entry
                    totalProfit += (transaction.price - price) * quantityToSell;
                    shares[0].quantity -= quantityToSell; // Reduce the quantity
                    quantityToSell = 0; // All sold
                } else {
                    // Sell the whole first entry
                    totalProfit += (transaction.price - price) * quantity;
                    quantityToSell -= quantity; // Reduce the amount to sell
                    shares.shift(); // Remove the entry as it's sold out
                }
            }
        }
    });

    return totalProfit;
};


