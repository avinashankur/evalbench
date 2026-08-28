from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from evalbench.config import EvalRunConfig, ModelConfig, RetrieverConfig
from evalbench.schema import TestCaseResult


class HealthResponse(BaseModel):
    status: str
    version: str
    postgres: str
    redis: str

class RunCreate(BaseModel):
    dataset: str | list[dict] | None = None
    config_path: str | None = None
    model: ModelConfig | None = None
    prompt_template: str = "{question}"
    system_prompt: str | None = None
    concurrency: int = 10
    evaluators: list[Any] = Field(default_factory=list)
    retriever: RetrieverConfig | None = None

    def to_eval_run_config(self) -> EvalRunConfig:
        if self.config_path:
            from evalbench.config import load_config
            return load_config(self.config_path)
        
        if not self.dataset or not self.model:
            raise ValueError("Must provide either config_path or dataset and model.")
            
        return EvalRunConfig(
            dataset=self.dataset,
            model=self.model,
            prompt_template=self.prompt_template,
            system_prompt=self.system_prompt,
            concurrency=self.concurrency,
            evaluators=self.evaluators,
            retriever=self.retriever
        )

class RunStatusResponse(BaseModel):
    run_id: str
    status: str
    message: str | None = None
    error: str | None = None

class RunSummaryResponse(BaseModel):
    run_id: str
    status: str
    dataset_name: str
    provider: str
    model: str
    total: int
    created_at: datetime
    metrics: dict[str, Any]

class RunListItem(BaseModel):
    run_id: str
    dataset_name: str
    provider: str
    model: str
    total_test_cases: int
    created_at: datetime
    metrics: dict[str, Any]

class RunListResponse(BaseModel):
    runs: list[RunListItem]

class PaginatedResults(BaseModel):
    run_id: str
    total: int
    offset: int
    limit: int
    results: list[TestCaseResult]


class JobCreate(BaseModel):
    config: dict[str, Any] | None = None
    config_path: str | None = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    run_id: str | None = None
    error: str | None = None
    config_path: str | None = None
    message: str | None = None
