
import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Trash2, X, Loader2 } from 'lucide-react';
import { useAcademy } from '../contexts/AcademyContext';
import { useEvents, useSaveEvent, useDeleteEvent } from '../hooks/useQueries';
import { toast } from 'sonner';

interface AcademyEvent {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    color: string;
}

const AcademyCalendar: React.FC = () => {
    const { academyId } = useAcademy();
    const { data: events = [], isLoading: loading } = useEvents(academyId);
    const saveEventMutation = useSaveEvent();
    const deleteEventMutation = useDeleteEvent();

    const [showAddModal, setShowAddModal] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '18:00',
        end_time: '19:30',
        color: '#4f46e5'
    });

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!academyId) return;

        const start = new Date(`${newEvent.date}T${newEvent.start_time}`);
        const end = new Date(`${newEvent.date}T${newEvent.end_time}`);

        saveEventMutation.mutate({
            academy_id: academyId,
            title: newEvent.title,
            description: newEvent.description,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            color: newEvent.color
        }, {
            onSuccess: () => {
                setShowAddModal(false);
                setNewEvent({
                    title: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    start_time: '18:00',
                    end_time: '19:30',
                    color: '#4f46e5'
                });
            }
        });
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Excluir este evento?')) return;
        deleteEventMutation.mutate(id);
    };

    // Calendar Math
    const { daysInMonth, firstDayOfMonth, monthName, year } = useMemo(() => {
        const d = currentDate;
        return {
            daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
            firstDayOfMonth: new Date(d.getFullYear(), d.getMonth(), 1).getDay(),
            monthName: d.toLocaleString('default', { month: 'long' }),
            year: d.getFullYear()
        };
    }, [currentDate]);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Academy Calendar</h2>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">Manage class schedules and special events.</p>
                </div>
                <Button className="flex items-center gap-2 group" onClick={() => setShowAddModal(true)}>
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Plus size={14} />
                    </div>
                    <span>New Event</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Modern Grid Calendar */}
                <Card className="lg:col-span-2 p-6 border-none bg-[var(--bg-card)] shadow-xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-8 relative">
                        <h3 className="text-xl font-black uppercase tracking-widest text-[var(--text-primary)]">
                            {monthName} <span className="text-[var(--accent-primary)]">{year}</span>
                        </h3>
                        <div className="flex gap-1">
                            <button onClick={prevMonth} className="p-2.5 hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all active:scale-95"><ChevronLeft size={20} /></button>
                            <button onClick={nextMonth} className="p-2.5 hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all active:scale-95"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-[var(--border-color)] border border-[var(--border-color)] relative">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="bg-[var(--bg-secondary)] p-3 text-[10px] font-black uppercase text-center text-[var(--text-secondary)] tracking-tighter">{d}</div>
                        ))}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-[var(--bg-card)]/40 p-4 h-24 lg:h-32"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                            const dayEvents = events.filter(e => new Date(e.start_time).toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString());

                            return (
                                <div key={day} className={`bg-[var(--bg-card)] p-2 h-24 lg:h-32 border-t border-[var(--border-color)] transition-all hover:bg-[var(--bg-secondary)] group relative ${isToday ? 'after:content-[""] after:absolute after:inset-0 after:border-2 after:border-[var(--accent-primary)] after:pointer-events-none' : ''}`}>
                                    <span className={`text-xs font-black p-1 ${isToday ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                        {day.toString().padStart(2, '0')}
                                    </span>
                                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)] custom-scrollbar">
                                        {dayEvents.map(e => (
                                            <div key={e.id} className="text-[9px] font-black p-1 uppercase border-l-2 truncate shadow-sm" style={{ backgroundColor: `${e.color}20`, borderLeftColor: e.color, color: e.color }}>
                                                {e.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Agenda Side Panel */}
                <div className="space-y-6">
                    <Card className="p-6 bg-[var(--bg-card)] border-none shadow-xl border-t-4 border-[var(--accent-primary)]">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-[var(--text-primary)]">
                            <Clock size={16} className="text-[var(--accent-primary)]" /> Upcoming Events
                        </h3>
                        {loading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--accent-primary)]" /></div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-12 px-6 border-2 border-dashed border-[var(--border-color)]">
                                <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase">No events scheduled</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.slice(0, 6).map(e => {
                                    const date = new Date(e.start_time);
                                    return (
                                        <div key={e.id} className="group flex gap-4 p-3 bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-color)] transition-all hover:-translate-y-1">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--bg-card)] border border-[var(--border-color)] shrink-0 shadow-sm">
                                                <span className="text-[9px] font-black uppercase text-[var(--text-secondary)] leading-none">{date.toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-lg font-black text-[var(--text-primary)] leading-none mt-1">{date.getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-black text-[var(--text-primary)] truncate uppercase tracking-tighter">{e.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase bg-[var(--bg-card)] px-1 py-0.5 border border-[var(--border-color)]">
                                                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteEvent(e.id)}
                                                        className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-red-500 transition-all p-1"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border-none">
                        <p className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest mb-2 italic">Pro Tip</p>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            Click on any day in the calendar to see more details. All events are synchronized in real-time.
                        </p>
                    </Card>
                </div>
            </div>

            {/* Premium Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="max-w-md w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border-none transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">New Event / Class</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddEvent} className="p-6 space-y-5 bg-[var(--bg-card)]">
                            <Input label="Title" required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g. Advanced BJJ Class" />
                            <Input label="Description (Optional)" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Date" type="date" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Theme Color</label>
                                    <div className="flex items-center gap-3 bg-[var(--bg-secondary)] p-2 border border-[var(--border-color)]">
                                        <input type="color" value={newEvent.color} onChange={e => setNewEvent({ ...newEvent, color: e.target.value })} className="w-8 h-8 rounded-none border-none bg-transparent cursor-pointer p-0" />
                                        <span className="text-xs font-bold font-mono text-[var(--text-secondary)]">{newEvent.color.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Start" type="time" required value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} />
                                <Input label="End" type="time" required value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} />
                            </div>

                            <div className="flex gap-2 pt-6 border-t border-[var(--border-color)]">
                                <Button type="submit" className="flex-1 font-black shadow-lg shadow-[var(--accent-primary)]/20" disabled={saveEventMutation.isPending}>
                                    {saveEventMutation.isPending ? <Loader2 className="animate-spin mr-2 inline" size={16} /> : null}
                                    {saveEventMutation.isPending ? 'Saving...' : 'Save Schedule'}
                                </Button>
                                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)} className="border-[var(--border-color)]">Cancel</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AcademyCalendar;
