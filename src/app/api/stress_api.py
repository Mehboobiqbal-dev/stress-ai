import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
from flask import Flask, request, jsonify
import numpy as np

# Load data
df = pd.read_csv("stress_data.csv")

# Convert text labels to numbers
encoder = LabelEncoder()
df["anxiety_level"] = encoder.fit_transform(df["anxiety_level"])

# Save the encoder for later use
pickle.dump(encoder, open("stress_label_encoder.pkl", "wb"))

# Split data
X = df[["heart_rate"]]
y = df["anxiety_level"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Build Neural Network Model
model = tf.keras.models.Sequential([
    tf.keras.layers.Dense(16, activation="relu"),
    tf.keras.layers.Dense(8, activation="relu"),
    tf.keras.layers.Dense(3, activation="softmax")
])

model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

# Train model
model.fit(X_train, y_train, epochs=50, validation_data=(X_test, y_test))

# Save model
model.save("stress_predictor.h5")

# Flask app for serving predictions
app = Flask(__name__)

# Load the model and encoder
model = tf.keras.models.load_model("stress_predictor.h5")
encoder = pickle.load(open("stress_label_encoder.pkl", "rb"))

@app.route("/predict_stress", methods=["POST"])
def predict_stress():
    data = request.json
    heart_rate = data["heart_rate"]
    # Predict (model expects a 2D array: [samples, features])
    prediction = model.predict([[heart_rate]])
    anxiety_level_encoded = np.argmax(prediction, axis=1)[0]
    anxiety_level = encoder.inverse_transform([anxiety_level_encoded])[0]
    return jsonify({"anxiety_level": anxiety_level})

if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Use port 5001 to avoid conflict with emotion-model.py