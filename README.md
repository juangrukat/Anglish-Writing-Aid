# Anglish Writing Aid

This project aims to help users write in "Anglish" by suggesting Old English-derived or Germanic alternatives to words of Latin, Greek, or French origin.

## Project Structure

- `backend/`: Contains the Python Flask/FastAPI application for text analysis and word suggestion.
- `frontend/`: Contains the React application for the user interface.

## Features

- **Text Analysis**: Analyze user-provided text to identify words that have Anglish alternatives.
- **Word Suggestions**: Provide attested and unattested Anglish replacements for identified words.
- **Interactive Replacement**: Allow users to interactively replace words in their text with suggested alternatives.
- **Smart Tooltips**: Tooltips with word suggestions intelligently position themselves to avoid being cut off at screen edges.
- **Cross-Origin Resource Sharing**: Properly configured CORS allows the frontend and backend to communicate securely.

## Setup and Installation

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Download the spaCy English model:
   ```bash
   python -m spacy download en_core_web_sm
   ```
4. Run the Flask application:
   ```bash
   python app.py
   ```
   The backend API will be running at `http://127.0.0.1:5002` (port 5002).

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend application will typically open in your browser at `http://localhost:3000`.

## Usage

1. Open your web browser and go to the frontend application URL (e.g., `http://localhost:3000`).
2. Paste or type your text into the provided input area.
3. The system will highlight words that have Anglish alternatives.
4. Click on the highlighted words to see suggestions and replace them interactively.