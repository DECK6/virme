#!/bin/zsh
set -euo pipefail

project_root=${0:A:h:h}
cd "$project_root"
export PYTHONPATH="$project_root/model_service"
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec .venv/bin/uvicorn app:app --app-dir model_service --host 127.0.0.1 --port 8766
