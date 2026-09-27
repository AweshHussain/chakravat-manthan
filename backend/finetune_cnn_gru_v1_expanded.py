#!/usr/bin/env python3
"""
Chakravat Manthan v1 Expanded Fine-Tuning Script.

Takes the best v1 trained checkpoint (chakravat_manthan_cnn_gru_fixed_best.pt, ~91.9% val accuracy)
and fine-tunes on the expanded 10-storm dataset (6,230 train frames, 1,556 test frames)
using a gentle learning rate (5e-5) to prevent catastrophic forgetting while teaching
the model new storm intensity patterns.
"""

import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import numpy as np
from collections import Counter
import random
import csv
from datetime import datetime
import json
import time
import math
import re

from temporal_sequence_builder import TemporalSequenceBuilder
from utils import IMAGE_SIZE, IMD_STAGES, STAGE_TO_IDX, NUM_CLASSES, STAGE_FULL_NAMES

# ---------------------------------------------------------------------------
# Paths & Hyperparameters
# ---------------------------------------------------------------------------
PROJECT_ROOT         = r"E:\got\colab_test_bundle"
TRAIN_CSV_PATH       = os.path.join(PROJECT_ROOT, "train_frames_expanded.csv")
TEST_CSV_PATH        = os.path.join(PROJECT_ROOT, "test_frames_expanded.csv")
BASE_CHECKPOINT_PATH = os.path.join(PROJECT_ROOT, "checkpoints", "chakravat_manthan_cnn_gru_fixed_best.pt")
CHECKPOINT_DIR       = os.path.join(PROJECT_ROOT, "checkpoints_finetuned_v1")
MANIFEST_DIR         = os.path.join(PROJECT_ROOT, "training_runs", "cnn_gru_finetuned_v1")
os.makedirs(CHECKPOINT_DIR, exist_ok=True)
os.makedirs(MANIFEST_DIR,   exist_ok=True)

SEED                = 42
BATCH_SIZE          = 16
NUM_WORKERS         = 2
LEARNING_RATE       = 5e-5      # Gentle fine-tuning rate
EPOCHS              = 5         # 5 targeted epochs to absorb new storms
EARLY_STOP_PATIENCE = 4
GRADIENT_CLIP       = 1.0
FOCAL_GAMMA         = 2.0
GRU_HIDDEN_DIM      = 128

