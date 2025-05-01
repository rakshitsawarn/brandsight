# save as download_model.py and run: python download_model.py
from transformers import pipeline

# Download and cache the model
pipeline("sentiment-analysis", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
