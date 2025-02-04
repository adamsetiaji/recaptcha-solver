// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import FunctionRequests from './pages/FunctionRequests';
import RecaptchaSolverMonitor from './pages/RecaptchaSolverMonitor';
import Setting from './pages/Setting';

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/function-requests" element={<FunctionRequests />} />
          <Route path="/monitor-recaptcha" element={<RecaptchaSolverMonitor />} />
          <Route path="/setting" element={<Setting />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};


export default App;