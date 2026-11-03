class ActionError(Exception):
    """A refusal the caller can act on: the message is shown as is."""

    def __init__(self, message: str, status: int = 400, **extra):
        super().__init__(message)
        self.status = status
        self.extra = extra


class NotFound(ActionError):
    def __init__(self, message: str):
        super().__init__(message, status=404)
