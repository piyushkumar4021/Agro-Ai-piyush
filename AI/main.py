from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
from datetime import datetime

# 1. Initialize the FastAPI app
app = FastAPI(title="Agro Price Prediction API")

origins = [
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# 2. Load the trained model
# It's best practice to load the model once when the app starts
try:
    model = joblib.load('agro_price_model.pkl')
except Exception as e:
    print(f"Error loading the model: {e}")
    model = None

# 3. Define the expected data format from your Node.js backend
class PredictionRequest(BaseModel):
    State: str
    District: str
    Commodity: str
    Arrival_Date: str  # Expected format: "DD-MM-YYYY"

# 4. Create the prediction endpoint
@app.post("/predict-price")
async def predict_price(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")

    try:
        # Parse the date string to extract Year, Month, and Day
        # This matches the feature engineering we did during training
        date_obj = datetime.strptime(request.Arrival_Date, "%d-%m-%Y")
        
        # Create a single-row DataFrame exactly as the pipeline expects
        input_data = pd.DataFrame([{
            'State': request.State,
            'District': request.District,
            'Commodity': request.Commodity,
            'Year': date_obj.year,
            'Month': date_obj.month,
            'Day': date_obj.day
        }])

        # Make the prediction
        prediction = model.predict(input_data)

        # Return the result as JSON
        return {
            "predicted_modal_price": round(float(prediction[0]), 2),
            "commodity": request.Commodity,
            "district": request.District
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Date formatting error. Use DD-MM-YYYY. Details: {ve}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# Health check endpoint
@app.get("/")
def read_root():
    return {"status": "Agro AI Model is running!"}