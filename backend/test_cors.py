from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze_text():
    logger.info(f"Received {request.method} request with headers: {request.headers}")
    
    if request.method == 'OPTIONS':
        logger.info("Handling OPTIONS request")
        return '', 200
    
    data = request.get_json()
    logger.info(f"Received data: {data}")
    return jsonify({'message': 'CORS test successful', 'received': data})

if __name__ == '__main__':
    logger.info("Starting test CORS server on port 5001...")
    app.run(debug=True, port=5001)