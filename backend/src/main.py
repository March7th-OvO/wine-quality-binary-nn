import json
import torch
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from .config import MODEL_SAVE_PATH, SCALER_SAVE_PATH, METRICS_SAVE_PATH
from .model import WineQualityMLP

app = FastAPI(title="Wine Quality API")

# Enable CORS for React JS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input data schema
class WineFeatures(BaseModel):
    fixed_acidity: float
    volatile_acidity: float
    citric_acid: float
    residual_sugar: float
    chlorides: float
    free_sulfur_dioxide: float
    total_sulfur_dioxide: float
    density: float
    pH: float
    sulphates: float
    alcohol: float

# Global variables for model and scaler
model = None
scaler = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

@app.on_event("startup")
async def load_artifacts():
    global model, scaler
    
    if os.path.exists(SCALER_SAVE_PATH) and os.path.exists(MODEL_SAVE_PATH):
        try:
            scaler = joblib.load(SCALER_SAVE_PATH)
            model = WineQualityMLP(input_dim=11)
            model.load_state_dict(torch.load(MODEL_SAVE_PATH, map_location=device))
            model.to(device)
            model.eval()
            print("Model and Scaler loaded successfully.")
        except Exception as e:
            print(f"Failed to load specific model artifacts: {e}")
    else:
        print("Warning: Model or scaler not found. Prediction endpoint will fail until trained.")

@app.get("/api/metrics")
async def get_metrics():
    if not os.path.exists(METRICS_SAVE_PATH):
        raise HTTPException(status_code=404, detail="Metrics file not found. Have you trained the model?")
        
    try:
        with open(METRICS_SAVE_PATH, 'r') as f:
            metrics = json.load(f)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
async def predict_quality(features: WineFeatures):
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please train the model first.")
        
    try:
        # Convert input to array
        input_data = [[
            features.fixed_acidity, features.volatile_acidity, features.citric_acid,
            features.residual_sugar, features.chlorides, features.free_sulfur_dioxide,
            features.total_sulfur_dioxide, features.density, features.pH,
            features.sulphates, features.alcohol
        ]]
        
        # Scale features
        scaled_input = scaler.transform(input_data)
        
        # Convert to tensor
        tensor_input = torch.tensor(scaled_input, dtype=torch.float32).to(device)
        
        # Inference
        with torch.no_grad():
            output = model(tensor_input)
            prob = torch.sigmoid(output).item()
            
        label = 1 if prob >= 0.5 else 0
        
        return {
            "label": label,
            "probability": float(prob)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error executing prediction: {str(e)}")

# Health check
@app.get("/")
async def root():
    return {"status": "ok", "message": "Wine Quality Prediction API is running"}
