// =================================================================
// BRACU PLACEMENT HUB - COMPLETE BACKEND
// All 24 Features Implemented Across 3 Modules
// =================================================================

// =================================================================
// SETUP AND DEPENDENCIES
// =================================================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cron = require("node-cron");
require("dotenv").config();
const app = express();
const { sendOTPEmail } = require('./EmailService');
// =================================================================
// MIDDLEWARE
// =================================================================
app.use(express.json());
app.use(cors());

// Authentication middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ success: false, error: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// Recruiter authorization middleware
const recruiterAuth = (req, res, next) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ success: false, error: "Access denied. Recruiter role required." });
  }
  next();
};

// Admin authorization middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Access denied. Admin role required." });
  }
  next();
};

// =================================================================
// DATABASE CONNECTION
// =================================================================
const MONGODB_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection failed:", err));

// =================================================================
// MONGOOSE SCHEMAS & MODELS
// =================================================================

// OTP Schema for email verification and password reset
const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ["registration", "password_reset"], required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

const OTP = mongoose.model("OTP", OTPSchema);

// Enhanced User Schema
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  studentId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "recruiter", "admin"], default: "student" },
  isVerified: { type: Boolean, default: false },
  
  // Student fields
  department: String,
  cgpa: Number,
  skills: [String],
  interests: [String],
  workExperience: [{
    company: String,
    position: String,
    duration: String,
    description: String,
  }],
  education: [{ institution: String, degree: String, year: String }],
  
  // Recruiter/Company fields
  companyName: String,
  companyIndustry: String,
  companyDescription: String,
  companyLocation: String,
  companySize: String,
  
  // Account status
  isActive: { type: Boolean, default: true },
  warnings: { type: Number, default: 0 },
  suspendedUntil: Date,
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

// Enhanced Job Schema
const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  salaryMin: Number,
  salaryMax: Number,
  description: String,
  requiredSkills: [String],
  type: { type: String, enum: ["Full-time", "Part-time", "Internship"], default: "Full-time" },
  status: { type: String, enum: ["Open", "Closed", "Filled"], default: "Open" },
  applicationDeadline: Date,
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const Job = mongoose.model("Job", JobSchema);

// Application Schema
const ApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["Pending", "Reviewed", "Rejected", "Accepted"],
    default: "Pending",
  },
  profileSnapshot: {
    name: String,
    email: String,
    studentId: String,
    department: String,
    cgpa: Number,
    skills: [String],
    interests: [String],
    workExperience: [{
      company: String,
      position: String,
      duration: String,
      description: String,
    }],
    education: [{ institution: String, degree: String, year: String }],
  },
}, { timestamps: true });

const Application = mongoose.model("Application", ApplicationSchema);

// Invitation Schema - NEW
const InvitationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: String,
  status: { type: String, enum: ["Pending", "Accepted", "Declined"], default: "Pending" },
}, { timestamps: true });

const Invitation = mongoose.model("Invitation", InvitationSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { 
    type: String, 
    enum: ["application", "invitation", "message", "connection", "review", "system"],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  read: { type: Boolean, default: false },
  relatedId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);

// Message Schema - NEW
const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: String,
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const Message = mongoose.model("Message", MessageSchema);

// Review Schema - NEW
const ReviewSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  workCulture: { type: Number, min: 1, max: 5 },
  salary: { type: Number, min: 1, max: 5 },
  careerGrowth: { type: Number, min: 1, max: 5 },
  comment: String,
  flagged: { type: Boolean, default: false },
  flagReason: String,
  aiAnalysis: String,
}, { timestamps: true });

const Review = mongoose.model("Review", ReviewSchema);

// Forum Post Schema - NEW
const ForumPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["Interview Tips", "Job Search", "Career Advice", "General"], required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  flagged: { type: Boolean, default: false },
  flagReason: String,
  aiAnalysis: String,
}, { timestamps: true });

const ForumPost = mongoose.model("ForumPost", ForumPostSchema);

// Forum Comment Schema - NEW
const ForumCommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  flagged: { type: Boolean, default: false },
}, { timestamps: true });

const ForumComment = mongoose.model("ForumComment", ForumCommentSchema);

// Dashboard Schema
const DashboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Dashboard = mongoose.model("Dashboard", DashboardSchema);

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email (simulated - replace with real email service)

// Simple AI content moderation (replace with real AI service)
async function moderateContent(text) {
  const negativeKeywords = ["hate", "abuse", "scam", "fraud", "terrible", "worst", "awful", "stupid", "idiot"];
  const inappropriateKeywords = ["profanity", "offensive", "spam"];
  
  let score = 0;
  let flags = [];
  
  const lowerText = text.toLowerCase();
  
  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 2;
      flags.push(`Negative sentiment: "${keyword}"`);
    }
  });
  
  inappropriateKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 3;
      flags.push(`Inappropriate content: "${keyword}"`);
    }
  });
  
  return {
    flagged: score >= 2,
    score,
    flags,
    analysis: flags.length > 0 ? flags.join("; ") : "Content appears appropriate"
  };
}

