import React from 'react'

export function TaskList() {
  return (
    <ul>
      <li data-testid="task-item-1">
        <span>Kitap Oku</span>
        <button>Sil</button>
      </li>
      <li data-testid="task-item-2">
        <span>Spor Yap</span>
        <button>Sil</button>
      </li>
    </ul>
  );
}