"use client";

import React, { useState } from "react";

export default function ResumeScorer() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [score, setScore] = useState(null);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function uploadResume() {
    if (!file) {
      alert("Please select a resume PDF file.");
      return;
    }
    if (!jobDescription.trim()) {
      alert("Please enter the job description.");
      return;
    }

    setLoading(true);
    setError(null);
    setScore(null);
    setMatchedSkills([]);
    setMissingSkills([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jobDescription);

      const res = await fetch("http://127.0.0.1:8000/resume/score", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      setScore(data.score ?? "--");
      setMatchedSkills(Array.isArray(data.matched_skills) ? data.matched_skills : []);
    } catch (err) {
      setError(err.message || "Failed to score resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1>📄 Resume Scoring</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ marginBottom: "10px", width: "100%" }}
      />

      <textarea
        placeholder="Enter Job Description here"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={5}
        style={{ width: "100%", padding: "8px", marginBottom: "10px", fontSize: "1rem" }}
      />

      <button
        onClick={uploadResume}
        disabled={loading}
        style={{
          padding: "10px 15px",
          fontSize: "1rem",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Scoring..." : "Upload & Score"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "15px" }}>
          ❌ Error: {error}
        </p>
      )}

      {(score !== null) && (
        <div style={{ marginTop: "20px" }}>
          <p><strong>Score:</strong> {score}</p>
          <p>
            <strong>Matched Skills:</strong>{" "}
            {matchedSkills.length > 0 ? matchedSkills.join(", ") : "--"}
          </p>
           <p>
            <strong>Missing Skills:</strong>{" "}
            {missingSkills.length > 0 ? missingSkills.join(", ") : "--"}
          </p>
        </div>
      )}
    </div>
  );
}
