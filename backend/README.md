# Backend für die Todo-App schreiben
- Anleitung: https://medium.com/p/39d16dcd0b5b/edit
#### Datenbank vorbereiten für das Backend
Wir installieren uns erst einmal lokal eine mysql-Datenbank auf unseren Rechner. Das funktioniert mit chocolatey einfach mit
```
choco install mysql
```
Danach starten wir den mysql-Server über die Dienste im Windows-Menü. Alternativ über die CMD mit
```
net start mysql
```
Danach können wir uns mit dem mysql-Server verbinden. Das geht mit
```
mysql -u root -p
```
Danach können wir uns eine Datenbank anlegen. Das geht mit
```
CREATE DATABASE test;
```
Danach können wir uns eine Tabelle anlegen. Das geht mit
```
CREATE TABLE test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL
);
```
Danach können wir uns ein paar Testdaten einfügen. Das geht mit
```
INSERT INTO test (description) VALUES ('Test 1');
INSERT INTO test (description) VALUES ('Test 2');
INSERT INTO test (description) VALUES ('Test 3');
```
Danach können wir uns die Daten anzeigen lassen. Das geht mit
```
SELECT * FROM test;
```
Das sollte dann so aussehen:
```
+----+-------------+
| id | description |
+----+-------------+
|  1 | Test 1      |
|  2 | Test 2      |
|  3 | Test 3      |
+----+-------------+
3 rows in set (0.00 sec)
```
Das war es schon. Wir haben jetzt eine Datenbank mit einer Tabelle und ein paar Testdaten.
#### Backend mit FastAPI implementieren
Wir laden zunächst Umgebungsvariablen aus einer .env-Datei. Dazu verwenden wir das Modul python-dotenv. 
```
load_dotenv()
```
Wir instanziieren zunächst einmal eine FastAPI-Instanz mit
```
app = FastAPI()
```
Danach definieren wir eine Funktion, um CORS zu aktivieren. 
```
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Danach definieren wir eine Funktion, um uns mit der Datenbank zu verbinden. 
```
def get_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME')
        )
        if connection.is_connected():
            print("SQL Connection Self-Check: Ok")
            print("DB Connection set up successfully")
            return connection
    except Error as e:
        print("Database connection error", e)
        raise HTTPException(status_code=500, detail="Database connection error")
```
Hier verwenden wir die Umgebungsvariablen, die wir zuvor geladen haben.
Danach definieren wir zunächst einmal ein Modell für unsere Todo-Items. Das ist eine Klasse, die wir von einem BaseModel ableiten. Das BaseModel importieren wir aus pydantic, das wiederum aus dem FastAPI-Package. 
```
class Todo(BaseModel):
    description: str
```
Danach definieren wir die Routen für unsere Endpunkte unser Restful-API. 
```
@app.get('/todos')
async def get_todos():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT * FROM todos')
    todos = cursor.fetchall()
    cursor.close()
    connection.close()
    return {"todos": todos}
```
Hier holen wir uns alle Todos aus der Datenbank und geben sie als JSON zurück. Dazu wird mit `connection` zunächst eine Verbindung zur Datenbank gemacht und mit `cursor` ein Cursor erstellt. Mit `cursor.execute()` wird ein SQL-Statement ausgeführt und mit `cursor.fetchall()` die Ergebnisse geholt. Danach wird der Cursor und die Verbindung geschlossen. Die Todos werden als JSON zurückgegeben. Diese JSON-Daten werden dann für unser Frontend benötigt, das sich diese Daten im JSON-Format fetcht und sie auch so am besten verarbeiten kann.
Wir wollen als nächstes ein spezielles Todo per ID abrufen. 
```
@app.get('/todo/{id}')
async def get_todo_by_id(id: int):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT * FROM todos WHERE id = %s', (id,))
    todo = cursor.fetchone()
    cursor.close()
    connection.close()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"todo": todo}
```
Hier wird ein Todo per ID abgerufen. Dazu wird ein Parameter `id` erwartet. Mit `cursor.execute()` wird ein SQL-Statement ausgeführt und mit `cursor.fetchone()` das Ergebnis geholt. Danach wird der Cursor und die Verbindung geschlossen. Wenn kein Todo gefunden wurde, wird eine HTTPException mit dem Statuscode 404 geworfen.
Als nächstes wollen wir ein Todo hinzufügen. 
```
@app.post('/todo')
async def create_todo(todo: Todo):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute('INSERT INTO todos (description) VALUES (%s)', (todo.description,))
    connection.commit()
    todo_id = cursor.lastrowid
    cursor.close()
    connection.close()
    return {"id": todo_id}
