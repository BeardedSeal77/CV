from pydantic import BaseModel, ConfigDict, Field


class JobRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="The job's id, e.g. acme-backend-engineer")


class NoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
