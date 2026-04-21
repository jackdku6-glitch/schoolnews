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
  user_id?: string;
}

export default function SchoolNewsPage() {
  // --- AUTH ТӨЛӨВ ---
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'authed'>('login');

  // --- ПОСТ ТӨЛӨВ ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Бүгд' | 'Мэдээ' | 'Зарлал' | 'Мэдэгдэл'>('Бүгд');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes'>('newest');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  // Формын төлөвүүд
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Мэдээ');

  useEffect(() => {
    // Хэрэглэгчийг шалгах
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setAuthMode('authed');
      }
    };
    checkUser();

    fetchPosts();
    const savedLikes = localStorage.getItem('school_news_likes');
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));

    const channel = supabase
      .channel('school-news-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'INSERT') setPosts((prev) => [payload.new as Post, ...prev]);
        else if (payload.eventType === 'UPDATE') setPosts((prev) => prev.map(p => p.id === payload.new.id ? payload.new as Post : p));
        else if (payload.eventType === 'DELETE') setPosts((prev) => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- AUTH FUNCTIONS ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { nickname } }
      });
      if (error) alert(error.message);
      else alert("Бүртгэл амжилттай! И-мэйлээ шалгана уу.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else {
        setUser(data.user);
        setAuthMode('authed');
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthMode('login');
  };

  // --- POST FUNCTIONS ---
  async function fetchPosts() {
    setFetching(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data as Post[]);
    setFetching(false);
  }

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("Бөглөнө үү!");
    setLoading(true);
    const postData = { 
      title, 
      content, 
      category, 
      author: user?.user_metadata?.nickname || user?.email,
      user_id: user?.id 
    };

    if (editingId) {
      const { error } = await supabase.from('posts').update(postData).eq('id', editingId);
      if (!error) { setEditingId(null); resetForm(); }
    } else {
      const { error } = await supabase.from('posts').insert([{ ...postData, likes: 0 }]);
      if (!error) resetForm();
    }
    setLoading(false);
  };

  const resetForm = () => { setTitle(''); setContent(''); setCategory('Мэдээ'); };

  const handleLike = async (id: string, currentLikes: number) => {
    if (likedPosts.includes(id)) return;
    const { error } = await supabase.from('posts').update({ likes: currentLikes + 1 }).eq('id', id);
    if (!error) {
      const updatedLikes = [...likedPosts, id];
      setLikedPosts(updatedLikes);
      localStorage.setItem('school_news_likes', JSON.stringify(updatedLikes));
    }
  };

  const filteredPosts = useMemo(() => {
    let result = activeTab === 'Бүгд' ? [...posts] : posts.filter(post => post.category === activeTab);
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'likes') result.sort((a, b) => b.likes - a.likes);
    return result;
  }, [posts, activeTab, sortBy]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-10">
      <header className="bg-[#1e293b]/90 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-10 h-10 flex items-center justify-center font-black text-xl rounded-xl">S</div>
            <h1 className="text-lg md:text-2xl font-black text-white">SchoolNews</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {authMode === 'authed' && (
               <div className="flex items-center gap-3">
                 <span className="hidden md:block text-xs font-bold text-slate-400">Сайн уу, {user?.user_metadata?.nickname}</span>
                 <button onClick={handleLogout} className="text-[10px] bg-slate-700 px-3 py-1.5 rounded-lg hover:bg-rose-500 transition-all">Гарах</button>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
          
          {/* ЗҮҮН ТАЛ: AUTH ЭСВЭЛ FORM */}
          <aside className="lg:col-span-4">
            {authMode !== 'authed' ? (
              <div className="bg-[#1e293b] border border-slate-700 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6">
                  {authMode === 'login' ? '🔑 Нэвтрэх' : '👤 Бүртгүүлэх'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <FormField label="Nickname" value={nickname} onChange={(e: any) => setNickname(e.target.value)} />
                  )}
                  <FormField label="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  <FormField label="Password" value={password} type="password" onChange={(e: any) => setPassword(e.target.value)} />
                  <SubmitButton label={loading ? "Уншиж байна..." : (authMode === 'login' ? "Нэвтрэх" : "Бүртгүүлэх")} />
                  <button 
                    type="button" 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="w-full text-[10px] text-indigo-400 mt-2 hover:underline"
                  >
                    {authMode === 'login' ? "Шинэ бүртгэл үүсгэх үү?" : "Аль хэдийн бүртгэлтэй юу?"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-[#1e293b] border border-slate-700 p-8 rounded-3xl sticky top-28 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6">{editingId ? '📝 Засварлах' : '✨ Шинэ пост'}</h2>
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <FormField label="Гарчиг" value={title} onChange={(e: any) => setTitle(e.target.value)} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ангилал</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((cat) => (
                        <button key={cat} type="button" onClick={() => setCategory(cat)} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${category === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#0f172a] border-slate-700 text-slate-400'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <FormField label="Агуулга" isTextArea value={content} onChange={(e: any) => setContent(e.target.value)} />
                  <SubmitButton label={loading ? "..." : (editingId ? "Хадгалах" : "Нийтлэх")} />
                  {editingId && <button onClick={() => { setEditingId(null); resetForm(); }} className="w-full text-[10px] text-slate-500 mt-2 hover:underline">Цуцлах</button>}
                </form>
              </div>
            )}
          </aside>

          {/* БАРУУН ТАЛ: ЖАГСААЛТ */}
          <div className="lg:col-span-8 space-y-8">
            <nav className="flex overflow-x-auto bg-[#0f172a]/50 p-1 rounded-xl border border-slate-700 gap-1 mb-6">
              {['Бүгд', 'Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
              ))}
            </nav>

            <div className="grid grid-cols-1 gap-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="group bg-[#1e293b] border border-slate-700 p-6 rounded-3xl transition-all hover:border-indigo-500/50">
                  <ItemCard 
                    title={post.title}
                    description={post.content}
                    badge={post.category}
                    footer={
                      <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-400">
                            {post.author.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{post.author}</p>
                            <p className="text-[9px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleLike(post.id, post.likes)} className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl border border-rose-500/10 hover:bg-rose-500/20">
                            <span className="text-[10px] font-bold">{post.likes}</span>
                            <span>{likedPosts.includes(post.id) ? '❤️' : '🤍'}</span>
                          </button>
                          {/* Зөвхөн өөрийн постыг устгах/засах */}
                          {user?.id === post.user_id && (
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingId(post.id); setTitle(post.title); setContent(post.content); setCategory(post.category); }} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">✏️</button>
                              <button onClick={async () => { if(confirm("Устгах уу?")) await supabase.from('posts').delete().eq('id', post.id); }} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">🗑️</button>
                            </div>
                          )}
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