"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import FormField from '@/components/FormField';
import SubmitButton from '@/components/SubmitButton';
import ItemCard from '@/components/ItemCard';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  likes: number;
  created_at: string;
}

export default function SchoolNewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Бүгд' | 'Мэдээ' | 'Зарлал' | 'Мэдэгдэл'>('Бүгд');
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- ШҮҮЛТҮҮРИЙН ТӨЛӨВ ---
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes'>('newest');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  // Формын төлөвүүд
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Мэдээ');

  useEffect(() => {
    fetchPosts();
    const savedLikes = localStorage.getItem('school_news_likes');
    if (savedLikes) {
      setLikedPosts(JSON.parse(savedLikes));
    }

    const channel = supabase
      .channel('school-news-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPosts((prev) => [payload.new as Post, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPosts((prev) => prev.map(p => p.id === payload.new.id ? payload.new as Post : p));
        } else if (payload.eventType === 'DELETE') {
          setPosts((prev) => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPosts() {
    setFetching(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data as Post[]);
    setFetching(false);
  }

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) return alert("Бүх талбарыг бөглөнө үү!");

    setLoading(true);
    const postData = { title, content, author, category };

    if (editingId) {
      const { error } = await supabase.from('posts').update(postData).eq('id', editingId);
      if (!error) { setEditingId(null); resetForm(); }
    } else {
      const { error } = await supabase.from('posts').insert([{ ...postData, likes: 0 }]);
      if (!error) resetForm();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setAuthor(''); setCategory('Мэдээ');
  };

  const handleLike = async (id: string, currentLikes: number) => {
    if (likedPosts.includes(id)) {
      alert("Та энэ нийтлэлд лайк дарсан байна!");
      return;
    }
    const { error } = await supabase.from('posts').update({ likes: currentLikes + 1 }).eq('id', id);
    if (!error) {
      const updatedLikes = [...likedPosts, id];
      setLikedPosts(updatedLikes);
      localStorage.setItem('school_news_likes', JSON.stringify(updatedLikes));
    }
  };

  // --- ЭРЭМБЭЛЭХ ЛОГИК ---
  const filteredPosts = useMemo(() => {
    let result = activeTab === 'Бүгд' ? [...posts] : posts.filter(post => post.category === activeTab);

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'likes') {
      result.sort((a, b) => b.likes - a.likes);
    }
    return result;
  }, [posts, activeTab, sortBy]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      <header className="bg-[#1e293b]/90 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-12 h-12 flex items-center justify-center font-black text-3xl rounded-2xl shadow-lg">S</div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">SchoolNews<span className="text-indigo-500">.mn</span></h1>
            </div>
          </div>
          <nav className="hidden md:flex bg-[#0f172a]/50 p-1 rounded-xl border border-slate-700">
            {['Бүгд', 'Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-4">
            <div className={`bg-[#1e293b] border ${editingId ? 'border-indigo-500' : 'border-slate-700'} p-8 rounded-3xl sticky top-28 shadow-2xl`}>
              <h2 className="text-xl font-bold text-white mb-8">{editingId ? '📝 Засварлаж байна' : '✨ Шинэ нийтлэл'}</h2>
              <form onSubmit={handlePostSubmit} className="space-y-6">
                <FormField label="Гарчиг" value={title} onChange={(e: any) => setTitle(e.target.value)} />
                <FormField label="Нийтлэгч" value={author} onChange={(e: any) => setAuthor(e.target.value)} />
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ангилал сонгох</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((cat) => (
                      <button key={cat} type="button" onClick={() => setCategory(cat)} className={`py-2.5 rounded-xl text-[10px] font-bold border transition-all ${category === cat ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-[#0f172a] border-slate-700 text-slate-400'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <FormField label="Агуулга" isTextArea value={content} onChange={(e: any) => setContent(e.target.value)} />
                <SubmitButton label={loading ? "Боловсруулж байна..." : (editingId ? "Өөрчлөлтийг хадгалах" : "Шууд нийтлэх")} />
                {editingId && <button onClick={() => { setEditingId(null); resetForm(); }} className="w-full text-xs text-slate-500 mt-2 hover:underline">Цуцлах</button>}
              </form>
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-8">
            {/* ЭРЭМБЭЛЭХ ХЭСЭГ */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
              <div>
                <h3 className="text-4xl font-black text-white italic">{activeTab}</h3>
                <p className="text-slate-500 text-xs font-bold mt-1">Нийт: {filteredPosts.length}</p>
              </div>
              <div className="flex bg-[#0f172a] p-1 rounded-xl border border-slate-700 gap-1">
                <button onClick={() => setSortBy('newest')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'newest' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Шинэ нь</button>
                <button onClick={() => setSortBy('oldest')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'oldest' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Хуучин нь</button>
                <button onClick={() => setSortBy('likes')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'likes' ? 'bg-rose-500/20 text-rose-500 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>❤️ Лайкаар</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {filteredPosts.map((post) => (
                <div key={post.id} className="group bg-[#1e293b] border border-slate-700 p-8 rounded-[2.5rem] hover:border-indigo-500/50 transition-all shadow-xl">
                  <ItemCard 
                    title={post.title}
                    description={post.content} // DIV-г хасч, шууд текст дамжуулав (Error fixing)
                    badge={post.category}
                    footer={
                      <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center text-xs font-black text-indigo-400">
                            {post.author.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{post.author}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{new Date(post.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleLike(post.id, post.likes)}
                            className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-3 border ${likedPosts.includes(post.id) ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-rose-500/5 text-rose-500 border-rose-500/10 hover:bg-rose-500/20'}`}
                          >
                            <span className="text-xs font-black">{post.likes}</span>
                            <span className="text-lg">{likedPosts.includes(post.id) ? '❤️' : '🤍'}</span>
                          </button>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditingId(post.id); setTitle(post.title); setContent(post.content); setAuthor(post.author); setCategory(post.category); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl">✏️</button>
                            <button onClick={async () => { if(confirm("Устгах уу?")) await supabase.from('posts').delete().eq('id', post.id); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl">🗑️</button>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}