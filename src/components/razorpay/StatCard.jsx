import { Card, CardContent } from "../ui/card";

export function StatCard({ title, value, icon: Icon, subtitle }) {
    return (
        <Card className="relative overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-700/5 rounded-full -translate-y-8 translate-x-8" />
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-green-700/10">
                        <Icon className="h-5 w-5 text-green-700" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
