# Python Classes: A Complete Guide

_A comprehensive reference for developers picking up Python's class system — from basic syntax to advanced patterns._

---

## 1. Why do classes exist at all?

Before touching syntax, it is worth answering the question honestly: **you can write a lot of working software without classes.** Python does not force OOP on you the way Java does. So why use them?

### What a class actually buys you

A class bundles **data** (attributes) and the **behavior that operates on that data** (methods) into one unit, and gives that unit a _type_. That is it. Everything else (inheritance, polymorphism, encapsulation) is built on top of that one idea.

Without classes, you are left with two bad options for anything non-trivial:

**Option A: loose dicts + functions**

```python
def make_user(id, name, email):
    return {"id": id, "name": name, "email": email}

def user_display_name(user):
    return user["name"].title()

u = make_user("u1", "alice", "alice@example.com")
user_display_name(u)
```

This works, but:

- Nothing stops you from typo-ing `user["naem"]` — it fails at runtime, not before.
- Nothing documents what a "user" _is_. You have to read every function that touches the dict.
- There is no place to hang validation ("email must contain @") or invariants.
- Behavior (`user_display_name`) is disconnected from the data it operates on.

**Option B: parallel arrays / positional tuples**

Even worse — `("u1", "alice", "alice@example.com")` — now you have also lost field names.

### What a class gives you instead

```python
class User:
    def __init__(self, id: str, name: str, email: str):
        self.id = id
        self.name = name
        self.email = email

    def display_name(self) -> str:
        return self.name.title()
```

Now:

- `User` is a real **type**. Type checkers and your IDE know its shape.
- The behavior that makes sense _only_ in the context of a user lives on the user itself.
- You get a single, discoverable place to add validation, defaults, and invariants.
- You can create _many_ users that are all guaranteed to have the same shape.

### So, why can't I just not use classes?

You can, for small scripts. The tipping point is usually:

1. You have data with **multiple fields that always travel together**.
2. That data has **behavior tied to it** (validation, transformations, comparisons).
3. You want **multiple implementations of the same capability** that calling code should not distinguish between.
4. You want the type checker to catch mistakes instead of finding them at runtime.

Classes are not "more advanced" than functions — they solve a different problem (organizing state + behavior). Most well-designed systems use both: classes for the nouns, functions for the verbs.

---

## 2. Basic syntax

```python
class Point:
    \"\"\"A 2D point.\"\"\"

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def distance_from_origin(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5


p = Point(3, 4)
p.distance_from_origin()   # 5.0
```

Key mechanics:

- `class Point:` defines the blueprint. No code runs yet.
- `Point(3, 4)` is **instantiation**. Python calls `Point.__new__` then `Point.__init__` automatically.
- `__init__` is _not_ a constructor in the C++/Java sense — it initializes an already-created object. You will almost never touch `__new__`.
- `self` is the instance, passed automatically as the first argument to every instance method.
- There is no `new` keyword. `Point(3, 4)` _is_ the instantiation call.

---

## 3. Instance attributes vs. class attributes

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
    items = []   # ONE list, shared by every instance

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

---

## 4. Methods: three kinds

```python
class Circle:
    unit = "cm"

    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:                        # INSTANCE method
        return 3.14159 * self.radius ** 2

    @classmethod
    def unit_circle(cls) -> "Circle":               # CLASS method
        return cls(radius=1)

    @staticmethod
    def is_valid_radius(r: float) -> bool:           # STATIC method
        return r > 0
```

| Kind            | First param | Access to instance state? | Access to class itself? | Typical use                                             |
| --------------- | ----------- | ------------------------- | ----------------------- | ------------------------------------------------------- |
| Instance method | `self`      | Yes                       | Via `type(self)`        | Normal behavior on an object                            |
| `@classmethod`  | `cls`       | No                        | Yes                     | Alternate constructors, factory methods                 |
| `@staticmethod` | none        | No                        | No                      | Helper related to the class but needs no instance/class |

`@classmethod` is the idiomatic way to write **alternate constructors**, since Python only gives you one `__init__`:

```python
class Date:
    def __init__(self, year: int, month: int, day: int):
        self.year, self.month, self.day = year, month, day

    @classmethod
    def from_iso(cls, iso_str: str) -> "Date":
        parts = iso_str.split("-")
        return cls(int(parts[0]), int(parts[1]), int(parts[2]))

d = Date.from_iso("2024-01-15")
```

---

## 5. @property — computed attributes that look like plain attributes

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
r.area          # 12  — called like an attribute, but it is actually a method
r.width = 10    # runs validation via the setter
r.width = -5    # raises ValueError
```

You can **start with a plain attribute and upgrade to a property later without breaking callers.** This is a big deal for API stability.

---

## 6. Dunder ("magic") methods

These let your objects hook into Python built-in syntax (`+`, `==`, `len()`, `str()`, `for`, `with`).

```python
class Money:
    def __init__(self, cents: int):
        self.cents = cents

    def __repr__(self) -> str:
        return f"Money({self.cents})"

    def __str__(self) -> str:
        return f"${self.cents / 100:.2f}"

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Money) and self.cents == other.cents

    def __add__(self, other: "Money") -> "Money":
        return Money(self.cents + other.cents)

    def __lt__(self, other: "Money") -> bool:
        return self.cents < other.cents

    def __hash__(self) -> int:
        return hash(self.cents)


a, b = Money(150), Money(250)
a + b            # Money(400)
a == Money(150)  # True
print(a)         # $1.50
```

Common dunders:

| Method                               | Triggered by                                               |
| ------------------------------------ | ---------------------------------------------------------- |
| `__init__`                           | `ClassName(...)` — called after an object is created       |
| `__repr__`                           | `repr(obj)`, debugger/REPL display, fallback for `print()` |
| `__str__`                            | `str(obj)`, `print(obj)`, f-strings                        |
| `__eq__`, `__lt__`, `__le__`, etc.   | `==`, `<`, `<=`, sorting                                   |
| `__hash__`                           | `hash(obj)`, using the object as a dict key / in a set     |
| `__len__`                            | `len(obj)`                                                 |
| `__iter__`                           | `for x in obj`                                             |
| `__getitem__`                        | `obj[key]` — makes indexing work                           |
| `__contains__`                       | `x in obj`                                                 |
| `__call__`                           | `obj(...)` — makes an instance callable like a function    |
| `__enter__` / `__exit__`             | `with obj:` (context managers)                             |
| `__add__`, `__sub__`, `__mul__`, ... | `+`, `-`, `*`, ...                                         |

---

## 7. "Private" attributes — convention, not enforcement

Python has **no real access control**.

```python
class Account:
    def __init__(self, balance):
        self.balance = balance       # public
        self._balance = balance      # "protected" by convention (single underscore)
        self.__balance = balance     # name-mangled (double underscore)
```

- `self._balance` — pure convention. Nothing stops external code from writing `account._balance = -999`.
- `self.__balance` — Python rewrites it to `self._Account__balance` (name mangling). This avoids accidental name collisions in subclasses, not real privacy.

There is no compiler to enforce anything. `@property` is the main real tool for controlled access.

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

This is **polymorphism**: `describe()` is written once and works for every subclass.

`super()` calls the parent implementation:

```python
class Puppy(Dog):
    def __init__(self, name: str, age_months: int):
        super().__init__(name)
        self.age_months = age_months
```

**Multiple inheritance** is legal in Python. Ambiguity is resolved by the **MRO (Method Resolution Order)** — C3 linearization. Inspect it with `Duck.__mro__`. Prefer composition over deep inheritance hierarchies.

---

## 9. Abstract Base Classes — ABC and @abstractmethod

### The problem: unenforced contracts

```python
class Animal:
    def speak(self) -> str:
        raise NotImplementedError("subclasses must implement speak()")
```

This only fails at call time. You only discover the missing implementation when you actually call the method.

### ABC + @abstractmethod: enforced contracts

```python
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self) -> str:
        \"\"\"Return the animal sound.\"\"\"
        ...

    def describe(self) -> str:          # concrete method — inherited as-is
        return f"I say: {self.speak()}"


class Dog(Animal):
    def speak(self) -> str:
        return "Woof"


dog = Dog()          # OK — all abstract methods are implemented
animal = Animal()    # TypeError: Can't instantiate abstract class Animal

