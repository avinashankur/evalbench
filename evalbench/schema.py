import uuid
import time

from pydantic import BaseModel
from enum import Enum
from typing import Optional, Any
from pydantic import Field, field_validator

class TestCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    context: Optional[str] = None
    expected_answer: Optional[str] = None
    reference_contexts: Optional[list[str]] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Question must not be empty")
        return v


class Dataset(BaseModel):
    name: str
    version: str = "v1"
    description: Optional[str] = None
    test_cases: list[TestCase] = Field(default_factory=list)

    # Function to check the number of test cases in a dataset
    def __len__(self) -> int:
        return len(self.test_cases)

    # Function to loop over the test cases
    def __iter__(self):
        return iter(self.test_cases)

    # This loads data from a JSONL file
    @classmethod
    def from_jsonl(cls,
                   path: str,
                   name: Optional[str] = None,
                   version: str = "v1") -> "Dataset":
        import json
        from pathlib import Path

        p = Path(path)
        cases: list[TestCase] = []

        with p.open("r", encoding="utf-8") as f:
            for line_no, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    raw = json.loads(line)
                except json.JSONDecodeError as e:
                    raise ValueError(
                        f"{path}:{line_no}: invalid JSON — {e}") from e
                cases.append(TestCase(**raw))

        return cls(name=name or p.stem, version=version, test_cases=cases)

    # This converts dataset to JSONL
    def to_jsonl(self, path: str) -> None:
        from pathlib import Path

        with Path(path).open("w", encoding="utf-8") as f:
            for tc in self.test_cases:
                f.write(tc.model_dump_json() + "\n")


class LLMResponse(BaseModel):
    text: str
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    latency_ms: float = 0.0
    cost_usd: Optional[float] = None
    model: str = ""
    provider: str = ""
    raw: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    retrieved_context: Optional[list[str]] = None

    @property
    def ok(self) -> bool:
        return self.error is None


class EvalStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"


class EvalResult(BaseModel):
    evaluator_name: str
    test_case_id: str
    score: float
    status: EvalStatus
    reason: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class TestCaseResult(BaseModel):
    run_id: str
    test_case: TestCase
    response: LLMResponse
    eval_results: list[EvalResult] = Field(default_factory=list)
    timestamp: float = Field(default_factory=time.time)

    # Summary of the test case
    def summary(self) -> dict[str, float]:
        return {r.evaluator_name: r.score for r in self.eval_results}