// Create notification helper
async function createNotification(userId, type, title, message, link = null, relatedId = null) {
  const notification = new Notification({
    user: userId,
    type,
    title,
    message,
    link,
    relatedId
  });
  await notification.save();
  return notification;
}

// =================================================================
// CRON JOB FOR DEADLINE MANAGEMENT
// =================================================================

// Check for expired job deadlines every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🕐 Running deadline check...');
    
    const expiredJobs = await Job.find({
      status: 'Open',
      applicationDeadline: { $lt: new Date() }
    });
    
    for (const job of expiredJobs) {
      job.status = 'Closed';
      await job.save();
      
      // Notify recruiter
      await createNotification(
        job.recruiter,
        'system',
        'Job Application Deadline Passed',
        `Applications for "${job.title}" are now closed.`,
        `/recruiter/jobs/${job._id}`
      );
      
      console.log(`✅ Closed job: ${job.title}`);
    }
  } catch (error) {
    console.error('❌ Deadline check error:', error);
  }
});

// =================================================================
// AUTHENTICATION APIs WITH OTP
// =================================================================

// Step 1: Request OTP for registration
app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    // Role-specific email validation
    if (role === "student" || !role) {
      if (!email.endsWith("@g.bracu.ac.bd")) {
        return res.status(400).json({
          success: false,
          error: "Students must use @g.bracu.ac.bd email addresses",
        });
      }
    } else if (role === "recruiter" || role === "admin") {
      if (email.endsWith("@g.bracu.ac.bd")) {
        return res.status(400).json({
          success: false,
          error: "Recruiters and admins must use non-university email addresses",
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email, type: "registration" });

    // Save new OTP
    const otpDoc = new OTP({
      email,
      otp,
      type: "registration",
      expiresAt,
    });
    await otpDoc.save();

    // Send OTP email
    await sendOTPEmail(email, otp, "registration");

    res.json({
      success: true,
      message: "OTP sent to your email. Valid for 10 minutes.",
      email
      // REMOVE THIS IN PRODUCTION - Only for testing
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Step 2: Verify OTP and complete registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        error: "Name, email, password, and OTP are required",
      });
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email,
      otp,
      type: "registration",
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create or update user
    const userId = email.split("@")[0];
    
    if (user) {
      user.name = name;
      user.password = hashedPassword;
      user.role = role || "student";
      user.isVerified = true;
      await user.save();
    } else {
      user = new User({
        name,
        userId,
        email,
        password: hashedPassword,
        role: role || "student",
        isVerified: true,
      });
      await user.save();
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    // Create dashboard for user
    const dashboard = new Dashboard({ user: user._id });
    await dashboard.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: user.userId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, error: "Please verify your email first" });
    }

    if (!user.isActive) {
      const message = user.suspendedUntil 
        ? `Account suspended until ${user.suspendedUntil.toLocaleDateString()}`
        : "Account is suspended";
      return res.status(401).json({ success: false, error: message });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const payload = {
      id: user.id,
      userId: user.userId,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request password reset OTP
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email, type: "password_reset" });

    const otpDoc = new OTP({
      email,
      otp,
      type: "password_reset",
      expiresAt,
    });
    await otpDoc.save();

    await sendOTPEmail(email, otp, "password_reset");

    res.json({
      success: true,
      message: "OTP sent to your email",
      email
       // REMOVE IN PRODUCTION
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset password with OTP
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpDoc = await OTP.findOne({
      email,
      otp,
      type: "password_reset",
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    otpDoc.verified = true;
    await otpDoc.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get profile
app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Profile status check
app.get("/api/profile/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found", hasProfile: false });
    }

    let hasProfile = false;
    
    if (user.role === "student") {
      hasProfile = !!(user.skills && user.skills.length > 0 && user.interests && user.interests.length > 0);
    } else if (user.role === "recruiter") {
      hasProfile = !!(user.companyName && user.companyIndustry);
    }

    res.json({ success: true, hasProfile, userId: user.userId, role: user.role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, hasProfile: false });
  }
});

