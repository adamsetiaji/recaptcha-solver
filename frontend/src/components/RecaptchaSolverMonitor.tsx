import { FC, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ActivitySquare, Clock, CheckCircle, TrendingUp, LucideIcon, Play } from 'lucide-react';

// Types
interface TaskStats {
  queueLength: number;
  activeWorkers: number;
  maxParallel: number;
  completedTasks: number;
  successRate: number;
}

interface PerformanceData {
  time: string;
  totalTasks: number;
  successfulTasks: number;
}

interface DashboardMetricProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  color: string;
}

// Socket.io setup
const BACKEND_URL = import.meta.env.PROD 
  ? 'https://yourproduction.domain' 
  : 'http://localhost:3000';

const socket = io(BACKEND_URL);

// API client functions
const createTask = async () => {
  const response = await fetch(`${BACKEND_URL}/api/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientKey: '123456789' // Replace with actual API key management
    })
  });
  return response.json();
};

const getTaskResult = async (taskId: string) => {
  const response = await fetch(`${BACKEND_URL}/api/getTaskResult`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientKey: '123456789', // Replace with actual API key management
      taskId
    })
  });
  return response.json();
};

const DashboardMetric: FC<DashboardMetricProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
);

const RecaptchaSolverMonitor: FC = () => {
  const [stats, setStats] = useState<TaskStats>({
    queueLength: 0,
    activeWorkers: 0,
    maxParallel: 5,
    completedTasks: 0,
    successRate: 0
  });

  const [isConnected, setIsConnected] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pollTaskResult = useCallback(async (taskId: string) => {
    try {
      const result = await getTaskResult(taskId);
      if (result.message === 'ready') {
        setIsProcessing(false);
        setCurrentTask(null);
        // Handle successful result
        console.log('Task completed:', result.solution.gRecaptchaResponse);
      } else if (result.message === 'processing') {
        // Continue polling
        setTimeout(() => pollTaskResult(taskId), 2000);
      } else {
        setIsProcessing(false);
        setCurrentTask(null);
        console.error('Task failed:', result.error);
      }
    } catch (error) {
      console.error('Error polling task:', error);
      setIsProcessing(false);
      setCurrentTask(null);
    }
  }, []);

  const handleStartTask = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const response = await createTask();
      if (response.success) {
        setCurrentTask(response.taskId);
        pollTaskResult(response.taskId);
      } else {
        console.error('Failed to create task:', response.message);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Socket event handlers
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('stats', (newStats: TaskStats) => {
      setStats(newStats);
    });

    socket.on('taskUpdate', (update: any) => {
      // Update performance data
      setPerformanceData(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        
        // Calculate new values
        const totalTasks = prev[prev.length - 1]?.totalTasks + 1 || 1;
        const successfulTasks = prev[prev.length - 1]?.successfulTasks + 
          (update.status === 'completed' ? 1 : 0);

        const newPoint = {
          time: timeStr,
          totalTasks,
          successfulTasks
        };

        return [...prev, newPoint].slice(-20); // Keep last 20 points
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('stats');
      socket.off('taskUpdate');
    };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">reCAPTCHA Solver Monitor</h1>
          <div className={`inline-flex items-center px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            {isConnected ? 'System Active' : 'System Inactive'}
          </div>
        </div>
        
        <button
          onClick={handleStartTask}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isProcessing 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <Play className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Start Task'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardMetric 
          icon={Clock}
          title="Active Workers"
          value={stats.activeWorkers}
          color="bg-blue-500"
        />
        <DashboardMetric 
          icon={ActivitySquare}
          title="Tasks in Queue"
          value={stats.queueLength}
          color="bg-yellow-500"
        />
        <DashboardMetric 
          icon={CheckCircle}
          title="Completed Tasks"
          value={stats.completedTasks}
          color="bg-green-500"
        />
        <DashboardMetric 
          icon={TrendingUp}
          title="Success Rate"
          value={`${stats.successRate}%`}
          color="bg-purple-500"
        />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Task Performance</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalTasks" 
                stroke="#3B82F6" 
                name="Total Tasks"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="successfulTasks" 
                stroke="#10B981" 
                name="Successful Tasks"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {currentTask && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            Current Task ID: {currentTask}
          </p>
        </div>
      )}
    </div>
  );
};

export default RecaptchaSolverMonitor;