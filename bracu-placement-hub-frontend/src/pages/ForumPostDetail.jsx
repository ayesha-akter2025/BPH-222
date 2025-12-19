import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function ForumPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchPostWithComments();
  }, [postId]);

  const fetchPostWithComments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/forum/posts/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load post");
      }

      setPost(data.post);
      setComments(data.comments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:1350/api/forum/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPostWithComments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/forum/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: commentText }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post comment");
      }

      setCommentText("");
      fetchPostWithComments();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error || "Post not found"}</p>
          <button
            onClick={() => navigate("/forum")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/forum")}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Back to Forum
        </button>

        {/* Post Card */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {post.category}
            </span>
            {post.flagged && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                Flagged
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
            <span>by {post.author?.name || "Anonymous"}</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>

          <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
            {post.content}
          </p>

          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold transition"
            >
              ❤️ {post.likes?.length || 0} Likes
            </button>
            <span className="text-gray-600">💬 {comments.length} Comments</span>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add a Comment</h2>
          <form onSubmit={handleComment}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-md mb-3"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              Post Comment
            </button>
          </form>
        </div>

        {/* Comments List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Comments ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-800">
                      {comment.author?.name || "Anonymous"}
                    </p>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {comment.flagged && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default ForumPostDetail;
