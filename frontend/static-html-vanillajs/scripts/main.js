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