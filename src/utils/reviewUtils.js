const AVATAR_COLORS = [
  "#8B7355",
  "#6B7C3E",
  "#A67C52",
  "#5C6B73",
  "#9A7B4F",
  "#7D6B8A",
];

export function getAvatarColor(name = "") {
  const code = (name || "A").charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function getInitial(name = "") {
  const trimmed = String(name || "A").trim();
  return (trimmed[0] || "A").toUpperCase();
}

export function computeRatingStats(reviews = []) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const review of reviews) {
    const r = Math.min(5, Math.max(1, Number(review.rating) || 0));
    if (r >= 1 && r <= 5) {
      counts[r] += 1;
      sum += r;
    }
  }

  const total = reviews.length;
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

  return { counts, total, average };
}

export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  if (diffMonth < 12) return `${diffMonth}mth ago`;
  return `${diffYear}yr ago`;
}

export function truncateText(text = "", max = 120) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max).trim()}...`;
}
