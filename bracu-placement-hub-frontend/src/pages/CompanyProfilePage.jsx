import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function CompanyProfilePage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Review form
  const [reviewData, setReviewData] = useState({
    rating: 5,
    workCulture: 5,
    salary: 5,
    careerGrowth: 5,
    comment: "",
  });

  // Profile edit form
  const [profileEditData, setProfileEditData] = useState({
    companyName: "",
    companyIndustry: "",
    companyDescription: "",
    companyLocation: "",
    companySize: "",
  });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      fetchCompanyData();
    }
  }, [companyId, userInfo]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:1350/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setUserInfo(data.user);
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const viewingOwnProfile =
        !companyId ||
        companyId === "profile" ||
        companyId === "my-profile" ||
        (userInfo && companyId === userInfo._id);

      setIsOwnProfile(viewingOwnProfile);

      const actualCompanyId = viewingOwnProfile ? userInfo._id : companyId;
      const companyEndpoint = viewingOwnProfile
        ? "http://localhost:1350/api/company/profile"
        : `http://localhost:1350/api/company/${companyId}`;
      const reviewsEndpoint = `http://localhost:1350/api/reviews/company/${actualCompanyId}`;

      const companyResponse = await fetch(companyEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const companyData = await companyResponse.json();
      if (!companyResponse.ok) throw new Error(companyData.error || "Failed to load company");

      setCompany(companyData.company);
      setProfileEditData({
        companyName: companyData.company.companyName || "",
        companyIndustry: companyData.company.companyIndustry || "",
        companyDescription: companyData.company.companyDescription || "",
        companyLocation: companyData.company.companyLocation || "",
        companySize: companyData.company.companySize || "",
      });

      const reviewsResponse = await fetch(reviewsEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reviewsData = await reviewsResponse.json();
      if (reviewsResponse.ok) {
        setReviews(reviewsData.reviews);
        setStats(reviewsData.stats);
      }
    } catch (err) {
      console.error("Fetch company error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:1350/api/company/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileEditData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update profile");
      alert("Profile updated successfully!");
      setIsEditingProfile(false);
      fetchCompanyData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingReviewId) {
        const response = await fetch(`http://localhost:1350/api/reviews/${editingReviewId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(reviewData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to update review");
        alert("Review updated successfully!");
        setEditingReviewId(null);
      } else {
        const actualCompanyId = isOwnProfile ? userInfo._id : companyId;
        const response = await fetch("http://localhost:1350/api/reviews/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ companyId: actualCompanyId, ...reviewData }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to submit review");
        alert(data.moderated ? "Review submitted and under moderation." : "Review submitted successfully!");
      }
      setShowReviewForm(false);
      setReviewData({ rating: 5, workCulture: 5, salary: 5, careerGrowth: 5, comment: "" });
      fetchCompanyData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewData({
      rating: review.rating,
      workCulture: review.workCulture || 5,
      salary: review.salary || 5,
      careerGrowth: review.careerGrowth || 5,
      comment: review.comment || "",
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:1350/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete review");
      alert("Review deleted successfully!");
      fetchCompanyData();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderStars = (rating) => [...Array(5)].map((_, i) => (
    <span key={i} className={i < rating ? "text-yellow-500" : "text-gray-300"}>★</span>
  ));

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading company profile...</p>
      </div>
    </>
  );

  if (error || !company) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 mb-4 font-semibold">⚠️ {error || "Company not found"}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Go Back</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 hover:text-blue-800 font-semibold">← Back</button>
            {isOwnProfile && !isEditingProfile && (
              <button onClick={() => setIsEditingProfile(true)} className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">✏️ Edit Profile</button>
            )}
          </div>

          {/* Profile Edit Form */}
          {isEditingProfile && isOwnProfile && (
            <div className="bg-white p-8 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Company Profile</h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Company Name *</label>
                    <input type="text" value={profileEditData.companyName} onChange={(e) => setProfileEditData({...profileEditData, companyName: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Industry *</label>
                    <input type="text" value={profileEditData.companyIndustry} onChange={(e) => setProfileEditData({...profileEditData, companyIndustry: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Location</label>
                    <input type="text" value={profileEditData.companyLocation} onChange={(e) => setProfileEditData({...profileEditData, companyLocation: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Company Size</label>
                    <select value={profileEditData.companySize} onChange={(e) => setProfileEditData({...profileEditData, companySize: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md">
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-bold mb-2">Description</label>
                    <textarea value={profileEditData.companyDescription} onChange={(e) => setProfileEditData({...profileEditData, companyDescription: e.target.value})} rows="5" className="w-full p-3 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold">Save Changes</button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Company Info Card */}
          {!isEditingProfile && (
            <>
              <div className="bg-white p-8 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">{company.companyName || company.name}</h1>
                    {company.companyIndustry && <p className="text-lg text-gray-600">{company.companyIndustry}</p>}
                    {stats && stats.totalReviews > 0 && <p className="text-gray-600 mt-2">{stats.totalReviews} review{stats.totalReviews > 1 ? "s" : ""}</p>}
                  </div>
                  {!isOwnProfile && userInfo?.role === 'student' && (
                    <button onClick={() => setShowReviewForm(true)} className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Write Review</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {company.companyLocation && <div><p className="text-sm text-gray-600">Location</p><p className="font-semibold text-gray-800">{company.companyLocation}</p></div>}
                  {company.companySize && <div><p className="text-sm text-gray-600">Company Size</p><p className="font-semibold text-gray-800">{company.companySize}</p></div>}
                </div>
                {company.companyDescription && <div className="mt-6 pt-6 border-t"><h3 className="text-lg font-bold text-gray-800 mb-2">About</h3><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{company.companyDescription}</p></div>}
              </div>

              {/* Reviews */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Reviews</h2>
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No reviews yet. {!isOwnProfile && "Be the first to review!"}</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          {review.comment && <p className="text-gray-700">{review.comment}</p>}
                          {userInfo && review.reviewer?._id?.toString() === userInfo._id?.toString() && (
                            <div className="flex gap-2">
                              <button onClick={() => handleEditReview(review)} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-semibold hover:bg-blue-200 transition">Edit</button>
                              <button onClick={() => handleDeleteReview(review._id)} className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-xs font-semibold hover:bg-red-200 transition">Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{editingReviewId ? "Edit Review" : "Write a Review"}</h2>
              <button onClick={() => {setShowReviewForm(false); setEditingReviewId(null)}} className="text-gray-600 hover:text-gray-800 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Your Review</label>
                <textarea value={reviewData.comment} onChange={(e) => setReviewData({...reviewData, comment: e.target.value})} placeholder="Share your experience..." rows="6" className="w-full p-3 border border-gray-300 rounded-md" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">{editingReviewId ? "Update Review" : "Submit Review"}</button>
                <button type="button" onClick={() => {setShowReviewForm(false); setEditingReviewId(null)}} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CompanyProfilePage;
