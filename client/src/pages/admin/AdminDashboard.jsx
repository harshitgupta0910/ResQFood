import { useState, useEffect } from 'react';
import { HiUsers, HiClipboardList, HiOutlineShieldCheck, HiScale, HiExclamationCircle, HiFire, HiHeart } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import io from 'socket.io-client';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let socket;
    const fetchMetrics = async () => {
      try {
        const res = await adminAPI.getUserMetrics();
        setMetrics(res.data.metrics);
        setAnomalies(res.data.anomalies);
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    
    // Real-Time Socket Connection
    const token = localStorage.getItem('resqfood_token');
    socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        auth: { token }
    });

    socket.on('admin_metrics_update', (newMetrics) => {
        setMetrics(prev => ({...prev, ...newMetrics}));
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Admin Monitoring</h1>
          <p className="text-gray-500 mt-1">Real-time metrics, anomalies, and overall platform health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={metrics?.usersCount || 0} icon={HiUsers} color="bg-blue-500" />
        <StatCard title="Total Listings" value={metrics?.totalListings || 0} icon={HiClipboardList} color="bg-indigo-500" />
        <StatCard title="Active Listings" value={metrics?.activeListings || 0} icon={HiFire} color="bg-amber-500" />
        <StatCard title="Meals Rescued" value={metrics?.totalMealsSaved || 0} icon={HiHeart} color="bg-emerald-500" />
        <StatCard title="Pending Complaints" value={metrics?.pendingComplaints || 0} icon={HiExclamationCircle} color="bg-rose-500" />
      </div>

      <Card title="System Anomalies Detected">
        {anomalies && anomalies.length > 0 ? (
            <div className="divide-y divide-gray-100">
                {anomalies.map((anomaly, idx) => (
                    <div key={idx} className="py-4 flex justify-between items-center bg-rose-50 px-4 rounded-lg my-2 border border-rose-100">
                        <div>
                            <h4 className="font-semibold text-rose-800">{anomaly.title}</h4>
                            <p className="text-sm text-rose-600 font-medium">Quantity: {anomaly.quantity} {anomaly.unit}</p>
                            <p className="text-xs text-rose-500">Status: {anomaly.status} • Category: {anomaly.category}</p>
                        </div>
                        <Badge variant="error">Review</Badge>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10">
                <HiOutlineShieldCheck className="mx-auto h-12 w-12 text-emerald-400" />
                <p className="mt-4 text-gray-500 font-medium">No active anomalies detected!</p>
            </div>
        )}
      </Card>
      
    </div>
  );
};

export default AdminDashboard;