class BadAnimal(Animal):
    pass             # forgot to implement speak()

bad = BadAnimal()    # TypeError: Can't instantiate abstract class BadAnimal
```

What `ABC` does:

- `class Animal(ABC):` marks `Animal` as abstract. `ABC` is shorthand for `class Animal(metaclass=ABCMeta):`.
- `@abstractmethod` marks a method as missing implementation in the base class. **Key Mental Model**: `@abstractmethod` does *not* mean "this method is required on the object" (structural contract). It specifically means **"the parent class has no code for this, so the child class must write it."**
- `@abstractmethod` MUST decorate a top-level method inside a class inheriting from `ABC` — it cannot be defined inside instance methods like `__init__`.
- Enforcement happens at **instantiation time** — the moment you try to instantiate a class missing abstract method implementations (e.g. `Animal()`), Python raises a `TypeError`.

### Abstract classes can have concrete methods too

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:    # shared concrete method — free for all subclasses
        return f"Area: {self.area():.2f}, Perimeter: {self.perimeter():.2f}"


class Circle(Shape):
    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:
        return 3.14159 * self.radius ** 2

    def perimeter(self) -> float:
        return 2 * 3.14159 * self.radius


Circle(5).describe()   # Area: 78.54, Perimeter: 31.42
```

### Abstract properties

```python
from abc import ABC, abstractmethod

class Connector(ABC):
    @property
    @abstractmethod
    def connection_string(self) -> str: ...

    @abstractmethod
    def connect(self) -> None: ...

    @abstractmethod
    def disconnect(self) -> None: ...


class PostgresConnector(Connector):
    @property
    def connection_string(self) -> str:
        return "postgresql://localhost:5432/mydb"

    def connect(self) -> None:
        print(f"Connecting to {self.connection_string}")

    def disconnect(self) -> None:
        print("Disconnecting")
```

### When to use ABC

- You own both the base class and the implementors.
- You want **runtime enforcement** — instantiating an incomplete class should fail immediately.
- You have **shared concrete behavior** in the base class that subclasses should inherit.
- You want `isinstance(obj, MyABC)` to work reliably.

---

## 10. typing.Protocol — structural typing

`ABC` requires explicit inheritance. `Protocol` defines a **shape**, and any class matching that shape satisfies it — **no inheritance needed**.

```python
from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...
    def resize(self, factor: float) -> None: ...


# These classes do NOT inherit from Drawable at all —
# they just happen to have the right methods

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

    def resize(self, factor: float) -> None:
        self.radius *= factor


class Button:
    def draw(self) -> None:
        print("Drawing button")

    def resize(self, factor: float) -> None:
        self.width *= factor


def render(item: Drawable) -> None:
    item.draw()

render(Circle())   # type-checks fine — shape matches
render(Button())   # type-checks fine — shape matches
```

This is **structural typing** (duck typing + static analysis). The type checker verifies the methods exist without requiring any declaration from the implementor.

### ABC vs. Protocol — when to use which

| Feature                             | ABC                                     | Protocol                                 |
| ----------------------------------- | --------------------------------------- | ---------------------------------------- |
| Requires explicit inheritance?      | Yes (`class Dog(Animal)`)               | No — shape match is enough               |
| Runtime enforcement (instantiation) | Yes — raises TypeError immediately      | No — only static analysis by default     |
| Shared concrete methods             | Yes — great for this                    | Unusual; Protocols are shapes            |
| Works with third-party classes      | Hard — they need to inherit from you    | Perfect — no changes to their code       |
| isinstance() support                | Built in                                | Only with @runtime_checkable             |
| Typing philosophy                   | Nominal (explicit)                      | Structural (implicit)                    |

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...

isinstance(Circle(), Drawable)   # True — only checks method names, not signatures
```

**Rule of thumb**: Use `Protocol` for dependency injection, adapter patterns, or third-party types you do not control. Use `ABC` when you own the whole hierarchy and want runtime enforcement plus shared implementation.

---

## 11. @dataclass — classes for plain data, without the boilerplate

A huge fraction of classes are just typed bags of data. Writing `__init__`, `__repr__`, and `__eq__` by hand is pure boilerplate. `dataclasses` generates them for you.

```python
from dataclasses import dataclass, field

