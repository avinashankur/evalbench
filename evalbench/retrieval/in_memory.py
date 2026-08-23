"""
This retriever's job: given a question, find which stored documents are most relevant to it without using any AI model or vector database. It just compares word overlap.
"""
import re
import math
import snowballstemmer

from collections import Counter
from evalbench.retrieval.base import Retriever, RetrievedDocument

_stemmer = snowballstemmer.stemmer("english")

_TOKEN_RE = re.compile(r"[a-z0-9]+")

# A small stopword list so short documents that happen to share "is"/"the"/
# "our" with the query don't outrank longer documents that share the actual
# subject-matter terms. Deliberately minimal - this is a testing retriever,
# not a search-quality product.
_STOPWORDS = frozenset(
    """
    a an the is are was were be been being of in on at to and or for with
    within our your you we it this that from has have had do does did as
    by can will would could should may might must not no
    """.split()
)


def _stem(token: str) -> str:
    """suffix stripping so 'refund'/'refunds' and 'process'/'processed' are treated as the same token"""
    return _stemmer.stemWord(token)


def _tokenize(text: str) -> Counter:
    tokens = _TOKEN_RE.findall(text.lower())
    return Counter(_stem(t) for t in tokens if t not in _STOPWORDS)


def _cosine_sim(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0

    common = set(a) & set(b)
    dot = sum(a[t] * b[t] for t in common)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)


class InMemoryRetriever(Retriever):
    name = "in_memory"

    def __init__(
        self,
        documents: list[str] | list[RetrievedDocument],
        source_ids: list[str] | None = None,
        min_score: float = 0.0,
    ):
        self._min_score = min_score
        self._docs: list[RetrievedDocument] = []

        for i, d in enumerate(documents):
            if isinstance(d, RetrievedDocument):
                self._docs.append(d)
            else:
                sid = source_ids[i] if source_ids else str(i)
                self._docs.append(RetrievedDocument(content=d, source_id=sid))

        self._doc_vectors = [_tokenize(d.content) for d in self._docs]

    async def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedDocument]:
        query_vec = _tokenize(query)
        scores = [_cosine_sim(query_vec, vec) for vec in self._doc_vectors]
        scored = [
            (doc.model_copy(update={"score": score}), score)
            for doc, score in zip(self._docs, scores) if score > self._min_score
        ]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        
        return [doc for doc, _ in scored[:top_k]]