```
Hier wird ein neues Todo hinzugefügt. Dazu wird ein Todo-Objekt erwartet. Mit `cursor.execute()` wird ein SQL-Statement ausgeführt. Die Verbindung wird mit `connection.commit()` committet. Mit `cursor.lastrowid` wird die ID des neuen Todos geholt. Das ist dann einfach die nächsthöhere, d.h. wir inkrementieren um 1. Danach wird der Cursor und die Verbindung geschlossen. Die ID des neuen Todos wird zurückgegeben.
Als nächstes wollen wir ein Todo aktualisieren. Zunächst einmal wollen wir den Status aktualisieren.
```
@app.put('/todo/{id}')
async def update_todo_status(id: int):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("""
        UPDATE todos
        SET status = CASE
            WHEN status = 'open' THEN 'in progress'
            WHEN status = 'in progress' THEN 'finished'
            ELSE status
        END
        WHERE id = %s
    """, (id,))
    connection.commit()
    affected_rows = cursor.rowcount
    cursor.close()
    connection.close()
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"affected-rows": affected_rows}
```
Hier wird der Status eines Todos aktualisiert. Dazu wird ein Parameter `id` erwartet. Mit `cursor.execute()` wird ein SQL-Statement ausgeführt. Die Verbindung wird mit `connection.commit()` committet. Mit `cursor.rowcount` wird die Anzahl der betroffenen Zeilen geholt. Danach wird der Cursor und die Verbindung geschlossen. Wenn keine Zeilen betroffen waren, wird eine HTTPException mit dem Statuscode 404 geworfen.
Als nächstes wollen wir die Beschreibung eines Todos aktualisieren. 
```
@app.patch('/todo/{id}')
async def update_todo_description(id: int, todo: Todo):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute('UPDATE todos SET description = %s WHERE id = %s', (todo.description, id))
    connection.commit()
    affected_rows = cursor.rowcount
    cursor.close()
    connection.close()
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"id": id, "message": "Item successfully updated"}
```
Hier wird die Beschreibung eines Todos aktualisiert. Dazu wird ein Parameter `id` und ein Todo-Objekt erwartet. Mit `cursor.execute()` wird ein SQL-Statement ausgeführt. Die Verbindung wird mit `connection.commit()` committet. Mit `cursor.rowcount` wird die Anzahl der betroffenen Zeilen geholt. Danach wird der Cursor und die Verbindung geschlossen. Wenn keine Zeilen betroffen waren, wird eine HTTPException mit dem Statuscode 404 geworfen.
Als nächstes wollen wir ein Todo löschen. 
```
@app.delete('/todo/{id}')
async def delete_todo(id: int):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute('DELETE FROM todos WHERE id = %s', (id,))
    connection.commit()
    affected_rows = cursor.rowcount
    cursor.close()
    connection.close()
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"action": "delete", "affected-rows": affected_rows}
```
Hier wird ein Todo gelöscht. Dazu wird ein Parameter `id` erwartet. Mit `cursor.execute()` wird ein SQL-Statement ausgeführt. Die Verbindung wird mit `connection.commit()` committet. Mit `cursor.rowcount` wird die Anzahl der betroffenen Zeilen geholt. Danach wird der Cursor und die Verbindung geschlossen. Wenn keine Zeilen betroffen waren, wird eine HTTPException mit dem Statuscode 404 geworfen.

Wir können die App jetzt mit uvicorn app:app --reload starten... Wenn die App sich mit der Datenbank verbinden kann, dann wird sie auf http://127.0.0.1:8000 laufen. 
#### Testen mit Postman
Wir können die Endpunkte jetzt mit Postman testen. Dazu können wir uns Postman herunterladen, oder aber die Extension in VSCode hinzufügen. (Wer sich keinen Account bei Postman anlegen will, kann auch die Extension in VSCode Thunder Client hinzufügen.) Wir können dann die Endpunkte testen, indem wir die URL eingeben und die Methode auswählen. Wir können auch die Body-Parameter eingeben und die Antwort sehen.
- GET /todos: Einfach http://127.0.0.1:8000/todos eingeben und GET auswählen.
- GET /todo/{id}: Einfach http://127.0.0.1:8000/todo/1 eingeben und GET auswählen.
- POST /todo: Einfach http://127.0.0.1:8000/todo eingeben und POST auswählen. In den Body-Parametern die Beschreibung (description) eingeben. 
```
{
    "description": "Test"
}
```
- PUT /todo/{id}: Einfach http://127.0.0.1:8000/todo/1 eingeben und PUT auswählen. Dann wird jeweils der Status einen weiter gesetzt.
- PATCH /todo/{id}: Einach http://127.0.0.1:8000/todo/1 eingeben und PATCH auswählen. Dann wird die Beschreibung geändert. Dabei bitte den Body füllen. 
```
{
    "description": "First Item"
}
```
- DELETE /todo/{id}: Einfach http://127.0.0.1:8000/todo/1 eingeben und DELETE auswählen. Dann wird das Item aus der Liste gelöscht...

#### Frontend mit VanillaJS und statischen HTML
Wir erstellen uns zunächst einmal eine HTML-Datei. Das geht mit
```
touch index.html
```
Danach können wir uns die Datei in VSCode öffnen und den HTML-Code schreiben. 
```
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
</head>

