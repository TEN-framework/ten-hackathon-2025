from typing import Any, Dict, List
from pydantic import BaseModel
from ten_ai_base import utils


class ElevenLabsTTS2Config(BaseModel):
    key: str = ""
    dump: bool = False
    dump_path: str = "./"
    params: Dict[str, Any] = {}
    black_list_keys: List[str] = ["key"]

    # url params
    sample_rate: int = 16000

    def to_str(self, sensitive_handling: bool = False) -> str:
        if not sensitive_handling:
            return f"{self}"

        config = self.copy(deep=True)
        if config.key:
            config.key = utils.encrypt(config.key)
        return f"{config}"

    def update_params(self) -> None:
        # This function allows overriding default config values with 'params' from property.json
        # pylint: disable=no-member

        for key, value in self.params.items():
            if hasattr(self, key):
                setattr(self, key, value)

        # Delete keys after iteration is complete
        for key in self.black_list_keys:
            if key in self.params:
                del self.params[key]
