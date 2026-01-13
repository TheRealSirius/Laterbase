import React, { useState, useRef, useEffect } from 'react';
import { Tag, Plus, Check, Trash2, X } from 'lucide-react';

const CategoryBar = ({ categories, selected, onSelect, onAdd, onRename, onDelete, isDarkMode }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCat, setNewCat] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editValue, setEditValue] = useState('');
    const scrollRef = useRef(null);

    // Drag to scroll logic
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const pressTimer = useRef(null);

    const handleAdd = (e) => {
        e.preventDefault();
        if (newCat.trim()) {
            onAdd(newCat.trim());
            setNewCat('');
            setIsAdding(false);
        }
    };

    const startEditing = (cat) => {
        if (cat === 'Tutti') return; // Cannot edit "Tutti"
        setEditingCategory(cat);
        setEditValue(cat);
    };

    const handleRename = (e) => {
        e.preventDefault();
        if (editValue.trim() && editValue.trim() !== editingCategory) {
            onRename(editingCategory, editValue.trim());
        }
        setEditingCategory(null);
    };

    // Long press logic for mobile
    const handleTouchStart = (cat) => {
        if (cat === 'Tutti') return;
        pressTimer.current = setTimeout(() => {
            startEditing(cat);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    };

    // Drag to scroll handlers
    const onMouseDown = (e) => {
        isDragging.current = true;
        startX.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;
    };

    const onMouseLeave = () => {
        isDragging.current = false;
    };

    const onMouseUp = () => {
        isDragging.current = false;
    };

    const onMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 2;
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    return (
        <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            className={'flex items-center gap-3 overflow-x-auto flex-nowrap pb-2 select-none active:cursor-grabbing cursor-grab max-w-full relative ' + (isDarkMode ? 'bg-zinc-900' : 'bg-white')}
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: '.no-scrollbar::-webkit-scrollbar { display: none; }' }} />

            {/* Sticky "Tutti" button with gradient fade */}
            <div className={'sticky left-0 z-10 flex items-center shrink-0 ' + (isDarkMode ? 'bg-zinc-900' : 'bg-white')}>
                <button
                    onClick={() => onSelect('Tutti')}
                    className={'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ' + (selected === 'Tutti'
                        ? (isDarkMode ? 'bg-white text-zinc-950 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                        : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300')
                    )}
                >
                    Tutti
                </button>
                {/* Gradient fade effect */}
                <div
                    className="w-6 h-full pointer-events-none"
                    style={{
                        background: isDarkMode
                            ? 'linear-gradient(to right, rgb(24, 24, 27) 0%, transparent 100%)'
                            : 'linear-gradient(to right, rgb(255, 255, 255) 0%, transparent 100%)'
                    }}
                />
            </div>

            {categories.map(cat => (
                <div key={cat} className="relative flex items-center group animate-in fade-in zoom-in-95 duration-300">
                    {editingCategory === cat ? (
                        <form onSubmit={handleRename} className="flex items-center animate-in slide-in-from-left-2 duration-300">
                            <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className={`px-4 py-2 rounded-l-full text-sm font-medium border focus:outline-none transition-all ${isDarkMode
                                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-white'
                                    : 'bg-white border-slate-300 focus:border-slate-900'}`}
                            />
                            <button
                                type="button"
                                onClick={() => onDelete(cat)}
                                className={`p-2 border-y transition-colors ${isDarkMode
                                    ? 'bg-rose-950/30 border-zinc-700 text-rose-500 hover:bg-rose-500 hover:text-white'
                                    : 'bg-rose-50 border-slate-300 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
                            >
                                <Trash2 size={14} />
                            </button>
                            <button
                                type="submit"
                                className={`p-2 rounded-r-full border-y border-r transition-all ${isDarkMode
                                    ? 'bg-white text-zinc-950 hover:bg-zinc-200 border-zinc-700'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-300'}`}
                            >
                                <Check size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingCategory(null)}
                                className={`ml-2 p-2 rounded-full transition-all ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100'}`}
                            >
                                <X size={14} />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => onSelect(cat)}
                            onDoubleClick={() => startEditing(cat)}
                            onTouchStart={() => handleTouchStart(cat)}
                            onTouchEnd={handleTouchEnd}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selected === cat
                                ? (isDarkMode ? 'bg-white text-zinc-950 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                                : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300')
                                }`}
                        >
                            {cat}
                        </button>
                    )}
                </div>
            ))}

            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className={`flex items-center gap-1 whitespace-nowrap px-3 py-2 rounded-full text-sm font-medium transition-all border border-dashed ${isDarkMode
                        ? 'bg-zinc-900/50 text-zinc-500 hover:text-white hover:bg-zinc-800 border-zinc-700'
                        : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-slate-300'}`}
                >
                    <Plus size={14} />
                    <span>Nuova</span>
                </button>
            ) : (
                <form onSubmit={handleAdd} className="flex items-center animate-in slide-in-from-right-2 duration-300">
                    <input
                        autoFocus
                        type="text"
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        onBlur={() => !newCat && setIsAdding(false)}
                        placeholder="Nome..."
                        className={`w-24 px-3 py-1.5 rounded-l-full text-sm border focus:outline-none transition-all ${isDarkMode
                            ? 'bg-zinc-800 border-zinc-700 text-white focus:border-white placeholder:text-zinc-600'
                            : 'bg-white border-slate-300 focus:border-slate-900 placeholder:text-slate-400'}`}
                    />
                    <button
                        type="submit"
                        className={`p-2 rounded-r-full transition-colors ${isDarkMode
                            ? 'bg-white text-zinc-950 hover:bg-zinc-200'
                            : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        <Check size={14} />
                    </button>
                </form>
            )}
        </div>
    );
};

export default CategoryBar;
