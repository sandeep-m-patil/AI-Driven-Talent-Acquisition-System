"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Home() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoSummary, setVideoSummary] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);

  // Request webcam access on mount
  useEffect(() => {
    async function getWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          setWebcamReady(true);
        }
      } catch (err) {
        alert("Error accessing webcam: " + err.message);
      }
    }
    getWebcam();

    // Cleanup on unmount
    return () => {
      if (webcamRef.current && webcamRef.current.srcObject) {
        webcamRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function startRecording() {
    if (!webcamReady || !webcamRef.current || !webcamRef.current.srcObject) {
      alert("Webcam not ready");
      return;
    }

    chunksRef.current = [];
    const stream = webcamRef.current.srcObject;

    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        const type = blob.type;

        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.src = url;
        tempVideo.onloadedmetadata = () => {
          window.URL.revokeObjectURL(tempVideo.src);
          const duration = tempVideo.duration.toFixed(2);

          setVideoSummary({
            sizeMB,
            type,
            duration,
          });
        };
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("MediaRecorder error: " + err.message);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Webcam Recorder</h2>

      <video
        ref={webcamRef}
        autoPlay
        muted
        playsInline
        style={{ width: "320px", height: "240px", backgroundColor: "#000" }}
      ></video>

      {!webcamReady && <p>Loading webcam...</p>}

      <div style={{ marginTop: 10 }}>
        {!recording ? (
          <button onClick={startRecording} disabled={!webcamReady}>
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
      </div>

      {videoUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Recorded Video Preview</h3>
          <video src={videoUrl} controls style={{ width: "320px", height: "240px" }}></video>
        </div>
      )}

      {videoSummary && (
        <div style={{ marginTop: 20 }}>
          <h3>Recording Summary</h3>
          <ul>
            <li>
              <strong>Duration:</strong> {videoSummary.duration} seconds
            </li>
            <li>
              <strong>Size:</strong> {videoSummary.sizeMB} MB
            </li>
            <li>
              <strong>Format:</strong> {videoSummary.type}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
