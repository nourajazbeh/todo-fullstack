import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTodo, setEditTodo] = useState('');

  // Fetch todos from the backend when the component is mounted
  useEffect(() => {
    fetchTodos();
    const bootstrap = require('bootstrap');

    // Initialize Bootstrap dropdowns (or other components as needed)
    const dropdownElements = document.querySelectorAll('.dropdown-toggle');
    dropdownElements.forEach(dropdown => new bootstrap.Dropdown(dropdown));
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/todos');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setTodos(data.todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const addTodo = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newTodo })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setTodos([...todos, { id: data.id, description: newTodo }]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodoCompletion = async (todo) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/todo/${todo.id}`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      fetchTodos(); // Fetch updated todos from the backend
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const removeTodo = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/todo/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const editTodoItem = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/todo/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editTodo })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      fetchTodos();
      setEditingId(null);
    } catch (error) {
      console.error('Error editing todo:', error);
    }
  };

  return (
    <div className="container bg-light p-3">
      <div className="card rounded-3 mx-auto my-3 p-3" style={{ width: '550px' }}>
        <h3 className="text-center">Todo App</h3>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter new Todo Item"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addTodo}>Absenden</button>
        </div>
        <table className="table table-hover">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {todos.map((todo, index) => (
              <tr key={todo.id}>
                <th scope="row">{index + 1}</th>
                <td>{todo.description}</td>
                <td>{todo.status || 'open'}</td>
                <td>
                  <div className="dropdown">
                    <button className="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      Actions
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button className="dropdown-item" onClick={() => toggleTodoCompletion(todo)}>Update Status</button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => { setEditingId(todo.id); setEditTodo(todo.description); }}>Edit</button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => removeTodo(todo.id)}>Delete</button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {editingId !== null && (
          <div className="modal show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Item</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingId(null)} />
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control"
                    value={editTodo}
                    onChange={(e) => setEditTodo(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-danger" onClick={() => setEditingId(null)}>schliessen</button>
                  <button className="btn btn-primary" onClick={editTodoItem}>speichern</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;