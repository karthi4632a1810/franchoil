import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import MaskImage from "../tools/MaskImage.jsx";
import useAuth from "../hooks/useAuth";
import { useReviewComments } from "../hooks/useReviewComments";
import { computeRatingStats, formatRelativeTime, getInitial } from "../utils/reviewUtils";
import "../css/reviewSection.css";

const INITIAL_REVIEWS_VISIBLE = 5;

function getAuthorName(review) {
  const name = review?.authorName || review?.userName || review?.name || "";
  if (!name || name === "Anonymous") return "Customer";
  return name;
}

export default function ReviewSection({ productId }) {
  const { user } = useAuth();
  const { reviews, loading, error, submitReview } = useReviewComments(productId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    if (user.displayName) setName(user.displayName);
    else if (user.email) setName(user.email.split("@")[0]);
    if (user.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    setShowAllReviews(false);
  }, [productId]);

  const { counts, total, average } = computeRatingStats(reviews);
  const avgRating = total > 0 ? average.toFixed(1) : "0.0";
  const hasMoreReviews = reviews.length > INITIAL_REVIEWS_VISIBLE;
  const visibleReviews = showAllReviews
    ? reviews
    : reviews.slice(0, INITIAL_REVIEWS_VISIBLE);

  const ratingBar = (star) => {
    if (total === 0) return "0%";
    return `${Math.round((counts[star] / total) * 100)}%`;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setSubmitStatus("error:Please select a rating.");
      setTimeout(() => setSubmitStatus(null), 4000);
      return;
    }
    if (!name.trim()) {
      setSubmitStatus("error:Please enter your name.");
      setTimeout(() => setSubmitStatus(null), 4000);
      return;
    }
    if (!email.trim()) {
      setSubmitStatus("error:Please enter your email address.");
      setTimeout(() => setSubmitStatus(null), 4000);
      return;
    }
    if (!message.trim()) {
      setSubmitStatus("error:Please write your review.");
      setTimeout(() => setSubmitStatus(null), 4000);
      return;
    }

    setSubmitting(true);
    const result = await submitReview({
      rating,
      message: message.trim(),
      authorName: name.trim(),
    });
    setSubmitting(false);

    if (result.ok) {
      setSubmitStatus("success:Review submitted successfully!");
      setRating(0);
      setMessage("");
      if (!user || user.isAnonymous) {
        setName("");
        setEmail("");
      }
    } else {
      setSubmitStatus(`error:${result.error || "Failed to submit review."}`);
    }
    setTimeout(() => setSubmitStatus(null), 5000);
  };

  const statusText = submitStatus?.replace(/^(success|error):/, "") || "";
  const isSuccess = submitStatus?.startsWith("success:");
  const isError = submitStatus?.startsWith("error:");

  if (loading) {
    return (
      <section id="product-reviews" className="poppins">
        <p className="text-center text-slate-500 py-10">Loading reviews…</p>
      </section>
    );
  }

  return (
    <section id="product-reviews" className="poppins w-full relative overflow-hidden my-10 py-6">
      <div className="max-w-[1200px] w-full mx-auto relative">
        {error && (
          <p className="text-red-600 text-sm mb-4" role="alert">
            {String(error)}
          </p>
        )}

        <div className="grid grid-cols-12 mt-4">
          <div className="lg:col-span-6 col-span-12 mb-10 lg:mb-0">
            <div className="grid grid-cols-12">
              <div className="col-span-4" style={{ width: "max-content" }}>
                <div className="ratings-numbers-wrapper flex flex-col gap-2 w-max">
                  <h6 className="m-0 mb-2">Ratings and Reviews</h6>
                  <div className="rating-number flex items-end gap-2 mb-3">
                    <h5 className="m-0">{avgRating}</h5>
                    <p className="m-0">/ 5</p>
                  </div>
                  <span className="m-0 p-0">({total} review{total !== 1 ? "s" : ""})</span>
                </div>
              </div>
              <div className="col-span-8">
                <div className="rating-percentage-wrapper w-full flex flex-col gap-1 sm:mt-3">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="ratings-part flex gap-1 items-center w-full h-full">
                      <MaskImage
                        url="/icon/fill-star.svg"
                        size="1.5em"
                        bg="var(--review-star)"
                        hBg="var(--review-star)"
                      />
                      <span>{star}</span>
                      <div
                        className="rating-percentage ms-1"
                        style={{ "--rating-per": ratingBar(star) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 col-span-12 flex justify-start lg:justify-end">
            <div className="top-review-wrapper">
              <h5 className="m-0">Top Reviews</h5>
              {reviews.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="top-review-content mt-2">
                  <Swiper
                    className="swiper top-review-swiper"
                    modules={[Pagination, Autoplay]}
                    loop={reviews.length > 1}
                    slidesPerView={1}
                    autoplay={{
                      delay: 2500,
                      disableOnInteraction: false,
                    }}
                    pagination={{
                      el: ".top-review-pagination",
                      clickable: true,
                    }}
                  >
                    {reviews.slice(0, 3).map((data) => (
                      <SwiperSlide key={data.id || data.createdAt}>
                        <div className="swiper-review-section p-3 px-4">
                          <div className="star-time-wrapper flex justify-between items-center">
                            <div className="star-bg" style={{ "--rate": data.rating }} />
                            <span>{formatRelativeTime(data.createdAt)}</span>
                          </div>
                          <p className="m-0 top-comment my-3">{data.message}</p>
                          <div className="rating-profile-wrapper flex items-center gap-2">
                            <div className="rating-profile upper-text flex justify-center items-center">
                              {getInitial(getAuthorName(data))}
                            </div>
                            <span>{getAuthorName(data)}</span>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                    <div className="top-review-pagination swiper-pagination" />
                  </Swiper>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 mt-20">
          <div className="lg:col-span-4 sm:col-span-8 col-span-12 mb-10 lg:mb-0">
            <div className="customer-reviews-wrapper">
              <h5 className="m-0 mb-4">Review list</h5>
              {reviews.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500">No reviews yet. Be the first to review!</p>
              ) : (
                <>
                  {visibleReviews.map((data, idx) => (
                    <div key={data.id || `review-${idx}`} className="cus-reviews flex gap-2 mb-10 pb-3">
                      <div className="rating-profile upper-text flex justify-center items-center">
                        {getInitial(getAuthorName(data))}
                      </div>
                      <div className="cus-r-details w-full">
                        <div className="start-name-wrapper flex justify-between">
                          <div className="flex flex-col">
                            <span>{getAuthorName(data)}</span>
                            <div className="star-bg" style={{ "--rate": data.rating }} />
                          </div>
                          <span className="r-time">{formatRelativeTime(data.createdAt)}</span>
                        </div>
                        <p className="m-0 top-comment my-2">{data.message}</p>
                        <div className="help-report flex gap-4 mt-3">
                          <button type="button" className="flex items-center gap-2 helpful-part">
                            <div className="help-report-icon-wrapper flex items-center justify-center">
                              <MaskImage url="/icon/help.svg" size="1em" bg="var(--p-c)" hBg="var(--p-c)" />
                            </div>
                            <span>Helpful Review</span>
                          </button>
                          <button type="button" className="flex items-center gap-2 report-part">
                            <div className="help-report-icon-wrapper flex items-center justify-center">
                              <MaskImage url="/icon/report.svg" size="1em" bg="#FF0000" hBg="#FF0000" />
                            </div>
                            <span>Report</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasMoreReviews && (
                    <button
                      type="button"
                      className="review-show-more-btn"
                      onClick={() => setShowAllReviews((prev) => !prev)}
                      aria-expanded={showAllReviews}
                    >
                      {showAllReviews
                        ? "Show less"
                        : `Show more (${reviews.length - INITIAL_REVIEWS_VISIBLE} more)`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 col-span-12">
            <div className="customer-review-submit py-4 sm:p-4">
              <h5 className="m-0 mb-4 px-4">Add a review</h5>

              <div className="add-rating-wrapper flex flex-col gap-1 px-4 mb-3 pb-2">
                <p className="m-0">
                  Add ratings<span className="text-p-c">*</span>
                </p>
                <div className="star-wrapper flex items-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`Rate ${n} stars`}>
                      <MaskImage
                        url={n <= rating ? "/icon/fill-star.svg" : "/icon/empty-star.svg"}
                        size="1.1em"
                        bg="var(--review-star)"
                        hBg="var(--review-star)"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pro-input-wrapper mt-7 px-4 flex flex-col gap-1">
                <label htmlFor="customer-name">
                  Name<span className="text-p-c">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="pro-input-wrapper mt-7 px-4 flex flex-col gap-1">
                <label htmlFor="customer-email">
                  Email Address<span className="text-p-c">*</span>
                </label>
                <input
                  id="customer-email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="pro-input-wrapper mt-7 px-4 flex flex-col gap-1">
                <label htmlFor="customer-review">
                  Write your review<span className="text-p-c">*</span>
                </label>
                <textarea
                  id="customer-review"
                  rows="3"
                  placeholder="Write your review"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="px-4 mt-7 pb-2">
                <button
                  type="button"
                  className="customer-review-submit-btn upper-text flex items-center justify-center"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "SUBMITTING…" : "SUBMIT"}
                </button>
                {statusText && (
                  <p
                    className={`mt-3 text-center text-sm ${isSuccess ? "text-green-700" : ""} ${isError ? "text-red-600" : ""}`}
                    role="alert"
                  >
                    {statusText}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
