import { useEffect, useMemo } from "react";
import { firestore as db } from "../firebase/config";
import {
    collection as fsCollection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { useCollection, query as fsQuery } from "./useFirestore";

const VISITS_COLLECTION = "pageVisits";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Session-level dedup key stored in sessionStorage
const VISITED_KEY = "fg_visited_paths";

function getSessionVisited() {
    try { return new Set(JSON.parse(sessionStorage.getItem(VISITED_KEY) || "[]")); }
    catch { return new Set(); }
}
function markSessionVisited(path) {
    const visited = getSessionVisited();
    visited.add(path);
    try { sessionStorage.setItem(VISITED_KEY, JSON.stringify([...visited])); } catch { /* quota */ }
}

// Hook to track page visits
export function useVisitTracker() {
    const trackVisit = (pagePath) => {
        const path = pagePath || window.location.pathname;

        // Skip if already tracked this path in current session
        if (getSessionVisited().has(path)) return;
        markSessionVisited(path);

        // Defer write so route-change rendering finishes first
        const doWrite = async () => {
            try {
                const now = new Date();
                await addDoc(fsCollection(db, VISITS_COLLECTION), {
                    pagePath: path,
                    timestamp: serverTimestamp(),
                    createdAt: Timestamp.fromDate(now),
                });
            } catch (error) {
                console.error("Error tracking visit:", error);
            }
        };

        // Use requestIdleCallback if available, else defer 1.5s
        if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(doWrite, { timeout: 3000 });
        } else {
            setTimeout(doWrite, 1500);
        }
    };

    // Clean up old data (older than 24 hours)
    const cleanupOldData = async () => {
        try {
            const cutoffTime = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
            const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

            // Query by createdAt field for consistency
            const q = query(
                fsCollection(db, VISITS_COLLECTION),
                where("createdAt", "<", cutoffTimestamp)
            );

            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map((docSnapshot) =>
                deleteDoc(doc(db, VISITS_COLLECTION, docSnapshot.id))
            );

            await Promise.all(deletePromises);
            if (snapshot.docs.length > 0) {
                // console.log(`Cleaned up ${snapshot.docs.length} old visit records`);
            }
        } catch (error) {
            console.error("Error cleaning up old visits:", error);
        }
    };

    return { trackVisit, cleanupOldData };
}

// Hook to get visit statistics (last 24 hours only)
export function useVisitStatistics() {
    const now = useMemo(() => new Date(), []);
    const twentyFourHoursAgo = useMemo(
        () => new Date(now.getTime() - TWENTY_FOUR_HOURS_MS),
        [now]
    );

    const visitsQuery = useMemo(() => {
        const cutoffTimestamp = Timestamp.fromDate(twentyFourHoursAgo);
        // Query by createdAt field which we store as Timestamp
        // Note: This requires a Firestore composite index on (createdAt)
        // If index is missing, Firestore will show an error with a link to create it
        return fsQuery(
            fsCollection(db, VISITS_COLLECTION),
            where("createdAt", ">=", cutoffTimestamp),
            orderBy("createdAt", "desc")
        );
    }, [twentyFourHoursAgo]);

    const { data: visits, loading, error } = useCollection(visitsQuery);

    // Calculate statistics (filter to last 24 hours in case query doesn't filter)
    const stats = useMemo(() => {
        if (!visits || visits.length === 0) {
            return {
                totalVisits: 0,
                uniquePages: 0,
                pageCounts: {},
                hourlyVisits: {},
            };
        }

        const pageCounts = {};
        const hourlyVisits = {};
        const uniquePagesSet = new Set();
        const now = new Date();
        const cutoffTime = now.getTime() - TWENTY_FOUR_HOURS_MS;

        // Filter visits to last 24 hours and calculate stats
        const recentVisits = visits.filter((visit) => {
            let visitDate;
            if (visit.createdAt?.toDate) {
                visitDate = visit.createdAt.toDate();
            } else if (visit.timestamp?.toDate) {
                visitDate = visit.timestamp.toDate();
            } else if (visit.createdAt) {
                visitDate = visit.createdAt instanceof Date
                    ? visit.createdAt
                    : new Date(visit.createdAt);
            } else {
                return false; // Skip if no valid date
            }

            // Check if within last 24 hours
            return visitDate.getTime() >= cutoffTime;
        });

        // Calculate statistics from filtered visits
        recentVisits.forEach((visit) => {
            const pagePath = visit.pagePath || "Unknown";
            uniquePagesSet.add(pagePath);

            // Count visits per page
            pageCounts[pagePath] = (pageCounts[pagePath] || 0) + 1;

            // Count visits per hour
            let visitDate;
            if (visit.createdAt?.toDate) {
                visitDate = visit.createdAt.toDate();
            } else if (visit.timestamp?.toDate) {
                visitDate = visit.timestamp.toDate();
            } else {
                return; // Skip if no valid date
            }

            const hour = visitDate.getHours();
            const hourKey = `${hour}:00`;
            hourlyVisits[hourKey] = (hourlyVisits[hourKey] || 0) + 1;
        });

        // Sort pages by visit count
        const sortedPages = Object.entries(pageCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10); // Top 10 pages

        return {
            totalVisits: recentVisits.length,
            uniquePages: uniquePagesSet.size,
            pageCounts: Object.fromEntries(sortedPages),
            hourlyVisits,
            allVisits: recentVisits,
        };
    }, [visits]);

    return { stats, loading, error };
}