// Update profile
app.put("/api/profile/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only update your own profile.",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// COMPANY PROFILE MANAGEMENT (Module 1 - Feature 3)
// =================================================================

// Get company profile
app.get("/api/company/:companyId", auth, async (req, res) => {
  try {
    const company = await User.findOne({
      _id: req.params.companyId,
      role: 'recruiter'
    }).select('-password');
    
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }
    
    // Get company reviews
    const reviews = await Review.find({ company: req.params.companyId })
      .populate('reviewer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    res.json({
      success: true,
      company,
      reviews,
      avgRating: avgRating.toFixed(1),
      reviewCount: reviews.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update company profile (recruiter only)
app.put("/api/company/profile", auth, recruiterAuth, async (req, res) => {
  try {
    const { companyName, companyIndustry, companyDescription, companyLocation, companySize } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          companyName,
          companyIndustry,
          companyDescription,
          companyLocation,
          companySize
        }
      },
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: "Company profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search companies
app.get("/api/companies/search", auth, async (req, res) => {
  try {
    const { keyword, industry } = req.query;
    
    let query = { role: 'recruiter', companyName: { $exists: true, $ne: null } };
    
    if (keyword) {
      query.$or = [
        { companyName: { $regex: keyword, $options: 'i' } },
        { companyDescription: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    if (industry) {
      query.companyIndustry = { $regex: industry, $options: 'i' };
    }
    
    const companies = await User.find(query)
      .select('companyName companyIndustry companyDescription companyLocation companySize')
      .limit(50);
    
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// JOB MANAGEMENT APIs
// =================================================================

// Search jobs with filters
app.get("/api/jobs/search", auth, async (req, res) => {
  try {
    const { keyword, location, minSalary, maxSalary } = req.query;
    let query = { status: "Open" };

    // Check deadline
    query.$or = [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: null },
      { applicationDeadline: { $gte: new Date() } }
    ];

    if (keyword) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { company: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ]
      });
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (minSalary) {
      query.salaryMin = { $gte: Number(minSalary) };
    }

    if (maxSalary) {
      query.salaryMax = { $lte: Number(maxSalary) };
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    
    const jobsResponse = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter,
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline,
      createdAt: job.createdAt
    }));
    
    
    res.json({ success: true, count: jobsResponse.length, jobsResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single job details
app.get("/api/jobs/:jobId", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate("recruiter", "name email companyName");
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: req.params.jobId,
    });

     const jobsResponse = {
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter._id, // recruiter mapped to companyId
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline,
      recruiter: job.recruiter // optional if you want recruiter info
    };

    res.json({
      success: true,
      job: jobsResponse,
      hasApplied: !!existingApplication,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply to job
app.post("/api/jobs/apply", auth, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: "jobId is required"
      });
    }

    // ✅ FIX 2: Validate logged-in user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized user"
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.status !== "Open") {
      return res.status(400).json({
        success: false,
        error: "This job is no longer accepting applications",
      });
    }

    // Check deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({
        success: false,
        error: "Application deadline has passed",
      });
    }

    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: jobId,
    });

    if (existingApplication) {
      return res.status(400).json({ success: false, error: "Already applied to this job" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const profileSnapshot = {
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      department: user.department,
      cgpa: user.cgpa,
      skills: user.skills,
      interests: user.interests,
      workExperience: user.workExperience,
      education: user.education,
    };

    const newApplication = new Application({
      user: req.user.id,
      job: jobId,
      status: "Pending",
      profileSnapshot: profileSnapshot,
    });

    await newApplication.save();

    // Create notification for student
    await createNotification(
      req.user.id,
      "application",
      "Application Submitted",
      `Your application for "${job.title}" at ${job.company} has been submitted successfully.`,
      `/applications/${newApplication._id}`
    );

    // Create notification for recruiter
    await createNotification(
      job.recruiter,
      "application",
      "New Application Received",
      `${user.name} has applied for ${job.title}`,
      `/recruiter/jobs/${jobId}/applications`
    );

    const responseJob = {
      ...job.toObject(),
      companyId: job.recruiter._id
    };

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: newApplication,
      job: responseJob
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's applications
app.get("/api/applications/my-applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate({
        path: "job",
        select: "title company recruiter location status"
                })
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// RECRUITER JOB MANAGEMENT
// =================================================================

// Get recruiter's jobs
app.get("/api/recruiter/jobs", auth, recruiterAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).sort({ createdAt: -1 });
    
    const jobsResponse = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter, // recruiter mapped to companyId
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline,
      createdAt: job.createdAt
    }));
    
    res.json({ success: true, jobs:jobsResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single job (recruiter view)
app.get("/api/recruiter/jobs/:jobId", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const jobsResponse = {
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter,
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline
    };

    res.json({ success: true, job: jobsResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create job posting
app.post("/api/recruiter/jobs", auth, recruiterAuth, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      recruiter: req.user.id,
      status: "Open",
    };

    const newJob = new Job(jobData);
    await newJob.save();

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: newJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update job posting
app.put("/api/recruiter/jobs/:jobId", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found or you don't have permission to edit it",
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.jobId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete job
app.delete("/api/recruiter/jobs/:jobId", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found or you don't have permission to delete it",
      });
    }

    await Job.findByIdAndDelete(req.params.jobId);

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark job as filled
app.patch("/api/recruiter/jobs/:jobId/mark-filled", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found or you don't have permission to modify it",
      });
    }

    job.status = "Filled";
    await job.save();

    res.json({
      success: true,
      message: "Job marked as filled",
      job,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get applications for a job
app.get("/api/recruiter/jobs/:jobId/applications", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found or you don't have permission to view applications",
      });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const responseJob = {
      ...job.toObject(),
      companyId: job.recruiter
    };

    res.json({
      success: true,
      applications,
      jobTitle: job.title,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// TALENT SOURCING & INVITATION SYSTEM (Module 2 - Feature 3)
// =================================================================

// Search for talent with AI-powered matching
app.post("/api/recruiter/search-talent", auth, recruiterAuth, async (req, res) => {
  try {
    const { keywords, skills, minCGPA, department } = req.body;
    
    let query = { role: 'student', isVerified: true, isActive: true };
    
    // Keyword search across multiple fields
    if (keywords) {
      const keywordRegex = new RegExp(keywords, 'i');
      query.$or = [
        { name: keywordRegex },
        { department: keywordRegex },
        { interests: keywordRegex },
        { skills: keywordRegex }
      ];
    }
    
    // Skills filter
    if (skills && skills.length > 0) {
      query.skills = { $in: skills.map(s => new RegExp(s, 'i')) };
    }
    
    // CGPA filter
    if (minCGPA) {
      query.cgpa = { $gte: parseFloat(minCGPA) };
    }
    
    // Department filter
    if (department) {
      query.department = new RegExp(department, 'i');
    }
    
    const students = await User.find(query)
      .select('name email department cgpa skills interests studentId workExperience education')
      .limit(100);
    
    // AI-powered relevance scoring
    const scoredStudents = students.map(student => {
      let score = 0;
      
      // Skills matching (most important)
      if (skills && skills.length > 0) {
        const studentSkills = student.skills || [];
        const matchingSkills = studentSkills.filter(s => 
          skills.some(reqSkill => s.toLowerCase().includes(reqSkill.toLowerCase()))
        );
        score += matchingSkills.length * 10;
      }
      
      // CGPA bonus
      if (student.cgpa) {
        score += student.cgpa * 2;
      }
      
      // Work experience bonus
      if (student.workExperience && student.workExperience.length > 0) {
        score += student.workExperience.length * 5;
      }
      
      // Education bonus
      if (student.education && student.education.length > 0) {
        score += student.education.length * 3;
      }
      
      return { 
        ...student.toObject(), 
        relevanceScore: score,
        matchPercentage: skills ? Math.min(100, (score / (skills.length * 10)) * 100) : 0
      };
    });
    
    // Sort by relevance
    scoredStudents.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    res.json({ 
      success: true, 
      count: scoredStudents.length,
      students: scoredStudents 
    });
  } catch (error) {
    console.error("Talent search error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send job invitation to student
app.post("/api/recruiter/invite/:studentId", auth, recruiterAuth, async (req, res) => {
  try {
    const { jobId, message } = req.body;
    
    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiter: req.user.id });
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        error: "Job not found or you don't have permission" 
      });
    }
    
    // Verify student exists
    const student = await User.findOne({ 
      _id: req.params.studentId, 
      role: 'student' 
    });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: "Student not found" 
      });
    }
    
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      job: jobId,
      student: req.params.studentId,
      status: 'Pending'
    });
    
    if (existingInvitation) {
      return res.status(400).json({ 
        success: false, 
        error: "Invitation already sent to this student" 
      });
    }
    
    // Create invitation
    const invitation = new Invitation({
      job: jobId,
      student: req.params.studentId,
      recruiter: req.user.id,
      message: message || `You've been invited to apply for ${job.title}`,
    });
    await invitation.save();
    
    // Create notification for student
    await createNotification(
      req.params.studentId,
      'invitation',
      'New Job Invitation',
      `You've been invited to apply for ${job.title} at ${job.company}`,
      `/invitations/${invitation._id}`,
      invitation._id
    );
    
    res.status(201).json({ 
      success: true, 
      message: "Invitation sent successfully",
      invitation 
    });
  } catch (error) {
    console.error("Send invitation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's invitations
app.get("/api/student/invitations", auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({ 
      student: req.user.id 
    })
    .populate('job')
    .populate('recruiter', 'name email companyName')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Respond to invitation
app.post("/api/invitations/:invitationId/respond", auth, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'decline'
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid action. Use 'accept' or 'decline'" 
      });
    }
    
    const invitation = await Invitation.findOne({
      _id: req.params.invitationId,
      student: req.user.id,
      status: 'Pending'
    }).populate('job');
    
    if (!invitation) {
      return res.status(404).json({ 
        success: false, 
        error: "Invitation not found or already responded" 
      });
    }
    
    // Update invitation status
    invitation.status = action === 'accept' ? 'Accepted' : 'Declined';
    await invitation.save();
    
    // If accepted, create application automatically
    if (action === 'accept') {
      const user = await User.findById(req.user.id).select("-password");
      
      // Check if already applied
      const existingApplication = await Application.findOne({
        user: req.user.id,
        job: invitation.job._id
      });
      
      if (!existingApplication) {
        const application = new Application({
          user: req.user.id,
          job: invitation.job._id,
          status: "Pending",
          profileSnapshot: {
            name: user.name,
            email: user.email,
            studentId: user.studentId,
            department: user.department,
            cgpa: user.cgpa,
            skills: user.skills,
            interests: user.interests,
            workExperience: user.workExperience,
            education: user.education,
          },
        });
        await application.save();
        
        // Notify student about application
        await createNotification(
          req.user.id,
          'application',
          'Application Submitted',
          `Your application for ${invitation.job.title} has been submitted`,
          `/applications/${application._id}`
        );
        
        // Notify recruiter
        await createNotification(
          invitation.recruiter._id,
          'application',
          'Invitation Accepted - Application Received',
          `${user.name} accepted your invitation and applied for ${invitation.job.title}`,
          `/recruiter/jobs/${invitation.job._id}/applications`
        );
      }
    } else {
      // Notify recruiter about decline
      await createNotification(
        invitation.recruiter._id,
        'invitation',
        'Invitation Declined',
        `A student declined your invitation for ${invitation.job.title}`,
        `/recruiter/jobs/${invitation.job._id}`
      );
    }
    
    // Response includes companyId
    const responseJob = {
      ...invitation.job.toObject(),
      companyId: invitation.job.recruiter._id
    };

    res.json({ 
      success: true, 
      message: `Invitation ${action}ed successfully` 
    });
  } catch (error) {
    console.error("Respond to invitation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// DIRECT MESSAGING SYSTEM (Module 3 - Feature 2)
// =================================================================

// Send message
app.post("/api/messages/send", auth, async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;
    
    if (!recipientId || !content) {
      return res.status(400).json({ 
        success: false, 
        error: "Recipient and content are required" 
      });
    }
    
    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: "Recipient not found" 
      });
    }
    
    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      subject: subject || '(No subject)',
      content
    });
    await message.save();
    
    // Create notification for recipient
    await createNotification(
      recipientId,
      'message',
      'New Message',
      `You have a new message from ${req.user.name}`,
      `/messages/${message._id}`,
      message._id
    );
    
    res.status(201).json({ 
      success: true, 
      message: "Message sent successfully",
      messageData: message 
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get inbox
app.get("/api/messages/inbox", auth, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user.id })
      .populate('sender', 'name email role companyName')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sent messages
app.get("/api/messages/sent", auth, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user.id })
      .populate('recipient', 'name email role companyName')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single message
app.get("/api/messages/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .populate('sender', 'name email role companyName')
    .populate('recipient', 'name email role companyName');
    
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }
    
    // Mark as read if user is recipient
    if (message.recipient._id.toString() === req.user.id && !message.read) {
      message.read = true;
      await message.save();
    }
    
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete message
app.delete("/api/messages/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.messageId,
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    });
    
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }
    
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread message count
app.get("/api/messages/unread/count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false
    });
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// COMPANY REVIEWS & RATINGS (Module 3 - Feature 1)
// =================================================================

