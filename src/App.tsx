import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index'; // Assuming Index.tsx is the default page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;