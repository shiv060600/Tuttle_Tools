import pydantic


class QueryRequest(pydantic.BaseModel):
    query: str
    top_k: int = 5

class QueryResponse(pydantic.BaseModel):
    result: str