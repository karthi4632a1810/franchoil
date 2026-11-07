import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { phpApi, phpRoutes } from "../lib/phpApi";

const useUser = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        todayUsers: 0,
        yesterdayUsers: 0,
        thisWeekUsers: 0,
        thisMonthUsers: 0,
        thisYearUsers: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsersAndDashboard = async () => {
            try {
                const res = await phpApi.get(`${phpRoutes.users}?pageSize=5000`);
                const usersList = Array.isArray(res?.data?.users) ? res.data.users : [];
                let total = 0;
                let active = 0;
                let inactive = 0;
                let today = 0;
                let yesterday = 0;
                let thisWeek = 0;
                let thisMonth = 0;
                let thisYear = 0;

                const now = new Date();

                // Today 00:00
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);

                // Yesterday 00:00 and 23:59
                const yesterdayStart = new Date(todayStart);
                yesterdayStart.setDate(yesterdayStart.getDate() - 1);
                const yesterdayEnd = new Date(todayStart);

                // This week (start from Monday)
                const weekStart = new Date(now);
                const dayOfWeek = weekStart.getDay(); // Sunday = 0
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // shift to Monday
                weekStart.setDate(weekStart.getDate() - diff);
                weekStart.setHours(0, 0, 0, 0);

                // This month
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                // This year
                const yearStart = new Date(now.getFullYear(), 0, 1);

                usersList.forEach(data => {
                    total++;
                    if (data.blocked) {
                        inactive++;
                    } else {
                        active++;
                    }

                    if (data.createdAt) {
                        const createdDate = new Date(data.createdAt);
                        if (Number.isNaN(createdDate.getTime())) return;

                        if (createdDate >= todayStart) today++;
                        if (createdDate >= yesterdayStart && createdDate < yesterdayEnd) {
                            yesterday++;
                        }
                        if (createdDate >= weekStart) thisWeek++;
                        if (createdDate >= monthStart) thisMonth++;
                        if (createdDate >= yearStart) thisYear++;
                    }
                });

                setUserData(usersList);
                setStats({
                    totalUsers: total,
                    activeUsers: active,
                    inactiveUsers: inactive,
                    todayUsers: today,
                    yesterdayUsers: yesterday,
                    thisWeekUsers: thisWeek,
                    thisMonthUsers: thisMonth,
                    thisYearUsers: thisYear,

                });
            } catch (error) {
                console.error('Error fetching users/dashboard:', error);
                setUserData([]);
                setStats({
                    totalUsers: 0,
                    activeUsers: 0,
                    inactiveUsers: 0,
                    todayUsers: 0,
                    yesterdayUsers: 0,
                    thisWeekUsers: 0,
                    thisMonthUsers: 0,
                    thisYearUsers: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchUsersAndDashboard();
        }
    }, [user]);

    const toggleBlockUser = async (id, blocked) => {
        await phpApi.patch(`/api/users/${id}/block`, { blocked });
    };

    return { userData, stats, loading, toggleBlockUser };
};

export default useUser;
