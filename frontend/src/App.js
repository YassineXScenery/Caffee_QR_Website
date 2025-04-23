import { useState } from 'react';
import Items from './components/Items';
import Categories from './components/Categories';
import MenuDisplay from './components/MenuDisplay';

function App() {
  const [showManagement, setShowManagement] = useState(false);

  const toggleManagement = () => {
    setShowManagement(!showManagement);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Cafe Menu</h1>
        <button
          onClick={toggleManagement}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          {showManagement ? 'View Menu' : 'Manage Menu'}
        </button>
      </div>
      {showManagement ? (
        <div className="space-y-8">
          <Categories />
          <Items />
        </div>
      ) : (
        <MenuDisplay />
      )}
    </div>
  );
}

export default App;