MIN_SEQUENCE_LENGTH = 2
MAX_SEQUENCE_LENGTH = 10
MAX_GAP_MINUTES     = 90

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
class FixedTemporalChakravatManthan(nn.Module):
    def __init__(self,
                 input_channels: int = 3,
                 cnn_feature_dim: int = 256,
                 gru_hidden_dim:  int = GRU_HIDDEN_DIM,
                 metadata_dim:    int = 3,
                 num_classes:     int = NUM_CLASSES,
                 dropout:         float = 0.4):
        super().__init__()
        self.gru_hidden_dim  = gru_hidden_dim
        self.cnn_feature_dim = cnn_feature_dim

        self.conv_block1 = nn.Sequential(
            nn.Conv2d(input_channels, 32, 3, padding=1, bias=False),
            nn.BatchNorm2d(32), nn.ReLU(inplace=True),
        )
        self.pool1 = nn.MaxPool2d(2, 2)

        self.conv_block2 = nn.Sequential(
            nn.Conv2d(32, 64, 3, padding=1, bias=False),
            nn.BatchNorm2d(64), nn.ReLU(inplace=True),
        )
        self.pool2 = nn.MaxPool2d(2, 2)

        self.conv_block3 = nn.Sequential(
            nn.Conv2d(64, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
        )
        self.pool3 = nn.MaxPool2d(2, 2)

        self.conv_block4 = nn.Sequential(
            nn.Conv2d(128, 256, 3, padding=1, bias=False),
            nn.BatchNorm2d(256), nn.ReLU(inplace=True),
        )
        self.pool4 = nn.MaxPool2d(2, 2)

        self.global_avg_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.cnn_fc          = nn.Linear(256, cnn_feature_dim)
        self.cnn_bn          = nn.BatchNorm1d(cnn_feature_dim)

        self.gru = nn.GRU(
            input_size  = cnn_feature_dim + metadata_dim,
            hidden_size = gru_hidden_dim,
            num_layers  = 2,
            batch_first = True,
            dropout     = 0.3,
        )

        self.classifier = nn.Sequential(
            nn.Linear(gru_hidden_dim, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(64, num_classes),
        )

    def encode_frame(self, x):
        x = self.pool1(self.conv_block1(x))
        x = self.pool2(self.conv_block2(x))
        x = self.pool3(self.conv_block3(x))
        x = self.pool4(self.conv_block4(x))
        x = self.global_avg_pool(x).view(x.size(0), -1)
        x = self.cnn_fc(x)
        x = self.cnn_bn(x)
        return F.relu(x, inplace=True)

    def forward(self, image_sequences, metadata_sequences):
        B, T = image_sequences.shape[:2]
        cnn_in = image_sequences.view(-1, *image_sequences.shape[2:])
        feats  = self.encode_frame(cnn_in)
        feats  = feats.view(B, T, -1)

        gru_in     = torch.cat([feats, metadata_sequences], dim=2)
        gru_out, _ = self.gru(gru_in)
        final      = gru_out[:, -1, :]
        logits     = self.classifier(final)
        return logits, None, None

# ---------------------------------------------------------------------------
# Focal Loss
# ---------------------------------------------------------------------------
class FocalLoss(nn.Module):
    def __init__(self, gamma: float = 2.0, alpha=None, reduction: str = "mean"):
        super().__init__()
        self.gamma     = gamma
        self.alpha     = alpha
        self.reduction = reduction

    def forward(self, logits, targets):
        log_probs = F.log_softmax(logits, dim=1)
        probs     = log_probs.exp()
        log_pt    = log_probs.gather(1, targets.unsqueeze(1)).squeeze(1)
        pt        = probs.gather(1, targets.unsqueeze(1)).squeeze(1)

        focal_weight = (1 - pt) ** self.gamma
        loss         = -focal_weight * log_pt

        if self.alpha is not None:
            alpha_t = self.alpha.to(logits.device)[targets]
            loss    = alpha_t * loss

        if self.reduction == "mean":
            return loss.mean()
        elif self.reduction == "sum":
            return loss.sum()
        return loss

# ---------------------------------------------------------------------------
# Dataset & Sampler
# ---------------------------------------------------------------------------
def set_seeds(seed=SEED):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.benchmark = True

def load_csv_data(csv_path):
    data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ts = row['satellite_timestamp'].replace("T", " ").strip()
            row['timestamp_dt'] = datetime.strptime(ts, '%Y-%m-%d %H:%M:%S')
            data.append(row)
    return data

def parse_intensity_class(intensity_class_str):
    if not intensity_class_str or not isinstance(intensity_class_str, str):
        return None, False, "Empty or invalid"
    clean_str = intensity_class_str.strip()
    if clean_str in STAGE_TO_IDX:
        return clean_str, True, ""
    first_space = clean_str.find(' ')
    if first_space != -1:
        prefix = clean_str[:first_space]
        if prefix in STAGE_TO_IDX:
            return prefix, True, ""
    return None, False, f"Unknown class: {clean_str}"

class CycloneSequenceDataset(Dataset):
    def __init__(self, csv_data, sequence_builder):
        self.csv_data         = csv_data
        self.sequence_builder = sequence_builder
        self.sequences        = sequence_builder.build_sequences_from_data(csv_data)

        valid_sequences = []
        invalid_count   = 0
        for seq_info in self.sequences:
            bad = False
            for fidx in seq_info['frames']:
                row = self.csv_data[fidx]
                try:
                    lat = float(row['latitude'])
                    lon = float(row['longitude'])
                    if not (math.isfinite(lat) and math.isfinite(lon)):
                        bad = True
                        break
                except (ValueError, KeyError):
                    bad = True
                    break
            if bad:
                invalid_count += 1
            else:
                valid_sequences.append(seq_info)

        self.sequences = valid_sequences
        print(f"Loaded {len(self.csv_data)} frames -> Using {len(self.sequences)} valid sequences (excluded {invalid_count})")

    def get_label(self, idx):
        seq_info  = self.sequences[idx]
        final_idx = seq_info['frames'][-1]
        row       = self.csv_data[final_idx]
        abbr, ok, _ = parse_intensity_class(row['intensity_class'])
        if not ok:
            return 0
        return STAGE_TO_IDX[abbr]

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        seq_info = self.sequences[idx]
        images, labels, metadata, storms = self.sequence_builder.get_sequence_data(
            self.csv_data, seq_info)
        final_label = labels[-1]
        return images, final_label, metadata, storms[0]

def collate_fn(batch):
    images_list   = [item[0] for item in batch]
    labels_list   = [item[1] for item in batch]
    metadata_list = [item[2] for item in batch]
    storm_names   = [item[3] for item in batch]

    lengths    = torch.tensor([s.shape[0] for s in images_list], dtype=torch.long)
    max_length = lengths.max().item()
    B          = len(batch)
    _, C, H, W = images_list[0].shape

    padded_images   = torch.zeros(B, max_length, C, H, W, dtype=torch.float32)
    padded_labels   = torch.zeros(B, dtype=torch.long)
    padded_metadata = torch.zeros(B, max_length, 3, dtype=torch.float32)

    for i in range(B):
        L   = images_list[i].shape[0]
        pad = max_length - L
        padded_images[i, pad:]   = images_list[i]
        padded_metadata[i, pad:] = metadata_list[i]
        padded_labels[i]         = labels_list[i]

    return padded_images, padded_labels, padded_metadata, storm_names, lengths

def build_focal_alpha(train_labels, device):
    counts     = Counter(train_labels)
    total      = len(train_labels)
    alpha_vals = torch.zeros(NUM_CLASSES, dtype=torch.float32)
    for c in range(NUM_CLASSES):
        cnt = counts.get(c, 0)
        alpha_vals[c] = math.sqrt(total / (cnt + 1))
    alpha_vals = alpha_vals / alpha_vals.mean()
    return alpha_vals.to(device)

def build_weighted_sampler(train_dataset):
    labels  = [train_dataset.get_label(i) for i in range(len(train_dataset))]
    counts  = Counter(labels)
    weights = [1.0 / counts[lbl] for lbl in labels]
    return WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)

# ---------------------------------------------------------------------------
# Training & Evaluation
# ---------------------------------------------------------------------------
def train_epoch(model, loader, criterion, optimizer, scaler, device, grad_clip=1.0):
    model.train()
    total_loss, total_corr, total_samp = 0.0, 0, 0
    t0 = time.time()

    for batch_idx, batch_data in enumerate(loader):
        images, labels, metadata, _, _ = batch_data
        images   = images.to(device, non_blocking=True)
        labels   = labels.to(device, non_blocking=True)
        metadata = metadata.to(device, non_blocking=True)

        optimizer.zero_grad(set_to_none=True)
        with torch.cuda.amp.autocast(enabled=(scaler is not None)):
            logits, _, _ = model(images, metadata)
            loss         = criterion(logits, labels)

        if scaler is not None:
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
            optimizer.step()

        preds       = logits.argmax(dim=-1)
        corr        = (preds == labels).sum().item()
        batch_n     = labels.size(0)
        total_loss += loss.item() * batch_n
        total_corr += corr
        total_samp += batch_n

        if (batch_idx + 1) % 50 == 0 or (batch_idx + 1) == len(loader):
            print(f"  batch [{batch_idx+1:4d}/{len(loader):4d}]  "
                  f"loss={loss.item():.4f}  "
                  f"running_acc={total_corr/total_samp:.3f}", flush=True)

    return total_loss / total_samp, total_corr / total_samp

def evaluate(model, test_loader, device):
    model.eval()
    ce_fn      = nn.CrossEntropyLoss()
    total_loss = 0.0
    all_preds, all_labels = [], []

    with torch.no_grad():
        for batch_data in test_loader:
            images, labels, metadata, _, _ = batch_data
            images   = images.to(device, non_blocking=True)
            labels   = labels.to(device, non_blocking=True)
            metadata = metadata.to(device, non_blocking=True)

            logits, _, _ = model(images, metadata)
            loss         = ce_fn(logits, labels)
            _, preds     = torch.max(logits, 1)

            total_loss += loss.item() * labels.size(0)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    n          = len(all_labels)
    all_preds  = np.array(all_preds)
    all_labels = np.array(all_labels)
    avg_loss   = total_loss / n
    accuracy   = (all_preds == all_labels).mean()
    adj_acc    = (np.abs(all_preds.astype(int) - all_labels.astype(int)) <= 1).mean()
    return avg_loss, accuracy, adj_acc, all_preds, all_labels

# ---------------------------------------------------------------------------
# Main Fine-Tuning Execution
# ---------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("CHAKRAVAT_MANTHAN: EXPANDED FINE-TUNING FROM V1 BEST CHECKPOINT")
    print("=" * 70)

    set_seeds()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Using device: {device}")

    # 1. Load data
    print("\n[1] Loading expanded train & test datasets...", flush=True)
    train_data = load_csv_data(TRAIN_CSV_PATH)
    test_data  = load_csv_data(TEST_CSV_PATH)
    print(f"    Train frames: {len(train_data)}")
    print(f"    Test  frames: {len(test_data)}")

    # 2. Build sequences
    seq_builder = TemporalSequenceBuilder(
        min_sequence_length=MIN_SEQUENCE_LENGTH,
        max_sequence_length=MAX_SEQUENCE_LENGTH,
        max_gap_minutes=MAX_GAP_MINUTES
    )
    train_dataset = CycloneSequenceDataset(train_data, seq_builder)
    test_dataset  = CycloneSequenceDataset(test_data,  seq_builder)

    # 3. Dataloaders
    train_labels = [train_dataset.get_label(i) for i in range(len(train_dataset))]
    focal_alpha  = build_focal_alpha(train_labels, device)
    sampler      = build_weighted_sampler(train_dataset)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler,
                              num_workers=NUM_WORKERS, pin_memory=True, collate_fn=collate_fn)
    test_loader  = DataLoader(test_dataset,  batch_size=BATCH_SIZE, shuffle=False,
                              num_workers=NUM_WORKERS, pin_memory=True, collate_fn=collate_fn)

    # 4. Model & Load v1 Best Checkpoint
    print(f"\n[2] Initializing model & loading baseline: {BASE_CHECKPOINT_PATH}", flush=True)
    model = FixedTemporalChakravatManthan(gru_hidden_dim=GRU_HIDDEN_DIM).to(device)
    base_ckpt = torch.load(BASE_CHECKPOINT_PATH, map_location=device)
    sd = base_ckpt['model_state_dict'] if 'model_state_dict' in base_ckpt else base_ckpt
    model.load_state_dict(sd)
    print("    [SUCCESS] Loaded v1 checkpoint weights seamlessly.")

    # 5. Baseline Pre-Evaluation
    print("\n[3] Baseline evaluation on expanded test set before fine-tuning...", flush=True)
    base_loss, base_acc, base_adj, _, _ = evaluate(model, test_loader, device)
    print(f"    Baseline Val Loss     : {base_loss:.4f}")
    print(f"    Baseline Exact Acc    : {base_acc*100:.2f}%")
    print(f"    Baseline Adjacent Acc : {base_adj*100:.2f}%")

    # 6. Optimizer, Scheduler, Loss
    criterion = FocalLoss(gamma=FOCAL_GAMMA, alpha=focal_alpha)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)
    scaler    = torch.cuda.amp.GradScaler() if torch.cuda.is_available() else None

    # CSV Logging
    history_csv = os.path.join(MANIFEST_DIR, "training_history.csv")
    with open(history_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["epoch", "train_loss", "train_acc", "val_loss", "val_acc", "val_adj_acc", "lr", "time_sec"])

    best_val_acc  = base_acc
    best_ckpt_path = os.path.join(CHECKPOINT_DIR, "chakravat_manthan_finetuned_best.pt")

    print("\n[4] Starting fine-tuning loop...", flush=True)
    for epoch in range(1, EPOCHS + 1):
        t0 = time.time()
        current_lr = optimizer.param_groups[0]['lr']
        print(f"\n--- Epoch {epoch}/{EPOCHS} [LR: {current_lr:.6f}] ---", flush=True)

        tr_loss, tr_acc = train_epoch(model, train_loader, criterion, optimizer, scaler, device, GRADIENT_CLIP)
        val_loss, val_acc, val_adj, _, _ = evaluate(model, test_loader, device)
        scheduler.step()
        elapsed = time.time() - t0

        print(f"Epoch {epoch:2d} Result | Train Loss: {tr_loss:.4f} | Train Acc: {tr_acc*100:.2f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}% | Val Adj: {val_adj*100:.2f}% | Time: {elapsed:.1f}s", flush=True)

        # Append to CSV
        with open(history_csv, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([epoch, tr_loss, tr_acc, val_loss, val_acc, val_adj, current_lr, elapsed])

        # Checkpoint
        ep_ckpt = os.path.join(CHECKPOINT_DIR, f"chakravat_manthan_finetuned_ep{epoch:02d}.pt")
        torch.save({'epoch': epoch, 'model_state_dict': model.state_dict(), 'val_acc': val_acc, 'val_loss': val_loss}, ep_ckpt)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({'epoch': epoch, 'model_state_dict': model.state_dict(), 'val_acc': val_acc, 'val_loss': val_loss}, best_ckpt_path)
            print(f"  --> [NEW BEST] Saved best checkpoint: {best_val_acc*100:.2f}% Val Acc", flush=True)

    print("\n" + "=" * 70)
    print(f"[COMPLETE] FINE-TUNING FINISHED! Best Val Acc: {best_val_acc*100:.2f}%")
    print(f"Best Checkpoint: {best_ckpt_path}")
    print("=" * 70)

if __name__ == '__main__':
    main()
