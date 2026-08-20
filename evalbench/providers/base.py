from abc import ABC


class ProviderError(Exception):
    """"""


class LLMProvider(ABC):
    name: str = "base"

    def __init__(self,
                 model: str,
                 api_key: str,
                 max_retries: int = 3,
                 base_backoff_seconds: float = 1.0,
                 timeout_seconds: float = 60.0,
                 **generation_kwargs):

        self.model = model
        self.api_key = api_key
        self.max_retries = max_retries
        self.base_backoff_seconds = base_backoff_seconds
        self.timeout_seconds = timeout_seconds
        self.generation_kwargs = generation_kwargs

        @abstractmethod
        async def _call(self, prompt: str, system: Optional[str] = None) -> LLMResponse:

