# Python Classes: A Complete Guide

_Written for a TypeScript developer picking up Python._

---

## 1. Why do classes exist at all?

Before touching syntax, it's worth answering the question honestly: **you can write a lot of working software without classes.** Python doesn't force OOP on you the way Java does. So why use them?

### What a class actually buys you

A class bundles **data** (attributes) and the **behavior that operates on that data** (methods) into one unit, and gives that unit a _type_. That's it. Everything else — inheritance, polymorphism, encapsulation — is built on top of that one idea.

Without classes, you're left with two bad options for anything non-trivial:

**Option A: loose dicts + functions**

```python
def make_chunk(id, document_id, content, embedding=None):
    return {"id": id, "document_id": document_id, "content": content, "embedding": embedding}

def chunk_word_count(chunk):
    return len(chunk["content"].split())

c = make_chunk("c1", "d1", "hello world")
chunk_word_count(c)
```

This works, but:

- Nothing stops you from typo'ing `chunk["conetnt"]` — it fails at runtime, not before.
- Nothing documents what a "chunk" _is_. You have to read every function that touches the dict to reverse-engineer the shape.
- There's no place to hang validation ("content can't be empty") or invariants ("embedding, if present, must be 768-dim").
- Behavior (`chunk_word_count`) is disconnected from the data it operates on — it lives wherever someone happened to put it.

**Option B: parallel arrays / positional tuples**

Even worse — `("c1", "d1", "hello world", None)` — now you've also lost field names.

### What a class gives you instead

```python
class Chunk:
    def __init__(self, id: str, document_id: str, content: str, embedding: list[float] | None = None):
        self.id = id
        self.document_id = document_id
        self.content = content
        self.embedding = embedding

    def word_count(self) -> int:
        return len(self.content.split())
```

Now:

- `Chunk` is a real **type**. Type checkers (mypy) and your IDE know its shape and will flag `chunk.conetnt` before you ever run the code.
- The behavior that makes sense _only_ in the context of a chunk (`word_count`) lives on the chunk itself — `chunk.word_count()` instead of `word_count(chunk)` floating in some utils module.
- You get a single, discoverable place to add validation, defaults, and invariants.
- You can create _many_ chunks that are all guaranteed to have the same shape, because they're all instances of the same blueprint.

### The TypeScript comparison

Coming from TS, the mental model is close but has one crucial difference:

| TypeScript                                                                     | Python                                                                                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `interface`/`type` — shape only, erased at runtime, zero runtime cost          | `Protocol` (structural, see §9) — shape only, but _can_ be checked at runtime with `isinstance()` if `@runtime_checkable`                                          |
| `class` — shape **and** implementation, exists at runtime                      | `class` — same, exists at runtime                                                                                                                                  |
| Structural typing by default (`{name: string}` matches anything with a `name`) | **Nominal** typing by default (a class only "is" a `Foo` if it or an ancestor is literally named `Foo`) — Protocols are the escape hatch back to structural typing |
| `private`/`public`/`protected` keywords, enforced by the compiler              | No real enforcement — see §7 (it's convention: `_foo`, `__foo`)                                                                                                    |
| `interface X { method(): void }` then `class Y implements X`                   | `class X(Protocol): def method(self) -> None: ...` then any class with a matching `method` satisfies it, _without declaring so_                                    |

This last point is genuinely different and matters a lot for the port/adapter pattern in your RAG project — more in §9.

### So, "why can't I just not use classes?"

You can, for small scripts. The tipping point is usually:

1. You have data with **multiple fields that always travel together** (a `Document`, a `Chunk`).
2. That data has **behavior tied to it** (validation, transformations, comparisons).
3. You want **multiple implementations of the same capability** (Gemini vs OpenAI embedder) that calling code shouldn't have to distinguish between.
4. You want the type checker to catch mistakes instead of finding them at 2am from a stack trace.

Classes aren't "more advanced" than functions — they solve a different problem (organizing state + behavior), not the problem functions solve (transforming inputs to outputs). Most well-designed systems use both: classes for the nouns, functions for the verbs.

---

## 2. Basic syntax

```python
class Point:
    """A 2D point."""            # docstring, becomes Point.__doc__

    def __init__(self, x: float, y: float):
        self.x = x                # instance attribute
        self.y = y

    def distance_from_origin(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5


p = Point(3, 4)
p.distance_from_origin()   # 5.0
```

Key mechanics:

- `class Point:` defines the blueprint. No code runs yet, no memory for an instance is allocated.
- `Point(3, 4)` is **instantiation**. Python calls `Point.__new__` (creates a bare object) then `Point.__init__` (initializes it) automatically.
- `__init__` is _not_ a constructor in the C++/Java sense — `__new__` is the actual constructor. `__init__` just initializes an already-created object. You'll almost never touch `__new__`.
- `self` is the instance, passed automatically as the first argument to every instance method. It's not a keyword — you could call it anything, but never do; `self` is a universal convention. TS's implicit `this` is Python's explicit `self`.
- There's no `new` keyword. `Point(3, 4)` _is_ the instantiation call.

---

## 3. Instance attributes vs. class attributes

This trips up a lot of people coming from other languages.

```python
class Dog:
    species = "Canis familiaris"   # CLASS attribute — shared by all instances

    def __init__(self, name: str):
        self.name = name           # INSTANCE attribute — unique per instance

a = Dog("Rex")
b = Dog("Fido")

a.species   # "Canis familiaris"
b.species   # "Canis familiaris"  (same object in memory, shared)
a.name      # "Rex"
b.name      # "Fido"
```

The danger: **mutable class attributes are shared and mutation leaks across all instances.**

```python
class Bad:
    items = []   # ⚠️ ONE list, shared by every instance

    def add(self, item):
        self.items.append(item)

x, y = Bad(), Bad()
x.add("a")
y.items   # ["a"]  <- surprise, y sees x's data
```

Fix: put mutable defaults in `__init__`, never as class attributes.

```python
class Good:
    def __init__(self):
        self.items = []   # a fresh list per instance
```

(This is also why Python raises an error if you write `def f(x, items=[]):` as a linting warning — same trap, function version.)

---

## 4. Methods: three kinds

```python
class Circle:
    unit = "cm"                      # class attribute

    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:                        # INSTANCE method
        return 3.14159 * self.radius ** 2

    @classmethod
    def unit_circle(cls) -> "Circle":                # CLASS method
        return cls(radius=1)

    @staticmethod
    def is_valid_radius(r: float) -> bool:           # STATIC method
        return r > 0
```

| Kind            | First param | Access to instance state? (self) | Access to class itself? | Typical use                                                                                                |
| --------------- | ----------- | -------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Instance method | `self`      | Yes                              | Via `type(self)`        | Normal behavior on an object                                                                               |
| `@classmethod`  | `cls`       | No                               | Yes                     | Alternate constructors (`Circle.unit_circle()`), factory methods                                           |
| `@staticmethod` | none        | No                               | No                      | A helper that's _related_ to the class but needs no instance/class data — really just a namespacing choice |

Calling:

```python
Circle.unit_circle()          # via the class
Circle.is_valid_radius(5)     # via the class
c = Circle(2)
c.area()                      # via an instance
```

`@classmethod` matters more than it looks — it's the idiomatic way to write alternate constructors, since Python only gives you one `__init__`:

```python
class Chunk:
    def __init__(self, id, content, embedding=None):
        ...

    @classmethod
    def from_document_slice(cls, document, start, end):
        return cls(id=..., content=document.content[start:end])
```

---

## 5. `@property` — computed attributes that look like plain attributes

TS has native `get`/`set`. Python's equivalent is `@property`.

```python
class Rectangle:
    def __init__(self, width: float, height: float):
        self._width = width
        self._height = height

    @property
    def area(self) -> float:
        return self._width * self._height

    @property
    def width(self) -> float:
        return self._width

    @width.setter
    def width(self, value: float):
        if value <= 0:
            raise ValueError("width must be positive")
        self._width = value


r = Rectangle(3, 4)
r.area          # 12  — called like an attribute, no parens, but it's actually a method
r.width = 10    # runs validation via the setter
r.width = -5    # raises ValueError
```

Why bother instead of just a plain attribute? Because you can **start with a plain attribute and upgrade to a property later without breaking callers.** `r.area` looks identical whether `area` is a stored value or a computed one — callers never know or care. This is a big deal for API stability; in many other languages, adding validation later means either breaking the public field or writing getters/setters from day one "just in case." Python lets you defer that decision.

---

## 6. Dunder ("magic") methods

These let your objects hook into Python's built-in syntax (`+`, `==`, `len()`, `str()`, `for`, `with`, etc). This is Python's version of operator overloading.

```python
class Money:
    def __init__(self, cents: int):
        self.cents = cents

    def __repr__(self) -> str:
        return f"Money({self.cents})"          # unambiguous, for developers (repr())

    def __str__(self) -> str:
        return f"${self.cents / 100:.2f}"       # readable, for humans (str(), print())

    def __eq__(self, other) -> bool:
        return isinstance(other, Money) and self.cents == other.cents

    def __add__(self, other) -> "Money":
        return Money(self.cents + other.cents)

    def __lt__(self, other) -> bool:
        return self.cents < other.cents

    def __hash__(self) -> int:
        return hash(self.cents)


a, b = Money(150), Money(250)
a + b            # Money(400)  — via __add__
a == Money(150)  # True        — via __eq__
print(a)         # $1.50       — via __str__
[a, b]           # [Money(150), Money(250)]  — repr shown in containers/debugger
```

Common dunders worth knowing:

| Method                               | Triggered by                                               |
| ------------------------------------ | ---------------------------------------------------------- |
| `__init__`                           | `ClassName(...)` - Called after an object is created.      |
| `__repr__`                           | `repr(obj)`, debugger/REPL display, fallback for `print()` |
| `__str__`                            | `str(obj)`, `print(obj)`, f-strings                        |
| `__eq__`, `__lt__`, `__le__`, etc.   | `==`, `<`, `<=`, sorting                                   |
| `__hash__`                           | `hash(obj)`, using the object as a dict key / in a set     |
| `__len__`                            | `len(obj)` - Makes `len()` work.                           |
| `__iter__`                           | `for x in obj`                                             |
| `__getitem__`                        | `obj[key]` - makes indexing work                           |
| `__contains__`                       | `x in obj`                                                 |
| `__call__`                           | `obj(...)` — makes an instance callable like a function    |
| `__enter__` / `__exit__`             | `with obj:` (context managers)                             |
| `__add__`, `__sub__`, `__mul__`, ... | `+`, `-`, `*`, ...                                         |

Default behavior if you define none of these: `__repr__` shows `<Money object at 0x...>`, `__eq__` compares by identity (same object in memory), and the object isn't iterable, indexable, etc. Overriding dunders is how you make custom types feel like first-class citizens rather than second-class structs.

---

## 7. "Private" attributes — convention, not enforcement

Python has **no real access control**. This is a deliberate philosophy ("we're all consenting adults here"), and it's the sharpest departure from TS/Java/C#.

```python
class Account:
    def __init__(self, balance):
        self.balance = balance       # public — anyone can touch it
        self._balance = balance      # "protected" by convention only — a single underscore
                                      #    means "internal, don't touch this from outside,
                                      #    but I'm not going to stop you"
        self.__balance = balance     # name-mangled — see below
```

- `self._balance` — single underscore. Pure convention. Nothing stops `account._balance = -999` from outside. It signals intent to other developers and to tools (linters won't flag external access, but humans will side-eye it in review).
- `self.__balance` — double underscore triggers **name mangling**: Python rewrites it internally to `self._Account__balance`. This isn't real privacy either — it exists mainly to avoid accidental name collisions in subclasses, not to lock anyone out. You _can_ still access it as `account._Account__balance` if you really want to.

There's no `private`/`public`/`protected` keyword, and no compiler to enforce anything at runtime. Encapsulation in Python is a social contract backed by naming conventions, not a language guarantee. `@property` (§5) is the main real tool you have for controlling access to internal state, since it lets you gate reads/writes through actual code.

---

## 8. Inheritance

```python
class Animal:
    def __init__(self, name: str):
        self.name = name

    def speak(self) -> str:
        raise NotImplementedError

    def describe(self) -> str:
        return f"{self.name} says {self.speak()}"


class Dog(Animal):
    def speak(self) -> str:
        return "Woof"


class Cat(Animal):
    def speak(self) -> str:
        return "Meow"


Dog("Rex").describe()    # "Rex says Woof"
Cat("Tom").describe()    # "Tom says Meow"
```

This is **polymorphism**: `describe()` is written once, against the general `Animal` shape, and works correctly for every subclass without modification.

`super()` calls the parent's implementation — usually used inside `__init__` to make sure parent setup still happens:

```python
class Puppy(Dog):
    def __init__(self, name: str, age_months: int):
        super().__init__(name)       # let Animal/Dog set up `self.name`
        self.age_months = age_months
```

**Multiple inheritance** is legal in Python (unlike Java/C#, which restrict you to one parent class plus interfaces):

```python
class Swimmer:
    def swim(self): return "swimming"

class Flyer:
    def fly(self): return "flying"

class Duck(Swimmer, Flyer):
    pass

Duck().swim()   # "swimming"
Duck().fly()    # "flying"
```

When there's ambiguity (both parents define the same method), Python resolves it via the **MRO (Method Resolution Order)** — a deterministic left-to-right, depth-first-ish algorithm (technically C3 linearization). You can inspect it: `Duck.__mro__`. In practice, deep multiple inheritance hierarchies get confusing fast — most experienced Python devs prefer **composition over inheritance** past a certain complexity, same advice you'd get in any language.

---

## 9. Abstract classes vs. Protocols — and why this matters for your RAG project

This section is directly relevant to the `domain/ports/` pattern in your hexagonal architecture.

### `abc.ABC` — nominal, explicit contracts

```python
from abc import ABC, abstractmethod

class Embedder(ABC):
    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        ...

class GeminiEmbedder(Embedder):     # must explicitly inherit
    def embed(self, texts):
        ...                         # must implement embed() or this stays abstract

Embedder()          # TypeError: Can't instantiate abstract class
GeminiEmbedder()    # fine, as long as embed() is implemented
```

- You **must explicitly subclass** `Embedder` to count as one — this is _nominal_ typing, exactly like TS's `implements`.
- Python enforces it at _instantiation_ time: forgetting to implement `embed()` raises immediately, not silently.
- Good when you own both the interface and want to force real inheritance (shared base behavior, runtime enforcement).

### `typing.Protocol` — structural, implicit contracts

```python
from typing import Protocol

class Embedder(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]:
        ...

class GeminiEmbedder:                # NOTE: doesn't inherit from Embedder at all!
    def embed(self, texts):
        ...

def use_embedder(e: Embedder): ...

use_embedder(GeminiEmbedder())       # ✅ type-checks fine — shape matches, that's enough
```

- No inheritance required. If `GeminiEmbedder` happens to have a matching `embed()` method, it satisfies `Embedder` as far as the type checker is concerned.
- This is Python's closest equivalent to TS `interface`/structural typing.
- Checked **statically** by mypy, not enforced at runtime by default — `Embedder()` isn't even something you'd instantiate; it's purely a type-checking construct. (You can opt into limited runtime checks with `@runtime_checkable`, but that only checks method _names_ exist, not their signatures.)

### Why this matters for your `domain/ports/`

You're using `Protocol` for your ports (per your `context.md`/architecture notes), which is the more idiomatic choice for hexagonal architecture in Python:

- It keeps `infrastructure/` adapters (`GeminiEmbedder`, `QdrantVectorStore`) from needing to import anything from `domain/` at all — they just need to _shape-match_. This is a slightly stronger decoupling than ABC gives you, since adapters don't even need a dependency on the domain package to satisfy the contract.
- It mirrors exactly how you'd design this in TypeScript with `interface Embedder { embed(...): ... }` — so it should feel familiar.
- The tradeoff: enforcement is static-analysis-only. If someone writes an adapter with a typo'd method name and never runs mypy, nothing stops it at runtime the way `ABC` would. That's a reasonable tradeoff for a project prioritizing decoupling, as long as you're actually running mypy in CI.

---

## 10. `@dataclass` — classes for plain data, without the boilerplate

A huge fraction of classes you write (like your `Document`, `Chunk`, `ScoredChunk` models) are just typed bags of data. Writing `__init__`, `__repr__`, and `__eq__` by hand for these is pure boilerplate. `dataclasses` generates them for you.

```python
from dataclasses import dataclass, field

@dataclass
class Chunk:
    id: str
    document_id: str
    content: str
    embedding: list[float] | None = None
    metadata: dict = field(default_factory=dict)   # safe way to default a mutable field


c1 = Chunk(id="c1", document_id="d1", content="hello")
c2 = Chunk(id="c1", document_id="d1", content="hello")

c1 == c2       # True — __eq__ auto-generated, compares field-by-field
repr(c1)       # "Chunk(id='c1', document_id='d1', content='hello', embedding=None, metadata={})"
```

You get `__init__`, `__repr__`, and `__eq__` for free from just the field declarations. Compare to TS: this is close to what you'd get from a `type` alias or an `interface` plus a plain object literal, except it's still a real class — you can add methods, it's a genuine runtime type, `isinstance()` works, and you can still use `@property`, inheritance, etc. on top of it.

Useful variants:

- `@dataclass(frozen=True)` — makes instances immutable (assigning to a field after creation raises). Useful for value objects you don't want mutated after construction, and makes them hashable so they can go in sets/dict keys.
- `@dataclass(order=True)` — auto-generates `__lt__`, `__le__`, etc. based on field order.

Pydantic's `BaseModel` (which you're already using for your domain models) is effectively "`dataclass` plus runtime validation plus JSON serialization" — same underlying motivation, more machinery.

---

## 11. Composition vs. inheritance

Inheritance answers "**is-a**" (a `Dog` _is an_ `Animal`). Composition answers "**has-a**" (a `RAGPipeline` _has a_ `Retriever`, a `Reranker`, a `Generator`).

```python
# Inheritance: "is-a" — use sparingly, only for genuine type hierarchies
class Dog(Animal): ...

# Composition: "has-a" / "uses-a" — this is what your application layer does
class RAGPipeline:
    def __init__(self, retriever, reranker, generator):
        self.retriever = retriever
        self.reranker = reranker
        self.generator = generator

    def query(self, question: str):
        results = self.retriever.execute(question)
        ranked = self.reranker.rerank(question, results)
        return self.generator.execute(question, ranked)
```

Your entire ports-and-adapters architecture is built on composition, not inheritance: `RAGPipeline` doesn't inherit from anything — it's _handed_ objects that satisfy `Retriever`/`Reranker`/`Generator` shapes at construction time (dependency injection). This is precisely why swapping `BasicReranker` for a future `CrossEncoderReranker` requires zero changes to `RAGPipeline` — composition over inheritance is what makes "swap the adapter" cheap. The general rule of thumb, in any OOP language: prefer composition; reach for inheritance only when there's a genuine, stable "is-a" relationship and you want polymorphic dispatch.

---

## 12. `__slots__` — trading flexibility for memory/speed

By default, every instance carries a `__dict__` to allow arbitrary attributes to be added at any time:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
p.z = 99   # totally legal — Python lets you bolt on new attributes anytime
```

This flexibility costs memory (a per-instance dict) and a little speed. `__slots__` opts out:

```python
class Point:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
p.z = 99   # AttributeError — z isn't a declared slot
```

Worth it when you're creating large numbers of small objects (e.g. millions of `Chunk` instances during ingestion) and want to shrink memory footprint. Not something to reach for by default — it's an optimization, and it complicates multiple inheritance and dynamic attribute patterns.

---

## 13. A quick word on metaclasses

You'll see `class Foo(metaclass=SomeMeta):` occasionally — this controls _how the class itself is created_ (a metaclass is "a class whose instances are classes"). Pydantic's `BaseModel` and ABC both use metaclasses under the hood to make `@abstractmethod` enforcement and field validation work automatically. As a rule: you'll **use** metaclass-powered libraries constantly; you'll almost never **write** your own metaclass. If you ever think you need one, a class decorator or `__init_subclass__` usually solves the same problem more simply.

---

## 14. Putting it together: the pattern in your own project

```python
# domain/ports/embedder.py — the CONTRACT (Protocol, structural)
from typing import Protocol

class Embedder(Protocol):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        ...


# domain/models/chunk.py — the DATA (pydantic model, dataclass-like)
from pydantic import BaseModel

class Chunk(BaseModel):
    id: str
    content: str
    embedding: list[float] | None = None


# infrastructure/embeddings/gemini.py — the IMPLEMENTATION (plain class, composition)
class GeminiEmbedder:
    def __init__(self, client, model: str):
        self.client = client        # composition: holds a reference, doesn't inherit
        self.model = model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [await self._embed_one(t) for t in texts]   # instance method,
                                                              # calling another instance method

    async def _embed_one(self, text: str) -> list[float]:   # "private" by convention
        ...


# application/retrieval/retrieve_documents.py — ORCHESTRATION (composition, dependency injection)
class RetrieveDocuments:
    def __init__(self, embedder: Embedder, vector_store):   # typed against the PROTOCOL,
        self.embedder = embedder                              # not the concrete class
        self.vector_store = vector_store

    async def execute(self, question: str):
        vector = await self.embedder.embed([question])
        return await self.vector_store.search(vector[0])
```

Every concept in this guide shows up here: a `Protocol` for the structural contract, a `BaseModel`/dataclass-style class for typed data, a plain class using composition + instance methods for the adapter, private-by-convention helper methods, and dependency injection via `__init__` so `RetrieveDocuments` never knows or cares that it's talking to Gemini specifically.