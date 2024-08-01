import React, { useRef, useEffect, useState } from "react";

import videoBackground from "./videoBackground";

const BACKGROUND_OPTIONS = ["none", "blur", "image"];

function App() {
  const [cameraReady, setCameraReady] = useState(false);
  const [backgroundType, setBackgroundType] = useState(BACKGROUND_OPTIONS[1]);
  const videoRef = useRef(null);
  const canvasRef = useRef();

  useEffect(() => {
    async function getVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    }

    getVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraReady || backgroundType === "none") return;

    const bgFn =
      backgroundType === "blur" ? videoBackground.blur : videoBackground.remove;

    bgFn(canvasRef.current, videoRef.current);

    return () => {
      videoBackground.stop();
    };
  }, [cameraReady, backgroundType]);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        width="640"
        height="480"
        style={
          backgroundType === "none"
            ? { transform: "scaleX(-1)" }
            : { display: "none" }
        }
        onLoadedMetadata={() => setCameraReady(true)}
      />
      {backgroundType === "image" && (
        <img
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "640px",
            height: "480px",
          }}
          src="/bgImage.png"
        />
      )}
      {backgroundType !== "none" && (
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ transform: "scaleX(-1)" }}
        />
      )}

      <div>
        <select
          value={backgroundType}
          onChange={(e) => setBackgroundType(e.target.value)}
        >
          {BACKGROUND_OPTIONS.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default App;
