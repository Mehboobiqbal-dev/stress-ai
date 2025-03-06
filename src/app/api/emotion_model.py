import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import pickle

# Load data
df = pd.read_csv("emotion_data.csv")

# Convert text labels to numbers
encoder = LabelEncoder()
df["emotion"] = encoder.fit_transform(df["emotion"])

# Save label encoder for later use
pickle.dump(encoder, open("label_encoder.pkl", "wb"))

# Convert text to numerical features
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["message"]).toarray()
y = df["emotion"]

# Save vectorizer
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Build Neural Network Model
model = tf.keras.models.Sequential([
    tf.keras.layers.Dense(32, activation="relu", input_shape=(X_train.shape[1],)),
    tf.keras.layers.Dense(16, activation="relu"),
    tf.keras.layers.Dense(len(df["emotion"].unique()), activation="softmax")
])

model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

# Train model
model.fit(X_train, y_train, epochs=30, validation_data=(X_test, y_test))

# Save model
model.save("emotion_detector.h5")
app = Flask(__name__)

# Load model and preprocessing tools
model = tf.keras.models.load_model("emotion_detector.h5")
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))
encoder = pickle.load(open("label_encoder.pkl", "rb"))

@app.route("/detect_emotion", methods=["POST"])
def detect_emotion():
    data = request.json
    message = data["message"]

    # Convert text to numerical format
    message_vector = vectorizer.transform([message]).toarray()

    # Predict emotion
    prediction = model.predict(message_vector)
    emotion = encoder.inverse_transform([np.argmax(prediction)])[0]

    return jsonify({"emotion": emotion})

if __name__ == "__main__":
    app.run(debug=True)