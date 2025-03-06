import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

const HeartRateMonitor = () => {
  const webcamRef = useRef(null);
  const [heartRate, setHeartRate] = useState(null);
  const [heartRateHistory, setHeartRateHistory] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  let frameData = [];

  useEffect(() => {
    const captureHeartRate = async () => {
      if (!webcamRef.current || !webcamRef.current.video) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const video = webcamRef.current.video;

      canvas.width = 50;
      canvas.height = 50;

      let lastTimestamp = performance.now();

      const processFrame = () => {
        ctx.drawImage(
          video,
          video.videoWidth / 2 - 25,
          video.videoHeight / 2 - 25,
          50,
          50,
          0,
          0,
          50,
          50
        );
        const imageData = ctx.getImageData(0, 0, 50, 50);
        const avgBrightness =
          imageData.data.reduce((sum, value, index) => (index % 4 === 0 ? sum + value : sum), 0) /
          (50 * 50);

        const currentTime = performance.now();
        const timeDiff = (currentTime - lastTimestamp) / 1000;
        lastTimestamp = currentTime;

        frameData.push({ brightness: avgBrightness, time: timeDiff });

        if (frameData.length > 60) frameData.shift();

        if (frameData.length >= 30) {
          const peaks = detectPeaks(frameData.map((d) => d.brightness));
          const bpm = (peaks.length / frameData.length) * 60;
          const roundedBpm = Math.round(bpm);

          setHeartRate(roundedBpm);
          setHeartRateHistory((prevHistory) => [...prevHistory.slice(-10), roundedBpm]);

          if (roundedBpm > 120) {
            setAlertMessage("⚠ High heart rate detected! Try deep breathing.");
            startVoiceAlert();
          } else {
            setAlertMessage("");
          }
        }

        requestAnimationFrame(processFrame);
      };

      processFrame();
    };

    captureHeartRate();
  }, []);

  const detectPeaks = (data) => {
    let peaks = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) peaks.push(i);
    }
    return peaks;
  };

  const suggestCalmingExercise = (bpm) => {
    if (bpm > 120) {
      return "Your heart rate is high! Try deep breathing: Inhale for 4 seconds... Hold for 4 seconds... Exhale slowly.";
    } else if (bpm > 100) {
      return "You're a little stressed. Try closing your eyes and taking slow deep breaths.";
    } else {
      return "You're doing well! Stay relaxed and continue at your own pace.";
    }
  };

  const startVoiceAlert = () => {
    const speech = new SpeechSynthesisUtterance();
    speech.text = "Warning! Your heart rate is high. Try deep breathing. Inhale... Hold... Exhale.";
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    window.speechSynthesis.speak(speech);
  };

  const getHeartRateColor = (bpm) => {
    if (bpm > 120) return "text-red-500";
    if (bpm > 100) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg shadow-md max-w-md mx-auto">
      <Webcam ref={webcamRef} className="w-full h-auto mb-4 rounded-lg" />
      <div className="w-full space-y-2">
        <h2
          className={`text-2xl font-bold ${
            heartRate ? getHeartRateColor(heartRate) : "text-gray-500"
          }`}
        >
          Heart Rate: {heartRate ? `${heartRate} BPM` : "Measuring..."}
        </h2>
        {alertMessage && (
          <h3 className="text-lg font-semibold text-red-500">{alertMessage}</h3>
        )}
        <h3 className="text-md text-gray-600">
          Heart Rate History: {heartRateHistory.join(", ")}
        </h3>
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
          <p className="font-semibold">AI Calming Suggestion:</p>
          <p>{suggestCalmingExercise(heartRate)}</p>
        </div>
      </div>
    </div>
  );
};

export default HeartRateMonitor;