<body class="container bg-light">
    <script id="todo-item-template" type="text/x-handlebars-template">
        <tr>
            <th scope="row">{{index}}</th>
            <td>{{description}}</td>
            <td>{{status}}</td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Actions
                    </button>
                    <ul class="dropdown-menu">
                      <li><a class="dropdown-item" onclick="updateTodoStatus('{{id}}');" style="cursor: pointer;">{{action}}</a></li>
                      <li><a class="dropdown-item" onclick="editTodo('{{id}}')" style="cursor: pointer;">Edit</a></li>
                      <li><a class="dropdown-item" onclick="deleteTodo('{{id}}')" style="cursor: pointer;">Delete</a></li>
                    </ul>
                  </div>
            </td>
          </tr>
    </script>


    
    <div class="modal" tabindex="-1" id="myModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Item</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="form">
                  <input type="text" name="item" id="item">
              </form>
            </div>
            <div class="modal-footer">
              <button id="dialog-close" class="btn btn-danger">schliessen</button>
              <button id="dialog-save" class="btn btn-success">speichern</button>
            </div>
          </div>
        </div>
      </div>



    <div class="bg-white card rounded-3 mx-auto my-3 p-3" style="width: 550px">
        <h3 class="text-center">Todo App</h3>
        <input type="text" id="todo-item" placeholder="Enter new Todo Item">
        <button onclick="sendTodo();" class="btn btn-success">Absenden</button>
        <div id="todo-container" class="container">
            <table class="table table-hover" id="todo-table">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Description</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody id="todo-tbody">

                </tbody>
            </table>

        </div>
    </div>

    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
        crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.8/handlebars.min.js"></script>
    <script src="scripts/main.js"></script>
</body>

</html>
```
Wir erstellen uns dann noch eine JavaScript-Datei. Das geht mit
```
mkdir scripts
touch scripts/main.js
```
Danach können wir uns die Datei in VSCode öffnen und den JavaScript-Code schreiben. 
```
console.log("Todo Script läuft");
const apiUrl = "http://localhost:8000/";
// const apiUrl = "http://apigateway.awslambda.amazonaws.com/";

const container = document.getElementById('todo-container');
const tbody = document.getElementById('todo-tbody');
let list;


function getTodos() {
    tbody.innerHTML = '';
    let source = document.getElementById('todo-item-template').innerHTML;
    let template = Handlebars.compile(source);
    fetch(apiUrl + "todos")
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log(data);
            let todos = data.todos;
            todos.forEach((todo, index) => {
                todo.index = index + 1;
                todo.action = statusValue(todo.status);
                const html = template(todo);
                tbody.innerHTML += html;
            });
        });
}

function statusValue(status) {
    let text = "";
    if (status === 'open') {
        text = "Start";
    } else if (status === 'in progress') {
        text = "Beenden";
    } else {
        text = "Fertig";
    }
    return text;
}

function sendTodo() {
    // Value vom input auslesen und an die Api via POST senden
    const input = document.getElementById('todo-item');
    if (input.value) {
        console.log(input.value);
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ "description": input.value })
        }
        fetch(apiUrl + "todo", options)
            .then(response => {
                console.log("Response: ", response);
                getTodos();
            })
    } else {
        alert("Todo Item darf nicht leer sein!");
    }

}

function updateTodoStatus(id) {
    console.log("Update Todo ", id);
    const options = {
        method: "PUT"
    }
    fetch(apiUrl + 'todo/' + id, options)
        .then(response => {
            getTodos();
            console.log("PUT Response", response);
        })
}

