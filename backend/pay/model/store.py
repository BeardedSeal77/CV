"""The only code that reads or writes data/jobhunt/pay. Files are re-read only
when they change on disk; every write is validated and atomic."""

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

from utils.datadir import jobhunt_dir
from utils.errors import NotFound
from utils.files import folder_lock, write_atomic

from .schema import CITY_SLUG, COUNTRY_CODE, Baseline, City, Country, Fx, Grading


def pay_dir() -> Path:
    return jobhunt_dir() / "pay"


def _path(*parts: str) -> Path:
    return pay_dir().joinpath(*parts)


@lru_cache(maxsize=256)
def _parse(path: str, mtime_ns: int, model: type[BaseModel]) -> BaseModel:
    return model.model_validate(json.loads(Path(path).read_text(encoding="utf-8")))


def _read(path: Path, model: type[BaseModel], what: str):
    if not path.is_file():
        raise NotFound(f"No {what}: add data/jobhunt/pay/{path.relative_to(pay_dir()).as_posix()}")
    return _parse(str(path), path.stat().st_mtime_ns, model)


def _write(path: Path, data: BaseModel) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with folder_lock(path.parent):
        write_atomic(path, json.dumps(data.model_dump(), ensure_ascii=False, indent=2) + "\n")


def baseline() -> Baseline:
    return _read(_path("baseline.json"), Baseline, "baseline")


def grading() -> Grading:
    return _read(_path("grading.json"), Grading, "grading settings")


def fx() -> Fx:
    path = _path("fx.json")
    return _read(path, Fx, "exchange rates") if path.is_file() else Fx(base="ZAR")


def country(code: str) -> Country:
    if not COUNTRY_CODE.match(code or ""):
        raise NotFound(f"No country {code!r}")
    return _read(_path("countries", f"{code}.json"), Country, f"country file for {code}")


def city(slug: str) -> City:
    if not CITY_SLUG.match(slug or ""):
        raise NotFound(f"No city {slug!r}")
    return _read(_path("cities", f"{slug}.json"), City, f"city file for {slug}")


def city_exists(slug: str) -> bool:
    return bool(CITY_SLUG.match(slug or "")) and _path("cities", f"{slug}.json").is_file()


def all_cities() -> list[City]:
    folder = _path("cities")
    if not folder.is_dir():
        return []
    return [city(p.stem) for p in sorted(folder.glob("*.json"))]


def save_baseline(data: Baseline) -> None:
    _write(_path("baseline.json"), data)


def save_fx(data: Fx) -> None:
    _write(_path("fx.json"), data)


def save_country(data: Country) -> None:
    _write(_path("countries", f"{data.code}.json"), data)


def save_city(data: City) -> None:
    _write(_path("cities", f"{data.slug}.json"), data)
