import React, { useEffect, useState } from 'react';
import {
  getAllDocuments,
  updateDocument,
  deleteDocument,
} from '../../../firebase/firestore';
import {
  Inbox,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  StickyNote,
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { useUiStore } from '../../../store/uiStore';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', variant: 'accent', icon: AlertCircle },
  { value: 'in_progress', label: 'In Progress', variant: 'warning', icon: Clock },
  { value: 'resolved', label: 'Resolved', variant: 'success', icon: CheckCircle2 },
  { value: 'closed', label: 'Closed', variant: 'neutral', icon: XCircle },
];

const getStatusConfig = (status) =>
  STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

// ────────────────────────────────────────────────
// Single expandable enquiry row
// ────────────────────────────────────────────────
const EnquiryRow = ({ enquiry, onStatusChange, onDelete, onSaveNotes }) => {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(enquiry.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const statusCfg = getStatusConfig(enquiry.status);
  const StatusIcon = statusCfg.icon;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onSaveNotes(enquiry.id, notes);
    setSavingNotes(false);
  };

  const handleStatusChange = async (e) => {
    setChangingStatus(true);
    await onStatusChange(enquiry.id, e.target.value);
    setChangingStatus(false);
  };

  return (
    <div className="border border-gray-150 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Row Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Left – name + source */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold uppercase text-sm shrink-0">
            {(enquiry.name || enquiry.studentName || '?').charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-sm truncate">
              {enquiry.name || enquiry.studentName || 'Unknown'}
            </p>
            <p className="text-xs text-text-secondary truncate">{enquiry.email || '—'}</p>
          </div>
        </div>

        {/* Middle – country + date */}
        <div className="hidden md:flex items-center gap-6 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            {enquiry.country || enquiry.interestedCountry || '—'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(enquiry.createdAt)}
          </span>
        </div>

        {/* Right – status badge + expand toggle */}
        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <select
              value={enquiry.status || 'new'}
              onChange={handleStatusChange}
              disabled={changingStatus}
              className={`
                appearance-none pl-8 pr-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-secondary transition-colors
                ${enquiry.status === 'new' ? 'bg-secondary/10 text-secondary border-secondary/25' : ''}
                ${enquiry.status === 'in_progress' ? 'bg-secondary/10 text-secondary-dark border-secondary/25' : ''}
                ${enquiry.status === 'resolved' ? 'bg-accent/10 text-accent-light border-accent/25' : ''}
                ${enquiry.status === 'closed' ? 'bg-gray-50 text-gray-600 border-gray-200' : ''}
              `}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <StatusIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            className="p-1.5 rounded-md text-text-secondary hover:bg-gray-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 bg-surface space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-secondary font-medium">Email</p>
                <a href={`mailto:${enquiry.email}`} className="font-semibold text-text-primary hover:text-secondary break-all">
                  {enquiry.email || '—'}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-secondary font-medium">Phone</p>
                <p className="font-semibold text-text-primary">{enquiry.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-secondary font-medium">Destination Country</p>
                <p className="font-semibold text-text-primary">
                  {enquiry.country || enquiry.interestedCountry || '—'}
                </p>
              </div>
            </div>
            {enquiry.service && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-secondary font-medium">Service Interest</p>
                  <p className="font-semibold text-text-primary">{enquiry.service}</p>
                </div>
              </div>
            )}
            {enquiry.eventTitle && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-secondary font-medium">Event Registered</p>
                  <p className="font-semibold text-text-primary">{enquiry.eventTitle}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-text-secondary font-medium">Submitted On</p>
                <p className="font-semibold text-text-primary">{formatDate(enquiry.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {enquiry.message && (
            <div className="bg-white border border-gray-150 rounded-md p-4">
              <p className="text-xs text-text-secondary font-semibold mb-1 uppercase tracking-wide">Message</p>
              <p className="text-sm text-text-primary leading-relaxed">{enquiry.message}</p>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-primary uppercase tracking-wide">
              <StickyNote className="w-3.5 h-3.5 text-secondary" /> Admin Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add internal follow-up notes here..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary resize-none transition-colors"
            />
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="secondary"
                loading={savingNotes}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => onDelete(enquiry.id)}
              >
                Delete Enquiry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────
// Main EnquiriesCMS Page
// ────────────────────────────────────────────────
const EnquiriesCMS = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewDetailId, setViewDetailId] = useState(null);

  const { showToast } = useUiStore();

  const fetchEnquiries = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getAllDocuments('enquiries');
      // Sort newest first
      const sorted = data.sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setEnquiries(sorted);
    } catch (err) {
      showToast('Failed to load enquiries.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDocument('enquiries', id, { status: newStatus });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      showToast('Status updated.', 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleSaveNotes = async (id, notes) => {
    try {
      await updateDocument('enquiries', id, { notes });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, notes } : e))
      );
      showToast('Notes saved.', 'success');
    } catch {
      showToast('Failed to save notes.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this enquiry?')) return;
    try {
      await deleteDocument('enquiries', id);
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      showToast('Enquiry deleted.', 'success');
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  // Derived filtered list
  const filtered = enquiries.filter((e) => {
    const name = (e.name || e.studentName || '').toLowerCase();
    const email = (e.email || '').toLowerCase();
    const country = (e.country || e.interestedCountry || '').toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      country.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats summary
  const stats = STATUS_OPTIONS.map((s) => ({
    ...s,
    count: enquiries.filter((e) => (e.status || 'new') === s.value).length,
  }));
  const totalNew = enquiries.filter((e) => !e.status || e.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Inbox className="w-6 h-6 text-secondary" /> Enquiries &amp; Bookings
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage all consultation requests and contact form submissions from your website.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          loading={refreshing}
          onClick={() => fetchEnquiries(true)}
        >
          Refresh
        </Button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
              className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                filterStatus === s.value
                  ? 'border-secondary bg-secondary/5 shadow-sm'
                  : 'border-gray-150 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">{s.label}</p>
                <Icon className={`w-4 h-4 ${
                  s.value === 'new' ? 'text-secondary' :
                  s.value === 'in_progress' ? 'text-secondary-dark' :
                  s.value === 'resolved' ? 'text-accent-light' : 'text-gray-400'
                }`} />
              </div>
              <p className="text-3xl font-extrabold text-primary mt-1">{s.count}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Bar */}
      <Card className="bg-white border border-gray-150">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white transition-colors"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results Count */}
      {!loading && (
        <p className="text-xs text-text-secondary px-1">
          Showing <span className="font-bold text-text-primary">{filtered.length}</span> of{' '}
          <span className="font-bold text-text-primary">{enquiries.length}</span> enquiries
          {totalNew > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
              {totalNew} new
            </span>
          )}
        </p>
      )}

      {/* Enquiry List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-text-secondary">Loading enquiries...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white border border-gray-150">
          <CardBody className="p-16 text-center space-y-3">
            <Inbox className="w-12 h-12 text-text-muted mx-auto" />
            <p className="font-bold text-text-primary">No enquiries found</p>
            <p className="text-sm text-text-secondary">
              {enquiries.length === 0
                ? 'No enquiries have been submitted yet. They will appear here when visitors fill out contact or booking forms.'
                : 'No results match your current search or filter.'}
            </p>
            {(search || filterStatus !== 'all') && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterStatus('all'); }}>
                Clear Filters
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((enq) => (
            <EnquiryRow
              key={enq.id}
              enquiry={enq}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onSaveNotes={handleSaveNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnquiriesCMS;