function updateTodoItem(description, id) {
    console.log("Update Todo ", id);
    const options = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ "description": description })
    }
    fetch(apiUrl + 'todo/' + id, options)
        .then(response => {
            console.log("PATCH Response", response);
            getTodos();
        })
}

function deleteTodo(id) {
    console.log("Delete Todo ", id);
    const options = {
        method: "DELETE"
    }
    fetch(apiUrl + 'todo/' + id, options)
        .then(response => {
            getTodos();
            console.log("DELETE Response", response);
        })
}

function editTodo(id) {
    fetch(apiUrl + 'todo/' + id)
        .then(response => response.json())
        .then(item => {
            // Correctly access the 'description' field from the 'todo' object
            if (!item || !item.todo) {
                throw new Error("No todo found with the given ID");
            }
            console.log("ITEM", item.todo);
            let itemData = item.todo; // directly assign the todo object
            const myModal = new bootstrap.Modal('#myModal', {});
            const iteminput = document.getElementById('item');
            const closebutton = document.getElementById('dialog-close');
            const savebutton = document.getElementById('dialog-save');
            closebutton.onclick = () => myModal.hide();
            savebutton.onclick = () => {
                myModal.hide();
                updateTodoItem(iteminput.value, id);
            }
            iteminput.value = itemData.description; // Access 'description' directly
            myModal.show();
        })
        .catch(error => console.error("Error fetching todo:", error));
}

getTodos();
```

#### Frontend mit React implementieren
Wir erstellen uns zunächst einmal ein neues React-Projekt. Das geht mit
```
npx create-react-app react-todo
```
Danach wechseln wir in das Verzeichnis und starten das Projekt mit
```
cd react-todo
npm start
```
Wir installieren uns noch ein paar Pakete. Das geht mit
```
npm install bootstrap
```
Dann können wir unsere einzige Komponente hinzufügen. Das ist die TodoList-Komponente. Als erstes nutzen wir ein paar UseState-Hooks, um die Todos zu speichern und die Eingabe zu speichern. 
```
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTodo, setEditTodo] = useState('');
}
```
Danach holen wir uns die Todos aus der Datenbank. Das geht mit
```
  useEffect(() => {
    fetchTodos();
```
Direkt dabei müssen wir noch Bootstrap initialisieren und Dropdowns aktivieren.
```
   const dropdownElements = document.querySelectorAll('.dropdown-toggle');
    dropdownElements.forEach(dropdown => new bootstrap.Dropdown(dropdown));
  }, []);
```
Danach definieren wir die Funktionen, um die Endpunkte zu bedienen. Wir starten mal mit der fetchTodos-Funktion. Diese wird im useEffect aufgerufen. 
```
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
```
Hier wird der Endpunkt /todos aufgerufen. Die Todos werden geholt und in den State gespeichert. Danach können wir mal mit addTodo weitermachen. 
```
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
```
Hier wird der Endpunkt /todo aufgerufen. Ein neues Todo wird hinzugefügt und in den State gespeichert. Danach können wir mal mit updateTodoStatus weitermachen. 
```
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
```
Hier wird der Endpunkt /todo/{id} aufgerufen. Der Status eines Todos wird aktualisiert. Danach können wir mal mit updateTodoDescription weitermachen. 
```
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
```
Hier wird der Endpunkt /todo/{id} aufgerufen. Die Beschreibung eines Todos wird aktualisiert. Danach können wir mal mit deleteTodo weitermachen. 
```
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
```
Hier wird der Endpunkt /todo/{id} aufgerufen. Ein Todo wird gelöscht. Danach machen wir mit dem Rendern weiter. Hier wird der HTML-Code geschrieben und die Funktionen als Skripts aufgerufen. Außerdem werden Bootstrap-Klassen verwendet.
```
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
          <button className="btn btn-success" onClick={addTodo}>Absenden</button>
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
                    <button className="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown">
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
                  <button className="btn btn-success" onClick={editTodoItem}>speichern</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
```
Wir müssen die Komponente noch exportieren mit `export default TodoList` und binden die in der `App.js` ein. 
```
import TodoList from './TodoList';
```
Danach können wir die Komponente in der `App.js` einbinden. 
```
function App() {
  return (
    <div className="App">
      <TodoList />
    </div>
  );
}
```
Schau im Browser auf localhost:3000 nach. Mach parallel die Entwicklertools auf (F11) und schau im Netzwerk-Tab nach, was passiert.
Das war es schon. Wir haben jetzt eine Todo-App mit einem Backend und einem Frontend. Wir können jetzt die App starten und die Todos hinzufügen, bearbeiten, löschen und den Status ändern.
