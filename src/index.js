const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checksExistsUserTodo(request, response, next) {
  const { user } = request;

  const todoExists = user.todos.find(todo => todo.id === request.params.id);

  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found" });
  }

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(user => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists!" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  const { user } = request;
  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsUserTodo, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  let updatedTodo = null;

  user.todos = user.todos.map(todo => {
    if (todo.id == request.params.id) {
      todo.title = title;
      todo.deadline = new Date(deadline);

      updatedTodo = todo;
    }

    return todo;
  });

  return response.status(200).json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsUserTodo, (request, response) => {
  const { user } = request;

  let updatedTodo = null;

  user.todos = user.todos.map(todo => {
    if (todo.id === request.params.id) {
      todo.done = true;

      updatedTodo = todo;
    }

    return todo;
  });

  return response.status(200).json(updatedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsUserTodo, (request, response) => {
  const { user } = request;

  user.todos = user.todos.filter(todo => todo.id !== request.params.id);

  return response.status(204).send();
});

module.exports = app;
