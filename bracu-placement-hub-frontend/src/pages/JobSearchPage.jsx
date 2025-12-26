import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { searchJobs } from "../api/jobApi";
import Navbar from "../components/Navbar";

function JobSearchPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const filters = { keyword, location, minSalary, maxSalary };
      const data = await searchJobs(filters);
      console.log("API Response:", data); // Debugging: Check your console to see the real structure

      //setJobs(data.jobsResponse || (Array.isArray(data.jobsResponse) ? data : []));
       // ✅ FIX: Use 'jobsResponse' instead of 'jobs'
      if (data.success && Array.isArray(data.jobsResponse)) {
        setJobs(data.jobsResponse);
      } else {
        // Fallback: If the structure changes or is empty
        setJobs([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.error || "Failed to load jobs.");
      setJobs([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Search Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  placeholder="Keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  placeholder="Min Salary"
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  placeholder="Max Salary"
                  type="number"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="p-2 border rounded-md"
                />
              </div>
              <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md">
                Search
              </button>
            </form>
          </div>

          {/* FIX: Use the 'error' variable here */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* FIX: Use the 'loading' variable here to handle the loading state */}
          {loading ? (
            <p className="text-center text-gray-600 text-lg">Loading jobs...</p>
          ) : (
            // Only show the list if NOT loading
            <>
              {jobs?.length === 0 ? (
                <p>No jobs found</p>
              ) : (
                jobs.map((job) => (
                  <div key={job._id} className="bg-white p-6 mb-4 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{job.title}</h2>
                    <p className="text-blue-600 font-semibold hover:underline mb-2">
                      <Link to={`/company/${job.companyId}`}>{job.company}</Link>
                    </p>
                    <p>{job.location}</p>
                    {job.applicationDeadline && (
                      <p className="text-sm text-red-700 font-medium mt-2">
                        Deadline: {new Date(job.applicationDeadline).toLocaleString()}
                      </p>
                    )}
                    <button
                      onClick={() => handleJobClick(job._id)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      View Details →
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default JobSearchPage;
