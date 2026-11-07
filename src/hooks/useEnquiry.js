import { useState, useEffect } from "react";
import { phpApi, phpRoutes } from "../lib/phpApi";

export function useEnquiry() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [enquiries, setEnquiries] = useState([]);
    const [fetching, setFetching] = useState(true);

    // ✅ Submit enquiry
    const submitEnquiry = async ({ name, email, phone, message }) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!name?.trim() || !email?.trim() || !phone?.trim() || !message?.trim()) {
            setError("All fields are required.");
            setLoading(false);
            return false;
        }

        try {
            await phpApi.post(phpRoutes.enquiries, {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                message: message.trim(),
            });
            setSuccess(true);
            setLoading(false);
            return true;
        } catch (e) {
            setError(e.message || "Failed to submit enquiry.");
            setLoading(false);
            return false;
        }
    };

    // ✅ Fetch enquiries with limit to reduce reads
    useEffect(() => {
        const fetchEnquiries = async () => {
            try {
                const res = await phpApi.get(`${phpRoutes.enquiries}?pageSize=2000`);
                const rows = Array.isArray(res?.data?.enquiries) ? res.data.enquiries : [];
                setEnquiries(rows);
                setFetching(false);
            } catch (err) {
                setError(err.message);
                setFetching(false);
            }
        };

        fetchEnquiries();
        
        // Refresh every 30 seconds instead of real-time
        const interval = setInterval(fetchEnquiries, 30000);
        
        return () => clearInterval(interval);
    }, []);

    return { loading, error, success, submitEnquiry, enquiries, fetching };
}
