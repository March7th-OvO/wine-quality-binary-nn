import json
import os
import random

import joblib
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

from .config import (
    BATCH_SIZE,
    DATA_PATH,
    EPOCHS,
    LEARNING_RATE,
    METRICS_SAVE_PATH,
    MODEL_SAVE_PATH,
    RANDOM_SEED,
    SCALER_SAVE_PATH,
)
from .data_loader import get_dataloaders
from .evaluate import evaluate_model
from .model import WineQualityMLP


def set_random_seeds(seed):
    """固定 Python、NumPy 与 PyTorch 的随机状态，确保训练可复现。"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def train():
    set_random_seeds(RANDOM_SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Check if data exists securely
    if not os.path.exists(DATA_PATH):
        print(f"Error: dataset not found at {DATA_PATH}")
        print("Please place 'winequality-red.csv' in the data directory.")
        return

    print("Loading data...")
    train_loader, val_loader, test_loader, scaler = get_dataloaders(batch_size=BATCH_SIZE)

    model = WineQualityMLP(input_dim=11).to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # Save the fitted scaler
    joblib.dump(scaler, SCALER_SAVE_PATH)
    print(f"Scaler saved to {SCALER_SAVE_PATH}")

    best_f1 = 0.0
    best_epoch = 0

    print("Starting training loop...")
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        avg_train_loss = train_loss / len(train_loader)

        # Evaluate
        val_loss, metrics = evaluate_model(model, val_loader, criterion, device)

        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(
                f"Epoch [{epoch + 1}/{EPOCHS}] - "
                f"Train Loss: {avg_train_loss:.4f} - Val Loss: {val_loss:.4f} - "
                f"Accuracy: {metrics['accuracy']:.4f} - F1: {metrics['f1_score']:.4f}"
            )

        # Save best model
        if metrics["f1_score"] > best_f1:
            best_f1 = metrics["f1_score"]
            best_epoch = epoch + 1
            torch.save(model.state_dict(), MODEL_SAVE_PATH)

    # 最终指标必须来自已保存的最佳模型，并且测试集只在此处评估一次。
    model.load_state_dict(torch.load(MODEL_SAVE_PATH, map_location=device))
    test_loss, test_metrics = evaluate_model(model, test_loader, criterion, device)
    report = {
        **test_metrics,
        "test_loss": float(test_loss),
        "best_epoch": best_epoch,
        "selection_metric": "validation_f1_score",
        "best_validation_f1": float(best_f1),
        "random_seed": RANDOM_SEED,
        "evaluation_split": "test",
    }
    with open(METRICS_SAVE_PATH, "w", encoding="utf-8") as metrics_file:
        json.dump(report, metrics_file, indent=4)

    print(f"Training completed. Best model saved to {MODEL_SAVE_PATH}")
    print(f"Test metrics saved to {METRICS_SAVE_PATH}")


if __name__ == "__main__":
    train()