// Submit review
app.post("/api/reviews/submit", auth, async (req, res) => {
  try {
    const { 
      companyId, 
      rating, 
      workCulture, 
      salary, 
      careerGrowth, 
      comment 
    } = req.body;
    
    // Verify company exists and is a recruiter
    const company = await User.findOne({ 
      _id: companyId, 
      role: 'recruiter' 
    });
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        error: "Company not found" 
      });
    }
    
    // Check if user already reviewed this company
    const existingReview = await Review.findOne({
      company: companyId,
      reviewer: req.user.id
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        error: "You have already reviewed this company" 
      });
    }
    
    // AI content moderation
    const moderation = await moderateContent(comment || '');
    
    const review = new Review({
      company: companyId,
      reviewer: req.user.id,
      rating,
      workCulture,
      salary,
      careerGrowth,
      comment,
      flagged: moderation.flagged,
      flagReason: moderation.flagged ? moderation.flags.join('; ') : null,
      aiAnalysis: moderation.analysis
    });
    await review.save();
    
    // If flagged, notify admins
    if (moderation.flagged) {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          'system',
          'Content Flagged for Review',
          `A review has been flagged by AI for potential inappropriate content`,
          `/admin/reviews/${review._id}`
        );
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: "Review submitted successfully",
      review,
      moderated: moderation.flagged
    });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company reviews
