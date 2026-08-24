from typing import Type

from evalbench.providers.anthropic_provider import AnthropicProvider
from evalbench.providers.base import LLMProvider
from evalbench.providers.gemini_provider import GeminiProvider
from evalbench.providers.mock_provider import MockProvider
from evalbench.providers.openai_provider import OpenAIProvider

_REGISTRY: dict[str, Type[LLMProvider]] = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "gemini": GeminiProvider,
    "mock": MockProvider,
}


def register_provider(name: str, cls: Type[LLMProvider]) -> None:
    _REGISTRY[name] = cls


def get_provider(name: str, model: str, **kwargs) -> LLMProvider:
    if name not in _REGISTRY:
        available = ", ".join(sorted(_REGISTRY))
        raise ValueError(f"Unknown provider '{name}'. Available: {available}")
    return _REGISTRY[name](model=model, **kwargs)


def available_providers() -> list[str]:
    return sorted(_REGISTRY)