@dataclass
class Product:
    id: str
    name: str
    price: float
    tags: list[str] = field(default_factory=list)   # safe mutable default


p1 = Product(id="p1", name="Widget", price=9.99)
p2 = Product(id="p1", name="Widget", price=9.99)

p1 == p2   # True — __eq__ auto-generated, compares field-by-field
repr(p1)   # "Product(id='p1', name='Widget', price=9.99, tags=[])"
```

You get `__init__`, `__repr__`, and `__eq__` for free. It is a real class — you can add methods, `isinstance()` works, and you can use `@property`, inheritance, etc. on top.

### Useful @dataclass options

```python
@dataclass(frozen=True)   # immutable — assigning to a field after creation raises
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
p.x = 99   # FrozenInstanceError
hash(p)    # works — frozen dataclasses are hashable


@dataclass(order=True)   # generates __lt__, __le__, etc. based on field declaration order
class Version:
    major: int
    minor: int
    patch: int

Version(1, 2, 0) < Version(1, 3, 0)   # True
```

### field() and __post_init__

```python
from dataclasses import dataclass, field

@dataclass
class Order:
    id: str
    items: list[str] = field(default_factory=list)
    _note: str = field(default="", repr=False)    # excluded from repr
    total: float = field(init=False)               # not passed to __init__

    def __post_init__(self):
        # runs after __init__ — the dataclass-friendly place for validation and derived fields
        if not self.id:
            raise ValueError("id cannot be empty")
        self.total = len(self.items) * 9.99
```

---

## 12. Pydantic BaseModel — dataclass + runtime validation + serialization

`@dataclass` gives you structured classes with auto-generated boilerplate. Pydantic's `BaseModel` adds **runtime type coercion, validation, and JSON serialization**.

```python
from pydantic import BaseModel, Field, field_validator

