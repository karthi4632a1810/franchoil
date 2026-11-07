import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useBlogs } from "../hooks/useBlogs.js";
import { motion } from "framer-motion";

// Reusable function to format hashtags (#text#), custom links ([Text:URL]) and newlines (\n)
const formatBlogContent = (content, index) => {
    // Normalize and split content — this preserves bold, link, and newline segments
    const parts = content
        .replace(/\r\n/g, "\n") // Normalize Windows newlines
        .split(/(#.*?#|\[.*?:https?:\/\/[^\]]+\]|\n)/g);
    // console.log(parts)
    return (
        <span key={index} className="mb-4 leading-relaxed">
            {parts.map((part, i) => {
                // Handle newline
                if (part === "\n") {
                    return <br key={i} />;
                }

                // Handle bold text (#text#)
                if (/^#(.+?)#$/.test(part)) {
                    const text = part.replace(/^#|#$/g, "");
                    return (
                        <strong key={i} className="font-semibold">
                            {text}
                        </strong>
                    );
                }

                // Handle links ([Text:URL])
                const linkMatch = part.match(/^\[(.+?):(https?:\/\/[^\]]+)\]$/);
                if (linkMatch) {
                    const [, text, url] = linkMatch;
                    return (
                        <a
                            key={i}
                            href={url}
                            className="text-green-600 hover:text-green-800 underline transition-colors duration-200"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {text}
                        </a>
                    );
                }

                // Default plain text
                return part;
            })}
        </span>
    );
};



export default function Blog() {
    const { slug } = useParams();
    const { blogs, loading, error } = useBlogs({ onlyActive: true });
    const [selectedBlog, setSelectedBlog] = useState(null);

    useEffect(() => {
        if (blogs && slug) {
            const blog = blogs.find((b) => b.slug === slug);
            setSelectedBlog(blog || null);
        } else if (blogs && !slug) {
            setSelectedBlog(blogs[0] || null);
        }
    }, [blogs, slug]);

    useEffect(() => {
        document.title = selectedBlog
            ? `${selectedBlog.title} - Franch Global`
            : "Blog - Franch Global";
        const descriptionMetaTag = document.querySelector('meta[name="description"]');
        if (descriptionMetaTag) {
            descriptionMetaTag.setAttribute(
                "content",
                selectedBlog?.description || "Read the latest articles and updates from Franch Global."
            );
        }
    }, [selectedBlog]);

    const renderBlock = (block, index) => {
        switch (block.type) {
            case "h1":
                return (
                    <motion.h1
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-extrabold text-green-700 mb-6"
                    >
                        {formatBlogContent(block.content, index)}
                    </motion.h1>
                );
            case "h2":
                return (
                    <motion.h2
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-xl font-semibold text-gray-800 mb-4"
                    >
                        {formatBlogContent(block.content, index)}
                    </motion.h2>
                );
            case "h3":
                return (
                    <motion.h3
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg font-medium text-gray-700 mb-3"
                    >
                        {formatBlogContent(block.content, index)}
                    </motion.h3>
                );
            case "p":
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mb-5"
                    >
                        {formatBlogContent(block.content, index)}
                    </motion.div>
                );
            case "list":
                return (
                    <motion.ul
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-gray-700 mb-6 leading-relaxed text-base ps-6 list-disc"
                    >
                        {block.content.split("\n").map((item, i) => (
                            <li key={i} className="mb-2">
                                {formatBlogContent(item, i)}
                            </li>
                        ))}
                    </motion.ul>
                );
            case "image":
                return block.content ? (
                    <motion.img
                        key={index}
                        src={block.content}
                        alt={selectedBlog.title}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-auto max-h-96 object-cover rounded-lg mb-6 shadow-lg"
                    />
                ) : null;
            default:
                return null;
        }
    };

    if (loading)
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-green-600 py-10 text-lg"
            >
                Loading...
            </motion.div>
        );
    if (error)
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-red-600 py-10 text-lg"
            >
                Error: {String(error)}
            </motion.div>
        );
    if (!selectedBlog)
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-green-600 py-10 text-lg"
            >
                No blog found.
            </motion.div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 text-gray-800 font-sans">
            <main className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-12">
                <motion.article
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl p-8 shadow-xl"
                >
                    {selectedBlog.mainImage && (
                        <motion.img
                            src={selectedBlog.mainImage}
                            alt={selectedBlog.title}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7 }}
                            className="w-full h-auto object-cover rounded-xl mb-8 shadow-md"
                        />
                    )}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-600 mb-6 text-sm"
                    >
                        Category:{" "}
                        <span className="font-semibold text-green-600">
                            {selectedBlog.category || "Uncategorized"}
                        </span>
                    </motion.p>
                    <div className="prose prose-green max-w-none">
                        {selectedBlog.body.map((block, index) => renderBlock(block, index))}
                    </div>
                </motion.article>

                <aside className="mt-12">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl font-bold text-green-700 mb-6"
                    >
                        Explore More Blogs
                    </motion.h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs
                            .filter((b) => b.slug !== slug)
                            .slice(0, 3)
                            .map((b) => (
                                <motion.div
                                    key={b.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 * (b.id % 3) }}
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300"
                                >
                                    {b.mainImage && (
                                        <img
                                            src={b.mainImage}
                                            alt={b.title}
                                            className="w-full h-40 object-cover rounded-t-lg mb-4"
                                        />
                                    )}
                                    <div>
                                        <Link
                                            to={`/blog/${b.slug}`}
                                            className="text-green-700 hover:text-green-500 font-semibold text-lg"
                                        >
                                            {b.title}
                                        </Link>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {b.category || "Uncategorized"}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </aside>
            </main>
        </div>
    );
}