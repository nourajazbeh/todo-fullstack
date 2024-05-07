import os
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

# Create FastAPI instance
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
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

# Models
class Todo(BaseModel):
    description: str

# Routes
@app.get('/todos')
async def get_todos():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT * FROM todos')
    todos = cursor.fetchall()
    cursor.close()
    connection.close()
    return {"todos": todos}

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
