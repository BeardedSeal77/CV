"""Atomic writes and a per-folder lock, compatible with the Node store
(lib/jobhunt/store.ts) so both can run side by side: same `.lock` file, same
stale timeout."""

import os
import random
import time
from contextlib import contextmanager
from pathlib import Path

LOCK_STALE_SECONDS = 30


def write_atomic(path: Path, content: str) -> None:
    """Temp file + rename, retrying while Windows holds the target open."""
    tmp = path.with_name(f"{path.name}.{os.getpid()}.{random.getrandbits(32):x}.tmp")
    tmp.write_text(content, encoding="utf-8", newline="\n")
    for attempt in range(21):
        try:
            os.replace(tmp, path)
            return
        except PermissionError:
            if attempt == 20:
                tmp.unlink(missing_ok=True)
                raise
            time.sleep(0.05 * (attempt + 1))


@contextmanager
def folder_lock(folder: Path):
    """Serialises writes to one folder across processes, so read-modify-write
    never loses an update."""
    lock = folder / ".lock"
    for attempt in range(101):
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            break
        except FileExistsError:
            try:
                if time.time() - lock.stat().st_mtime > LOCK_STALE_SECONDS:
                    lock.unlink(missing_ok=True)  # left behind by a crashed writer
                    continue
            except FileNotFoundError:
                continue
            if attempt == 100:
                raise TimeoutError(f"Timed out waiting to write {folder.name}")
            time.sleep(0.05)
    try:
        yield
    finally:
        lock.unlink(missing_ok=True)
