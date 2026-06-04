import torch
import torch.nn as nn
import torch.optim as optim
import joblib
import os
from .model import WineQualityMLP
from .data_loader import get_dataloaders
from .evaluate import evaluate_model
from .config import MODEL_SAVE_PATH, SCALER_SAVE_PATH, EPOCHS, LEARNING_RATE, BATCH_SIZE, DATA_PATH

def train():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Check if data exists securely
    if not os.path.exists(DATA_PATH):
        print(f"Error: dataset not found at {DATA_PATH}")
        print("Please place 'winequality-red.csv' in the data directory.")
        return
        
    print("Loading data...")
    train_loader, test_loader, scaler = get_dataloaders(batch_size=BATCH_SIZE)
    
    model = WineQualityMLP(input_dim=11).to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # Save the fitted scaler
    joblib.dump(scaler, SCALER_SAVE_PATH)
    print(f"Scaler saved to {SCALER_SAVE_PATH}")
    
    best_f1 = 0.0
    
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
        val_loss, metrics = evaluate_model(model, test_loader, criterion, device)
        
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"Epoch [{epoch+1}/{EPOCHS}] - "
                  f"Train Loss: {avg_train_loss:.4f} - Val Loss: {val_loss:.4f} - "
                  f"Accuracy: {metrics['accuracy']:.4f} - F1: {metrics['f1_score']:.4f}")
            
        # Save best model
        if metrics['f1_score'] > best_f1:
            best_f1 = metrics['f1_score']
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            
    print(f"Training completed. Best model saved to {MODEL_SAVE_PATH}")
    
if __name__ == "__main__":
    train()
