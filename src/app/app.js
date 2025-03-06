import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import * as Speech from "expo-speech";
import axios from "axios";
import { Gyroscope } from "expo-sensors";
import Voice from "@react-native-voice/voice";
import Tts from "react-native-tts";
import { Camera } from "expo-camera";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import GoogleFit from "react-native-google-fit";
import * as SMS from "expo-sms";
import * as Location from "expo-location";
import { Linking } from "react-native";

const EMERGENCY_CONTACT = "1234567890"; // Replace with your actual emergency number

// --- Emergency Features Functions ---
const sendEmergencySMS = async () => {
  let location = await Location.getCurrentPositionAsync({});
  let message = `Emergency! I need help. My location: https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
  const isAvailable = await SMS.isAvailableAsync();
  if (isAvailable) {
    await SMS.sendSMSAsync([EMERGENCY_CONTACT], message);
    Alert.alert("SOS Alert Sent", "Your emergency contact has been notified.");
  } else {
    Alert.alert("Error", "SMS service is not available on this device.");
  }
};

const callEmergencyContact = () => {
  Linking.openURL(`tel:${EMERGENCY_CONTACT}`);
};

export default function App() {
  // States for text chat, voice input, heart rate, and face monitoring
  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [heartRate, setHeartRate] = useState(80);
  const [userSpeech, setUserSpeech] = useState("");
  const [botResponse, setBotResponse] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [anxietyDetected, setAnxietyDetected] = useState(false);
  const cameraRef = useRef(null);
  const recognitionRef = useRef(null);

  // Request camera permissions and initialize TensorFlow.js
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasCameraPermission(status === "granted");
      await tf.ready();
    })();
  }, []);

  // Setup Voice Recognition event
  useEffect(() => {
    Voice.onSpeechResults = async (event) => {
      if (event.value && event.value.length > 0) {
        const text = event.value[0];
        setUserSpeech(text);
        const emotion = await detectEmotion(text);
        let aiResponse;
        if (emotion === "Anxiety") {
          aiResponse =
            "I sense you're feeling anxious. Try deep breathing: Breathe in, hold, then breathe out slowly.";
        } else if (emotion === "Sad") {
          aiResponse =
            "I'm here for you. Would you like to listen to some relaxing music?";
        } else {
          aiResponse = "That’s great! Let’s keep the positivity going!";
        }
        setBotResponse(aiResponse);
        Tts.speak(aiResponse);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // --- Voice Interaction Functions ---
  const startListening = async () => {
    try {
      await Voice.start("en-US");
    } catch (error) {
      console.error("Error starting voice recognition:", error);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error("Error stopping voice recognition:", error);
    }
  };

  // Simulated call to a backend emotion detection API.
  const detectEmotion = async (message) => {
    try {
      const response = await axios.post("https://yourbackend.com/detect_emotion", { message });
      return response.data.emotion;
    } catch (error) {
      console.error("Error detecting emotion:", error);
      return "Neutral";
    }
  };

  // --- Chat Message Function ---
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
      const aiResponse = response.data.candidates?.[0]?.output || "Try slow breathing.";
      setChatHistory([...updatedChat, { sender: "ai", text: aiResponse }]);
      Speech.speak(aiResponse);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // --- Face Monitoring Function using BlazeFace ---
  const detectAnxiety = async () => {
    if (!cameraRef.current) return;
    const model = await blazeface.load();
    // Start an interval to capture and analyze frames every 3 seconds
    setInterval(async () => {
      if (!cameraRef.current) return;
      // Capture image from camera
      let photo = await cameraRef.current.takePictureAsync({ base64: true });
      // Convert the captured image to a tensor
      // NOTE: On mobile this conversion is non-trivial.
      // For demonstration, we simulate a detection result.
      // In production, you may use expo-gl and tfjs-react-native to process the image.
      const simulatedFaces = [{ topLeft: [100, 100], bottomRight: [150, 150], probability: 0.85 }];
      if (simulatedFaces.length > 0) {
        setFaceDetected(true);
        const { topLeft, bottomRight } = simulatedFaces[0];
        const eyeDistance = bottomRight[0] - topLeft[0];
        if (eyeDistance < 20) {
          setAnxietyDetected(true);
          Speech.speak("I'm detecting signs of anxiety. Let's take deep breaths together.");
        } else {
          setAnxietyDetected(false);
        }
      } else {
        setFaceDetected(false);
        setAnxietyDetected(false);
      }
    }, 3000);
  };

  // --- Heart Rate Functions ---
  const getHeartRate = () => {
    Gyroscope.addListener(({ y }) => {
      setHeartRate(80 + Math.abs(y * 10)); // Simulated heart rate using Gyroscope
    });
  };

  const startHeartRateTracking = async () => {
    const options = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      bucketUnit: "MINUTE",
      bucketInterval: 1,
    };
    GoogleFit.getHeartRateSamples(options)
      .then((res) => {
        const lastHeartRate = res.length > 0 ? res[res.length - 1].value : "N/A";
        setHeartRate(lastHeartRate);
      })
      .catch((err) => console.error("Error fetching heart rate:", err));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AI Mental Health Support</Text>

      {/* Emergency Features */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>🚨 Emergency Features</Text>
        <Button title="Send SOS Alert" onPress={sendEmergencySMS} color="red" />
        <Button title="Call Emergency Contact" onPress={callEmergencyContact} color="blue" />
      </View>

      {/* AI Therapy Chat */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>AI Therapy Chat</Text>
        {chatHistory.map((msg, index) => (
          <Text key={index} style={styles.chatText}>
            {msg.sender === "user" ? "You: " : "AI: "}
            {msg.text}
          </Text>
        ))}
        <TextInput
          value={userMessage}
          onChangeText={setUserMessage}
          placeholder="Type your message..."
          style={styles.input}
        />
        <Button title="Send Message" onPress={sendMessage} />
      </View>

      {/* Voice Interaction */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Voice Interaction</Text>
        <View style={styles.buttonRow}>
          <Button title="Start Talking" onPress={startListening} color="#f59e0b" />
          <Button title="Stop Talking" onPress={stopListening} color="#f59e0b" />
        </View>
        <Text>User Speech: {userSpeech}</Text>
        <Text>AI Response: {botResponse}</Text>
      </View>

      {/* Heart Rate Monitoring */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Heart Rate: {heartRate} BPM</Text>
        <Button title="Get Heart Rate (Gyroscope)" onPress={getHeartRate} />
        <Button title="Get Heart Rate (Google Fit)" onPress={startHeartRateTracking} />
      </View>

      {/* Face Monitoring */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Face Monitoring</Text>
        {hasCameraPermission === null && <Text>Requesting camera permission...</Text>}
        {hasCameraPermission === false && <Text>No access to camera</Text>}
        {hasCameraPermission && (
          <View style={styles.cameraContainer}>
            <Camera ref={cameraRef} style={styles.camera} />
            {anxietyDetected && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>
                  Stress Detected! Please try deep breathing.
                </Text>
              </View>
            )}
          </View>
        )}
        <Button title="Start Face Monitoring" onPress={detectAnxiety} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f3f4f6" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  section: { marginVertical: 10, padding: 10, backgroundColor: "#fff", borderRadius: 8, elevation: 3 },
  sectionHeader: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  chatText: { fontSize: 14, marginVertical: 2 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginVertical: 10, borderRadius: 6 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  cameraContainer: { position: "relative", width: "100%", height: 300, borderRadius: 8, overflow: "hidden" },
  camera: { width: "100%", height: "100%" },
  overlay: { 
    position: "absolute", 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  overlayText: { color: "red", fontSize: 20, fontWeight: "bold", textAlign: "center" },
});
