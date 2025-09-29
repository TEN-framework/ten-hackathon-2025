from ten_runtime import (
    Addon,
    register_addon_as_extension,
    TenEnv,
)
from .extension import MemoirStorageExtension


@register_addon_as_extension("memoir_storage_python")
class MemoirStorageAddon(Addon):
    def on_create_instance(self, ten_env: TenEnv, name: str, context) -> None:
        ten_env.log_info("MemoirStorageAddon on_create_instance")
        extension = MemoirStorageExtension(name)
        ten_env.on_create_instance_done(extension, context)


addon = MemoirStorageAddon()
