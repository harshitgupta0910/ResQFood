import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiCheck, HiX, HiShieldExclamation } from 'react-icons/hi';
import dayjs from 'dayjs';

const ComplaintSystem = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [resolutionStatus, setResolutionStatus] = useState('resolved');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getComplaints();
            setComplaints(res.data.complaints);
        } catch (err) {
            toast.error('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const openResolveModal = (complaint, status) => {
        setSelectedComplaint(complaint);
        setResolutionStatus(status);
        setResolutionNotes('');
    };

    const handleResolve = async () => {
        if (!selectedComplaint) return;
        const notes = resolutionNotes.trim();
        if (!notes) {
            toast.error('Please add resolution notes');
            return;
        }

        try {
            setUpdating(true);
            await adminAPI.resolveComplaint(selectedComplaint._id, { status: resolutionStatus, resolutionNotes: notes });
            toast.success(`Complaint ${resolutionStatus}`);
            setSelectedComplaint(null);
            setResolutionNotes('');
            await fetchComplaints();
        } catch (err) {
            toast.error('Failed to update complaint status');
        } finally {
            setUpdating(false);
        }
    };

    const getTypeStyle = (type) => {
        const map = {
            spoiled_food: 'bg-rose-100 text-rose-600',
            fake_ngo: 'bg-purple-100 text-purple-600',
            no_show: 'bg-amber-100 text-amber-600',
            inappropriate_behavior: 'bg-red-100 text-red-600',
            other: 'bg-gray-100 text-gray-600',
        };

        return map[type] || map.other;
    };

    const getStatusVariant = (status) => {
        const map = {
            pending: 'warning',
            investigating: 'info',
            resolved: 'success',
            rejected: 'default',
            escalated: 'danger',
        };

        return map[status] || 'default';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Food Safety & Complaints</h1>
                <p className="text-gray-500 mt-1">Review reported behavior, unsanitary food conditions, and resolve organizational disputes.</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? <PageLoader /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Incident Details</th>
                                    <th className="px-6 py-4 font-semibold">Reported By / Target</th>
                                    <th className="px-6 py-4 font-semibold">Description</th>
                                    <th className="px-6 py-4 font-semibold">Status / Final Notes</th>
                                    <th className="px-6 py-4 font-semibold text-right">Resolve</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {complaints.map(item => (
                                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors bg-white items-start">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center ${getTypeStyle(item.type)}`}>
                                                <HiShieldExclamation className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 capitalize w-36 truncate" title={item.type.replace('_', ' ')}>{item.type.replace('_', ' ')}</div>
                                                <div className="text-xs text-gray-500">
                                                  {dayjs(item.createdAt).format('MMM D, YYYY')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 truncate max-w-xs">
                                            <div className="text-sm font-medium text-emerald-700 hover:underline cursor-pointer">Re: {item.reportedBy?.name || 'Unknown'}</div>
                                            <div className="text-sm font-medium text-rose-700 hover:underline cursor-pointer mt-1">Suspect: {item.reportedUser?.name || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-normal break-words max-w-sm">
                                            <p className="text-gray-700 text-sm italic border-l-2 border-gray-300 pl-3">"{item.description}"</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={getStatusVariant(item.status)} className="mb-2 uppercase">
                                                {item.status}
                                            </Badge>
                                            {item.resolutionNotes && (
                                                <div className="mt-1 text-xs text-gray-500 italic max-w-xs truncate overflow-hidden">
                                                    Note: {item.resolutionNotes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right align-top space-x-2">
                                            {item.status === 'pending' || item.status === 'investigating' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openResolveModal(item, 'resolved')} className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 p-2 rounded-lg" title="Resolve & Affirm">
                                                        <HiCheck className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => openResolveModal(item, 'rejected')} className="text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg" title="Reject Report">
                                                        <HiX className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-semibold text-gray-400">Closed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {complaints.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No complaints reported globally.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={Boolean(selectedComplaint)}
                onClose={() => {
                    if (!updating) {
                        setSelectedComplaint(null);
                        setResolutionNotes('');
                    }
                }}
                title="Resolve Complaint"
                size="md"
            >
                <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-sm font-semibold text-gray-800">{selectedComplaint?.type?.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500 mt-1">Reported by {selectedComplaint?.reportedBy?.name || 'Unknown'} against {selectedComplaint?.reportedUser?.name || 'Unknown'}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Final Status</label>
                        <select
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
                            value={resolutionStatus}
                            onChange={(e) => setResolutionStatus(e.target.value)}
                            disabled={updating}
                        >
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                            <option value="investigating">Investigating</option>
                            <option value="escalated">Escalated</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution Notes</label>
                        <textarea
                            rows={4}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 resize-y"
                            placeholder="Add action taken, evidence checked, and final decision..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            disabled={updating}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedComplaint(null);
                                setResolutionNotes('');
                            }}
                            disabled={updating}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleResolve}
                            isLoading={updating}
                        >
                            Save Decision
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ComplaintSystem;