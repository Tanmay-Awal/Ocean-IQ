from huggingface_hub import hf_hub_download
import os

repo_id = "sentence-transformers/all-MiniLM-L6-v2"
filename = "onnx/model_optimized.onnx"
cache_dir = os.path.join(os.path.expanduser("~"), ".cache", "chroma", "onnx_models", "all-MiniLM-L6-v2")

os.makedirs(cache_dir, exist_ok=True)

print(f"Downloading {filename} from {repo_id}...")
try:
    path = hf_hub_download(repo_id=repo_id, filename=filename, local_dir=cache_dir)
    print("Download successful!")
    print(f"File saved to: {path}")
except Exception as e:
    print(f"An error occurred during download: {e}")