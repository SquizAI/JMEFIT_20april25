import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

interface EventDate {
  id: string;
  event_name: string;
  event_type: 'class' | 'workshop' | 'challenge' | 'maintenance' | 'holiday';
  start_date: string;
  end_date?: string;
  recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  max_participants?: number;
  current_participants?: number;
  location?: string;
  instructor?: string;
  notes?: string;
  active: boolean;
  created_at: string;
}

interface BlackoutDate {
  id: string;
  date: string;
  reason: string;
  affects_services: string[];
  created_at: string;
}

function DateManager() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'calendar' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<EventDate | null>(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showBlackoutForm, setShowBlackoutForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', filterType],
    queryFn: async () => {
      let query = supabase
        .from('event_dates')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (filterType !== 'all') {
        query = query.eq('event_type', filterType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as EventDate[];
    }
  });

  // Fetch blackout dates
  const { data: blackoutDates, isLoading: blackoutLoading } = useQuery({
    queryKey: ['blackout-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blackout_dates')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as BlackoutDate[];
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (event: Omit<EventDate, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('event_dates')
        .insert([event]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowNewEventForm(false);
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (event: EventDate) => {
      const { error } = await supabase
        .from('event_dates')
        .update({
          event_name: event.event_name,
          event_type: event.event_type,
          start_date: event.start_date,
          end_date: event.end_date,
          recurring: event.recurring,
          recurrence_pattern: event.recurrence_pattern,
          max_participants: event.max_participants,
          location: event.location,
          instructor: event.instructor,
          notes: event.notes,
          active: event.active
        })
        .eq('id', event.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEditingEvent(null);
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_dates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // Create blackout date mutation
  const createBlackoutMutation = useMutation({
    mutationFn: async (blackout: Omit<BlackoutDate, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('blackout_dates')
        .insert([blackout]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-dates'] });
      setShowBlackoutForm(false);
    }
  });

  // Delete blackout date mutation
  const deleteBlackoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blackout_dates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-dates'] });
    }
  });

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newEvent: Omit<EventDate, 'id' | 'created_at'> = {
      event_name: formData.get('event_name')?.toString() || '',
      event_type: formData.get('event_type')?.toString() as EventDate['event_type'],
      start_date: formData.get('start_date')?.toString() || '',
      end_date: formData.get('end_date')?.toString() || undefined,
      recurring: formData.get('recurring') === 'on',
      recurrence_pattern: formData.get('recurrence_pattern')?.toString() as EventDate['recurrence_pattern'],
      max_participants: formData.get('max_participants') ? parseInt(formData.get('max_participants')?.toString() || '0') : undefined,
      location: formData.get('location')?.toString() || undefined,
      instructor: formData.get('instructor')?.toString() || undefined,
      notes: formData.get('notes')?.toString() || undefined,
      active: true,
      current_participants: 0
    };
    
    createEventMutation.mutate(newEvent);
  };

  const handleCreateBlackout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const services = formData.getAll('affects_services').map(s => s.toString());
    
    const newBlackout: Omit<BlackoutDate, 'id' | 'created_at'> = {
      date: formData.get('date')?.toString() || '',
      reason: formData.get('reason')?.toString() || '',
      affects_services: services
    };
    
    createBlackoutMutation.mutate(newBlackout);
  };

  const getEventTypeColor = (type: EventDate['event_type']) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-purple-100 text-purple-800';
      case 'challenge': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'holiday': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventColor = (type: EventDate['event_type']) => {
    switch (type) {
      case 'class': return '#3b82f6'; // blue-500
      case 'workshop': return '#8b5cf6'; // purple-500
      case 'challenge': return '#10b981'; // green-500
      case 'maintenance': return '#f59e0b'; // yellow-500
      case 'holiday': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  if (eventsLoading || blackoutLoading) {
    return <div className="text-center py-8">Loading date management data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Events Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Event & Class Schedule</h3>
            <div className="flex gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Events</option>
                <option value="class">Classes</option>
                <option value="workshop">Workshops</option>
                <option value="challenge">Challenges</option>
                <option value="maintenance">Maintenance</option>
                <option value="holiday">Holidays</option>
              </select>
              <button
                onClick={() => setShowNewEventForm(true)}
                className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark transition-colors"
              >
                Add New Event
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'list' ? 'bg-jme-purple text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'calendar' ? 'bg-jme-purple text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>

        {showNewEventForm && (
          <form onSubmit={handleCreateEvent} className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="event_name"
                placeholder="Event Name"
                required
                className="px-4 py-2 border rounded-lg"
              />
              <select
                name="event_type"
                required
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Select Type</option>
                <option value="class">Class</option>
                <option value="workshop">Workshop</option>
                <option value="challenge">Challenge</option>
                <option value="maintenance">Maintenance</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  name="start_date"
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                <input
                  name="end_date"
                  type="datetime-local"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input
                name="location"
                placeholder="Location"
                className="px-4 py-2 border rounded-lg"
              />
              <input
                name="instructor"
                placeholder="Instructor"
                className="px-4 py-2 border rounded-lg"
              />
              <input
                name="max_participants"
                type="number"
                placeholder="Max Participants"
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" name="recurring" />
                Recurring Event
              </label>
              <select
                name="recurrence_pattern"
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">No Recurrence</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <textarea
              name="notes"
              placeholder="Notes"
              rows={2}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Event
              </button>
              <button
                type="button"
                onClick={() => setShowNewEventForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List View */}
        {activeView === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events?.map((event) => (
                  <tr key={event.id}>
                    {editingEvent?.id === event.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            value={editingEvent.event_name}
                            onChange={(e) => setEditingEvent({ ...editingEvent, event_name: e.target.value })}
                            className="px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editingEvent.event_type}
                            onChange={(e) => setEditingEvent({ 
                              ...editingEvent, 
                              event_type: e.target.value as EventDate['event_type'] 
                            })}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="class">Class</option>
                            <option value="workshop">Workshop</option>
                            <option value="challenge">Challenge</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="holiday">Holiday</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="datetime-local"
                            value={editingEvent.start_date}
                            onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                            className="px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            value={editingEvent.location || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                            className="px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingEvent.max_participants || ''}
                            onChange={(e) => setEditingEvent({ 
                              ...editingEvent, 
                              max_participants: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                            className="px-2 py-1 border rounded w-20"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editingEvent.active ? 'active' : 'inactive'}
                            onChange={(e) => setEditingEvent({ ...editingEvent, active: e.target.value === 'active' })}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => updateEventMutation.mutate(editingEvent)}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingEvent(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium">{event.event_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.event_type)}`}>
                            {event.event_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {format(parseISO(event.start_date), 'MMM d, yyyy h:mm a')}
                          {event.recurring && (
                            <span className="block text-xs text-gray-500">
                              Recurring {event.recurrence_pattern}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">{event.location || '-'}</td>
                        <td className="px-6 py-4">
                          {event.max_participants ? (
                            <span>{event.current_participants || 0}/{event.max_participants}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="text-jme-purple hover:text-jme-purple-dark mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this event?')) {
                                deleteEventMutation.mutate(event.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div className="p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
              }}
              events={[
                // Transform events to FullCalendar format
                ...(events?.map(event => ({
                  id: event.id,
                  title: event.event_name,
                  start: event.start_date,
                  end: event.end_date || event.start_date,
                  backgroundColor: getEventColor(event.event_type),
                  borderColor: getEventColor(event.event_type),
                  extendedProps: {
                    type: event.event_type,
                    location: event.location,
                    instructor: event.instructor,
                    participants: `${event.current_participants || 0}/${event.max_participants || '∞'}`,
                    notes: event.notes,
                    recurring: event.recurring,
                    recurrence_pattern: event.recurrence_pattern
                  }
                })) || []),
                // Add blackout dates as events
                ...(blackoutDates?.map(blackout => ({
                  id: `blackout-${blackout.id}`,
                  title: `🚫 ${blackout.reason}`,
                  start: blackout.date,
                  allDay: true,
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444',
                  extendedProps: {
                    type: 'blackout',
                    affects: blackout.affects_services
                  }
                })) || [])
              ]}
              editable={true}
              droppable={true}
              eventClick={(info) => {
                // Handle event click - show details or edit
                const event = info.event;
                if (event.id.startsWith('blackout-')) {
                  alert(`Blackout: ${event.title}\nAffects: ${event.extendedProps.affects?.join(', ')}`);
                } else {
                  const originalEvent = events?.find(e => e.id === event.id);
                  if (originalEvent) {
                    setEditingEvent(originalEvent);
                    setActiveView('list'); // Switch to list view for editing
                  }
                }
              }}
              eventDrop={(info) => {
                // Handle event drag and drop
                const event = info.event;
                if (!event.id.startsWith('blackout-')) {
                  const originalEvent = events?.find(e => e.id === event.id);
                  if (originalEvent) {
                    updateEventMutation.mutate({
                      ...originalEvent,
                      start_date: event.start?.toISOString() || originalEvent.start_date,
                      end_date: event.end?.toISOString() || originalEvent.end_date
                    });
                  }
                }
              }}
              dateClick={(info) => {
                // Create new event on date click
                const newEvent = {
                  event_name: 'New Event',
                  event_type: 'class' as EventDate['event_type'],
                  start_date: info.dateStr,
                  active: true
                };
                setShowNewEventForm(true);
                // Pre-fill the form with the clicked date
                setTimeout(() => {
                  const startDateInput = document.querySelector('input[name="start_date"]') as HTMLInputElement;
                  if (startDateInput) {
                    startDateInput.value = info.dateStr + 'T09:00';
                  }
                }, 100);
              }}
              height="auto"
              eventContent={(eventInfo) => {
                // Custom event rendering
                return (
                  <div className="p-1 text-xs">
                    <div className="font-semibold">{eventInfo.event.title}</div>
                    {eventInfo.event.extendedProps.location && (
                      <div className="opacity-75">📍 {eventInfo.event.extendedProps.location}</div>
                    )}
                    {eventInfo.event.extendedProps.participants && eventInfo.event.extendedProps.type !== 'blackout' && (
                      <div className="opacity-75">👥 {eventInfo.event.extendedProps.participants}</div>
                    )}
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>

      {/* Blackout Dates Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Blackout Dates</h3>
          <button
            onClick={() => setShowBlackoutForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Add Blackout Date
          </button>
        </div>

        {showBlackoutForm && (
          <form onSubmit={handleCreateBlackout} className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="date"
                type="date"
                required
                className="px-4 py-2 border rounded-lg"
              />
              <input
                name="reason"
                placeholder="Reason for blackout"
                required
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Affects Services:</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="affects_services" value="classes" />
                  Classes
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="affects_services" value="consultations" />
                  Consultations
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="affects_services" value="workshops" />
                  Workshops
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="affects_services" value="programs" />
                  Programs
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="affects_services" value="merchandise" />
                  Merchandise
                </label>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Create Blackout
              </button>
              <button
                type="button"
                onClick={() => setShowBlackoutForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blackoutDates?.map((blackout) => (
                <tr key={blackout.id}>
                  <td className="px-6 py-4 font-medium">
                    {format(parseISO(blackout.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">{blackout.reason}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {blackout.affects_services.map((service) => (
                        <span key={service} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          {service}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this blackout date?')) {
                          deleteBlackoutMutation.mutate(blackout.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DateManager;