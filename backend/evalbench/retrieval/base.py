"""
This retriever's job: given a question, find which stored documents are most relevant to it without using any AI model or vector database. It just compares word overlap.
"""
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field


class RetrievedDocument(BaseModel):
    content: str
    score: float = 0.0
    source_id: str = ""
    metadata: dict = Field(default_factory=dict)


class Retriever(ABC):
    name: str = "base"

    @abstractmethod
    async def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedDocument]:
        raise NotImplementedError
