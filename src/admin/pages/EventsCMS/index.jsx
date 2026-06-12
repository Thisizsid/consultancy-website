import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getAllDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '../../../firebase/firestore';
import { Calendar, Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import Card, { CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const eventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please enter a time range (e.g. 2:00 PM - 4:00 PM)'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(2, 'Location is required'),
  status: z.enum(['upcoming', 'past'], 'Please select a status'),
});

const EventsCMS = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, id: null });

  const { showToast } = useUiStore();
  const { fetchStats } = useDashboardStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      time: '',
      description: '',
      location: '',
      status: 'upcoming'
    }
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('events');
      // Sort: upcoming first, then by date descending
      const sorted = data.sort((a, b) => {
        if (a.status === 'upcoming' && b.status === 'past') return -1;
        if (a.status === 'past' && b.status === 'upcoming') return 1;
        return new Date(b.date) - new Date(a.date);
      });
      setEvents(sorted);
    } catch (err) {
      showToast('Error loading events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddClick = () => {
    setEditingEvent(null);
    reset({
      title: '',
      date: '',
      time: '',
      description: '',
      location: '',
      status: 'upcoming'
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (eventItem) => {
    setEditingEvent(eventItem);
    reset({
      title: eventItem.title,
      date: eventItem.date,
      time: eventItem.time,
      description: eventItem.description,
      location: eventItem.location,
      status: eventItem.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument('events', confirmState.id);
      showToast('Event deleted successfully.', 'success');
      fetchEvents();
      fetchStats();
    } catch (err) {
      showToast('Delete failed.', 'error');
    } finally {
      setConfirmState({ open: false, id: null });
    }
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingEvent) {
        await updateDocument('events', editingEvent.id, formData);
        showToast('Event updated successfully.', 'success');
      } else {
        await createDocument('events', formData);
        showToast('Event created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchEvents();
      fetchStats();
    } catch (err) {
      showToast('Operation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-secondary" /> Events CMS
          </h1>
          <p className="text-xs text-text-secondary">Configure upcoming and past student seminars and webinar listings.</p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Add New Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : events.length === 0 ? (
        <Card className="p-8 text-center italic text-text-secondary text-sm">
          No seminars or webinars scheduled yet. Click "Add New Event" to schedule one.
        </Card>
      ) : (
        <Table headers={['Status', 'Event Details', 'Date & Time', 'Location', 'Actions']}>
          {events.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                {e.status === 'upcoming' ? (
                  <Badge variant="info">Upcoming</Badge>
                ) : (
                  <Badge variant="neutral">Completed</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="font-bold text-text-primary text-sm">{e.title}</p>
                <p className="text-xs text-text-secondary truncate mt-0.5" title={e.description}>{e.description}</p>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-text-primary">{e.date}</p>
                <p className="text-[10px] text-text-secondary">{e.time}</p>
              </TableCell>
              <TableCell className="text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-accent" /> {e.location}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleEditClick(e)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(e.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Modify Seminar Event' : 'Schedule Seminar Event'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Event Title" 
            placeholder="e.g. Study in Germany Webinar"
            {...register('title')}
            error={errors.title?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Event Date
              </label>
              <input 
                type="date"
                {...register('date')}
                className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.date.message}</p>
              )}
            </div>

            <Input 
              label="Time Range" 
              placeholder="e.g. 11:00 AM - 1:30 PM"
              {...register('time')}
              error={errors.time?.message}
            />

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Event Status
              </label>
              <select 
                className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                {...register('status')}
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Completed (Past)</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.status.message}</p>
              )}
            </div>
          </div>

          <Input 
            label="Venue Location / Online Link" 
            placeholder="e.g. Lasso Seminar Room / Zoom Webinar Link"
            {...register('location')}
            error={errors.location?.message}
          />

          <Input 
            label="Event Description / Seminar Agenda"
            type="textarea"
            rows={4}
            placeholder="List guest speakers, evaluation checklists, and admissions criteria..."
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={submitting}>
              Save Event
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete Event?"
        message="This seminar or webinar listing will be permanently removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />

    </div>
  );
};

export default EventsCMS;
