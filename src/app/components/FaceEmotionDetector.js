import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const FaceEmotionDetector = () => {
  const webcamRef = useRef(null);
  const [expressions, setExpressions] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Ensure your models are in the public folder
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log("Models loaded");
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    loadModels();
  }, []);

  const handleVideoOnPlay = () => {
    // Do not run detection until models are loaded
    if (!modelsLoaded) return;

    setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
        const detections = await faceapi
          .detectAllFaces(webcamRef.current.video, options)
          .withFaceExpressions();
        console.log("Detections:", detections);
        if (detections.length > 0) {
          setExpressions(detections[0].expressions);
        } else {
          setExpressions(null);
        }
      }
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow rounded-lg p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Face Emotion Detector</h2>
      <Webcam
        audio={false}
        ref={webcamRef}
        onPlay={handleVideoOnPlay}
        className="w-full h-auto rounded-lg"
      />
      {expressions ? (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Detected Emotions:</h3>
          <ul>
            {Object.entries(expressions).map(([expression, score]) => (
              <li key={expression} className="text-gray-700">
                {expression}: {(score * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 text-center text-gray-500">
          {modelsLoaded ? "No face detected or no expressions recognized." : "Loading models..."}
        </div>
      )}
    </div>
  );
};

export default FaceEmotionDetector;
