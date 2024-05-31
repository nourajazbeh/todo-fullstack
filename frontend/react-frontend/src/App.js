import './App.css';
import Footer from './Footer';
import Header from './Header';
import './TodoList';
import TodoList from './TodoList';

function App() {
  return (
    <div className="App">
      <Header></Header>
      <TodoList></TodoList>
      <Footer></Footer>
    </div>
  );
}

export default App;