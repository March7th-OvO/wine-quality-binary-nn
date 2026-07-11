import numpy as np
from src.data_loader import get_dataloaders


def test_data_split_is_stratified_and_disjoint_in_size():
    train_loader, val_loader, test_loader, _ = get_dataloaders(batch_size=32)
    sizes = [len(loader.dataset) for loader in (train_loader, val_loader, test_loader)]
    assert sum(sizes) == 1599
    assert sizes == [959, 320, 320]

    ratios = []
    for loader in (train_loader, val_loader, test_loader):
        labels = loader.dataset.labels.numpy().ravel()
        ratios.append(float(np.mean(labels)))
    assert max(ratios) - min(ratios) < 0.01
