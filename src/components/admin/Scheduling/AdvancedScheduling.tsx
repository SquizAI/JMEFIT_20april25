import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Star,
  AlertCircle,
  CheckCircle,
  Repeat,
  Download,
  Upload
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Class {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  instructor: Instructor;
  type: 'in-person' | 'virtual';
  location?: string;
  zoom_link?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled: number;
  recurring?: boolean;
  recurrence_rule?: string;
  price: number;
  status: 'scheduled' | 'cancelled' | 'completed';
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  bio: string;
  specialties: string[];
  rating: number;
  photo_url?: string;
  availability: any[];
}

export function AdvancedScheduling() {
  const [activeView, setActiveView] = useState<'calendar' | 'classes' | 'instructors'>('calendar');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const queryClient = useQueryClient();

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes', currentWeek],
    queryFn: async () => {
      const start = startOfWeek(currentWeek);
      const end = endOfWeek(currentWeek);
      
      const { data, error } = await supabase
        .from('fitness_classes')
        .select('*, instructor:instructors(*)')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time');
      
      if (error) throw error;
      return data as Class[];
    }
  });

  // Fetch instructors
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Instructor[];
    }
  });

  // Create/Update class
  const classMutation = useMutation({
    mutationFn: async (classData: Partial<Class>) => {
      if (classData.id) {
        const { error } = await supabase
          .from('fitness_classes')
          .update(classData)
          .eq('id', classData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fitness_classes')
          .insert([classData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success(editingClass ? 'Class updated!' : 'Class created!');
      setShowClassModal(false);
      setEditingClass(null);
    }
  });

  // Delete class
  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fitness_classes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted!');
    }
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek)
  });

  const getClassesForDay = (date: Date) => {
    return classes?.filter(c => isSameDay(new Date(c.start_time), date)) || [];
  };

  const stats = {
    totalClasses: classes?.length || 0,
    totalCapacity: classes?.reduce((sum, c) => sum + c.capacity, 0) || 0,
    totalEnrolled: classes?.reduce((sum, c) => sum + c.enrolled, 0) || 0,
    utilizationRate: classes?.length ? 
      ((classes.reduce((sum, c) => sum + c.enrolled, 0) / classes.reduce((sum, c) => sum + c.capacity, 0)) * 100).toFixed(1) : '0'
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Advanced Scheduling</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveView('calendar')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'calendar' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setActiveView('classes')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'classes' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Classes
            </button>
            <button
              onClick={() => setActiveView('instructors')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'instructors' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Instructors
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <Calendar className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <div className="text-sm text-gray-600">Classes This Week</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <Users className="w-5 h-5 text-green-600 mb-2" />
            <div className="text-2xl font-bold">{stats.totalEnrolled}</div>
            <div className="text-sm text-gray-600">Students Enrolled</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <CheckCircle className="w-5 h-5 text-purple-600 mb-2" />
            <div className="text-2xl font-bold">{stats.utilizationRate}%</div>
            <div className="text-sm text-gray-600">Utilization Rate</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
            <Star className="w-5 h-5 text-yellow-600 mb-2" />
            <div className="text-2xl font-bold">{instructors?.length || 0}</div>
            <div className="text-sm text-gray-600">Active Instructors</div>
          </div>
        </div>

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
              </h3>
              <button
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dayClasses = getClassesForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`border dark:border-gray-700 rounded-lg p-3 min-h-[200px] ${
                      isSameDay(day, selectedDate) ? 'ring-2 ring-purple-600' : ''
                    }`}
                  >
                    <div className="font-medium text-sm mb-2">
                      {format(day, 'EEE')}
                      <span className="ml-1 text-gray-500">{format(day, 'd')}</span>
                    </div>
                    <div className="space-y-1">
                      {dayClasses.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => {
                            setEditingClass(cls);
                            setShowClassModal(true);
                          }}
                          className="w-full text-left p-2 bg-purple-100 dark:bg-purple-900/20 rounded text-xs hover:bg-purple-200"
                        >
                          <div className="font-medium truncate">{cls.title}</div>
                          <div className="text-gray-600">
                            {format(new Date(cls.start_time), 'h:mm a')}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {cls.type === 'virtual' ? 
                              <Video className="w-3 h-3" /> : 
                              <MapPin className="w-3 h-3" />
                            }
                            <span>{cls.enrolled}/{cls.capacity}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDate(day);
                        setEditingClass(null);
                        setShowClassModal(true);
                      }}
                      className="w-full mt-2 p-1 text-xs text-purple-600 hover:bg-purple-50 rounded"
                    >
                      <Plus className="w-3 h-3 inline" /> Add Class
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 inline mr-2" />
                Export Schedule
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Upload className="w-4 h-4 inline mr-2" />
                Sync to Google Calendar
              </button>
            </div>
          </div>
        )}

        {/* Classes List View */}
        {activeView === 'classes' && (
          <div>
            <button
              onClick={() => {
                setEditingClass(null);
                setShowClassModal(true);
              }}
              className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New Class
            </button>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left pb-3">Class</th>
                    <th className="text-left pb-3">Instructor</th>
                    <th className="text-left pb-3">Schedule</th>
                    <th className="text-left pb-3">Type</th>
                    <th className="text-left pb-3">Enrollment</th>
                    <th className="text-left pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes?.map((cls) => (
                    <tr key={cls.id} className="border-b dark:border-gray-700">
                      <td className="py-3">
                        <div className="font-medium">{cls.title}</div>
                        <div className="text-sm text-gray-500">${cls.price}</div>
                      </td>
                      <td className="py-3">{cls.instructor?.name}</td>
                      <td className="py-3 text-sm">
                        {format(new Date(cls.start_time), 'MMM d, h:mm a')}
                        {cls.recurring && <Repeat className="w-4 h-4 inline ml-1 text-gray-400" />}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cls.type === 'virtual' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {cls.type}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{cls.enrolled}/{cls.capacity}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingClass(cls);
                              setShowClassModal(true);
                            }}
                            className="p-1 text-gray-600 hover:text-purple-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this class?')) {
                                deleteClass.mutate(cls.id);
                              }
                            }}
                            className="p-1 text-gray-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructors View */}
        {activeView === 'instructors' && (
          <div className="grid grid-cols-3 gap-6">
            {instructors?.map((instructor) => (
              <div key={instructor.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {instructor.photo_url ? (
                    <img 
                      src={instructor.photo_url} 
                      alt={instructor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{instructor.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-yellow-600 mb-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{instructor.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{instructor.bio}</p>
                    <div className="flex flex-wrap gap-1">
                      {instructor.specialties.map((specialty) => (
                        <span key={specialty} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingClass ? 'Edit Class' : 'Create New Class'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              classMutation.mutate({
                id: editingClass?.id,
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                instructor_id: formData.get('instructor_id') as string,
                type: formData.get('type') as 'in-person' | 'virtual',
                location: formData.get('location') as string,
                start_time: new Date(formData.get('date') + 'T' + formData.get('time')).toISOString(),
                end_time: new Date(formData.get('date') + 'T' + formData.get('end_time')).toISOString(),
                capacity: Number(formData.get('capacity')),
                price: Number(formData.get('price')),
                recurring: formData.get('recurring') === 'on',
                status: 'scheduled'
              });
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Class Title</label>
                  <input
                    name="title"
                    type="text"
                    defaultValue={editingClass?.title}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingClass?.description}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Instructor</label>
                  <select
                    name="instructor_id"
                    defaultValue={editingClass?.instructor_id}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select instructor</option>
                    {instructors?.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    defaultValue={editingClass?.type || 'in-person'}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={editingClass ? format(new Date(editingClass.start_time), 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd')}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    name="time"
                    type="time"
                    defaultValue={editingClass ? format(new Date(editingClass.start_time), 'HH:mm') : ''}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    name="end_time"
                    type="time"
                    defaultValue={editingClass ? format(new Date(editingClass.end_time), 'HH:mm') : ''}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    name="capacity"
                    type="number"
                    defaultValue={editingClass?.capacity || 20}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingClass?.price || 25}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Location/Link</label>
                  <input
                    name="location"
                    type="text"
                    placeholder="Studio A or Zoom link"
                    defaultValue={editingClass?.location || editingClass?.zoom_link}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      name="recurring"
                      type="checkbox"
                      defaultChecked={editingClass?.recurring}
                      className="rounded"
                    />
                    <span className="text-sm">Recurring weekly</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowClassModal(false);
                    setEditingClass(null);
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingClass ? 'Update' : 'Create'} Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 