app.get("/api/reviews/company/:companyId", auth, async (req, res) => {
  try {
    const reviews = await Review.find({ 
      company: req.params.companyId 
    })
    .populate('reviewer', 'name')
    .sort({ createdAt: -1 });
    
    // Calculate average ratings
    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0,
      averageWorkCulture: reviews.reduce((sum, r) => sum + (r.workCulture || 0), 0) / reviews.length || 0,
      averageSalary: reviews.reduce((sum, r) => sum + (r.salary || 0), 0) / reviews.length || 0,
      averageCareerGrowth: reviews.reduce((sum, r) => sum + (r.careerGrowth || 0), 0) / reviews.length || 0
    };
    
    res.json({ success: true, reviews, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// FORUM SYSTEM (Module 3 - Feature 2)
// =================================================================

// Create forum post
app.post("/api/forum/posts", auth, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ 
        success: false, 
        error: "Title, content, and category are required" 
      });
    }
    
    // AI content moderation
    const moderation = await moderateContent(`${title} ${content}`);
    
    const post = new ForumPost({
      author: req.user.id,
      title,
      content,
      category,
      flagged: moderation.flagged,
      flagReason: moderation.flagged ? moderation.flags.join('; ') : null,
      aiAnalysis: moderation.analysis
    });
    await post.save();
    
    // If flagged, notify admins
    if (moderation.flagged) {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          'system',
          'Forum Post Flagged',
          `A forum post has been flagged by AI`,
          `/admin/forum/${post._id}`
        );
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: "Post created successfully",
      post,
      moderated: moderation.flagged
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all forum posts
app.get("/api/forum/posts", auth, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const posts = await ForumPost.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single post with comments
app.get("/api/forum/posts/:postId", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId)
      .populate('author', 'name email');
    
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    
    const comments = await ForumComment.find({ post: req.params.postId })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });
    
    res.json({ success: true, post, comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like/Unlike post
app.post("/api/forum/posts/:postId/like", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    
    const userIndex = post.likes.indexOf(req.user.id);
    
    if (userIndex > -1) {
      // Unlike
      post.likes.splice(userIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }
    
    await post.save();
    
    res.json({ 
      success: true, 
      liked: userIndex === -1,
      likeCount: post.likes.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comment on post
app.post("/api/forum/posts/:postId/comments", auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        error: "Content is required" 
      });
    }
    
    const post = await ForumPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    
    // AI moderation
    const moderation = await moderateContent(content);
    
    const comment = new ForumComment({
      post: req.params.postId,
      author: req.user.id,
      content,
      flagged: moderation.flagged
    });
    await comment.save();
    
    if (moderation.flagged) {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          'system',
          'Forum Comment Flagged',
          `A comment has been flagged by AI`,
          `/admin/forum/comments/${comment._id}`
        );
      }
    }
    
    // Notify post author
    if (post.author.toString() !== req.user.id) {
      await createNotification(
        post.author,
        'system',
        'New Comment on Your Post',
        `Someone commented on your forum post: ${post.title}`,
        `/forum/posts/${post._id}`
      );
    }
    
    const populatedComment = await ForumComment.findById(comment._id)
      .populate('author', 'name email');
    
    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// NOTIFICATION CENTER (Module 3 - Feature 3)
// =================================================================

// Get notifications
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const { unread } = req.query;
    
    let query = { user: req.user.id };
    if (unread === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
app.put("/api/notifications/:notificationId/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read
app.put("/api/notifications/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread count
app.get("/api/notifications/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// DASHBOARD APIs
// =================================================================

// Get personalized dashboard
app.get("/api/dashboard/overview", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get applications
    const applications = await Application.find({ user: req.user.id })
      .populate('job')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const appStats = {
      pending: await Application.countDocuments({ user: req.user.id, status: 'Pending' }),
      reviewed: await Application.countDocuments({ user: req.user.id, status: 'Reviewed' }),
      accepted: await Application.countDocuments({ user: req.user.id, status: 'Accepted' }),
      rejected: await Application.countDocuments({ user: req.user.id, status: 'Rejected' }),
    };
    
    // Get saved jobs
    const dashboard = await Dashboard.findOne({ user: req.user.id }).populate('savedJobs');
    
    // Get notifications
    const notifications = await Notification.find({ user: req.user.id, read: false })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get invitations
    const invitations = await Invitation.find({ 
      student: req.user.id, 
      status: 'Pending' 
    }).populate('job');
    
    // Get unread message count
    const unreadMessages = await Message.countDocuments({
      recipient: req.user.id,
      read: false
    });
    
    res.json({
      success: true,
      data: {
        applications: appStats,
        recentApplications: applications,
        savedJobs: dashboard?.savedJobs || [],
        notifications,
        invitations,
        messages: { unreadCount: unreadMessages }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save job
app.post("/api/dashboard/saved-jobs/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job)
      return res.status(404).json({ success: false, error: "Job not found" });

    let dashboard = await Dashboard.findOne({ user: req.user.id });

    if (!dashboard) {
      dashboard = new Dashboard({ user: req.user.id, savedJobs: [jobId] });
    } else {
      if (dashboard.savedJobs.includes(jobId)) {
        return res
          .status(400)
          .json({ success: false, error: "Job already saved" });
      }
      dashboard.savedJobs.push(jobId);
    }

    await dashboard.save();
    res.json({ success: true, message: "Job saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get saved jobs
app.get("/api/dashboard/saved-jobs/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const dashboard = await Dashboard.findOne({ user: req.user.id }).populate(
      "savedJobs"
    );

    res.json({
      success: true,
      savedJobs: dashboard ? dashboard.savedJobs : [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove saved job
app.delete("/api/dashboard/saved-jobs/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const { jobId } = req.body;

    await Dashboard.updateOne(
      { user: req.user.id },
      { $pull: { savedJobs: jobId } }
    );

    res.json({ success: true, message: "Job removed from saved" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// ADMIN DASHBOARD (Module 3 - Feature 3)
// =================================================================

// Get flagged content
app.get("/api/admin/flagged-content", auth, adminAuth, async (req, res) => {
  try {
    const flaggedReviews = await Review.find({ flagged: true })
      .populate('company', 'name companyName')
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 });
    
    const flaggedPosts = await ForumPost.find({ flagged: true })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    
    const flaggedComments = await ForumComment.find({ flagged: true })
      .populate('author', 'name email')
      .populate('post', 'title')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      reviews: flaggedReviews,
      posts: flaggedPosts,
      comments: flaggedComments,
      totalFlagged: flaggedReviews.length + flaggedPosts.length + flaggedComments.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin action on content
app.post("/api/admin/content/:contentId/action", auth, adminAuth, async (req, res) => {
  try {
    const { action, reason, contentType } = req.body;
    // contentType: 'review', 'post', or 'comment'
    
    let content;
    let author;
    
    // Find content based on type
    if (contentType === 'review') {
      content = await Review.findById(req.params.contentId).populate('reviewer');
      author = content?.reviewer;
    } else if (contentType === 'post') {
      content = await ForumPost.findById(req.params.contentId).populate('author');
      author = content?.author;
    } else if (contentType === 'comment') {
      content = await ForumComment.findById(req.params.contentId).populate('author');
      author = content?.author;
    }
    
    if (!content) {
      return res.status(404).json({ success: false, error: "Content not found" });
    }
    
    const authorUser = await User.findById(author._id);
    
    switch (action) {
      case 'delete':
        // Delete the content
        if (contentType === 'review') await Review.findByIdAndDelete(req.params.contentId);
        else if (contentType === 'post') await ForumPost.findByIdAndDelete(req.params.contentId);
        else if (contentType === 'comment') await ForumComment.findByIdAndDelete(req.params.contentId);
        
        // Notify user
        await createNotification(
          author._id,
          'system',
          'Content Removed',
          `Your ${contentType} has been removed by an admin. Reason: ${reason}`,
          null
        );
        break;
        
      case 'warn':
        // Increment warnings
        authorUser.warnings += 1;
        await authorUser.save();
        
        // Notify user
        await createNotification(
          author._id,
          'system',
          'Warning Issued',
          `You have received a warning. Reason: ${reason}. Total warnings: ${authorUser.warnings}`,
          null
        );
        
        // Auto-suspend if 3+ warnings
        if (authorUser.warnings >= 3) {
          authorUser.isActive = false;
          authorUser.suspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          await authorUser.save();
          
          await createNotification(
            author._id,
            'system',
            'Account Suspended',
            `Your account has been suspended for 30 days due to multiple warnings`,
            null
          );
        }
        break;
        
      case 'suspend':
        // Suspend user
        authorUser.isActive = false;
        authorUser.suspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await authorUser.save();
        
        await createNotification(
          author._id,
          'system',
          'Account Suspended',
          `Your account has been suspended. Reason: ${reason}`,
          null
        );
        break;
        
      default:
        return res.status(400).json({ success: false, error: "Invalid action" });
    }
    
    res.json({ 
      success: true, 
      message: `Action ${action} completed successfully` 
    });
  } catch (error) {
    console.error("Admin action error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users (admin)
app.get("/api/admin/users", auth, adminAuth, async (req, res) => {
  try {
    const { search, role } = req.query;
    
    let query = {};
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { userId: searchRegex }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Suspend user
app.put("/api/admin/users/:userId/suspend", auth, adminAuth, async (req, res) => {
  try {
    const { days, reason } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    user.isActive = false;
    user.suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await user.save();
    
    await createNotification(
      req.params.userId,
      'system',
      'Account Suspended',
      `Your account has been suspended for ${days} days. Reason: ${reason}`,
      null
    );
    
    res.json({ success: true, message: "User suspended successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
app.delete("/api/admin/users/:userId", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Clean up related data
    await Application.deleteMany({ user: req.params.userId });
    await Message.deleteMany({ $or: [{ sender: req.params.userId }, { recipient: req.params.userId }] });
    await Notification.deleteMany({ user: req.params.userId });
    await Dashboard.deleteOne({ user: req.params.userId });
    
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get platform statistics
app.get("/api/admin/stats", auth, adminAuth, async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        students: await User.countDocuments({ role: 'student' }),
        recruiters: await User.countDocuments({ role: 'recruiter' }),
        admins: await User.countDocuments({ role: 'admin' }),
        suspended: await User.countDocuments({ isActive: false })
      },
      jobs: {
        total: await Job.countDocuments(),
        open: await Job.countDocuments({ status: 'Open' }),
        closed: await Job.countDocuments({ status: 'Closed' }),
        filled: await Job.countDocuments({ status: 'Filled' })
      },
      applications: {
        total: await Application.countDocuments(),
        pending: await Application.countDocuments({ status: 'Pending' }),
        reviewed: await Application.countDocuments({ status: 'Reviewed' }),
        accepted: await Application.countDocuments({ status: 'Accepted' }),
        rejected: await Application.countDocuments({ status: 'Rejected' })
      },
      content: {
        reviews: await Review.countDocuments(),
        flaggedReviews: await Review.countDocuments({ flagged: true }),
        forumPosts: await ForumPost.countDocuments(),
        flaggedPosts: await ForumPost.countDocuments({ flagged: true }),
        forumComments: await ForumComment.countDocuments(),
        flaggedComments: await ForumComment.countDocuments({ flagged: true })
      },
      activity: {
        messages: await Message.countDocuments(),
        notifications: await Notification.countDocuments(),
        invitations: await Invitation.countDocuments()
      }
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// LEGACY ROUTES (Keep for backward compatibility)
// =================================================================

app.get("/api/dashboard/applications/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const applications = await Application.find({ user: req.user.id })
      .populate("job")
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/dashboard/notifications/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const notifications = await Notification.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/dashboard/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const applications = await Application.find({ user: user.id })
      .populate("job")
      .sort({ createdAt: -1 })
      .limit(5);

    const dashboard = await Dashboard.findOne({ user: user.id }).populate(
      "savedJobs"
    );

    const notifications = await Notification.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        userId: user.userId,
        studentInfo: {
          name: user.name,
          email: user.email,
          department: user.department,
          cgpa: user.cgpa,
        },
        applications,
        savedJobsCount: dashboard ? dashboard.savedJobs.length : 0,
        savedJobs: dashboard ? dashboard.savedJobs : [],
        notifications,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test routes (remove in production)
app.post("/api/test/create-job", async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json({ success: true, message: "Test job created", job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/test/create-notification", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const newNotification = await createNotification(
      req.user.id,
      'system',
      'Test Notification',
      message || 'This is a test notification'
    );
    res.status(201).json({
      success: true,
      message: "Test notification created",
      notification: newNotification,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// SERVER START
// =================================================================
const PORT = process.env.PORT || 1350;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           BRACU PLACEMENT HUB - BACKEND SERVER                ║
║                    FULLY OPERATIONAL                          ║
╚═══════════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📚 Student ID: 23101350

✅ MODULE 1 - User Profile and Access:
   • OTP-based Authentication
   • Student Profile Management
   • Company Profile Management

✅ MODULE 2 - Jobs and Applications:
   • Job Posting with Deadlines
   • Job Discovery & Application
   • AI-Powered Talent Sourcing & Invitations

✅ MODULE 3 - Community & Interaction:
   • Company Reviews & Ratings
   • Direct Messaging System
   • Community Forum
   • Personalized Dashboard
   • Admin Dashboard with AI Moderation
   • Notification Center

🔧 Features:
   • JWT Authentication
   • OTP Email Verification
   • AI Content Moderation
   • Role-Based Access Control
   • Automatic Deadline Management
   • Profile Snapshots
   • Relevance-Based Search

⚠️  PRODUCTION REMINDERS:
   • Replace console.log with real email service
   • Integrate with actual AI moderation API
   • Add rate limiting
   • Enable HTTPS
   • Set secure JWT_SECRET
   • Configure proper CORS
`);
});


