from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Data paths
DATA_PATH = BASE_DIR / "data" / "winequality-red.csv"

# Model paths
MODEL_SAVE_PATH = BASE_DIR / "wine_quality_mlp.pt"
SCALER_SAVE_PATH = BASE_DIR / "scaler.joblib"
METRICS_SAVE_PATH = BASE_DIR / "metrics.json"

# Training hyperparameters
BATCH_SIZE = 32
LEARNING_RATE = 0.001
EPOCHS = 100
THRESHOLD = 6  # wine quality >= 6 is 1, else 0
RANDOM_SEED = 42
TEST_SIZE = 0.2
VALIDATION_SIZE = 0.2
