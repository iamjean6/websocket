import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const KpiCard = ({ title, value, trend, trendValue, icon: Icon, isDark, children }) => {
    const isPositive = trend === 'up'

    return (
        <div className="p-6 rounded-2xl border transition-all duration-300 bg-card border-border hover:border-muted-foreground/30 flex flex-col h-full text-card-foreground">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium mb-1 text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                </div>
                {Icon && (
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {trend && (
                <div className="flex items-center gap-2 mb-4">
                    <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trendValue}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
            )}

            <div className={`mt-auto flex-1 w-full min-h-[120px] rounded-lg ${!children ? 'bg-secondary/50' : ''} flex flex-col justify-end overflow-hidden`}>
                {children ? children : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                        No chart data
                    </div>
                )}
            </div>
        </div>
    )
}

export default KpiCard
