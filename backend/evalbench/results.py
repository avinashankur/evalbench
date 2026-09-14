from pathlib import Path
from abc import abstractmethod, ABC
from evalbench.engine import RunSummary
from evalbench.schema import TestCaseResult

class ResultStore(ABC):
    @abstractmethod
    def save(self, summary: RunSummary) -> None: ...

    @abstractmethod
    def load(self, run_id: str) -> RunSummary: ...

class JSONLResultStore(ResultStore):
    def __init__(self, base_dir: str = "results"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, run_id: str) -> Path:
        return self.base_dir / f"{run_id}.jsonl"

    def save(self, summary: RunSummary) -> None:
        path = self._path(summary.run_id)
        with path.open("w", encoding="utf-8") as f:
            for tcr in summary.results:
                f.write(tcr.model_dump_json() + "\n")

    def load(self, run_id: str) -> RunSummary:
        path = self._path(run_id)

        if not path.exists():
            raise FileNotFoundError(f"no result found for run_id={run_id} at {path}")

        results = []
        with path.open("r", encoding="utf-8") as f:
             for line in f:
                line = line.strip()
                if line:
                    results.append(TestCaseResult.model_validate_json(line))

        return RunSummary(run_id=run_id, total=len(results), results=results)

    def list_runs(self) -> list[str]:
        return [p.stem for p in self.base_dir.glob("*.jsonl")]