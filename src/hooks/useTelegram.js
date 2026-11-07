import { useState, useCallback } from "react";
import { phpApi } from "../lib/phpApi";

/**
 * Hook for sending messages to Telegram group
 * @returns {Object} Object containing sendMessage function and loading/error states
 */
export default function useTelegram() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Send a text message to the Telegram group
     * @param {string} message - The message text to send
     * @param {Object} options - Optional parameters
     * @param {string} options.parseMode - Parse mode: 'HTML', 'Markdown', or 'MarkdownV2'
     * @param {boolean} options.disableWebPagePreview - Disable web page preview
     * @returns {Promise<Object>} Response from Telegram API
     */
    const sendMessage = useCallback(async (message, options = {}) => {
        if (!message || typeof message !== "string") {
            const error = new Error("Message must be a non-empty string");
            setError(error);
            throw error;
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await phpApi.post("/api/functions/telegramSend", {
                message,
                parse_mode: options.parseMode || "HTML",
                disable_web_page_preview: Boolean(options.disableWebPagePreview),
            });
            if (!data?.success) {
                throw new Error(
                    data?.error || "Telegram API error"
                );
            }

            setLoading(false);
            return data?.data;
        } catch (err) {
            const errorMessage = err.message || "Failed to send message to Telegram";
            setError(err);
            setLoading(false);
            console.error("Telegram send error:", err);
            throw err;
        }
    }, []);

    /**
     * Send a formatted message with HTML
     * @param {string} message - The HTML formatted message
     * @returns {Promise<Object>} Response from Telegram API
     */
    const sendHTMLMessage = useCallback(
        async (message) => {
            return sendMessage(message, { parseMode: "HTML" });
        },
        [sendMessage]
    );

    /**
     * Send a formatted message with Markdown
     * @param {string} message - The Markdown formatted message
     * @returns {Promise<Object>} Response from Telegram API
     */
    const sendMarkdownMessage = useCallback(
        async (message) => {
            return sendMessage(message, { parseMode: "Markdown" });
        },
        [sendMessage]
    );

    /**
     * Send data as a formatted message (useful for structured data)
     * @param {Object} data - Data object to send
     * @param {string} title - Optional title for the message
     * @returns {Promise<Object>} Response from Telegram API
     */
    const sendData = useCallback(
        async (data, title = null) => {
            let message = "";

            if (title) {
                message += `<b>${title}</b>\n\n`;
            }

            // Format data as HTML
            if (typeof data === "object") {
                message += formatObjectAsHTML(data);
            } else {
                message += String(data);
            }

            return sendHTMLMessage(message);
        },
        [sendHTMLMessage]
    );

    /**
     * Format an object as HTML for Telegram
     * @param {Object} obj - Object to format
     * @param {number} indent - Indentation level
     * @returns {string} Formatted HTML string
     */
    const formatObjectAsHTML = (obj, indent = 0) => {
        let result = "";
        const indentStr = "  ".repeat(indent);

        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) {
                result += `${indentStr}<b>${key}:</b> <i>null</i>\n`;
            } else if (typeof value === "object" && !Array.isArray(value)) {
                result += `${indentStr}<b>${key}:</b>\n${formatObjectAsHTML(value, indent + 1)}`;
            } else if (Array.isArray(value)) {
                result += `${indentStr}<b>${key}:</b> [${value.length} items]\n`;
                value.forEach((item, index) => {
                    if (typeof item === "object") {
                        result += `${indentStr}  [${index}]:\n${formatObjectAsHTML(item, indent + 2)}`;
                    } else {
                        result += `${indentStr}  [${index}]: ${item}\n`;
                    }
                });
            } else {
                result += `${indentStr}<b>${key}:</b> ${escapeHTML(String(value))}\n`;
            }
        }

        return result;
    };

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    const escapeHTML = (text) => {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    return {
        sendMessage,
        sendHTMLMessage,
        sendMarkdownMessage,
        sendData,
        loading,
        error,
    };
}

