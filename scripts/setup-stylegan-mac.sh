#!/bin/zsh
set -euo pipefail

project_root=${0:A:h:h}
cd "$project_root"

uv venv --python 3.11 .venv
uv pip install --python .venv/bin/python torch torchvision pillow fastapi 'uvicorn[standard]' numpy
mkdir -p .runtime models generated

if [[ ! -d .runtime/stylegan2-ada-pytorch ]]; then
  git clone --depth 1 https://github.com/NVlabs/stylegan2-ada-pytorch.git .runtime/stylegan2-ada-pytorch
fi

if [[ ! -s models/stylegan2-church-config-f.pkl ]]; then
  curl -L --fail --progress-bar \
    https://nvlabs-fi-cdn.nvidia.com/stylegan2/networks/stylegan2-church-config-f.pkl \
    -o models/stylegan2-church-config-f.pkl
fi

echo "StyleGAN Mac runtime ready: $project_root/models/stylegan2-church-config-f.pkl"
