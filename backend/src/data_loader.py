import os

import pandas as pd
import torch
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, Dataset

from .config import DATA_PATH, RANDOM_SEED, TEST_SIZE, THRESHOLD, VALIDATION_SIZE


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
        raise FileNotFoundError(
            f"Data file not found at {DATA_PATH}. Please ensure winequality-red.csv is present."
        )

    df = pd.read_csv(DATA_PATH, sep=None, engine="python")

    # Binary classification threshold
    df["label"] = (df["quality"] >= THRESHOLD).astype(int)

    X = df.drop(["quality", "label"], axis=1).values
    y = df["label"].values

    return X, y


def get_dataloaders(batch_size=32):
    X, y = load_data()

    # 先留出只用于最终报告的测试集，再从剩余数据中拆分验证集。
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
    relative_validation_size = VALIDATION_SIZE / (1 - TEST_SIZE)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val,
        y_train_val,
        test_size=relative_validation_size,
        random_state=RANDOM_SEED,
        stratify=y_train_val,
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    train_dataset = WineDataset(X_train_scaled, y_train)
    val_dataset = WineDataset(X_val_scaled, y_val)
    test_dataset = WineDataset(X_test_scaled, y_test)

    generator = torch.Generator().manual_seed(RANDOM_SEED)
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True, generator=generator
    )
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader, test_loader, scaler
