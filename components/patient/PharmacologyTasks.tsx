/**
 * Patch 04: Pharmacology Task List with Gamification
 * Shows medication-related tasks (labs, side effect reports, education)
 */

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import taskCompleteAnimation from '../../public/lottie/task_complete.json';

interface PharmTask {
  id: string;
  label: string;
  dueOn: string | null;
  status: 'OPEN' | 'DONE' | 'SKIPPED';
  points: number;
  medOrderId: string | null;
  createdAt: string;
}

interface Props {
  patientId: string;
  apiBaseUrl?: string;
}

export default function PharmacologyTasks({ patientId, apiBaseUrl = 'http://localhost:3000' }: Props) {
  const [tasks, setTasks] = useState<PharmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, [patientId]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/pharmacology/tasks/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string, points: number) => {
    setCompletingTaskId(taskId);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/pharmacology/tasks/${patientId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      // Update local state
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: 'DONE' as const } : t
      ));

      // Show success animation
      setEarnedPoints(points);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task. Please try again.');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const skipTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to skip this task?')) return;

    try {
      const token = localStorage.getItem('authToken');
      // Note: Backend doesn't have skip endpoint yet, but we'll add it
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: 'SKIPPED' as const } : t
      ));
    } catch (error) {
      console.error('Failed to skip task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const openTasks = tasks.filter(t => t.status === 'OPEN');
  const completedTasks = tasks.filter(t => t.status === 'DONE');
  const totalPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Medication Tasks</h2>
            <p className="opacity-90">{openTasks.length} tasks to complete</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">{totalPoints}</div>
            <p className="text-sm opacity-80">Points Earned</p>
          </div>
        </div>
      </div>

      {/* Open Tasks */}
      {openTasks.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">To Do</h3>
          {openTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={completeTask}
              onSkip={skipTask}
              isCompleting={completingTaskId === task.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending medication tasks</p>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">Completed</h3>
          {completedTasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="font-semibold text-gray-700 line-through">{task.label}</p>
                  <p className="text-xs text-gray-500">
                    Completed {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-bold">
                <span>+{task.points}</span>
                <span className="text-lg">⚡</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm">
            <Lottie
              animationData={taskCompleteAnimation}
              loop={false}
              style={{ width: 200, height: 200, margin: '0 auto' }}
            />
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">Task Complete!</h3>
            <p className="text-center text-lg text-purple-600 font-bold">
              +{earnedPoints} points earned
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onComplete,
  onSkip,
  isCompleting,
}: {
  task: PharmTask;
  onComplete: (id: string, points: number) => void;
  onSkip: (id: string) => void;
  isCompleting: boolean;
}) {
  const isOverdue = task.dueOn ? new Date(task.dueOn) < new Date() : false;

  const getTaskIcon = (label: string): string => {
    if (label.toLowerCase().includes('lab')) return '🧪';
    if (label.toLowerCase().includes('side effect')) return '📋';
    if (label.toLowerCase().includes('education')) return '📚';
    if (label.toLowerCase().includes('pharmacy')) return '💊';
    if (label.toLowerCase().includes('refill')) return '🔄';
    return '✓';
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-md p-5 border-2 transition-all
        ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-purple-300'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-3xl">{getTaskIcon(task.label)}</div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 mb-1">{task.label}</h4>
            {task.dueOn && (
              <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                {isOverdue ? '⚠️ Overdue: ' : 'Due: '}
                {new Date(task.dueOn).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
          <span className="font-bold text-purple-700">{task.points}</span>
          <span className="text-lg">⚡</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onComplete(task.id, task.points)}
          disabled={isCompleting}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {isCompleting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Completing...
            </span>
          ) : (
            'Mark Complete'
          )}
        </button>
        <button
          onClick={() => onSkip(task.id)}
          disabled={isCompleting}
          className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
