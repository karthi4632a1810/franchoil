import { Search, Filter } from "lucide-react";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

export function SearchFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    cityFilter,
    onCityChange,
    uniqueCities = [],
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Order ID, Name, Email, or Phone..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-card border-border/50 focus-visible:ring-green-700/30"
                />
            </div>
            <div className="relative w-full sm:w-[200px]">
                <Select value={cityFilter} onValueChange={onCityChange}>
                    <SelectTrigger className="w-full bg-card border-border/50 focus:ring-green-700/30">
                        <SelectValue placeholder="Filter by City" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All Cities</SelectItem>
                        {uniqueCities.map((city) => (
                            <SelectItem key={city} value={city}>
                                {city}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-[140px] bg-card border-border/50 focus:ring-green-700/30">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="trash">Trash (Deleted)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
