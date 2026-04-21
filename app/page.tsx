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
  // --- AUTH & USER STATES ---
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // --- POSTS & UI STATES ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'Бүгд' | 'Мэдээ' | 'Зарлал' | 'Мэдэгдэл'>('Бүгд');
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest'); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [myGuestPosts, setMyGuestPosts] = useState<string[]>([]); // Зочин өөрийн постыг таних

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Мэдээ');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
      
      // Лайк болон өөрийн бичсэн зочин постуудыг ачаалах
      const savedLikes = localStorage.getItem('school_news_likes');
      if (savedLikes) setLikedPosts(JSON.parse(savedLikes));

      const savedMyPosts = localStorage.getItem('my_guest_posts');
      if (savedMyPosts) setMyGuestPosts(JSON.parse(savedMyPosts));

      fetchPosts();
    };
    init();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPosts() {
    setFetching(true);
    const { data } = await supabase.from('posts').select('*');
    if (data) setPosts(data as Post[]);
    setFetching(false);
  }

  // --- AUTH ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { nickname } } });
        if (error) throw error;
        alert("Бүртгэл амжилттай!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setUser(data.user);
      }
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  // --- POST ACTIONS ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert("Талбарыг бөглөнө үү!");
    if (category === 'Зарлал' && !user) return; // Guard

    setLoading(true);
    const postData = {
      title, content, category,
      author: user ? (user.user_metadata?.nickname || user.email) : (nickname || "Зочин"),
      user_id: user?.id || null
    };

    if (editingId) {
      await supabase.from('posts').update(postData).eq('id', editingId);
      setEditingId(null);
    } else {
      const { data, error } = await supabase.from('posts').insert([postData]).select();
      // Хэрэв зочин бол өөрийн постыг localStorage-д хадгалах
      if (!user && data) {
        const updatedMyPosts = [...myGuestPosts, data[0].id];
        setMyGuestPosts(updatedMyPosts);
        localStorage.setItem('my_guest_posts', JSON.stringify(updatedMyPosts));
      }
    }
    resetForm();
    setLoading(false);
  };

  const resetForm = () => { setTitle(''); setContent(''); setCategory('Мэдээ'); setEditingId(null); };

  const handleLike = async (id: string, currentLikes: number) => {
    if (likedPosts.includes(id)) return;
    await supabase.from('posts').update({ likes: currentLikes + 1 }).eq('id', id);
    const newLikes = [...likedPosts, id];
    setLikedPosts(newLikes);
    localStorage.setItem('school_news_likes', JSON.stringify(newLikes));
  };

  // --- FILTER & SORT LOGIC ---
  const filteredAndSortedPosts = useMemo(() => {
    let result = activeTab === 'Бүгд' ? [...posts] : posts.filter(p => p.category === activeTab);
    return result.sort((a, b) => 
      sortBy === 'newest' 
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : b.likes - a.likes
    );
  }, [posts, activeTab, sortBy]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-10">
      <header className="bg-[#1e293b] border-b border-slate-700 sticky top-0 z-50 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-white">SCHOOL<span className="text-indigo-500">NEWS</span></h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-bold">@{user.user_metadata?.nickname}</span>
              <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-[10px] text-rose-500 font-bold uppercase">Гарах</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: FORM / AUTH */}
        <aside className="lg:col-span-4">
          <div className="bg-[#1e293b] border border-slate-700 p-6 rounded-3xl sticky top-28">
            {category === 'Зарлал' && !user ? (
              <div className="space-y-4">
                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-center">
                  <p className="text-xs font-bold text-amber-500">📣 Зарлал оруулахын тулд нэвтрэх шаардлагатай.</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-3">
                  {authMode === 'signup' && <FormField label="Ник нэр" value={nickname} onChange={(e: any) => setNickname(e.target.value)} />}
                  <FormField label="И-мэйл" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  <FormField label="Нууц үг" value={password} type="password" onChange={(e: any) => setPassword(e.target.value)} />
                  <SubmitButton label={loading ? "..." : (authMode === 'login' ? "Нэвтрэх" : "Бүртгүүлэх")} />
                  <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] text-slate-500">
                    {authMode === 'login' ? "Шинэ бүртгэл үүсгэх" : "Нэвтрэх рүү буцах"}
                  </button>
                </form>
                <button onClick={() => setCategory('Мэдээ')} className="w-full text-[10px] text-indigo-400 underline">Зочноор бичих</button>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <h2 className="text-lg font-bold text-white">{editingId ? '📝 Засах' : '✨ Шинэ нийтлэл'}</h2>
                {!user && !editingId && <FormField label="Таны нэр (Зочин)" value={nickname} onChange={(e: any) => setNickname(e.target.value)} />}
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
                <SubmitButton label={loading ? "Уншиж байна..." : (editingId ? "Хадгалах" : "Нийтлэх")} />
                {editingId && <button onClick={resetForm} className="w-full text-[10px] text-slate-500 mt-2">Цуцлах</button>}
              </form>
            )}
          </div>
        </aside>

        {/* MAIN FEED */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <nav className="flex bg-[#1e293b] p-1 rounded-2xl border border-slate-700 flex-1 overflow-x-auto">
              {['Бүгд', 'Мэдээ', 'Зарлал', 'Мэдэгдэл'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
              ))}
            </nav>
            <div className="flex bg-[#1e293b] p-1 rounded-2xl border border-slate-700 gap-1">
              <button onClick={() => setSortBy('newest')} className={`px-4 py-2 rounded-xl text-[10px] font-bold ${sortBy === 'newest' ? 'bg-slate-700 text-indigo-400' : 'text-slate-500'}`}>🕒 Шинэ</button>
              <button onClick={() => setSortBy('likes')} className={`px-4 py-2 rounded-xl text-[10px] font-bold ${sortBy === 'likes' ? 'bg-slate-700 text-rose-400' : 'text-slate-500'}`}>🔥 Лайк</button>
            </div>
          </div>

          <div className="space-y-4">
            {fetching ? <div className="text-center py-20 text-slate-500 animate-pulse">Уншиж байна...</div> : 
              filteredAndSortedPosts.map((post) => {
                // Засах/Устгах эрх: Нэвтэрсэн user_id таарах ЭСВЭЛ localStorage-д байгаа зочин post_id таарах
                const canManage = (user && post.user_id === user.id) || myGuestPosts.includes(post.id);

                return (
                  <div key={post.id} className="bg-[#1e293b] border border-slate-700 p-6 rounded-3xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                    {post.category === 'Зарлал' && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase">Чухал</div>}
                    <ItemCard 
                      title={post.title}
                      description={post.content}
                      badge={post.category}
                      footer={
                        <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/10 uppercase">{post.author.substring(0, 2)}</div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">@{post.author}</p>
                              <p className="text-[9px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleLike(post.id, post.likes)} className={`px-4 py-2 rounded-2xl border text-[11px] font-bold transition-all ${likedPosts.includes(post.id) ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-rose-400'}`}>{post.likes} {likedPosts.includes(post.id) ? '❤️' : '🤍'}</button>
                            {canManage && (
                              <div className="flex gap-1">
                                <button onClick={() => { setEditingId(post.id); setTitle(post.title); setContent(post.content); setCategory(post.category); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2 bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-xl transition-colors">✏️</button>
                                <button onClick={async () => { if(confirm("Устгах уу?")) await supabase.from('posts').delete().eq('id', post.id); }} className="p-2 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition-colors">🗑️</button>
                              </div>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </div>
                );
              })
            }
          </div>
        </div>
      </main>
    </div>
  );
}