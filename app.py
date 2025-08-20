# app.py
import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from a .env file
# This will now correctly find the .env file you renamed.
load_dotenv()

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# --- Google Gemini API Configuration ---
try:
    # Get the API key from environment variables - FIXED to match render.yaml
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        raise ValueError("GEMINI_API_KEY not found or is a placeholder in .env file")
    
    genai.configure(api_key=api_key)
    
    # Create the generative model
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    print("Gemini API configured successfully.")
    
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    model = None

# --- API Route for Chatting ---
@app.route('/chat', methods=['POST'])
def chat():
    if not model:
        return jsonify({"error": "Generative model not initialized. Check API key and server logs."}), 500

    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        print(f"Sending to Gemini: {user_message}")
        response = model.generate_content(user_message)
        ai_reply = response.text
        print(f"Received from Gemini: {ai_reply}")
        return jsonify({"reply": ai_reply})

    except Exception as e:
        print(f"An error occurred during Gemini API call: {e}")
        return jsonify({"error": "Failed to get response from AI"}), 500

# --- Health Check Route ---
@app.route('/', methods=['GET'])
def health_check():
    return "Flask server is running!"

# --- Main Execution Block ---
if __name__ == '__main__':
    # Using port 5001 to avoid conflicts with other services.
    app.run(host='0.0.0.0', port=5001, debug=True)
