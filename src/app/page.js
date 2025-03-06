"use client";
import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import AITherapyChat from "./components/AITherapyChat";
import HeartRateMonitor from "./components/HeartRateMonitor";
import SOSButton from "./components/SOSButton";
import WebcamMonitor from "./components/WebcamMonitor";
import FaceEmotionDetector from "./components/FaceEmotionDetector"; // Adjust the path as necessary

const EMERGENCY_CONTACT = "1234567890"; // Replace with your actual emergency number

export default function Home() {
  // States for various features
  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [heartRate, setHeartRate] = useState(80); // Simulated heart rate
  const [userSpeech, setUserSpeech] = useState("");
  const [botResponse, setBotResponse] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [anxietyDetected, setAnxietyDetected] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState("");
  const [anxietyLevel, setAnxietyLevel] = useState("");
  const [emotionInput, setEmotionInput] = useState("");
  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize TensorFlow.js
  useEffect(() => {
    tf.ready();
  }, []);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.continuous = false;

        recognitionRef.current.onresult = async (event) => {
          const text = event.results[0][0].transcript;
          setUserSpeech(text);
          const emotion = await detectEmotionFromText(text);
          let aiResponse =
            emotion === "Anxiety"
              ? "I sense anxiety. Try deep breathing."
              : emotion === "Sad"
              ? "I’m here for you. Want some music?"
              : "Great! Let’s keep the positivity!";
          setBotResponse(aiResponse);
          speak(aiResponse);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
        };
      }
    }
  }, []);

  // Helper Functions
  const detectEmotionFromText = async (message) => {
    try {
      const response = await fetch("/api/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      return data.emotion || "Neutral";
    } catch (error) {
      console.error("Error detecting emotion:", error);
      return "Neutral";
    }
  };

  const sendEmergencySMS = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        alert(
          `Simulated SMS: "Emergency! Location: https://www.google.com/maps?q=${latitude},${longitude}" sent to ${EMERGENCY_CONTACT}`
        );
      },
      () => alert("Emergency SMS simulated (location unavailable).")
    );
  };

  const callEmergencyContact = () => {
    window.open(`tel:${EMERGENCY_CONTACT}`, "_self");
  };

  const startListening = () => {
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const speak = (text) => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim()) return;
    const updatedChat = [...chatHistory, { sender: "user", text: userMessage }];
    setChatHistory(updatedChat);
    setUserMessage("");
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText",
        { prompt: { text: `Calm me down: ${userMessage}` } },
        { params: { key: "YOUR_GEMINI_API_KEY" } }
      );
      const aiResponse =
        response.data.candidates?.[0]?.output || "Try slow breathing.";
      setChatHistory([...updatedChat, { sender: "ai", text: aiResponse }]);
      speak(aiResponse);
    } catch (error) {
      setChatHistory([...updatedChat, { sender: "ai", text: "Sorry, try again!" }]);
    }
  };

  const detectAnxiety = async () => {
    const model = await blazeface.load();
    setInterval(async () => {
      if (!webcamRef.current?.video) return;
      const predictions = await model.estimateFaces(webcamRef.current.video, false);
      setFaceDetected(predictions.length > 0);
      if (predictions.length > 0) {
        const eyeDistance =
          predictions[0].bottomRight[0] - predictions[0].topLeft[0];
        setAnxietyDetected(eyeDistance < 20);
        if (eyeDistance < 20) speak("Let’s take deep breaths together.");
      } else {
        setAnxietyDetected(false);
      }
    }, 3000);
  };

  const getHeartRate = () => {
    setHeartRate(Math.floor(Math.random() * (100 - 60) + 60));
  };

  const handleDetectEmotion = async () => {
    const emotion = await detectEmotionFromText(emotionInput);
    setDetectedEmotion(emotion);
  };

  const predictStress = async () => {
    try {
      const response = await fetch("/api/stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heart_rate: parseFloat(heartRate) }),
      });
      const data = await response.json();
      setAnxietyLevel(data.anxiety_level || "Error");
    } catch (error) {
      setAnxietyLevel("Error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          AI Mental Health Support
        </h1>

        {/* Emergency Features */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            🚨 Emergency Features
          </h2>
          <div className="p-4">
      <FaceEmotionDetector />
      {/* Other components or content */}
    </div>
          <div className="flex space-x-4">
            <SOSButton />
            <button
              onClick={callEmergencyContact}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600 transition"
            >
              Call Emergency
            </button>
          </div>
        </section>

        {/* AI Therapy Chat */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            AI Therapy Chat
          </h2>
          <AITherapyChat />
        </section>

        {/* Heart Rate Monitoring */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Heart Rate Monitoring
          </h2>
          <HeartRateMonitor />
        </section>

        {/* Voice Interaction */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Voice Interaction
          </h2>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={startListening}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
            >
              Start Talking
            </button>
            <button
              onClick={stopListening}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
            >
              Stop Talking
            </button>
          </div>
          <p className="text-gray-600">User Speech: {userSpeech}</p>
          <p className="text-gray-600">AI Response: {botResponse}</p>
        </section>

        {/* Emotion Detection */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Detect Emotion
          </h2>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={emotionInput}
              onChange={(e) => setEmotionInput(e.target.value)}
              placeholder="Enter text to detect emotion"
              className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleDetectEmotion}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
            >
              Detect
            </button>
          </div>
          {detectedEmotion && (
            <p className="text-gray-600">Emotion: {detectedEmotion}</p>
          )}
        </section>

        {/* Stress Prediction */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Predict Stress
          </h2>
          <div className="flex space-x-2 mb-4">
            <input
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="Enter heart rate"
              className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={predictStress}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              Predict
            </button>
          </div>
          {anxietyLevel && (
            <p className="text-gray-600">Anxiety Level: {anxietyLevel}</p>
          )}
        </section>

        {/* Face Monitoring */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Face Monitoring
          </h2>
          <WebcamMonitor />
        </section>
      </div>
    </div>
  );
}
