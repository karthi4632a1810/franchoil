import { useState, useMemo } from "react";
import { MessageSquare, Search, Mail, Phone, User, Calendar, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { useEnquiry } from "../../hooks/useEnquiry";

export default function Enquiry() {
    const { enquiries, fetching } = useEnquiry();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Filter enquiries based on search
    const filteredEnquiries = useMemo(() => {
        if (!searchQuery) return enquiries;

        const query = searchQuery.toLowerCase();
        return enquiries.filter(
            (enquiry) =>
                enquiry.name?.toLowerCase().includes(query) ||
                enquiry.email?.toLowerCase().includes(query) ||
                enquiry.phone?.toLowerCase().includes(query) ||
                enquiry.message?.toLowerCase().includes(query)
        );
    }, [enquiries, searchQuery]);

    const formatDate = (timestamp) => {
        if (!timestamp) return "—";
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (error) {
            return "—";
        }
    };

    return (
        <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            Enquiry Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            View and manage all customer enquiries
                        </p>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-border/50 shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Enquiries</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{enquiries.length}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-green-700/10">
                                    <MessageSquare className="h-5 w-5 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{filteredEnquiries.length}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-green-700/10">
                                    <Search className="h-5 w-5 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card className="border-border/50 shadow-md">
                    <CardContent className="p-5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, phone, or message..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-card border-border/50 focus-visible:ring-green-700/30"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Enquiries Table */}
                <Card className="border-border/50 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">All Enquiries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {fetching ? (
                            <div className="flex items-center justify-center py-12">
                                <p className="text-muted-foreground">Loading enquiries...</p>
                            </div>
                        ) : filteredEnquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-lg font-medium">No enquiries found</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {searchQuery ? "Try adjusting your search query" : "No enquiries have been submitted yet"}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Message</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEnquiries.map((enquiry) => (
                                            <TableRow key={enquiry.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{enquiry.name || "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{enquiry.email || "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{enquiry.phone || "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div 
                                                        className="max-w-md cursor-pointer hover:text-green-700 transition-colors"
                                                        onClick={() => setSelectedMessage(enquiry)}
                                                    >
                                                        <p className="text-sm line-clamp-2">{enquiry.message || "—"}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{formatDate(enquiry.createdAt)}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Message Popup Modal */}
                {selectedMessage && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedMessage(null)}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-600" />
                            </button>
                            
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">Message Details</h2>
                                    <div className="border-b border-gray-200 pb-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{selectedMessage.name || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{selectedMessage.email || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{selectedMessage.phone || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{formatDate(selectedMessage.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Message</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedMessage.message || "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
