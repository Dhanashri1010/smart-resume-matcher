from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

# Load SBERT model

model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/similarity', methods=['POST'])
def similarity():
    data = request.json
    text1 = data['text1']
    text2 = data['text2']


# Convert to embeddings
    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)

# Compute similarity
    score = util.cos_sim(emb1, emb2).item()

    return jsonify({'similarity': float(score)})


if __name__ == '__main__':
    app.run(port=5000)
