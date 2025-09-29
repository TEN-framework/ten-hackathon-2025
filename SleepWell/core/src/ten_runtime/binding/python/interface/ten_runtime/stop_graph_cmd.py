#
# Copyright © 2025 Agora
# This file is part of TEN Framework, an open source project.
# Licensed under the Apache License, Version 2.0, with certain conditions.
# Refer to the "LICENSE" file in the root directory for more information.
#
from typing import TypeVar, cast

from libten_runtime_python import (
    _StopGraphCmd,  # pyright: ignore[reportPrivateUsage]
    _ten_py_cmd_stop_graph_register_type,  # pyright: ignore[reportPrivateUsage]  # noqa: E501
)

from .cmd import Cmd

T = TypeVar("T", bound="StopGraphCmd")


class StopGraphCmd(_StopGraphCmd, Cmd):
    def __init__(self):  # pyright: ignore[reportMissingSuperCall]
        raise NotImplementedError("Use StopGraphCmd.create instead.")

    @classmethod
    def create(  # pyright: ignore[reportIncompatibleMethodOverride, reportImplicitOverride]  # noqa: E501
        cls: type[T],
    ) -> T:
        return cast(T, cls.__new__(cls))


_ten_py_cmd_stop_graph_register_type(StopGraphCmd)
