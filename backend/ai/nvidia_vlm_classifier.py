import base64
import json
import os
import re

import requests

from .base import AnalysisResult

NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# The build.nvidia.com model to use — must be one of their vision-capable
# chat models (accepts "image_url" content blocks). Override with
# NVIDIA_VLM_MODEL if you want a different one from the catalog.
DEFAULT_MODEL = "meta/llama-3.2-11b-vision-instruct"

PROMPT = (
    "You are labeling a photo of waste or surplus material for a B2B reuse "
    "marketplace. Look at the image and respond with ONLY a JSON object, no "
    "other text, in exactly this shape:\n"
    '{"name": "short listing title", '
    '"category": "one of: wood, metal, paper, organic, plastic, fixtures, construction", '
    '"tags": ["keyword", "keyword"], '
    '"quantity": "your best rough visual estimate, e.g. \'~15 pieces\' or \'1 pallet\'"}'
)


class NvidiaVlmClassifier:
    """Vision-language model hosted on build.nvidia.com (OpenAI-compatible
    chat/completions with image_url content). Unlike zero-shot CLIP, this
    actually looks at the photo and writes a title/category/quantity guess
    instead of picking from a fixed label list. Set AI_BACKEND=nvidia and
    NVIDIA_API_KEY to use this.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY")
        if not self.api_key:
            raise RuntimeError(
                "NVIDIA_API_KEY is not set. Get a key at build.nvidia.com and "
                "put it in backend/.env"
            )
        self.model = model or os.getenv("NVIDIA_VLM_MODEL", DEFAULT_MODEL)

    def analyze(self, image_bytes: bytes) -> AnalysisResult:
        data_uri = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode()

        response = requests.post(
            NVIDIA_CHAT_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json",
            },
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": PROMPT},
                            {"type": "image_url", "image_url": {"url": data_uri}},
                        ],
                    }
                ],
                "max_tokens": 512,
                "temperature": 0.2,
                "stream": False,
            },
            timeout=60,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return _parse(content)


def _parse(content: str) -> AnalysisResult:
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return AnalysisResult(
            name="Unidentified Materials",
            category="construction",
            tags=["unsorted"],
            quantity="1 unit (please adjust)",
            confidence=0.0,
        )

    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        return AnalysisResult(
            name="Unidentified Materials",
            category="construction",
            tags=["unsorted"],
            quantity="1 unit (please adjust)",
            confidence=0.0,
        )

    return AnalysisResult(
        name=data.get("name") or "Unidentified Materials",
        category=data.get("category") or "construction",
        tags=data.get("tags") or ["unsorted"],
        quantity=data.get("quantity") or "1 unit (please adjust)",
        confidence=1.0,
    )