class User(BaseModel):
    id: str
    name: str
    email: str
    age: int = Field(ge=0, le=150)    # ge = greater-or-equal, le = less-or-equal

    @field_validator("email")
    @classmethod
    def email_must_have_at(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("must contain @")
        return v.lower()


u = User(id="1", name="Alice", age=30, email="Alice@Example.com")
u.email   # "alice@example.com" — coerced to lowercase by validator

User(id="1", name="Bob", email="not-an-email", age=-5)   # raises ValidationError
```

### What BaseModel does differently from @dataclass

| Feature                       | @dataclass           | Pydantic BaseModel                           |
| ----------------------------- | -------------------- | -------------------------------------------- |
| Auto __init__, __repr__       | Yes                  | Yes                                          |
| Runtime type validation       | No (just type hints) | Yes — coerces and validates on construction  |
| Custom validators             | Manual               | @field_validator, @model_validator           |
| JSON serialization            | No (manual)          | Yes — .model_dump(), .model_dump_json()      |
| Immutability option           | frozen=True          | model_config = ConfigDict(frozen=True)       |
| Schema generation             | No                   | Yes — .model_json_schema()                   |
| Field constraints             | No                   | Yes — Field(ge=0, le=100, min_length=1)      |

### Common Pydantic patterns

```python
from pydantic import BaseModel
from typing import Optional

class Address(BaseModel):
    street: str
    city: str
    country: str = "US"

class Customer(BaseModel):
    id: str
    name: str
    address: Address              # nested model — validated recursively
    score: Optional[float] = None

data = {"id": "c1", "name": "Alice", "address": {"street": "123 Main", "city": "NY"}}
c = Customer.model_validate(data)

c.model_dump()                    # Python dict
c.model_dump_json()               # JSON string
c.model_dump(exclude_unset=True)  # only fields explicitly set (useful for PATCH endpoints)
```

### BaseModel vs ABC — they are complementary, not competing

`BaseModel` is about **structured data**. `ABC` is about **contracts and behavior**. Use them together:

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel

class Product(BaseModel):          # data model
    id: str
    name: str
    price: float

class ProductRepository(ABC):      # contract
    @abstractmethod
    def get(self, id: str) -> Product: ...

    @abstractmethod
    def save(self, product: Product) -> None: ...

class InMemoryProductRepository(ProductRepository):   # implementation
    def __init__(self):
        self._store: dict[str, Product] = {}

    def get(self, id: str) -> Product:
        return self._store[id]

    def save(self, product: Product) -> None:
        self._store[product.id] = product
```

---

## 13. TypedDict — typed dicts when you cannot use a class

Sometimes you need a plain dict but still want type safety. `TypedDict` adds type annotations to dicts without turning them into objects.

```python
from typing import TypedDict, NotRequired

class Config(TypedDict):
    host: str
    port: int
    debug: NotRequired[bool]    # optional key

def connect(config: Config) -> None:
    print(f"Connecting to {config['host']}:{config['port']}")

config: Config = {"host": "localhost", "port": 5432}
connect(config)   # OK
```

`TypedDict` is purely a static-analysis construct — at runtime it is just a `dict`. Use it when you need interop with code that expects a plain dict. For new code where you control the shape, prefer `@dataclass` or `BaseModel`.

---

## 14. NamedTuple — typed tuples with named fields

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
    label: str = ""

p = Point(1.0, 2.0, "origin")
p.x         # 1.0
p[0]        # 1.0  (it is still a tuple — indexing works)
x, y, *_ = p    # unpacking works too
p._asdict()  # {"x": 1.0, "y": 2.0, "label": "origin"}
```

`NamedTuple` instances are immutable, memory-efficient, and interoperable with code that expects tuples. Good for small, fixed data structures used as return values or dict keys.

---

## 15. Metaclasses — how classes themselves are created

A **metaclass** is a class whose instances are classes — it controls how the class object itself is constructed. You will see `class Foo(metaclass=SomeMeta):` in advanced code.

```python
class Meta(type):
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        # Inspect or modify the class here
        return cls

class MyClass(metaclass=Meta):
    pass
```

Metaclasses power:
- `ABC` / `ABCMeta` — how `@abstractmethod` enforcement works
- Pydantic `BaseModel` — how field validation and `__init__` are auto-generated
- ORMs like SQLAlchemy — how model fields become database columns
- Django models — how `class Meta` options (table name, ordering) work

**As a rule**: you will _use_ metaclass-powered libraries constantly; you will almost never _write_ your own metaclass. A class decorator or `__init_subclass__` usually solves the same problem more simply.

### __init_subclass__ — a lighter alternative to metaclasses

```python
class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, plugin_name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if plugin_name:
            Plugin.registry[plugin_name] = cls

class FooPlugin(Plugin, plugin_name="foo"):
    pass

class BarPlugin(Plugin, plugin_name="bar"):
    pass

Plugin.registry   # {"foo": FooPlugin, "bar": BarPlugin}
```

`__init_subclass__` runs automatically when a subclass is defined — much simpler than metaclasses.

---

## 16. __slots__ — trading flexibility for memory/speed

By default, every instance carries a `__dict__` allowing arbitrary attributes:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
p.z = 99   # totally legal
```

`__slots__` opts out:

```python
class Point:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
p.z = 99   # AttributeError — z is not a declared slot
```

Worth it when creating large numbers of small objects (millions of records) and you need to shrink memory footprint. Not something to reach for by default — it complicates multiple inheritance and dynamic attribute patterns.

---

## 17. Composition vs. inheritance

Inheritance answers "**is-a**" (a `Dog` is an `Animal`). Composition answers "**has-a**" (an `OrderService` has a `Mailer` and a `Logger`).

```python
# Inheritance: "is-a" — use sparingly, only for genuine type hierarchies
class Dog(Animal): ...

# Composition: "has-a" / "uses-a"
class OrderService:
    def __init__(self, repo, mailer, logger):
        self.repo = repo
        self.mailer = mailer
        self.logger = logger

    def place_order(self, order) -> None:
        self.repo.save(order)
        self.mailer.send_confirmation(order)
        self.logger.info(f"Order {order.id} placed")
```

`OrderService` is _handed_ objects at construction time (**dependency injection**). Swapping `SmtpMailer` for `SendgridMailer` requires zero changes to `OrderService`. Testing is easy — pass in mock implementations.

**Prefer composition**; reach for inheritance only when there is a genuine, stable "is-a" relationship and you want polymorphic dispatch.

---

## 18. Context managers — __enter__ and __exit__

The `with` statement works with any object that implements `__enter__` and `__exit__`.

```python
class DatabaseConnection:
    def __init__(self, dsn: str):
        self.dsn = dsn
        self._conn = None

    def __enter__(self):
        self._conn = connect(self.dsn)
        return self._conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._conn.close()
        return False   # do not suppress exceptions


with DatabaseConnection("postgresql://localhost/mydb") as conn:
    conn.execute("SELECT 1")
# conn is closed here even if an exception was raised
```

For simpler cases, `contextlib.contextmanager` lets you write a context manager as a generator:

```python
from contextlib import contextmanager

@contextmanager
def timer(label: str):
    import time
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{label}: {elapsed:.3f}s")

with timer("database query"):
    pass   # ... do work ...
```

---

## 19. Putting it all together

A realistic example combining the major patterns from this guide:

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from typing import Protocol


# Data models (Pydantic) ─────────────────────────────────────────────────────

class Product(BaseModel):
    id: str
    name: str
    price: float = Field(gt=0)
    tags: list[str] = []


# Contracts (Protocol — structural, no inheritance required) ──────────────────

class ProductRepository(Protocol):
    def get(self, id: str) -> Product: ...
    def list_all(self) -> list[Product]: ...
    def save(self, product: Product) -> None: ...


class Notifier(Protocol):
    def notify(self, message: str) -> None: ...


# Concrete implementations ────────────────────────────────────────────────────

class InMemoryProductRepository:
    def __init__(self):
        self._store: dict[str, Product] = {}

    def get(self, id: str) -> Product:
        return self._store[id]

    def list_all(self) -> list[Product]:
        return list(self._store.values())

    def save(self, product: Product) -> None:
        self._store[product.id] = product


class ConsoleNotifier:
    def notify(self, message: str) -> None:
        print(f"[NOTIFY] {message}")


# Application service (composition + dependency injection) ────────────────────

class ProductService:
    def __init__(self, repo: ProductRepository, notifier: Notifier):
        self._repo = repo           # typed against Protocol, not concrete class
        self._notifier = notifier

    def add_product(self, product: Product) -> None:
        self._repo.save(product)
        self._notifier.notify(f"New product added: {product.name}")

    def get_product(self, id: str) -> Product:
        return self._repo.get(id)


# Usage ───────────────────────────────────────────────────────────────────────

repo = InMemoryProductRepository()
notifier = ConsoleNotifier()
service = ProductService(repo=repo, notifier=notifier)

p = Product(id="p1", name="Widget", price=9.99, tags=["sale"])
service.add_product(p)                # [NOTIFY] New product added: Widget
fetched = service.get_product("p1")
print(fetched.model_dump_json())
```

Every concept from this guide appears:
- `BaseModel` for validated, serializable data.
- `Protocol` for structural contracts (dependency inversion without coupling).
- Plain classes using `__init__` and composition for adapters and services.
- Private-by-convention (`_store`, `_repo`) for internal state.
- Dependency injection via `__init__` so `ProductService` never knows about concrete implementations.

---

## Quick reference

| Concept            | When to use                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| Plain `class`      | Any reusable unit of data + behavior                                                |
| `@dataclass`       | Typed data containers — auto `__init__`/`__repr__`/`__eq__`                        |
| `BaseModel`        | Data needing runtime validation, coercion, or JSON serialization                    |
| `ABC`              | Enforced interfaces — you own the hierarchy and want runtime checks                 |
| `Protocol`         | Structural interfaces for DI, adapters, or third-party types                        |
| `TypedDict`        | Typed plain dicts for API interop or kwargs typing                                  |
| `NamedTuple`       | Immutable, lightweight tuples with named fields                                     |
| `@property`        | Computed attributes or validated setters without breaking the attribute access API   |
| `@classmethod`     | Alternate constructors, factory methods                                             |
| `@staticmethod`    | Helpers logically belonging to a class but needing no instance/class state          |
| `__slots__`        | Memory/performance optimization for large numbers of small instances                |
| Context manager    | Setup/teardown paired with resource management (`with` statement)                   |
| Composition        | Default; prefer over inheritance unless there is a clear "is-a" relationship        |
| Inheritance        | Genuine type hierarchies, shared concrete behavior, polymorphic dispatch            |
