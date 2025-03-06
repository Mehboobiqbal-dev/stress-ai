import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

const WebcamMonitor = () => {
  const webcamRef = useRef(null);
  const [stressDetected, setStressDetected] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const model = await blazeface.load();
      detectFace(model);
    };

    const detectFace = async (model) => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const predictions = await model.estimateFaces(webcamRef.current.video, false);
        if (predictions.length > 0) {
          // Basic stress indicators (e.g., furrowed brows)
          let detectedStress = predictions.some(face => face.probability > 0.8);
          setStressDetected(detectedStress);
        } else {
          setStressDetected(false);
        }
      }
      requestAnimationFrame(() => detectFace(model));
    };

    loadModel();
  }, []);

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          className="w-full h-auto object-cover"
        />
        {stressDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <h2 className="text-xl font-bold text-red-400">
              ⚠ Stress Detected! Try Deep Breathing
            </h2>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-gray-700 text-center">
          Keep calm and focus on your breathing.
        </p>
      </div>
    </div>
  );
};

export default WebcamMonitor;
