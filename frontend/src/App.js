import Categories from './components/Categories';
import Items from './components/Items';
import './App.css';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Cafe Menu Management</h1>
      <Categories />
      <Items />
    </div>
  );
}

export default App;