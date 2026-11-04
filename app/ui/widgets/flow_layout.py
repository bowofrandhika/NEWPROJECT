"""Flow layout adaptif (diadaptasi dari contoh resmi Qt).

Dipakai untuk kartu statistik agar jumlah kolom menyesuaikan lebar jendela —
bagian dari pendekatan *Adaptive Interface*.
"""

from __future__ import annotations

from PySide6.QtCore import QPoint, QRect, QSize, Qt
from PySide6.QtWidgets import QLayout, QLayoutItem, QSizePolicy, QWidget


class FlowLayout(QLayout):
    def __init__(self, parent: QWidget | None = None, margin: int = 0, h_spacing: int = 14, v_spacing: int = 14) -> None:
        super().__init__(parent)
        self._items: list[QLayoutItem] = []
        self._h_spacing = h_spacing
        self._v_spacing = v_spacing
        self.setContentsMargins(margin, margin, margin, margin)

    def addItem(self, item: QLayoutItem) -> None:  # noqa: N802 (API Qt)
        self._items.append(item)

    def addWidget(self, widget: QWidget) -> None:  # noqa: N802
        self.addItem(_WidgetItem(widget))

    def count(self) -> int:
        return len(self._items)

    def itemAt(self, index: int):  # noqa: N802
        if 0 <= index < len(self._items):
            return self._items[index]
        return None

    def takeAt(self, index: int):  # noqa: N802
        if 0 <= index < len(self._items):
            return self._items.pop(index)
        return None

    def expandingDirections(self):  # noqa: N802
        return Qt.Orientations(Qt.Orientation(0))

    def hasHeightForWidth(self) -> bool:  # noqa: N802
        return True

    def heightForWidth(self, width: int) -> int:  # noqa: N802
        return self._do_layout(QRect(0, 0, width, 0), test_only=True)

    def setGeometry(self, rect: QRect) -> None:  # noqa: N802
        super().setGeometry(rect)
        self._do_layout(rect, test_only=False)

    def sizeHint(self) -> QSize:  # noqa: N802
        return self.minimumSize()

    def minimumSize(self) -> QSize:  # noqa: N802
        size = QSize()
        for item in self._items:
            size = size.expandedTo(item.minimumSize())
        margins = self.contentsMargins()
        size += QSize(margins.left() + margins.right(), margins.top() + margins.bottom())
        return size

    def _do_layout(self, rect: QRect, test_only: bool) -> int:
        margins = self.contentsMargins()
        effective = rect.adjusted(margins.left(), margins.top(), -margins.right(), -margins.bottom())
        x = effective.x()
        y = effective.y()
        line_height = 0

        for item in self._items:
            widget = item.widget()
            space_x = self._h_spacing
            space_y = self._v_spacing
            if widget is not None:
                hint = widget.sizeHint()
                item_width = max(hint.width(), widget.minimumWidth())
                item_height = hint.height()
            else:
                hint = item.sizeHint()
                item_width = hint.width()
                item_height = hint.height()

            next_x = x + item_width + space_x
            if next_x - space_x > effective.right() + 1 and line_height > 0:
                x = effective.x()
                y = y + line_height + space_y
                next_x = x + item_width + space_x
                line_height = 0

            if not test_only:
                item.setGeometry(QRect(QPoint(x, y), QSize(item_width, item_height)))

            x = next_x
            line_height = max(line_height, item_height)

        return y + line_height - rect.y() + margins.bottom()


class _WidgetItem(QLayoutItem):
    def __init__(self, widget: QWidget) -> None:
        super().__init__()
        self._widget = widget

    def widget(self) -> QWidget:
        return self._widget

    def sizeHint(self) -> QSize:  # noqa: N802
        return self._widget.sizeHint()

    def minimumSize(self) -> QSize:  # noqa: N802
        return self._widget.minimumSize()

    def setGeometry(self, rect: QRect) -> None:  # noqa: N802
        self._widget.setGeometry(rect)

    def isEmpty(self) -> bool:  # noqa: N802
        return self._widget.isHidden()

    def sizePolicy(self) -> QSizePolicy:  # noqa: N802
        return self._widget.sizePolicy()
