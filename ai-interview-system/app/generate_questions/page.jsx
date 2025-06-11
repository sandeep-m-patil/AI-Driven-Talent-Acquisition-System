"use client";

import React, { useState } from "react";

export default function InterviewQuestions() {
  const [role, setRole] = useState("");
  const [desc, setDesc] = useState("");
  const [questionsData, setQuestionsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generateQuestions() {
    if (!role.trim() || !desc.trim()) {
      alert("Please enter role and job description.");
      return;
    }
    setLoading(true);
    setError(null);
    setQuestionsData(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/interview/generate_questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, job_description: desc }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      if (
        data.questions &&
        typeof data.questions === "object" &&
        !Array.isArray(data.questions)
      ) {
        setQuestionsData(data.questions);
      } else {
        setQuestionsData({
          technical_questions: [],
          behavioral_questions: [],
        });
      }
    } catch (err) {
      setError(err.message || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <h1>📝 Generate Interview Questions</h1>

      <input
        type="text"
        placeholder="Enter Job Role (e.g., UI UX Developer)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px", fontSize: "1rem" }}
      />

      <textarea
        placeholder="Enter Job Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={5}
        style={{ width: "100%", padding: "8px", marginBottom: "10px", fontSize: "1rem" }}
      ></textarea>

      <button
        onClick={generateQuestions}
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
        {loading ? "Generating..." : "Get Questions"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "15px" }}>
          ❌ Error: {error}
        </p>
      )}

      {questionsData && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Technical Questions</h2>
          {questionsData.technical_questions && questionsData.technical_questions.length > 0 ? (
            <ul>
              {questionsData.technical_questions.map((q, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>
                  {q}
                </li>
              ))}
            </ul>
          ) : (
            <p>No technical questions available.</p>
          )}

          <h2>Behavioral Questions</h2>
          {questionsData.behavioral_questions && questionsData.behavioral_questions.length > 0 ? (
            <ul>
              {questionsData.behavioral_questions.map((q, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>
                  {q}
                </li>
              ))}
            </ul>
          ) : (
            <p>No behavioral questions available.</p>
          )}
        </div>
      )}
    </div>
  );
}
