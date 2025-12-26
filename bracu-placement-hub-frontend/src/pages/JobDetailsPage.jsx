import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getJobDetails } from "../api/jobApi";
import JobLocationMap from "../components/JobLocationMap";
import Navbar from "../components/Navbar";

function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const data = await getJobDetails(jobId);
      setJob(data.job);
      setHasApplied(data.hasApplied);
    } catch (err) {
      setError(err.error || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleBackToSearch = () => {
    navigate("/jobs");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBackToSearch}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Job Search
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Job not found</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBackToSearch}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Back to Job Search
          </button>

          {/* Job Header Card */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  {job.title}
                </h1>
                {/* ✅ Company Name Clickable */}
                <p className="text-2xl text-blue-600 font-semibold mb-2 hover:underline">
                  <Link to={`/company/${job.companyId}`}>{job.company}</Link>
                </p>
                {job.location && (
                  <p className="text-gray-600 flex items-center">
                    {job.location}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <span
                  className={`px-4 py-2 rounded-full font-semibold ${
                    job.status === "Open"
                      ? "bg-green-100 text-green-800"
                      : job.status === "Closed"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.status}
                </span>
              </div>
            </div>

            {/* Job Meta */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center">{job.type}</div>
              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center">
                  BDT {job.salaryMin?.toLocaleString()} - BDT {" "}
                  {job.salaryMax?.toLocaleString()}
                </div>
              )}
              {job.applicationDeadline && (
                <div className="flex items-center text-red-700 font-semibold">
                  Application Deadline: {new Date(job.applicationDeadline).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          {job.coordinates && job.coordinates.lat && job.coordinates.lng && (
            <JobLocationMap
              latitude={job.coordinates.lat}
              longitude={job.coordinates.lng}
              company={job.company}
              jobTitle={job.title}
            />
          )}

          {/* Job Description */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Job Description
            </h2>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>

          {/* Required Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="bg-white p-8 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            {hasApplied ? (
              <p className="text-green-700 font-semibold">
                You have already applied to this job
              </p>
            ) : job.status !== "Open" ? (
              <p className="text-gray-700 font-semibold">
                This job is no longer accepting applications
              </p>
            ) : job.applicationDeadline && new Date() > new Date(job.applicationDeadline) ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700 font-semibold">
                  ❌ Application deadline has passed ({new Date(job.applicationDeadline).toLocaleString()})
                </p>
              </div>
            ) : (
              <button
                onClick={handleApply}
                className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xl transition"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default JobDetailsPage;
