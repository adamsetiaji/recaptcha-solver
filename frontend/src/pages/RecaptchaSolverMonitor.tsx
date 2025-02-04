// frontend/src/pages/RecaptchaSolverMonitor.tsx
import { FC, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ActivitySquare, Clock, CheckCircle, TrendingUp, Play, AlertCircle, Ban, Copy, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TaskStats {
  queueLength: number;
  activeWorkers: number;
  maxParallel: number;
  completedTasks: number;
  successRate: number;
  taskHistory: Array<{
    taskId: string;
    status: string;
    timestamp: string;
    data: {
      result: {
        token: {
          success: boolean;
          message: string;
          gRecaptchaResponse?: string;
          error?: string;
        };
        queueLength: number;
        activeWorkers: number;
        startTime: string;
        endTime?: string;
        duration?: number;
      };
    };
  }>;
}

const BACKEND_URL = import.meta.env.NODE_ENV === 'production'
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000';

const socket = io(BACKEND_URL);

const CopyButton: FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-gray-100 transition-colors"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
};

const TaskHistoryItem: FC<{ task: TaskStats['taskHistory'][0] }> = ({ task }) => {
  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex justify-between items-start">
        <div>
          <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(task.status)}`}>
            {task.status}
          </span>

          <span className="ml-2 text-sm px-2 py-1 text-gray-600">
            {task.data.result.token.message}
          </span>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600 flex items-center">
              ID: {task.taskId}
              <CopyButton text={task.taskId} />
            </span>

            {task.data.result.duration && (
              <span className="text-sm text-gray-500">
                Duration: {Math.floor(task.data.result.duration / 1000)}s
              </span>
            )}
          </div>

          {task.data.result.token.gRecaptchaResponse && (
            <div className="mt-2 text-sm text-gray-600 flex items-center">
              <span className="text-gray-500">
                Token: {task.data.result.token.gRecaptchaResponse.substring(0, 20)}...
              </span>
              <CopyButton text={task.data.result.token.gRecaptchaResponse} />
            </div>
          )}

          {task.data.result.token.error && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {task.data.result.token.error}
            </div>
          )}
        </div>

        <span className="text-sm text-gray-500">
          {new Date(task.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'queued': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const calculateAverageDuration = (tasks: TaskStats['taskHistory']) => {
  const completedTasks = tasks.filter(task => task.status === 'completed');
  if (completedTasks.length === 0) return 0;

  const totalDuration = completedTasks.reduce((sum, task) =>
    sum + (task.data.result.duration ? Math.floor(task.data.result.duration / 1000) : 0), 0);

  return Math.round(totalDuration / completedTasks.length);
};

const DashboardMetric: FC<{
  icon: typeof Clock;
  title: string;
  value: string | number;
  color: string;
}> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm h-full">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-semibold">{value}</p>
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
    successRate: 0,
    taskHistory: []
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/stats`);
        const data = await response.json();
        if (data.success) setStats(data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('stats', setStats);
    socket.on('taskUpdate', update => update.stats && setStats(update.stats));

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('stats');
      socket.off('taskUpdate');
    };
  }, []);

  const handleStartTask = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await fetch(`${BACKEND_URL}/api/createTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientKey: '123456789' })
      });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const chartData = stats.taskHistory.map((task, index, array) => ({
    time: new Date(task.timestamp).toLocaleTimeString(),
    activeWorkers: task.data.result.activeWorkers,
    queueLength: task.data.result.queueLength,
    taskSuccess: array.slice(0, index + 1).filter(t => t.status === 'completed').length,
    taskFailed: array.slice(0, index + 1).filter(t => t.status === 'failed').length,
    avgDuration: calculateAverageDuration(array.slice(0, index + 1)),
  })).reverse();

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">reCAPTCHA Solver Monitor</h1>
          <div className={`inline-flex items-center px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {isConnected ? 'System Active' : 'System Inactive'}
          </div>
        </div>

        <button
          onClick={handleStartTask}
          disabled={isProcessing}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
            isProcessing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <Play className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Start Task'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
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
          title="Tasks Success"
          value={stats.taskHistory.filter(t => t.status === 'completed').length}
          color="bg-green-500"
        />
        <DashboardMetric
          icon={Ban}
          title="Tasks Failed"
          value={stats.taskHistory.filter(t => t.status === 'failed').length}
          color="bg-red-500"
        />
        <DashboardMetric
          icon={CheckCircle}
          title="Completed Tasks"
          value={stats.completedTasks}
          color="bg-cyan-500"
        />
        <DashboardMetric
          icon={TrendingUp}
          title="Success Rate"
          value={`${stats.successRate}%`}
          color="bg-purple-500"
        />
        <DashboardMetric
          icon={Clock}
          title="Average Duration"
          value={`${calculateAverageDuration(stats.taskHistory)}s`}
          color="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Performance Graph</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Avg Duration (s)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="activeWorkers"
                  stroke="#3B82F6"
                  name="Active Workers"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="queueLength"
                  stroke="#EAB308"
                  name="Tasks in Queue"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="taskSuccess"
                  stroke="#22C55E"
                  name="Tasks Success"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="taskFailed"
                  stroke="#EF4444"
                  name="Tasks Failed"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgDuration"
                  stroke="#8B5CF6"
                  name="Avg Solve Duration"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Task History</h2>
          <div className="h-96 overflow-y-auto">
            {stats.taskHistory.map(task => (
              <TaskHistoryItem key={task.taskId} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecaptchaSolverMonitor;