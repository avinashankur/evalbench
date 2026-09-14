import re
import json

# Regular expression to remmove unncessary syntax around json objects given by LLMs
_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def extract_json(text: str) -> dict | list:
    text = text.strip()
    m = _FENCE_RE.search(text)

    if m:
        text = m.group(1)

    return json.loads(text)
