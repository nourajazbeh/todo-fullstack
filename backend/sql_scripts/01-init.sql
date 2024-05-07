CREATE DATABASE IF NOT EXISTS todoexpress;

CREATE USER IF NOT EXISTS 'todouser'@'localhost' IDENTIFIED BY 'todo2023!';

GRANT SELECT, UPDATE, INSERT, DELETE ON todoexpress.* TO 'todouser'@'localhost';

FLUSH PRIVILEGES;