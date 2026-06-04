import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from .config import DATA_PATH, THRESHOLD
import os

class WineDataset(Dataset):
    def __init__(self, features, labels):
        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32).unsqueeze(1)
        
    def __len__(self):
        return len(self.labels)
        
    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]

def load_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Data file not found at {DATA_PATH}. Please ensure winequality-red.csv is present.")
        
    df = pd.read_csv(DATA_PATH, sep=None, engine='python')
    
    # Binary classification threshold
    df['label'] = (df['quality'] >= THRESHOLD).astype(int)
    
    X = df.drop(['quality', 'label'], axis=1).values
    y = df['label'].values
    
    return X, y

def get_dataloaders(batch_size=32):
    X, y = load_data()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    train_dataset = WineDataset(X_train_scaled, y_train)
    test_dataset = WineDataset(X_test_scaled, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, test_loader, scaler
