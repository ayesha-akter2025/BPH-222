
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function ForumPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    category: "General",
  });

  const categories = ["Interview Tips", "Job Search", "Career Advice", "General"];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url =
        selectedCategory === "all"
          ? "http://localhost:1350/api/forum/posts"
          : `http://localhost:1350/api/forum/posts?category=${selectedCategory}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch posts");
      }

      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:1350/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      if (data.moderated) {
        alert("Your post has been created and is under moderation.");
      } else {
        alert("Post created successfully!");
      }

      setShowCreatePost(false);
      setPostData({ title: "", content: "", category: "General" });
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/forum/posts/${postId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to like post");
      }

      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              💬 Community Forum
            </h1>
            <p className="text-gray-600">
              Share tips, ask questions, and connect with the community
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              ✏️ New Post
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold"
            >
              Back
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-md font-semibold transition ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="text-gray-600 hover:text-gray-800 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">
                    Category
                  </label>
                  <select
                    value={postData.category}
                    onChange={(e) =>
                      setPostData({ ...postData, category: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={postData.title}
                    onChange={(e) =>
                      setPostData({ ...postData, title: e.target.value })
                    }
                    placeholder="Enter post title"
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-bold mb-2">
                    Content *
                  </label>
                  <textarea
                    value={postData.content}
                    onChange={(e) =>
                      setPostData({ ...postData, content: e.target.value })
                    }
                    placeholder="What's on your mind?"
                    rows="8"
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  >
                    Create Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreatePost(false)}
                    className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posts List */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <p className="text-xl text-gray-600">No posts in this category yet</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              Be the first to post!
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/forum/posts/${post._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {post.category}
                      </span>
                      {post.flagged && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                          Flagged
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-700 line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>by {post.author?.name || "Anonymous"}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePost(post._id);
                        }}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        ❤️ {post.likes?.length || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default ForumPage;
