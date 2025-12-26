import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetchUserData();
    fetchNotificationCount();
    fetchMessageCount();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:1350/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:1350/api/notifications/unread-count",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setUnreadNotifications(data.count);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchMessageCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:1350/api/messages/unread/count",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setUnreadMessages(data.count);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path
      ? "bg-blue-700 text-white"
      : "text-blue-100 hover:bg-blue-700 hover:text-white";
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="text-white text-xl font-bold hover:text-blue-100 transition"
            >
              🎓 BRACU Placement Hub
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Student Navigation */}
            {user.role === "student" && (
              <>
                <button
                  onClick={() => navigate(`/profile/view/${user.userId}`)}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    `/profile/view/${user.userId}`
                  )}`}
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => navigate("/jobs")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/jobs"
                  )}`}
                >
                  💼 Find Jobs
                </button>
                <button
                  onClick={() => navigate("/invitations")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/invitations"
                  )}`}
                >
                  📧 Invitations
                </button>
                <button
                  onClick={() => navigate("/messages")}
                  className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                    "/messages"
                  )}`}
                >
                  💬 Messages
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate("/forum")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/forum"
                  )}`}
                >
                  💭 Forum
                </button>
                <button
                  onClick={() => navigate("/calendar")}
                  className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                    "/calendar"
                  )}`}
                >
                  📅 Calendar
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    ⭐
                  </span>
                </button>
              </>
            )}

            {/* Recruiter Navigation */}
            {user.role === "recruiter" && (
              <>
                <button
                  onClick={() => navigate("/recruiter/dashboard")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/recruiter/dashboard"
                  )}`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => navigate("/recruiter/jobs/create")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/recruiter/jobs/create"
                  )}`}
                >
                  ➕ Post Job
                </button>
                <button
                  onClick={() => navigate("/recruiter/talent-search")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/recruiter/talent-search"
                  )}`}
                >
                  🔍 Find Talent
                </button>
                <button
                  onClick={() => navigate("/messages")}
                  className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                    "/messages"
                  )}`}
                >
                  💬 Messages
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate("/forum")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/forum"
                  )}`}
                >
                  💭 Forum
                </button>
                <button
                  onClick={() => navigate("/calendar")}
                  className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                    "/calendar"
                  )}`}
                >
                  📅 Calendar
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    ⭐
                  </span>
                </button>
              </>
            )}

            {/* Admin Navigation */}
            {user.role === "admin" && (
              <>
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/admin/dashboard"
                  )}`}
                >
                  🛡️ Admin Panel
                </button>
                <button
                  onClick={() => navigate("/jobs")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/jobs"
                  )}`}
                >
                  💼 All Jobs
                </button>
                <button
                  onClick={() => navigate("/forum")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/forum"
                  )}`}
                >
                  💭 Forum
                </button>
                <button
                  onClick={() => navigate("/calendar")}
                  className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                    "/calendar"
                  )}`}
                >
                  📅 Calendar
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    ⭐
                  </span>
                </button>
              </>
            )}

            {/* Notifications */}
            <button
              onClick={() => navigate("/notifications")}
              className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                "/notifications"
              )}`}
            >
              🔔
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative ml-3">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 text-white hover:text-blue-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold">{user.name}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-semibold text-gray-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {user.role}
                      </p>
                    </div>
                    {user.role === "student" && (
                      <>
                        <button
                          onClick={() => {
                            navigate(`/profile/view/${user.userId}`);
                            setShowProfileDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/profile/edit");
                            setShowProfileDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit Profile
                        </button>
                      </>
                    )}
                    {user.role === "recruiter" && (
                      <button
                        onClick={() => {
                          navigate("/company/profile");
                          setShowProfileDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Company Profile
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-white hover:text-blue-100 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {showMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {/* Student Mobile Nav */}
              {user.role === "student" && (
                <>
                  <button
                    onClick={() => {
                      navigate(`/profile/view/${user.userId}`);
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      `/profile/view/${user.userId}`
                    )}`}
                  >
                    👤 Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/jobs");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/jobs"
                    )}`}
                  >
                    💼 Find Jobs
                  </button>
                  <button
                    onClick={() => {
                      navigate("/invitations");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/invitations"
                    )}`}
                  >
                    📧 Invitations
                    {unreadNotifications > 0 && (
                      <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      navigate("/messages");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/messages"
                    )}`}
                  >
                    💬 Messages
                    {unreadMessages > 0 && (
                      <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      navigate("/forum");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/forum"
                    )}`}
                  >
                    💭 Forum
                  </button>
                  <button
                    onClick={() => {
                      navigate("/calendar");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/calendar"
                    )} relative`}
                  >
                    📅 Calendar
                    <span className="ml-2 inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      ⭐
                    </span>
                  </button>
                </>
              )}

              {/* Recruiter Mobile Nav */}
              {user.role === "recruiter" && (
                <>
                  <button
                    onClick={() => {
                      navigate("/recruiter/dashboard");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/recruiter/dashboard"
                    )}`}
                  >
                    📊 Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigate("/recruiter/jobs/create");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/recruiter/jobs/create"
                    )}`}
                  >
                    ➕ Post Job
                  </button>
                  <button
                    onClick={() => {
                      navigate("/recruiter/talent-search");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/recruiter/talent-search"
                    )}`}
                  >
                    🔍 Find Talent
                  </button>
                  <button
                    onClick={() => {
                      navigate("/messages");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/messages"
                    )}`}
                  >
                    💬 Messages
                    {unreadMessages > 0 && (
                      <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      navigate("/forum");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/forum"
                    )}`}
                  >
                    💭 Forum
                  </button>
                  <button
                    onClick={() => {
                      navigate("/calendar");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/calendar"
                    )} relative`}
                  >
                    📅 Calendar
                    <span className="ml-2 inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      ⭐
                    </span>
                  </button>
                </>
              )}

              {/* Admin Mobile Nav */}
              {user.role === "admin" && (
                <>
                  <button
                    onClick={() => {
                      navigate("/admin/dashboard");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/admin/dashboard"
                    )}`}
                  >
                    🛡️ Admin Panel
                  </button>
                  <button
                    onClick={() => {
                      navigate("/jobs");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/jobs"
                    )}`}
                  >
                    💼 All Jobs
                  </button>
                  <button
                    onClick={() => {
                      navigate("/forum");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/forum"
                    )}`}
                  >
                    💭 Forum
                  </button>
                  <button
                    onClick={() => {
                      navigate("/calendar");
                      setShowMobileMenu(false);
                    }}
                    className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                      "/calendar"
                    )} relative`}
                  >
                    📅 Calendar
                    <span className="ml-2 inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      ⭐
                    </span>
                  </button>
                </>
              )}

              {/* Common Mobile Nav */}
              <button
                onClick={() => {
                  navigate("/notifications");
                  setShowMobileMenu(false);
                }}
                className={`px-4 py-2 rounded-md font-semibold transition text-left ${isActive(
                  "/notifications"
                )}`}
              >
                🔔 Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <div className="border-t border-blue-500 mt-2 pt-2">
                <div className="px-4 py-2">
                  <p className="text-white font-semibold">{user.name}</p>
                  <p className="text-blue-100 text-sm">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-200 hover:bg-blue-700 rounded-md transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;