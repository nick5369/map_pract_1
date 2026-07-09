const STORAGE_KEY = 'todo-forge-items';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const todoTemplate = document.getElementById('todo-template');
const taskCount = document.getElementById('task-count');
const emptyState = document.getElementById('empty-state');
const clearCompletedButton = document.getElementById('clear-completed');
const filterButtons = Array.from(document.querySelectorAll('.filter'));

let todos = loadTodos();
let activeFilter = 'all';
let editingId = null;

render();

function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createTodo(text) {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now(),
  };
}

function render() {
  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === 'active') {
      return !todo.completed;
    }

    if (activeFilter === 'completed') {
      return todo.completed;
    }

    return true;
  });

  todoList.innerHTML = '';

  visibleTodos.forEach((todo) => {
    const fragment = todoTemplate.content.cloneNode(true);
    const item = fragment.querySelector('.todo-item');
    const toggle = fragment.querySelector('.toggle');
    const text = fragment.querySelector('.todo-text');
    const editButton = fragment.querySelector('.edit-button');
    const deleteButton = fragment.querySelector('.delete-button');

    item.dataset.id = todo.id;
    item.classList.toggle('completed', todo.completed);
    item.classList.toggle('editing', editingId === todo.id);

    toggle.checked = todo.completed;
    text.textContent = todo.text;
    text.contentEditable = editingId === todo.id;
    text.spellcheck = false;
    text.setAttribute('role', 'textbox');
    text.setAttribute('aria-label', 'Task text');

    if (editingId === todo.id) {
      editButton.textContent = 'Save';
      requestAnimationFrame(() => {
        placeCaretAtEnd(text);
        text.focus();
      });
    } else {
      editButton.textContent = 'Edit';
    }

    toggle.addEventListener('change', () => {
      todo.completed = toggle.checked;
      saveTodos();
      render();
    });

    editButton.addEventListener('click', () => {
      if (editingId === todo.id) {
        const updatedText = normalizeText(text.textContent);
        if (!updatedText) {
          text.textContent = todo.text;
          editingId = null;
          render();
          return;
        }

        todo.text = updatedText;
        editingId = null;
        saveTodos();
        render();
        return;
      }

      editingId = todo.id;
      render();
    });

    text.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        editButton.click();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        editingId = null;
        render();
      }
    });

    text.addEventListener('blur', () => {
      if (editingId !== todo.id) {
        return;
      }

      const updatedText = normalizeText(text.textContent);
      if (updatedText) {
        todo.text = updatedText;
        saveTodos();
      }

      editingId = null;
      render();
    });

    deleteButton.addEventListener('click', () => {
      todos = todos.filter((item) => item.id !== todo.id);
      if (editingId === todo.id) {
        editingId = null;
      }
      saveTodos();
      render();
    });

    todoList.appendChild(fragment);
  });

  taskCount.textContent = `${todos.length} ${todos.length === 1 ? 'item' : 'items'}`;
  emptyState.hidden = todos.length > 0;
  clearCompletedButton.disabled = !todos.some((todo) => todo.completed);

  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === activeFilter);
  });
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function placeCaretAtEnd(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = normalizeText(todoInput.value);

  if (!text) {
    todoInput.focus();
    return;
  }

  todos = [createTodo(text), ...todos];
  todoInput.value = '';
  editingId = null;
  saveTodos();
  render();
  todoInput.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    render();
  });
});

clearCompletedButton.addEventListener('click', () => {
  const before = todos.length;
  todos = todos.filter((todo) => !todo.completed);

  if (todos.length === before) {
    return;
  }

  if (!todos.some((todo) => todo.id === editingId)) {
    editingId = null;
  }

  saveTodos();
  render();
});
