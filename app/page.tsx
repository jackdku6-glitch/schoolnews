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
  // --- ТӨЛӨВҮҮД ---
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'Бүгд' | 'Мэдээ' | 'Зарлал' | 'Мэдэгдэл'>('Бүгд');
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest'); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Мэдээ');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    checkUser();
    fetchPosts();

    const savedLikes = localStorage.getItem('school_news_likes');
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));

    // Real-time шинэчлэл
    const channel = supabase
      .channel('school-news-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPosts() {
    setFetching(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setPosts(data as Post[]);
    setFetching(false);
  }

  // --- AUTH FUNCTIONS ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { nickname } }
      });
      if (error) alert(error.message);
      else alert("Бүртгэл амжилттай! И-мэйлээ баталгаажуулна уу.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else setUser(data.user);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- POST FUNCTIONS ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("Талбаруудыг бүрэн бөглөнө үү!");
    
    // Зарлал бол заавал нэвтэрсэн байх ёстой
    if (category === 'Зарлал' && !user) {
      return alert("Зарлал оруулахын тулд нэвтрэх шаардлагатай!");
    }

    setLoading(true);
    const postData = { 
      title, 
      content, 
      category, 
      author: user ? (user.user_metadata?.nickname || user.email) : "Зочин хэрэглэгч",
      user_id: user?.id || null 
    };

    try {
      if (editingId) {
        await supabase.from('posts').update(postData).eq('id', editingId);
        setEditingId(null);
      } else {
        await supabase.from('posts').insert([{ ...postData, likes: 0 }]);
      }
      resetForm();
    } catch (err) {
      alert("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
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

  // --- FILTER & SORT LOGIC ---
  const filteredAndSortedPosts = useMemo(() => {
    let result = activeTab === 'Бүгд' ? [...posts] : posts.filter(p => p.category === activeTab);
    
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'likes') {
      result.sort((a, b) => b.likes - a.likes);
    }
    return result;
  }, [posts, activeTab, sortBy]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-10">
      <header className="bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50 p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-white tracking-tighter">SCHOOL<span className="text-indigo-500">NEWS</span></h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">@{user.user_metadata?.nickname || 'user'}</span>
              <button onClick={handleLogout} className="text-[10px] font-bold text-rose-400 hover:bg-rose-500/10 px-3 py-1 rounded-lg transition-all">Гарах</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: FORM / AUTH */}
        <aside className="lg:col-span-4">
          <div className="bg-[#1e293b] border border-slate-700 p-6 rounded-3xl sticky top-28 shadow-2xl">
            {category === 'Зарлал' && !user ? (
              <div className="animate-in fade-in duration-500">
                <div className="bg-indigo-500/10 p-4 rounded-2xl mb-6 border border-indigo-500/20 text-center">
                  <p className="text-xs font-bold text-indigo-400">📣 "Зарлал" оруулахын тулд заавал бүртгэлтэй байх шаардлагатай.</p>
                </div>
                <h2 className="text-lg font-bold text-white mb-4">{authMode === 'login' ? '🔑 Нэвтрэх' : '👤 Бүртгүүлэх'}</h2>
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && <FormField label="Ник нэр" value={nickname} onChange={(e: any) => setNickname(e.target.value)} />}
                  <FormField label="И-мэйл" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  <FormField label="Нууц үг" value={password} type="password" onChange={(e: any) => setPassword(e.target.value)} />
                  <SubmitButton label={loading ? "Түр хүлээнэ үү..." : (authMode === 'login' ? "Нэвтрэх" : "Бүртгүүлэх")} />
                  <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">
                    {authMode === 'login' ? "Шинэ бүртгэл үүсгэх үү?" : "Нэвтрэх хэсэг рүү буцах"}
                  </button>
                </form>
                <button onClick={() => setCategory('Мэдээ')} className="w-full mt-4 text-[10px] text-indigo-500 underline">Бусад төрлийг зочноор бичих</button>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-5">
                <h2 className="text-lg font-bold text-white mb-2">{editingId ? '📝 Засварлах' : '✨ Шинэ нийтлэл'}</h2>
                <FormField label="Гарчиг" value={title} onChange={(e: any) => setTitle(e.target.value)} />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ангилал сонгох</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((cat) => (
                      <button key={cat} type="button" onClick={() => setCategory(cat)} className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${category === cat ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-[#0f172a] border-slate-700 text-slate-400'}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                <FormField label="Агуулга" isTextArea value={content} onChange={(e: any) => setContent(e.target.value)} />
                <SubmitButton label={loading ? "Уншиж байна..." : (editingId ? "Хадгалах" : "Нийтлэх")} />
                {editingId && <button onClick={() => { setEditingId(null); resetForm(); }} className="w-full text-[10px] text-slate-500 mt-2 hover:underline">Цуцлах</button>}
              </form>
            )}
          </div>
        </aside>

        {/* FEED: LIST */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <nav className="flex bg-[#1e293b] p-1 rounded-2xl border border-slate-700 gap-1 overflow-x-auto flex-1">
              {['Бүгд', 'Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
              ))}
            </nav>
            
            <div className="flex bg-[#1e293b] p-1 rounded-2xl border border-slate-700 gap-1 self-end md:self-auto">
              <button onClick={() => setSortBy('newest')} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${sortBy === 'newest' ? 'bg-slate-700 text-indigo-400' : 'text-slate-500'}`}>🕒 Шинэ</button>
              <button onClick={() => setSortBy('likes')} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${sortBy === 'likes' ? 'bg-slate-700 text-rose-400' : 'text-slate-500'}`}>🔥 Лайк</button>
            </div>
          </div>

          <div className="space-y-4">
            {fetching ? (
              <div className="text-center py-20 text-slate-500 text-sm animate-pulse">Мэдээлэл шинэчилж байна...</div>
            ) : filteredAndSortedPosts.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm">Одоогоор нийтлэл байхгүй байна.</div>
            ) : (
              filteredAndSortedPosts.map((post) => (
                <div key={post.id} className="group bg-[#1e293b] border border-slate-700 p-6 rounded-3xl transition-all hover:border-indigo-500/50 relative overflow-hidden shadow-sm hover:shadow-indigo-500/5">
                  {post.category === 'Зарлал' && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter">Чухал</div>}
                  <ItemCard 
                    title={post.title}
                    description={post.content}
                    badge={post.category}
                    footer={
                      <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-[11px] font-bold text-indigo-400 uppercase border border-indigo-500/10">{post.author.substring(0, 2)}</div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">@{post.author}</p>
                            <p className="text-[9px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleLike(post.id, post.likes)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-[11px] font-bold ${likedPosts.includes(post.id) ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30'}`}>
                            {post.likes} {likedPosts.includes(post.id) ? '❤️' : '🤍'}
                          </button>
                          {user?.id === post.user_id && (
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingId(post.id); setTitle(post.title); setContent(post.content); setCategory(post.category); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-indigo-400 rounded-xl transition-colors">✏️</button>
                              <button onClick={async () => { if(confirm("Энэ нийтлэлийг устгах уу?")) await supabase.from('posts').delete().eq('id', post.id); }} className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 rounded-xl transition-colors">🗑️</button>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}